import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _baseUrl = 'http://localhost:5080/api';
  static const Duration _timeout = Duration(seconds: 10);
  
  // Get current API URL based on environment
  static String get baseUrl {
    const bool isProduction = const bool.fromEnvironment('dart.vm.product');
    return isProduction ? 'https://your-render-backend-url.onrender.com/api' : _baseUrl;
  }
  
  final Dio _dio;
  final FlutterSecureStorage _secureStorage;
  
  ApiService._(this._dio, this._secureStorage);
  
  factory ApiService() {
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: _timeout,
      receiveTimeout: _timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    final secureStorage = FlutterSecureStorage();
    
    // Add auth interceptor
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await secureStorage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired, clear storage
            await secureStorage.delete(key: 'auth_token');
            await secureStorage.delete(key: 'user_data');
            // Navigate to login (handled by auth service)
          }
          handler.next(error);
        },
      ),
    );
    
    return ApiService._(dio, secureStorage);
  }
  
  // Authentication endpoints
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      
      if (response.statusCode == 200) {
        final data = response.data;
        
        // Store token and user data
        await _secureStorage.write(key: 'auth_token', value: data['token']);
        await _secureStorage.write(key: 'user_data', value: jsonEncode(data['user']));
        
        return {
          'success': true,
          'user': data['user'],
          'token': data['token'],
        };
      }
      
      return {'success': false, 'error': 'Login failed'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
  
  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final response = await _dio.post('/auth/register', data: userData);
      
      if (response.statusCode == 201) {
        final data = response.data;
        
        await _secureStorage.write(key: 'auth_token', value: data['token']);
        await _secureStorage.write(key: 'user_data', value: jsonEncode(data['user']));
        
        return {
          'success': true,
          'user': data['user'],
          'token': data['token'],
        };
      }
      
      return {'success': false, 'error': 'Registration failed'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
  
  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final token = await _secureStorage.read(key: 'auth_token');
      final userData = await _secureStorage.read(key: 'user_data');
      
      if (token != null && userData != null) {
        return {
          'success': true,
          'user': jsonDecode(userData),
          'token': token,
          'isAuthenticated': true,
        };
      }
      
      return {'success': false, 'isAuthenticated': false};
    } catch (e) {
      return {'success': false, 'isAuthenticated': false};
    }
  }
  
  Future<void> logout() async {
    await _secureStorage.delete(key: 'auth_token');
    await _secureStorage.delete(key: 'user_data');
    await SharedPreferences.getInstance().then((prefs) => prefs.clear());
  }
  
  // Dashboard data
  Future<Map<String, dynamic>> getDashboardData() async {
    try {
      final response = await _dio.get('/dashboard');
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': response.data,
        };
      }
      
      return {'success': false, 'error': 'Failed to load dashboard'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
  
  // Announcements
  Future<Map<String, dynamic>> getAnnouncements() async {
    try {
      final response = await _dio.get('/announcements');
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'announcements': response.data,
        };
      }
      
      return {'success': false, 'error': 'Failed to load announcements'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
  
  // Payments
  Future<Map<String, dynamic>> getPaymentHistory() async {
    try {
      final response = await _dio.get('/payments/history');
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'payments': response.data,
        };
      }
      
      return {'success': false, 'error': 'Failed to load payment history'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
  
  Future<Map<String, dynamic>> makePayment(Map<String, dynamic> paymentData) async {
    try {
      final response = await _dio.post('/payments', data: paymentData);
      
      if (response.statusCode == 201) {
        return {
          'success': true,
          'payment': response.data,
        };
      }
      
      return {'success': false, 'error': 'Payment failed'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
  
  // Profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/profile');
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'profile': response.data,
        };
      }
      
      return {'success': false, 'error': 'Failed to load profile'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
  
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _dio.put('/profile', data: profileData);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'profile': response.data,
        };
      }
      
      return {'success': false, 'error': 'Failed to update profile'};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data['error'] ?? 'Network error occurred',
      };
    }
  }
}
