import 'dart:io';
import 'package:path/path.dart' as p;

class SshTunnelService {
  Process? _sshProcess;
  int? _exitCode;

  /// Starts an SSH reverse tunnel to the relay server.
  /// [relaySshPort] is the SSH daemon port on the relay (often 22, or a tunnel like bore.pub:NNNN).
  Future<bool> startTunnel(
    String sessionId,
    String relayIp,
    int relayPort,
    String authKey, {
    int relaySshPort = 22,
    String relayUser = 'relay_user',
  }) async {
    print('[SSH] Starting SSH Reverse Tunnel for session $sessionId to $relayIp:$relaySshPort (-R $relayPort)');

    try {
      final tempDir = Directory.systemTemp;
      final keyFile = File(p.join(tempDir.path, 'relay_key_$sessionId.pem'));
      await keyFile.writeAsString(authKey);

      // Restrictive perms help on non-Windows; on Windows OpenSSH is often still fine.
      try {
        await Process.run('chmod', ['600', keyFile.path]);
      } catch (_) {}

      final args = <String>[
        '-i', keyFile.path,
        '-N',
        '-p', '$relaySshPort',
        '-R', '$relayPort:localhost:2222',
        '$relayUser@$relayIp',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'ServerAliveInterval=30',
        '-o', 'ExitOnForwardFailure=yes',
        '-o', 'IdentitiesOnly=yes',
      ];
      print('[SSH] Executing: ssh ${args.join(' ')}');
      _exitCode = null;
      _sshProcess = await Process.start('ssh', args);
      _sshProcess!.stdout.listen((data) {
        print('[SSH STDOUT] ${String.fromCharCodes(data)}');
      });
      _sshProcess!.stderr.listen((data) {
        print('[SSH STDERR] ${String.fromCharCodes(data)}');
      });
      _sshProcess!.exitCode.then((code) {
        _exitCode = code;
        print('[SSH] Tunnel process exited with code $code');
      });

      await Future.delayed(const Duration(seconds: 3));
      if (_exitCode != null) {
        print('[SSH] Tunnel failed to start (exit code $_exitCode).');
        return false;
      }

      print('[SSH] Tunnel process started successfully.');
      return true;
    } catch (e) {
      print('[SSH] Error starting tunnel: $e');
      return false;
    }
  }

  Future<void> stopTunnel(String sessionId) async {
    print('[SSH] Closing SSH Tunnel for session $sessionId');
    if (_sshProcess != null) {
      _sshProcess!.kill();
      _sshProcess = null;
    }
    try {
      final tempDir = Directory.systemTemp;
      final keyFile = File(p.join(tempDir.path, 'relay_key_$sessionId.pem'));
      if (await keyFile.exists()) {
        await keyFile.delete();
      }
    } catch (e) {
      print('[SSH] Error cleaning up key file: $e');
    }
  }
}
