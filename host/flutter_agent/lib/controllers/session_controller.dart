import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/session.dart';
import '../services/docker_service.dart';
import '../services/ssh_service.dart';
import '../services/api_service.dart';
import '../services/gpu_service.dart';

class SessionController extends ChangeNotifier {
  final DockerService _dockerService = DockerService();
  final SshTunnelService _sshService = SshTunnelService();
  final ApiService _apiService = ApiService();
  final GpuService _gpuService = GpuService();
  
  Session? currentSession;
  Timer? _pollingTimer;
  Timer? _heartbeatTimer;

  SessionStatus get status => currentSession?.status ?? SessionStatus.idle;

  /// Starts polling for pending sessions in the background
  void startPolling() {
    print('[SessionController] Starting session polling...');
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      if (currentSession != null) return; // Already in a session

      try {
        final pending = await _apiService.pollPendingSession();
        final sessionId = pending?['session_id'] ?? pending?['id'];
        if (pending != null && sessionId != null) {
          print('[SessionController] Found pending session: $sessionId');
          await _handleNewSession(pending);
        }
      } catch (e) {
        print('[SessionController] Polling error: $e');
      }
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> _handleNewSession(Map<String, dynamic> data) async {
    final sessionId = data['session_id'] ?? data['id'];
    currentSession = Session(id: sessionId, status: SessionStatus.starting);
    notifyListeners();

    await _apiService.updateSessionStatus(sessionId, 'starting');

    // 1. Start Docker Container with security quotas and injected renter public key
    final renterSshKey = data['renter_ssh_key'] ?? data['public_key'] ?? data['renter_public_key'];
    final success = await _dockerService.createAndStartSession(
      sessionId: sessionId,
      renterSshKey: renterSshKey?.toString(),
    );

    if (!success) {
      if (currentSession != null) {
        currentSession!.status = SessionStatus.failed;
        await _apiService.updateSessionStatus(sessionId, 'failed');
        notifyListeners();
      }
      return;
    }

    if (currentSession != null) {
      currentSession!.status = SessionStatus.containerRunning;
      await _apiService.updateSessionStatus(sessionId, 'container_running');
      notifyListeners();

      // 2. Start SSH Tunnel
      currentSession!.status = SessionStatus.tunnelConnecting;
      await _apiService.updateSessionStatus(sessionId, 'tunnel_connecting');
      notifyListeners();
      
      String relayIp = data['relay_server_ip'] ?? '127.0.0.1';
      final int relayPort = data['relay_server_port'] ?? 40001;
      final int relaySshPort = int.tryParse('${data['relay_ssh_port'] ?? 22}') ?? 22;
      final String relayUser = (data['relay_ssh_user'] ?? 'relay_user').toString();
      final String authKey = data['relay_auth_key'] ?? '';
      
      // Fallback check: if backend returns localhost/127.0.0.1, check for override
      if (relayIp == '127.0.0.1' || relayIp == 'localhost') {
        try {
          final prefs = await SharedPreferences.getInstance();
          final overrideIp = prefs.getString('relay_host_override');
          if (overrideIp != null && overrideIp.trim().isNotEmpty) {
            print('[SessionController] Using relay host override: $overrideIp');
            relayIp = overrideIp.trim();
          }
        } catch (e) {
          print('[SessionController] Could not check relay override: $e');
        }
      }

      final tunnelSuccess = await _sshService.startTunnel(
        sessionId,
        relayIp,
        relayPort,
        authKey,
        relaySshPort: relaySshPort,
        relayUser: relayUser,
      );
      
      if (!tunnelSuccess) {
        currentSession!.status = SessionStatus.failed;
        await _apiService.updateSessionStatus(sessionId, 'failed');
        notifyListeners();
        return;
      }

      if (currentSession != null) {
        currentSession = Session(
          id: sessionId,
          status: SessionStatus.active,
          startedAt: DateTime.now(),
          relayPort: relayPort,
          relayIp: relayIp,
        );
        await _apiService.updateSessionStatus(sessionId, 'active');
        notifyListeners();
        
        _startHeartbeat(sessionId);
      }
    }
  }

  void _startHeartbeat(String sessionId) {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      if (currentSession == null || currentSession!.status != SessionStatus.active) {
        timer.cancel();
        return;
      }
      
      // Query real hardware telemetry
      int temp = 50;
      int util = 0;
      int memUsed = 0;
      try {
        final stats = await _gpuService.getRealtimeStats();
        if (stats != null) {
          temp = (stats['temperatureValue'] as double? ?? 50.0).toInt();
          util = (stats['utilizationValue'] as double? ?? 0.0).toInt();
          memUsed = (stats['vramUsed'] as double? ?? 0.0).toInt();
        }
      } catch (e) {
        print('[SessionController] Error getting real-time GPU stats: $e');
      }

      // Send Heartbeat with real telemetry
      await _apiService.sendHeartbeat(sessionId, temp, util, memUsed);

      // Poll Commands
      try {
        final commandData = await _apiService.pollCommands(sessionId);
        if (commandData != null) {
          final cmd = commandData['command'];
          if (cmd == 'STOP') {
            print('[SessionController] Received STOP command from backend.');
            await stopSession();
          }
        }
      } catch (e) {
        print('[SessionController] Error polling commands: $e');
      }
    });
  }

  // Used for testing/manual override
  Future<void> startSession(String sessionId) async {
    await _handleNewSession({'id': sessionId});
  }

  Future<void> stopSession() async {
    if (currentSession == null) return;
    final sessionId = currentSession!.id;

    currentSession!.status = SessionStatus.stopping;
    await _apiService.updateSessionStatus(sessionId, 'stopping');
    notifyListeners();

    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;

    // 1. Stop SSH Tunnel
    await _sshService.stopTunnel(sessionId);

    // 2. Stop and Remove Container
    await _dockerService.stopContainer(sessionId);
    await _dockerService.removeContainer(sessionId);

    currentSession!.status = SessionStatus.terminated;
    await _apiService.updateSessionStatus(sessionId, 'terminated');
    
    currentSession = null;
    notifyListeners();
  }
}
