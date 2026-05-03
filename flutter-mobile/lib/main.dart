import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'app/router.dart';
import 'app/theme.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize services
  await SharedPreferences.getInstance();
  
  runApp(
    ProviderScope(
      child: SDAChurchApp(),
    ),
  );
}

class SDAChurchApp extends ConsumerWidget {
  const SDAChurchApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final theme = AppTheme.lightTheme;
    final darkTheme = AppTheme.darkTheme;
    
    return MaterialApp.router(
      title: 'SDA Church Kiserian',
      debugShowCheckedModeBanner: false,
      
      // Theme
      theme: theme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
      
      // Router
      routerConfig: router,
      
      // Builder for consistent styling
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaleFactor: 1.0, // Prevent text scaling issues
          ),
          child: child!,
        );
      },
    );
  }
}
