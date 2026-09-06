import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/session.dart';
import '../services/docker_service.dart';
import '../services/ssh_service.dart';
import '../services/api_service.dart';

class SessionController extends ChangeNotifier {
  final DockerService _dockerService = DockerService();
  final SshTunnelService _sshService = SshTunnelService();
  final ApiService _apiService = ApiService();
  
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

    // 1. Start Docker Container
    final success = await _dockerService.createAndStartTestSession(sessionId);
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
      
      final String relayIp = data['relay_server_ip'] ?? '127.0.0.1';
      final int relayPort = data['relay_server_port'] ?? 40001;
      final int relaySshPort = int.tryParse('${data['relay_ssh_port'] ?? 22}') ?? 22;
      final String relayUser = (data['relay_ssh_user'] ?? 'relay_user').toString();
      final String authKey = data['relay_auth_key'] ?? '';
      
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
        currentSession!.status = SessionStatus.active;
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
      
      // Send Heartbeat
      await _apiService.sendHeartbeat(sessionId, 65, 95, 4000);

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
