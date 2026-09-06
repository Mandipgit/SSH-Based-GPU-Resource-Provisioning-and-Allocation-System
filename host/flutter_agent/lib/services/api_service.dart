import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/gpu_info.dart';

class ApiService {
  static String? _cachedBaseUrl;

  /// Loads baseUrl from .env, dart-define, or defaults to the Cloudflare tunnel
  static String get baseUrl {
    if (_cachedBaseUrl != null) return _cachedBaseUrl!;

    // 1. Check compile-time dart-define
    const envDefined = String.fromEnvironment('BACKEND_API_URL');
    if (envDefined.isNotEmpty) {
      _cachedBaseUrl = envDefined;
      return _cachedBaseUrl!;
    }

    // 2. Read dynamically from local .env file
    try {
      final envFile = File('.env');
      if (envFile.existsSync()) {
        final lines = envFile.readAsLinesSync();
        for (final line in lines) {
          final trimmed = line.trim();
          if (trimmed.startsWith('BACKEND_API_URL=')) {
            final val = trimmed.substring('BACKEND_API_URL='.length).trim();
            if (val.isNotEmpty) {
              _cachedBaseUrl = val;
              return _cachedBaseUrl!;
            }
          }
        }
      }
    } catch (_) {}

    // 3. Fallback default
    _cachedBaseUrl = 'https://holmes-observation-guild-prevent.trycloudflare.com/api';
    return _cachedBaseUrl!;
  }

  static const String tokenKey = 'jwt_token';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Register a new user
  Future<Map<String, dynamic>> register(String email, String firstName, String lastName, String password, String confirmPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register/'), // Added trailing slash for Django
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'first_name': firstName,
          'last_name': lastName,
          'role': 'host',
          'password': password,
          'password2': confirmPassword,
        }),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'error': _parseError(response)};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  /// Login and save token
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login/'), // Added trailing slash for Django
        headers: {'Content-Type': 'application/json'}, // Changed to JSON for DRF
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        
        // Find token. In Django it might be nested inside 'data'
        String? token = data['access_token'] ?? data['access'] ?? data['key'] ?? data['token'];
        if (token == null && data['data'] != null && data['data'] is Map) {
          token = data['data']['access_token'];
        }

        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(tokenKey, token);
          return {'success': true};
        }
      }
      return {'success': false, 'error': _parseError(response)};
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  String _parseError(http.Response response) {
    if (response.statusCode == 401 || response.statusCode == 403) {
      return 'Invalid credentials. Please check your email and password.';
    } else if (response.statusCode == 400 || response.statusCode == 422) {
      try {
        final data = jsonDecode(response.body);
        if (data is Map) {
          if (data.containsKey('message')) return data['message'];
          if (data.containsKey('detail') && data['detail'] is String) return data['detail'];
          if (data.containsKey('email')) return 'Email is invalid or already exists.';
          if (data.containsKey('username')) return 'Username is already taken.';
        }
      } catch (e) {
        // Fall back to generic message
      }
      return 'Invalid input provided. Please check your details.';
    } else if (response.statusCode >= 500) {
      return 'Server is currently unavailable. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /// Logout - Completely wipe user-specific cache
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear(); // Clears token, profile, and any dashboard cache
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _getToken();
    return token != null;
  }


  /// Get Current User Profile (General)
  Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me/'),
        headers: headers,
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        print('getUserProfile success: $decoded');
        Map<String, dynamic>? data;
        if (decoded is Map<String, dynamic> && decoded.containsKey('data') && decoded['data'] is Map) {
          data = decoded['data'] as Map<String, dynamic>;
        } else if (decoded is Map<String, dynamic>) {
          data = decoded;
        }
        if (data != null) {
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('cached_user_profile', jsonEncode(data));
          } catch (_) {}
          return data;
        }
        return decoded;
      }
      print('getUserProfile error: ${response.statusCode} - ${response.body}');
      return null;
    } catch (e) {
      print('Network error: $e');
      return null;
    }
  }

  /// Get Cached User Profile
  Future<Map<String, dynamic>?> getCachedUserProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('cached_user_profile');
      if (cached != null) {
        return jsonDecode(cached) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  /// Get Host Dashboard Metrics
  Future<Map<String, dynamic>?> getHostDashboard() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/sessions/host/dashboard/'),
        headers: headers,
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      } else {
        print('Failed to get host dashboard: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('Network error: $e');
      return null;
    }
  }

  /// Get Host Profile
  Future<Map<String, dynamic>?> getHostProfile() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/auth/host/profile/'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body);
      return decoded['data'] ?? decoded;
    }
    return null;
  }

  /// Update Host Profile (System Detection)
  Future<bool> updateHostProfile(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/auth/host/profile/'),
      headers: headers,
      body: jsonEncode(data),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return true;
    } else {
      print('Failed to update host profile: ${response.statusCode} - ${response.body}');
      return false;
    }
  }

  /// Update Host Settings (for go online/offline)
  Future<bool> updateHostSettings(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/sessions/host/settings/'),
      headers: headers,
      body: jsonEncode(data),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return true;
    } else {
      print('Failed to update host settings: ${response.statusCode} - ${response.body}');
      return false;
    }
  }

  /// Poll for pending sessions
  Future<Map<String, dynamic>?> pollPendingSession() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/sessions/host/pending/'),
      headers: headers,
    );

    if (response.statusCode == 200 && response.body.isNotEmpty) {
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return null;
      }
    }
    return null; // 204 No Content
  }

  /// Update Session Status
  Future<bool> updateSessionStatus(String sessionId, String status) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/sessions/$sessionId/status-update/'),
      headers: headers,
      body: jsonEncode({
        'status': status,
      }),
    );
    return response.statusCode >= 200 && response.statusCode < 300;
  }

  /// Send Heartbeat
  Future<bool> sendHeartbeat(String sessionId, int temp, int util, int memoryUsed) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/sessions/$sessionId/heartbeat/'),
      headers: headers,
      body: jsonEncode({
        'gpu_temperature_c': temp,
        'gpu_utilization_pct': util,
        'memory_used_mib': memoryUsed,
      }),
    );
    return response.statusCode >= 200 && response.statusCode < 300;
  }

  /// Poll for Commands (e.g. STOP)
  Future<Map<String, dynamic>?> pollCommands(String sessionId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/sessions/$sessionId/commands/'),
      headers: headers,
    );

    if (response.statusCode == 200 && response.body.isNotEmpty) {
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  /// Get Host Earnings Data
  Future<Map<String, dynamic>?> getHostEarningsData() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/sessions/host/earnings/'),
        headers: headers,
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic> && decoded.containsKey('data')) {
          return decoded['data'] as Map<String, dynamic>;
        }
        return decoded as Map<String, dynamic>;
      } else {
        print('Error fetching earnings data: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('Network error fetching earnings data: $e');
      return null;
    }
  }
}
