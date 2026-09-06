import 'dart:io';
import '../models/gpu_info.dart';

class GpuService {
  Future<GpuInfo?> detectGpu() async {
    try {
      // Execute nvidia-smi as a child process and wait for it to complete.
      final result = await Process.run('nvidia-smi', []);

      if (result.exitCode != 0) {
        print('Error running nvidia-smi: ${result.stderr}');
        return null;
      }

      final output = result.stdout as String;
      
      // Parse output using Regex
      final driverMatch = RegExp(r'Driver Version:\s+([0-9.]+)').firstMatch(output);
      final cudaMatch = RegExp(r'CUDA Version:\s+([0-9.]+)').firstMatch(output);
      
      // Example regex to match GPU name: "|   0  NVIDIA GeForce RTX 2050 ..."
      final nameMatch = RegExp(r'\|\s+\d+\s+(NVIDIA.*?)\s+(?:Off|On)\s+\|').firstMatch(output);
      
      // Example regex to match memory: "123MiB /  4096MiB"
      final memoryMatch = RegExp(r'/\s+([0-9]+MiB)').firstMatch(output);
      
      // Example regex to match temperature: "45C"
      final tempMatch = RegExp(r'(\d+)C').firstMatch(output);

      String internetType = 'ethernet';
      try {
        final interfaces = await NetworkInterface.list(type: InternetAddressType.IPv4);
        for (var interface in interfaces) {
          final name = interface.name.toLowerCase();
          if (name.contains('wi-fi') || name.contains('wlan') || name.contains('wireless')) {
            internetType = 'wifi';
            break;
          }
        }
      } catch (_) {
        // Fallback to ethernet if detection fails
      }

      if (driverMatch != null && nameMatch != null) {
        return GpuInfo(
          name: nameMatch.group(1)?.trim() ?? 'Unknown',
          vramTotal: memoryMatch?.group(1) ?? 'Unknown',
          driverVersion: driverMatch.group(1) ?? 'Unknown',
          cudaVersion: cudaMatch?.group(1) ?? 'Unknown',
          temperature: tempMatch != null ? '${tempMatch.group(1)}°C' : 'Unknown',
          osVersion: Platform.operatingSystemVersion,
          internetType: internetType,
        );
      }
      
      print('Could not parse nvidia-smi output properly.');
      return null;
      
    } catch (e) {
      print('Failed to execute nvidia-smi: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getRealtimeStats() async {
    try {
      final result = await Process.run('nvidia-smi', [
        '--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw',
        '--format=csv,noheader,nounits'
      ]);

      if (result.exitCode == 0) {
        final parts = (result.stdout as String).trim().split(', ');
        if (parts.length >= 4) {
          final util = double.tryParse(parts[0].trim()) ?? 0.0;
          final usedMiB = double.tryParse(parts[1].trim()) ?? 0.0;
          final totalMiB = double.tryParse(parts[2].trim()) ?? 1.0;
          final temp = double.tryParse(parts[3].trim()) ?? 0.0;
          double power = 0.0;
          if (parts.length >= 5) {
            power = double.tryParse(parts[4].trim()) ?? 0.0;
          }
          
          final usedGb = (usedMiB / 1024).toStringAsFixed(1);
          final totalGb = (totalMiB / 1024).toStringAsFixed(1);
          final vramPct = totalMiB > 0 ? (usedMiB / totalMiB * 100) : 0.0;

          return {
            'utilization': '${util.toInt()}%',
            'utilizationValue': util,
            'vram': '${usedGb}GB / ${totalGb}GB',
            'vramUsed': usedMiB,
            'vramTotal': totalMiB,
            'vramPct': vramPct,
            'temperature': '${temp.toInt()}°C',
            'temperatureValue': temp,
            'power': '${power.toStringAsFixed(1)} W',
            'powerValue': power,
          };
        }
      }
    } catch (_) {}
    return null;
  }
}

