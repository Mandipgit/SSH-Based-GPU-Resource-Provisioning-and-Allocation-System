import 'dart:io';
import 'package:path/path.dart' as p;

class SshTunnelService {
  Process? _sshProcess;

  /// Starts an SSH reverse tunnel to the relay server.
  Future<bool> startTunnel(String sessionId, String relayIp, int relayPort, String authKey) async {
    print('[SSH] Starting SSH Reverse Tunnel for session $sessionId to $relayIp:$relayPort');
    
    try {
      // 1. Write the auth key to a temporary file
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
      
      // 2. Start the SSH process
      // ssh -i <key> -N -R <relayPort>:localhost:2222 relay_user@<relayIp> -o StrictHostKeyChecking=no -o ServerAliveInterval=30
      print('[SSH] Executing ssh command...');
      _sshProcess = await Process.start('ssh', [
        '-i', keyFile.path,
        '-N', // Do not execute a remote command; purely forward ports
        '-R', '$relayPort:localhost:2222',
        'relay_user@$relayIp',
        '-o', 'StrictHostKeyChecking=no', // Automatically trust host key
        '-o', 'ServerAliveInterval=30',   // Keep-alive packet every 30s
        '-o', 'ServerAliveCountMax=3',
      ]);

      bool processExited = false;
      int? exitCode;
      String stderrLog = '';

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

      // Wait 2.5 seconds to see if the connection handshake fails or succeeds
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
    
    // Clean up the key file
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
