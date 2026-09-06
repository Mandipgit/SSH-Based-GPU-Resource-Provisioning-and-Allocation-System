import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/gpu_info.dart';
import '../../models/session.dart';
import '../../services/gpu_service.dart';
import '../../services/docker_service.dart';
import '../../controllers/session_controller.dart';
import '../../services/api_service.dart';
import 'login_screen.dart';
import 'host_profile_screen.dart';
import 'financial_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final GpuService _gpuService = GpuService();
  final SessionController _sessionController = SessionController();
  final ApiService _apiService = ApiService();
  
  GpuInfo? _gpuInfo;
  bool _isLoading = true;
  bool _hasError = false;
  bool _isDockerAvailable = false;
  Map<String, dynamic>? _dashboardData;
  Map<String, dynamic>? _userProfile;
  Map<String, dynamic>? _hostProfile;
  bool _isHostOnline = false;
  bool _isTogglingStatus = false;
  
  Timer? _realtimeTimer;
  String _gpuUtilization = '0%';
  String _gpuVram = '0GB / 0GB';
  String _gpuTemperature = 'Unknown';
  String _gpuPower = '0.0 W';
  bool _isHardwareExpanded = false;

  final List<double> _utilizationHistory = [];
  final List<double> _temperatureHistory = [];
  final List<double> _vramHistory = [];
  final List<double> _powerHistory = [];
  static const int _historyLimit = 30;
  double _maxPowerObserved = 30.0;

  @override
  void initState() {
    super.initState();
    _loadCachedProfile();
    _loadSystemInfo();
    
    _sessionController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
    
    _sessionController.startPolling();
    _startRealtimePolling();
  }

  Future<void> _loadCachedProfile() async {
    final cached = await _apiService.getCachedUserProfile();
    if (cached != null && mounted) {
      setState(() {
        _userProfile = cached;
      });
    }
  }

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    if (s == s.toUpperCase()) {
      return s[0].toUpperCase() + s.substring(1).toLowerCase();
    }
    return s[0].toUpperCase() + s.substring(1);
  }

  String _getUserName() {
    final userFromProfile = _userProfile?['user'] is Map ? _userProfile!['user'] as Map<String, dynamic> : null;
    final userFromHost = _hostProfile?['user'] is Map ? _hostProfile!['user'] as Map<String, dynamic> : null;
    final userFromDashboard = _dashboardData?['user'] is Map ? _dashboardData!['user'] as Map<String, dynamic> : null;

    final candidates = [
      _userProfile?['full_name'],
      userFromProfile?['full_name'],
      _hostProfile?['full_name'],
      userFromHost?['full_name'],
      _dashboardData?['host_name'],
      _dashboardData?['full_name'],
      userFromDashboard?['full_name'],
      _userProfile?['name'],
      userFromProfile?['name'],
      _dashboardData?['name'],
    ];

    for (final c in candidates) {
      if (c != null && c.toString().trim().isNotEmpty) {
        return c.toString().trim();
      }
    }

    final firstName = _getRawFirstName();
    final lastNameCandidates = [
      _userProfile?['last_name'],
      userFromProfile?['last_name'],
      _hostProfile?['last_name'],
      userFromHost?['last_name'],
      _dashboardData?['last_name'],
      userFromDashboard?['last_name'],
    ];
    String? lastName;
    for (final c in lastNameCandidates) {
      if (c != null && c.toString().trim().isNotEmpty) {
        lastName = c.toString().trim();
        break;
      }
    }

    if (firstName.isNotEmpty) {
      if (lastName != null && lastName.isNotEmpty) {
        return '$firstName $lastName';
      }
      return firstName;
    }

    final usernameCandidates = [
      _userProfile?['username'],
      userFromProfile?['username'],
      _hostProfile?['username'],
      userFromHost?['username'],
      _dashboardData?['username'],
    ];
    for (final c in usernameCandidates) {
      if (c != null && c.toString().trim().isNotEmpty) {
        return c.toString().trim();
      }
    }

    return 'Host User';
  }

  String _getRawFirstName() {
    final userFromProfile = _userProfile?['user'] is Map ? _userProfile!['user'] as Map<String, dynamic> : null;
    final userFromHost = _hostProfile?['user'] is Map ? _hostProfile!['user'] as Map<String, dynamic> : null;
    final userFromDashboard = _dashboardData?['user'] is Map ? _dashboardData!['user'] as Map<String, dynamic> : null;

    final directFirstNames = [
      _userProfile?['first_name'],
      userFromProfile?['first_name'],
      _hostProfile?['first_name'],
      userFromHost?['first_name'],
      _dashboardData?['first_name'],
      userFromDashboard?['first_name'],
    ];

    for (final c in directFirstNames) {
      if (c != null && c.toString().trim().isNotEmpty) {
        return c.toString().trim();
      }
    }

    final nameCandidates = [
      _userProfile?['full_name'],
      userFromProfile?['full_name'],
      _hostProfile?['full_name'],
      userFromHost?['full_name'],
      _dashboardData?['host_name'],
      _dashboardData?['full_name'],
      _userProfile?['name'],
    ];

    for (final c in nameCandidates) {
      if (c != null && c.toString().trim().isNotEmpty) {
        final str = c.toString().trim();
        final parts = str.split(RegExp(r'\s+'));
        if (parts.isNotEmpty && parts.first.isNotEmpty) {
          return parts.first;
        }
      }
    }

    final username = _userProfile?['username'] ?? _dashboardData?['username'];
    if (username != null && username.toString().trim().isNotEmpty) {
      return username.toString().trim();
    }

    return '';
  }

  String _getFirstName() {
    final raw = _getRawFirstName();
    if (raw.isEmpty) return '';
    return _capitalize(raw);
  }

  void _startRealtimePolling() {
    _realtimeTimer = Timer.periodic(const Duration(seconds: 1), (_) async {
      final stats = await _gpuService.getRealtimeStats();
      if (stats != null && mounted) {
        setState(() {
          _gpuUtilization = stats['utilization']!;
          _gpuVram = stats['vram']!;
          _gpuTemperature = stats['temperature']!;
          _gpuPower = stats['power'] ?? '0.0 W';

          final double utilVal = (stats['utilizationValue'] as num?)?.toDouble() ?? 0.0;
          final double tempVal = (stats['temperatureValue'] as num?)?.toDouble() ?? 0.0;
          final double vramVal = (stats['vramPct'] as num?)?.toDouble() ?? 0.0;
          final double powerVal = (stats['powerValue'] as num?)?.toDouble() ?? 0.0;

          if (powerVal > _maxPowerObserved) {
            _maxPowerObserved = powerVal * 1.25;
          }

          _appendHistory(_utilizationHistory, utilVal);
          _appendHistory(_temperatureHistory, tempVal);
          _appendHistory(_vramHistory, vramVal);
          _appendHistory(_powerHistory, powerVal);
        });
      }
    });
  }

  void _appendHistory(List<double> list, double value) {
    if (list.isEmpty) {
      list.addAll(List.filled(_historyLimit, value));
    } else {
      list.add(value);
      if (list.length > _historyLimit) {
        list.removeAt(0);
      }
    }
  }

  @override
  void dispose() {
    _realtimeTimer?.cancel();
    _sessionController.stopPolling();
    super.dispose();
  }

  Future<void> _loadSystemInfo() async {
    setState(() => _isLoading = true);
    
    // 1. Fetch Local Hardware/Docker Info & Initial GPU Telemetry
    final info = await _gpuService.detectGpu();
    final dockerService = DockerService();
    final isDockerOk = await dockerService.checkDockerAvailable();
    final initialStats = await _gpuService.getRealtimeStats();
    
    // 2. Fetch Backend Dashboard & Profiles concurrently
    final results = await Future.wait([
      _apiService.getHostDashboard(),
      _apiService.getUserProfile(),
      _apiService.getHostProfile(),
    ]);

    final dashboardResponse = results[0];
    final userProfile = results[1];
    final hostProfile = results[2];

    Map<String, dynamic>? dashboardData;
    bool hasError = false;
    
    if (dashboardResponse != null && dashboardResponse['data'] != null) {
      dashboardData = dashboardResponse['data'];
    } else if (dashboardResponse != null) {
      dashboardData = dashboardResponse;
    } else {
      hasError = true;
    }

    if (mounted) {
      setState(() {
        _gpuInfo = info;
        _isDockerAvailable = isDockerOk;
        _dashboardData = dashboardData;
        if (userProfile != null) {
          _userProfile = userProfile;
        }
        if (hostProfile != null) {
          _hostProfile = hostProfile;
        }
        _hasError = hasError;
        _isLoading = false;
        
        if (info != null) {
          _gpuTemperature = info.temperature;
        }

        if (initialStats != null) {
          _gpuUtilization = initialStats['utilization']!;
          _gpuVram = initialStats['vram']!;
          _gpuTemperature = initialStats['temperature']!;
          _gpuPower = initialStats['power'] ?? '0.0 W';

          final double utilVal = (initialStats['utilizationValue'] as num?)?.toDouble() ?? 0.0;
          final double tempVal = (initialStats['temperatureValue'] as num?)?.toDouble() ?? 0.0;
          final double vramVal = (initialStats['vramPct'] as num?)?.toDouble() ?? 0.0;
          final double powerVal = (initialStats['powerValue'] as num?)?.toDouble() ?? 0.0;

          if (powerVal > _maxPowerObserved) {
            _maxPowerObserved = powerVal * 1.25;
          }

          _appendHistory(_utilizationHistory, utilVal);
          _appendHistory(_temperatureHistory, tempVal);
          _appendHistory(_vramHistory, vramVal);
          _appendHistory(_powerHistory, powerVal);
        }
        
        if (dashboardData != null && dashboardData['status'] != null) {
          _isHostOnline = dashboardData['status'].toString().toLowerCase() == 'online';
        }
      });
    }
  }

  Future<void> _toggleHostStatus(bool newValue) async {
    setState(() => _isTogglingStatus = true);
    
    final newStatus = newValue ? 'online' : 'offline';
    final success = await _apiService.updateHostSettings({
      'status': newStatus,
      'auto_accept': newValue,
    });

    if (mounted) {
      if (success) {
        setState(() => _isHostOnline = newValue);
        _loadSystemInfo(); 
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update host status. Please try again.')),
        );
      }
      setState(() => _isTogglingStatus = false);
    }
  }

  Future<void> _logout() async {
    _sessionController.stopPolling();
    await _apiService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      body: Row(
        children: [
          // Left Sidebar (Navigation)
          Container(
            width: 250,
            color: const Color(0xFF151515),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile Header
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [Color(0xFF8DFA70), Color(0xFF4CB8C4)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            _getUserName().isNotEmpty ? _getUserName()[0].toUpperCase() : 'H',
                            style: const TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getUserName(),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const Text('Host', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // Navigation Items
                _SidebarItem(
                  title: 'Dashboard',
                  icon: Icons.dashboard_outlined,
                  isActive: true,
                  onTap: () {},
                ),
                _SidebarItem(
                  title: 'Host Profile',
                  icon: Icons.person_outline,
                  isActive: false,
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const HostProfileScreen()));
                  },
                ),
                _SidebarItem(
                  title: 'Financial Information',
                  icon: Icons.account_balance_wallet_outlined,
                  isActive: false,
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FinancialScreen()));
                  },
                ),
                const Spacer(),
                
                // Bottom Items
                _SidebarItem(
                  title: 'Log out',
                  icon: Icons.logout,
                  isActive: false,
                  onTap: _logout,
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          
          // Main Content Area
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Area
                Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Greeting
                      Flexible(
                        child: Text(
                          _getFirstName().isNotEmpty
                              ? '${_getTimeGreeting()} ${_getFirstName()}'
                              : _getTimeGreeting(),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 16),
                      
                      // Action Bar
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _PillToggle(
                            isOnline: _isHostOnline,
                            isToggling: _isTogglingStatus,
                            onChanged: _toggleHostStatus,
                          ),
                          const SizedBox(width: 16),
                          _buildCircularButton(
                            icon: Icons.refresh,
                            onTap: _loadSystemInfo,
                          ),
                          const SizedBox(width: 12),
                          _buildCircularButton(
                            icon: Icons.notifications_none,
                            onTap: () {},
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Dashboard Content
                Expanded(
                  child: _isLoading 
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF8DFA70)))
                      : _hasError
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.error_outline, color: Colors.red, size: 48),
                                  const SizedBox(height: 16),
                                  const Text('Failed to load dashboard data.', style: TextStyle(color: Colors.white, fontSize: 16)),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: _loadSystemInfo,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF2A2A2A),
                                      foregroundColor: Colors.white,
                                    ),
                                    child: const Text('Retry'),
                                  ),
                                ],
                              ),
                            )
                          : SingleChildScrollView(
                              padding: const EdgeInsets.symmetric(horizontal: 32),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Dynamic KPI Cards
                                  if (_dashboardData != null) ...[
                                    Row(
                                      children: [
                                        if (_dashboardData!['earnings'] != null) ...[
                                          Expanded(child: _HoverKpiCard(title: 'Total Earnings', value: '\$${_dashboardData!['earnings']['total']}', icon: Icons.attach_money)),
                                          const SizedBox(width: 16),
                                        ],
                                        if (_dashboardData!['stats'] != null) ...[
                                          Expanded(child: _HoverKpiCard(title: 'Active Sessions', value: '${_dashboardData!['stats']['active_sessions']}', icon: Icons.play_circle_outline)),
                                          const SizedBox(width: 16),
                                          Expanded(child: _HoverKpiCard(title: 'Total GPUs', value: '${_dashboardData!['stats']['total_gpus']}', icon: Icons.memory)),
                                          const SizedBox(width: 16),
                                          Expanded(child: _HoverKpiCard(title: 'GPU Utilization', value: _gpuUtilization, icon: Icons.speed)),
                                          const SizedBox(width: 16),
                                          Expanded(child: _HoverKpiCard(title: 'VRAM Usage', value: _gpuVram, icon: Icons.storage)),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 32),
                                  ],

                                  // Local Hardware & Orchestration Cards
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Expanded(child: _buildGpuCard()),
                                      const SizedBox(width: 24),
                                      Expanded(child: _buildSessionCard()),
                                    ],
                                  ),
                                  const SizedBox(height: 32),

                                  // GPU Telemetry Graphs Section
                                  Row(
                                    children: [
                                      const Text(
                                        'GPU Telemetry & Monitoring',
                                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(width: 12),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF8DFA70).withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: const Color(0xFF8DFA70).withOpacity(0.3)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Container(
                                              width: 6,
                                              height: 6,
                                              decoration: const BoxDecoration(
                                                color: Color(0xFF8DFA70),
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            const Text(
                                              '1s INTERVAL',
                                              style: TextStyle(
                                                color: Color(0xFF8DFA70),
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 20),

                                  // Row 1: Utilization & Temperature Graphs
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _TelemetryGraphCard(
                                          title: 'GPU UTILIZATION',
                                          value: _gpuUtilization,
                                          history: _utilizationHistory,
                                          accentColor: const Color(0xFF8DFA70),
                                          unit: '%',
                                          minValue: 0,
                                          maxValue: 100,
                                        ),
                                      ),
                                      const SizedBox(width: 24),
                                      Expanded(
                                        child: _TelemetryGraphCard(
                                          title: 'GPU TEMPERATURE',
                                          value: _gpuTemperature,
                                          history: _temperatureHistory,
                                          accentColor: const Color(0xFFFFA726),
                                          unit: '°C',
                                          minValue: 0,
                                          maxValue: 100,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 20),

                                  // Row 2: VRAM & Power Graphs
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _TelemetryGraphCard(
                                          title: 'VRAM USAGE',
                                          value: _gpuVram,
                                          history: _vramHistory,
                                          accentColor: const Color(0xFF4CB8C4),
                                          unit: '%',
                                          minValue: 0,
                                          maxValue: 100,
                                        ),
                                      ),
                                      const SizedBox(width: 24),
                                      Expanded(
                                        child: _TelemetryGraphCard(
                                          title: 'POWER CONSUMPTION',
                                          value: _gpuPower,
                                          history: _powerHistory,
                                          accentColor: const Color(0xFFB388FF),
                                          unit: 'W',
                                          minValue: 0,
                                          maxValue: _maxPowerObserved > 40 ? _maxPowerObserved : 40,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 36),
                                ],
                              ),
                            ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircularButton({required IconData icon, required VoidCallback onTap}) {
    return Material(
      color: const Color(0xFF151515),
      shape: const CircleBorder(side: BorderSide(color: Color(0xFF2A2A2A))),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        hoverColor: const Color(0xFF2A2A2A),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
      ),
    );
  }

  Widget _buildGpuCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF151515),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Local Hardware',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              if (_isHardwareExpanded)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8DFA70).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF8DFA70).withOpacity(0.3)),
                  ),
                  child: const Text(
                    'Full Spec',
                    style: TextStyle(color: Color(0xFF8DFA70), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          if (_gpuInfo == null)
            const Text('Failed to detect GPU. Is nvidia-smi available?', style: TextStyle(color: Colors.red))
          else ...[
            _buildInfoRow('Model', _gpuInfo!.name),
            _buildInfoRow('VRAM', _gpuInfo!.vramTotal),
            _buildInfoRow('Temperature', _gpuTemperature),
            if (_isHardwareExpanded) ...[
              _buildInfoRow('Driver', _gpuInfo!.driverVersion),
              _buildInfoRow('CUDA', _gpuInfo!.cudaVersion),
              _buildInfoRow('OS Version', _gpuInfo!.osVersion),
              _buildInfoRow('Network', _gpuInfo!.internetType.toUpperCase()),
              _buildInfoRow('Power Draw', _gpuPower),
            ],
          ],
          const SizedBox(height: 16),
          Center(
            child: Tooltip(
              message: _isHardwareExpanded ? 'Show less' : 'Show full details',
              child: MouseRegion(
                cursor: SystemMouseCursors.click,
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _isHardwareExpanded = !_isHardwareExpanded;
                    });
                  },
                  child: Container(
                    width: 38,
                    height: 28,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E1E),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF2A2A2A)),
                    ),
                    child: Center(
                      child: Icon(
                        _isHardwareExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                        color: const Color(0xFF8DFA70),
                        size: 20,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionCard() {
    final session = _sessionController.currentSession;
    final status = _sessionController.status;
    
    Color statusColor;
    String statusText = status.name.toUpperCase();
    
    switch (status) {
      case SessionStatus.active:
        statusColor = const Color(0xFF8DFA70);
        break;
      case SessionStatus.starting:
      case SessionStatus.containerRunning:
      case SessionStatus.tunnelConnecting:
        statusColor = Colors.amberAccent;
        statusText = status == SessionStatus.tunnelConnecting 
            ? 'CONNECTING TUNNEL' 
            : (status == SessionStatus.containerRunning ? 'STARTING CONTAINER' : 'INITIALIZING');
        break;
      case SessionStatus.stopping:
        statusColor = Colors.orangeAccent;
        statusText = 'STOPPING...';
        break;
      case SessionStatus.failed:
        statusColor = Colors.redAccent;
        break;
      default:
        statusColor = Colors.grey;
        statusText = 'IDLE';
    }

    String? elapsedStr;
    if (session?.startedAt != null && status == SessionStatus.active) {
      final elapsed = DateTime.now().difference(session!.startedAt!);
      final h = elapsed.inHours.toString().padLeft(2, '0');
      final m = (elapsed.inMinutes % 60).toString().padLeft(2, '0');
      final s = (elapsed.inSeconds % 60).toString().padLeft(2, '0');
      elapsedStr = '$h:$m:$s';
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF151515),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: status == SessionStatus.active 
              ? const Color(0xFF8DFA70).withOpacity(0.3) 
              : const Color(0xFF2A2A2A),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Orchestration', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      statusText,
                      style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildInfoRow(
            'Docker Daemon', 
            _isDockerAvailable ? 'Online' : 'Offline', 
            valueColor: _isDockerAvailable ? const Color(0xFF8DFA70) : Colors.redAccent,
          ),
          _buildInfoRow('Session State', statusText, valueColor: statusColor),
          _buildInfoRow('Container ID', session?.id ?? "None"),
          if (session?.relayPort != null)
            _buildInfoRow('Relay Host', '${session?.relayIp ?? "127.0.0.1"}:${session?.relayPort}'),
          if (elapsedStr != null)
            _buildInfoRow('Active Duration', elapsedStr, valueColor: const Color(0xFF8DFA70)),
          const SizedBox(height: 12),
          if (status == SessionStatus.active || 
              status == SessionStatus.containerRunning || 
              status == SessionStatus.tunnelConnecting) ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.stop_circle_outlined, color: Colors.redAccent, size: 18),
                label: const Text(
                  'TERMINATE SESSION', 
                  style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.5),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.redAccent.withOpacity(0.6), width: 1.2),
                  backgroundColor: Colors.redAccent.withOpacity(0.06),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: () => _confirmTerminateSession(),
              ),
            ),
          ] else if (status == SessionStatus.stopping) ...[
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 14, 
                      height: 14, 
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.orangeAccent),
                    ),
                    SizedBox(width: 10),
                    Text('Terminating container...', style: TextStyle(color: Colors.orangeAccent, fontSize: 13)),
                  ],
                ),
              ),
            ),
          ] else ...[
            Row(
              children: [
                Icon(Icons.radar, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Text(
                  'Listening for incoming rental sessions...',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontStyle: FontStyle.italic),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _confirmTerminateSession() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF2E2E2E)),
        ),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 24),
            SizedBox(width: 10),
            Text('Terminate Session?', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'This will immediately disconnect the renter, shut down the GPU container, and close the SSH reverse tunnel. Are you sure?',
          style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Terminate', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _sessionController.stopSession();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Session terminated and container cleaned up.'),
            backgroundColor: Color(0xFF1E1E1E),
          ),
        );
      }
    }
  }

  Widget _buildInfoRow(String label, String value, {Color valueColor = Colors.white}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14)),
          ),
          Expanded(
            child: Text(
              value, 
              style: TextStyle(color: valueColor, fontWeight: FontWeight.w500, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatefulWidget {
  final String title;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _SidebarItem({required this.title, required this.icon, required this.isActive, required this.onTap});

  @override
  State<_SidebarItem> createState() => _SidebarItemState();
}

class _SidebarItemState extends State<_SidebarItem> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovering = true),
      onExit: (_) => setState(() => _isHovering = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: widget.isActive ? const Color(0xFF2A2A2A) : (_isHovering ? const Color(0xFF1E1E1E) : Colors.transparent),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Row(
            children: [
              Icon(widget.icon, color: widget.isActive ? const Color(0xFF8DFA70) : Colors.grey, size: 20),
              const SizedBox(width: 16),
              Text(
                widget.title,
                style: TextStyle(
                  color: widget.isActive ? const Color(0xFF8DFA70) : Colors.grey,
                  fontWeight: widget.isActive ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PillToggle extends StatelessWidget {
  final bool isOnline;
  final ValueChanged<bool> onChanged;
  final bool isToggling;

  const _PillToggle({required this.isOnline, required this.onChanged, required this.isToggling});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF151515),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildSegment('Online', true),
          _buildSegment('Offline', false),
        ],
      ),
    );
  }
  
  Widget _buildSegment(String text, bool value) {
    final isActive = isOnline == value;
    return GestureDetector(
      onTap: () {
        if (!isActive && !isToggling) onChanged(value);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive 
              ? (text == 'Online' ? const Color(0xFF8DFA70) : const Color(0xFF2A2A2A)) 
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: isToggling && isActive 
            ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: text == 'Online' ? Colors.black : const Color(0xFF8DFA70)))
            : Text(
                text,
                style: TextStyle(
                  color: isActive ? (text == 'Online' ? Colors.black : Colors.white) : Colors.grey,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                  fontSize: 14,
                ),
              ),
      ),
    );
  }
}

class _HoverKpiCard extends StatefulWidget {
  final String title;
  final String value;
  final IconData icon;

  const _HoverKpiCard({required this.title, required this.value, required this.icon});

  @override
  State<_HoverKpiCard> createState() => _HoverKpiCardState();
}

class _HoverKpiCardState extends State<_HoverKpiCard> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovering = true),
      onExit: (_) => setState(() => _isHovering = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        transform: _isHovering ? (Matrix4.identity()..translate(0.0, -4.0)) : Matrix4.identity(),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _isHovering ? const Color(0xFF1E1E1E) : const Color(0xFF151515),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _isHovering ? const Color(0xFF8DFA70).withOpacity(0.5) : const Color(0xFF2A2A2A)),
          boxShadow: _isHovering ? [
            BoxShadow(
              color: const Color(0xFF8DFA70).withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 8),
            )
          ] : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.title, style: const TextStyle(color: Colors.grey, fontSize: 13), overflow: TextOverflow.ellipsis),
            const SizedBox(height: 12),
            Text(
              widget.value,
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

class _TelemetryGraphCard extends StatefulWidget {
  final String title;
  final String value;
  final List<double> history;
  final Color accentColor;
  final String unit;
  final double minValue;
  final double maxValue;

  const _TelemetryGraphCard({
    required this.title,
    required this.value,
    required this.history,
    required this.accentColor,
    required this.unit,
    required this.minValue,
    required this.maxValue,
  });

  @override
  State<_TelemetryGraphCard> createState() => _TelemetryGraphCardState();
}

class _TelemetryGraphCardState extends State<_TelemetryGraphCard> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    final history = widget.history;
    final min = history.isEmpty ? 0.0 : history.reduce((a, b) => a < b ? a : b);
    final max = history.isEmpty ? 0.0 : history.reduce((a, b) => a > b ? a : b);
    final avg = history.isEmpty ? 0.0 : history.reduce((a, b) => a + b) / history.length;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovering = true),
      onExit: (_) => setState(() => _isHovering = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _isHovering ? const Color(0xFF1A1A1A) : const Color(0xFF151515),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isHovering ? widget.accentColor.withOpacity(0.4) : const Color(0xFF2A2A2A),
          ),
          boxShadow: _isHovering
              ? [
                  BoxShadow(
                    color: widget.accentColor.withOpacity(0.06),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  )
                ]
              : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Title, Value and Live Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.value,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: widget.accentColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: widget.accentColor.withOpacity(0.25)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: widget.accentColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        'LIVE',
                        style: TextStyle(
                          color: widget.accentColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Chart Canvas
            SizedBox(
              height: 110,
              width: double.infinity,
              child: CustomPaint(
                painter: _TelemetryChartPainter(
                  dataPoints: widget.history,
                  minValue: widget.minValue,
                  maxValue: widget.maxValue,
                  accentColor: widget.accentColor,
                  unit: widget.unit,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Bottom stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatPill('Min', '${min.toInt()}${widget.unit}'),
                _buildStatPill('Avg', '${avg.toInt()}${widget.unit}'),
                _buildStatPill('Peak', '${max.toInt()}${widget.unit}'),
                Text(
                  '30s window',
                  style: TextStyle(color: Colors.grey.withOpacity(0.4), fontSize: 10),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatPill(String label, String val) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label: ', style: const TextStyle(color: Colors.grey, fontSize: 11)),
        Text(val, style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _TelemetryChartPainter extends CustomPainter {
  final List<double> dataPoints;
  final double minValue;
  final double maxValue;
  final Color accentColor;
  final String unit;

  _TelemetryChartPainter({
    required this.dataPoints,
    required this.minValue,
    required this.maxValue,
    required this.accentColor,
    required this.unit,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (dataPoints.isEmpty) return;

    final double effectiveMax = maxValue > minValue ? maxValue : (minValue + 1.0);
    final double range = effectiveMax - minValue;

    const double rightPadding = 36.0;
    const double topPadding = 8.0;
    const double bottomPadding = 8.0;

    final double chartWidth = size.width - rightPadding;
    final double chartHeight = size.height - topPadding - bottomPadding;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    // 1. Draw subtle horizontal grid lines (0%, 50%, 100%)
    final gridPaint = Paint()
      ..color = const Color(0xFF2A2A2A).withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i <= 2; i++) {
      final double ratio = i / 2.0;
      final double y = topPadding + chartHeight * (1.0 - ratio);

      canvas.drawLine(Offset(0, y), Offset(chartWidth, y), gridPaint);

      final double labelVal = minValue + range * ratio;
      final String labelText = unit == '%'
          ? '${labelVal.toInt()}%'
          : '${labelVal.toInt()}$unit';

      textPainter.text = TextSpan(
        text: labelText,
        style: const TextStyle(
          color: Color(0xFF666666),
          fontSize: 9,
          fontWeight: FontWeight.w500,
        ),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(chartWidth + 6, y - textPainter.height / 2));
    }

    // 2. Compute point coordinates
    final List<Offset> points = [];
    final int count = dataPoints.length;
    for (int i = 0; i < count; i++) {
      final double x = count > 1 ? (i / (count - 1)) * chartWidth : chartWidth;
      final double normalized = ((dataPoints[i] - minValue) / range).clamp(0.0, 1.0);
      final double y = topPadding + chartHeight * (1.0 - normalized);
      points.add(Offset(x, y));
    }

    if (points.isEmpty) return;

    // 3. Build Smooth Bezier Path
    final path = Path();
    path.moveTo(points.first.dx, points.first.dy);

    if (points.length == 1) {
      path.lineTo(chartWidth, points.first.dy);
    } else {
      for (int i = 0; i < points.length - 1; i++) {
        final p0 = i > 0 ? points[i - 1] : points[i];
        final p1 = points[i];
        final p2 = points[i + 1];
        final p3 = (i + 2 < points.length) ? points[i + 2] : p2;

        final cp1x = p1.dx + (p2.dx - p0.dx) / 6.0;
        final cp1y = p1.dy + (p2.dy - p0.dy) / 6.0;
        final cp2x = p2.dx - (p3.dx - p1.dx) / 6.0;
        final cp2y = p2.dy - (p3.dy - p1.dy) / 6.0;

        path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.dx, p2.dy);
      }
    }

    // 4. Draw Gradient Fill Under Curve
    final fillPath = Path.from(path);
    fillPath.lineTo(points.last.dx, topPadding + chartHeight);
    fillPath.lineTo(points.first.dx, topPadding + chartHeight);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          accentColor.withOpacity(0.22),
          accentColor.withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, topPadding, chartWidth, chartHeight))
      ..style = PaintingStyle.fill;

    canvas.drawPath(fillPath, fillPaint);

    // 5. Draw Glow Stroke & Main Stroke
    final glowPaint = Paint()
      ..color = accentColor.withOpacity(0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final strokePaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, glowPaint);
    canvas.drawPath(path, strokePaint);

    // 6. Draw Latest Point Marker Dot with Glow
    final lastPoint = points.last;
    final haloPaint = Paint()
      ..color = accentColor.withOpacity(0.3)
      ..style = PaintingStyle.fill;
    final corePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    canvas.drawCircle(lastPoint, 5.5, haloPaint);
    canvas.drawCircle(lastPoint, 2.5, corePaint);
  }

  @override
  bool shouldRepaint(covariant _TelemetryChartPainter oldDelegate) {
    return true;
  }
}
