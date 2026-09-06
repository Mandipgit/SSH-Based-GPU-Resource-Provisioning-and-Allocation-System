import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:forui/forui.dart';
import '../../services/api_service.dart';
import 'home_screen.dart';
import 'register_screen.dart';
import 'system_detection_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _apiService = ApiService();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter both email and password.';
        _isLoading = false;
      });
      return;
    }

    final result = await _apiService.login(email, password);

    if (!mounted) return;

    if (result['success'] == true) {
      if (mounted) {
        setState(() => _isLoading = true);
        try {
          // Verify user role before granting access
          final userProfile = await _apiService.getUserProfile();
          if (userProfile != null) {
            print('DEBUG LOGIN userProfile: $userProfile');
            final role = userProfile['role']?.toString().toLowerCase();
            final isHostRole = role == 'host' || role == 'both' || role == 'admin';
            final isHostFlag = userProfile['is_host'] == true || userProfile['is_host']?.toString().toLowerCase() == 'true';
            
            print('DEBUG LOGIN role: $role, isHostRole: $isHostRole, isHostFlag: $isHostFlag');
            final isHost = isHostRole || isHostFlag;
            
            if (!isHost) {
              await _apiService.logout();
              if (mounted) {
                setState(() {
                  _errorMessage = 'Access Denied: This application is only for Host accounts.';
                  _isLoading = false;
                });
              }
              return;
            }
          }

          final profile = await _apiService.getHostProfile();
          if (mounted) {
            if (profile != null && profile['gpu_name'] != null && profile['gpu_name'].toString().isNotEmpty) {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const HomeScreen()),
              );
            } else {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const SystemDetectionScreen()),
              );
            }
          }
        } catch (e) {
          // Fallback if profile fails to load
          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const SystemDetectionScreen()),
            );
          }
        }
      }
    } else {
      if (mounted) {
        setState(() {
          _errorMessage = result['error'] ?? 'Login failed';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Recreating the dark/yellow aesthetic from the reference
    return Scaffold(
      backgroundColor: const Color(0xFF121212), // Deep dark gray
      body: Center(
        child: SingleChildScrollView(
          child: Container(
            width: 400,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E), // Slightly lighter gray
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'HOST PORTAL',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFFFFE600), // Power BI Yellow
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 32),
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      border: Border.all(color: Colors.red),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red),
                      textAlign: TextAlign.center,
                    ),
                  ),
                FTextFormField.email(
                  control: FTextFieldManagedControl(controller: _emailController),
                  label: const Text('Email'),
                  hint: 'Enter your email',
                ),
                const SizedBox(height: 16),
                FTextFormField.password(
                  control: FTextFieldManagedControl(controller: _passwordController),
                  label: const Text('Password'),
                  hint: 'Enter your password',
                ),
                const SizedBox(height: 32),
                FButton(
                  onPress: _isLoading ? null : _login,
                  child: _isLoading ? const Text('LOGGING IN...') : const Text('LOGIN'),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    );
                  },
                  child: const Text('Need an account? Register here', style: TextStyle(color: Colors.grey)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
