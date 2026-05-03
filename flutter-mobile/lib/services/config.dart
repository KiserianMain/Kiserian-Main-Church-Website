class AppConfig {
  // Development
  static const String _devApiUrl = 'http://localhost:5080/api';
  
  // Production (Render)
  static const String _prodApiUrl = 'https://sda-church-api.onrender.com/api';
  
  // Current API URL
  static String get apiUrl {
    const bool isProduction = const bool.fromEnvironment(
      'dart.vm.product',
      defaultValue: false,
    );
    
    return isProduction ? _prodApiUrl : _devApiUrl;
  }
  
  // App Info
  static const String appName = 'SDA Church Kiserian';
  static const String appVersion = '1.0.0';
  
  // Environment
  static bool get isDevelopment {
    return !const bool.fromEnvironment('dart.vm.product');
  }
  
  static bool get isProduction {
    return const bool.fromEnvironment('dart.vm.product');
  }
}
