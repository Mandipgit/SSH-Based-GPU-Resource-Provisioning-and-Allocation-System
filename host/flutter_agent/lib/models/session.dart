enum SessionStatus {
  idle,
  pending,
  starting,
  containerRunning,
  tunnelConnecting,
  active,
  stopping,
  terminated,
  failed,
}

class Session {
  final String id;
  SessionStatus status;
  final DateTime? startedAt;
  final int? relayPort;
  final String? relayIp;

  Session({
    required this.id,
    this.status = SessionStatus.idle,
    this.startedAt,
    this.relayPort,
    this.relayIp,
  });
}
