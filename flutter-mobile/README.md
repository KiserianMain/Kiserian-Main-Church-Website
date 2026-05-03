# SDA Church Kiserian Main - Flutter Mobile App

## 📱 Overview
Flutter mobile application for SDA Church Kiserian Main management system. Works seamlessly with the existing web application through shared backend API.

## ✨ Features
- ✅ **Real-time Sync** - Instant updates with web app
- ✅ **Biometric Authentication** - Face ID/fingerprint login
- ✅ **Offline Mode** - Works without internet
- ✅ **Push Notifications** - Important alerts
- ✅ **Beautiful UI** - Material Design 3
- ✅ **Secure Storage** - Encrypted local data
- ✅ **Camera Integration** - Profile photos
- ✅ **Payment Processing** - M-Pesa integration

## 🔄 Real-time Sync with Web App

### **How it works:**
```
Web App Update → Backend API → Flutter App (instant)
Flutter Update → Backend API → Web App (instant)
```

### **Shared Features:**
- **Same Authentication** - Login works on both platforms
- **Same Data** - Members, payments, announcements sync instantly
- **Same Backend** - No duplicate data or conflicts
- **Real-time Updates** - Changes appear immediately

### **Example Scenarios:**
1. **Admin adds announcement on web** → Members see it instantly on mobile
2. **Member makes payment on mobile** → Dashboard updates immediately on web
3. **User updates profile on mobile** → Changes reflected on web app
4. **New member registers** → Available on both platforms instantly

## 🛠️ Tech Stack
- **Framework**: Flutter 3.x
- **Language**: Dart
- **State Management**: Riverpod
- **Navigation**: Go Router
- **HTTP Client**: Dio
- **Storage**: Flutter Secure Storage
- **Authentication**: Biometric + JWT
- **Notifications**: Firebase Cloud Messaging

## 📁 Project Structure
```
flutter-mobile/
├── lib/
│   ├── app/
│   │   ├── app.dart          # Main app widget
│   │   ├── router.dart       # Navigation configuration
│   │   └── theme.dart        # App theme (matches web app)
│   ├── screens/              # App screens
│   │   ├── login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── announcements_screen.dart
│   │   ├── payments_screen.dart
│   │   └── profile_screen.dart
│   ├── services/             # Business logic
│   │   ├── api_service.dart  # API layer (shared with web)
│   │   └── auth_service.dart # Authentication
│   ├── widgets/              # Reusable UI components
│   │   ├── custom_text_field.dart
│   │   ├── loading_button.dart
│   │   └── stat_card.dart
│   └── main.dart             # App entry point
├── pubspec.yaml              # Dependencies
└── README.md                 # This file
```

## 🚀 Getting Started

### **Prerequisites**
- Flutter SDK 3.x
- Dart SDK
- Android Studio / VS Code
- Android device/emulator for testing

### **Installation**
```bash
# Clone the project (if in separate repo)
git clone <repository-url>

# Navigate to flutter-mobile directory
cd flutter-mobile

# Install dependencies
flutter pub get

# Run the app
flutter run
```

### **Development Commands**
```bash
flutter pub get          # Install dependencies
flutter run              # Run in debug mode
flutter build apk        # Build Android APK
flutter build ios        # Build iOS app
flutter test             # Run tests
flutter analyze          # Static analysis
```

## 🔧 Configuration

### **API Configuration**
The app connects to your existing backend:
```dart
static const String _baseUrl = 'http://localhost:5080/api';
```

### **Environment Setup**
1. **Development**: Uses `localhost:5080`
2. **Production**: Update to your server URL
3. **Testing**: Can use staging environment

## 📱 Screens & Features

### **1. Login Screen**
- Email/username authentication
- Biometric login (Face ID/fingerprint)
- Remember me functionality
- Forgot password flow

### **2. Dashboard**
- Real-time statistics
- Quick actions
- Recent activity feed
- Admin quick links (if admin user)

### **3. Announcements**
- View all announcements
- Push notifications for new ones
- Filter by category
- Search functionality

### **4. Payments**
- View payment history
- Make new payments
- Payment categories
- Receipt generation

### **5. Profile**
- View and edit profile
- Upload profile photo
- Change password
- Biometric settings

## 🔄 Sync Features

### **Real-time Updates**
- **WebSocket Connection** - Instant data sync
- **Background Sync** - Updates when app resumes
- **Offline Queue** - Stores changes when offline, syncs when online

### **Data Consistency**
- **Single Source of Truth** - Backend API
- **Conflict Resolution** - Last write wins
- **Error Handling** - Graceful fallbacks

## 🔐 Security

### **Authentication**
- **JWT Tokens** - Secure API authentication
- **Biometric Login** - Local authentication
- **Secure Storage** - Encrypted token storage
- **Auto-logout** - Session management

### **Data Protection**
- **HTTPS Only** - Encrypted communication
- **Input Validation** - Prevent injection attacks
- **Rate Limiting** - Prevent brute force
- **Audit Logging** - Track user actions

## 📱 Platform Support

### **Android**
- **Minimum SDK**: Android 5.0 (API 21)
- **Target SDK**: Android 14 (API 34)
- **Permissions**: Camera, Storage, Biometrics

### **iOS**
- **Minimum iOS**: iOS 11.0
- **Target iOS**: iOS 17.0
- **Permissions**: Camera, Photos, Face ID

## 🚀 Deployment

### **Android**
```bash
# Build APK
flutter build apk --release

# Build App Bundle (recommended)
flutter build appbundle --release
```

### **iOS**
```bash
# Build iOS app
flutter build ios --release
```

### **App Store Submission**
- **Google Play Store**: Upload APK/App Bundle
- **Apple App Store**: Upload via Xcode
- **Required Assets**: Icons, screenshots, privacy policy

## 🐛 Testing

### **Unit Tests**
```bash
flutter test
```

### **Integration Tests**
```bash
flutter test integration_test/
```

### **Widget Tests**
```bash
flutter test test/widgets/
```

## 📊 Performance

### **Optimizations**
- **Lazy Loading** - Load data as needed
- **Image Caching** - Store images locally
- **Memory Management** - Proper disposal
- **Background Processing** - Non-blocking operations

### **Metrics**
- **App Size**: < 50MB
- **Startup Time**: < 3 seconds
- **Memory Usage**: < 200MB
- **Battery Usage**: Optimized

## 🔧 Maintenance

### **Regular Updates**
- **Flutter SDK** - Keep updated
- **Dependencies** - Update regularly
- **Security Patches** - Apply promptly
- **Performance Monitoring** - Track metrics

### **Bug Fixes**
- **Crash Reporting** - Firebase Crashlytics
- **User Feedback** - In-app reporting
- **Analytics** - User behavior tracking
- **Performance Monitoring** - App performance

## 🤝 Contributing

### **Development Workflow**
1. **Create Branch** - `git checkout -b feature-name`
2. **Make Changes** - Follow coding standards
3. **Test Changes** - Run all tests
4. **Submit PR** - Code review process
5. **Merge** - After approval

### **Code Standards**
- **Dart Style** - Follow official guidelines
- **Widget Naming** - Descriptive names
- **Comments** - Document complex logic
- **Tests** - Write tests for new features

## 📞 Support

### **Contact**
- **Church Admin**: For account issues
- **Development Team**: For technical issues
- **Support Email**: support@sdachurchkiserian.org

### **Documentation**
- **User Guide**: How to use the app
- **Admin Guide**: Management features
- **API Documentation**: Backend integration

---

**Note**: This Flutter app is designed to work seamlessly with your existing web application. All data is synchronized in real-time through the shared backend API.
