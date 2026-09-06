import 'dart:io';

class DockerService {
  /// Checks if Docker is installed and running by fetching its version.
  Future<bool> checkDockerAvailable() async {
    try {
      final result = await Process.run('docker', ['--version']);
      return result.exitCode == 0;
    } catch (e) {
      print('Docker is not available: $e');
      return false;
    }
  }

  /// Starts the GPU session container with strict resource quotas and security hardening.
  Future<bool> createAndStartSession({
    required String sessionId,
    String? renterSshKey,
    int localPort = 2222,
    String maxMemory = '8g',
    String maxCpus = '4.0',
    String shmSize = '2g',
    int pidsLimit = 512,
  }) async {
    try {
      final containerName = 'gpu-session-$sessionId';
      
      // Cleanup any leftover container with the same name before starting
      await Process.run('docker', ['rm', '-f', containerName]);

      // Command: docker run -d --name <containerName> --gpus all --memory=8g --cpus=4.0 --shm-size=2g --pids-limit=512 --restart=no -p 2222:22 gpu-session
      final result = await Process.run('docker', [
        'run',
        '-d',
        '--name', containerName,
        '--gpus', 'all',
        '--memory', maxMemory,
        '--cpus', maxCpus,
        '--shm-size', shmSize,
        '--pids-limit', pidsLimit.toString(),
        '--restart', 'no',
        '-p', '$localPort:22',
        'gpu-session',
      ]);

      if (result.exitCode != 0) {
        print('Failed to start container: ${result.stderr}');
        return false;
      }

      // If a renter public SSH key is provided, inject it into the container
      if (renterSshKey != null && renterSshKey.trim().isNotEmpty) {
        await _injectRenterKey(containerName, renterSshKey.trim());
      }

      print('GPU Container $containerName started successfully with limits ($maxMemory RAM, $maxCpus CPUs, $shmSize SHM).');
      return true;
    } catch (e) {
      print('Error starting container: $e');
      return false;
    }
  }

  /// Backwards compatibility alias for createAndStartSession
  Future<bool> createAndStartTestSession(String sessionId, [String? renterKey]) async {
    return createAndStartSession(sessionId: sessionId, renterSshKey: renterKey);
  }

  /// Injects renter's public SSH key into the container's authorized_keys
  Future<void> _injectRenterKey(String containerName, String publicKey) async {
    try {
      // 1. Create .ssh folder with correct permissions
      await Process.run('docker', ['exec', containerName, 'mkdir', '-p', '/home/renter/.ssh']);
      
      // 2. Append public key to authorized_keys
      await Process.run('docker', [
        'exec',
        containerName,
        'sh',
        '-c',
        'echo "$publicKey" >> /home/renter/.ssh/authorized_keys',
      ]);
      
      // 3. Set strict permissions (600 for authorized_keys, 700 for .ssh)
      await Process.run('docker', ['exec', containerName, 'chmod', '700', '/home/renter/.ssh']);
      await Process.run('docker', ['exec', containerName, 'chmod', '600', '/home/renter/.ssh/authorized_keys']);
      await Process.run('docker', ['exec', containerName, 'chown', '-R', 'renter:renter', '/home/renter/.ssh']);
      print('Successfully injected renter public key into $containerName.');
    } catch (e) {
      print('Warning: Failed to inject renter public key: $e');
    }
  }

  /// Stops a running container.
  Future<bool> stopContainer(String sessionId) async {
    try {
      final containerName = 'gpu-session-$sessionId';
      final result = await Process.run('docker', ['stop', containerName]);
      return result.exitCode == 0;
    } catch (e) {
      print('Error stopping container: $e');
      return false;
    }
  }

  /// Removes a stopped container.
  Future<bool> removeContainer(String sessionId) async {
    try {
      final containerName = 'gpu-session-$sessionId';
      final result = await Process.run('docker', ['rm', '-f', containerName]);
      return result.exitCode == 0;
    } catch (e) {
      print('Error removing container: $e');
      return false;
    }
  }
}
