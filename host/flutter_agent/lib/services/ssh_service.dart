import 'dart:io';
import 'package:path/path.dart' as p;

class SshTunnelService {
  Process? _sshProcess;

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
      await keyFile.writeAsString(authKey.trim());

      // SSH requires strict permissions on the private key file.
      if (Platform.isWindows) {
        final username = Platform.environment['USERNAME'] ?? 'SYSTEM';
        await Process.run('icacls', [
          keyFile.path,
          '/inheritance:r',
          '/grant:r',
          '$username:(R)',
        ]);
      } else {
        await Process.run('chmod', ['600', keyFile.path]);
      }

      final args = <String>[
        '-i', keyFile.path,
        '-N',
        '-p', '$relaySshPort',
        '-R', '$relayPort:localhost:2222',
        '$relayUser@$relayIp',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'ServerAliveInterval=30',
        '-o', 'ServerAliveCountMax=3',
        '-o', 'ExitOnForwardFailure=yes',
        '-o', 'IdentitiesOnly=yes',
      ];
      print('[SSH] Executing: ssh ${args.join(' ')}');

      bool processExited = false;
      int? exitCode;
      String stderrLog = '';

      _sshProcess = await Process.start('ssh', args);

      _sshProcess!.stdout.listen((data) {
        print('[SSH STDOUT] ${String.fromCharCodes(data)}');
      });
      _sshProcess!.stderr.listen((data) {
        final err = String.fromCharCodes(data);
        stderrLog += err;
        print('[SSH STDERR] $err');
      });

      _sshProcess!.exitCode.then((code) {
        processExited = true;
        exitCode = code;
        print('[SSH] Tunnel process exited with code $code');
      });

      await Future.delayed(const Duration(milliseconds: 2500));

      if (processExited) {
        print('[SSH] Tunnel failed to start (exit code $exitCode). Stderr: $stderrLog');
        return false;
      }

      print('[SSH] Tunnel process running smoothly in background.');
      return true;
    } catch (e) {
      print('[SSH] Error starting tunnel: $e');
      return false;
    }
  }

  /// Closes the SSH tunnel.
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
