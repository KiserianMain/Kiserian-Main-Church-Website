# SDA Church Kiserian Main Mobile App

## Overview
React Native mobile application for SDA Church Kiserian Main management system.

## Features
- ✅ User authentication (login/logout)
- ✅ Dashboard with stats and quick actions
- ✅ Announcements viewing
- ✅ Payment management
- ✅ Profile management
- 🔄 Push notifications (planned)
- 🔄 Offline mode (planned)
- 🔄 Biometric login (planned)

## Tech Stack
- **Frontend**: React Native 0.72.6
- **Navigation**: React Navigation 6
- **UI**: React Native Paper
- **State Management**: React Hooks + AsyncStorage
- **API**: Axios with existing backend (port 5080)

## Project Structure
```
mobile-app/
├── App.js                 # Main app entry point
├── package.json           # Dependencies and scripts
├── src/
│   ├── screens/           # App screens
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── AnnouncementsScreen.js
│   │   ├── PaymentsScreen.js
│   │   └── ProfileScreen.js
│   └── services/
│       └── api.js       # API layer (shared with web)
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Installation
```bash
cd mobile-app
npm install
```

### Running the App
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## API Integration
The mobile app connects to the same backend as the web application:
- **Base URL**: `http://localhost:5080/api`
- **Authentication**: JWT tokens stored in AsyncStorage
- **Real-time data**: Same endpoints as web app

## Development Status
- ✅ Project structure created
- ✅ Basic navigation setup
- ✅ API layer configured
- ✅ Login screen implemented
- ✅ Dashboard screen implemented
- ⏳ Other screens in progress
- ⏳ Testing and polish needed

## Next Steps
1. Complete remaining screens (Announcements, Payments, Profile)
2. Add push notification support
3. Implement offline mode
4. Add biometric authentication
5. Test on real devices
6. Prepare for app store submission

## Notes
- Uses existing backend API (no changes needed)
- Shares authentication logic with web app
- Responsive design for all screen sizes
- Follows same color scheme (off-white, blue, gold)
