# 🚀 Deployment Guide - Render + Vercel + Local Development

## 📋 Overview
Deploy your SDA Church system to production while continuing development in Windsurf locally.

## 🔄 Development Workflow

```
Local Development (Windsurf) 
    ↓ Git Push
Auto-Deploy (Render/Vercel)
    ↓ 
Production (Live)
```

## 🛠️ Setup Instructions

### **1. Backend Deployment - Render**

#### **Create Account**
1. Sign up at [render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service

#### **Configuration**
- **Service Type**: Node.js
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/api/health`

#### **Environment Variables**
```bash
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://sda-church-kiserian.onrender.com
DATABASE_URL=postgresql://user:password@host:5432/database
```

#### **KopoKopo Integration**
```bash
KOPOKOPO_API_KEY=your_kopokopo_key
KOPOKOPO_API_SECRET=your_kopokopo_secret
KOPOKOPO_WEBHOOK_SECRET=your_webhook_secret
```

### **2. Frontend Deployment - Vercel**

#### **Create Account**
1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Import `vercel.json` configuration

#### **Configuration**
- **Framework**: Vite (auto-detected)
- **Build Output**: `dist`
- **API Routes**: Proxy to Render backend

### **3. Flutter Mobile App**

#### **Development** (Local)
```bash
cd flutter-mobile
flutter run                    # Uses localhost:5080
```

#### **Production** (App Store/Play Store)
```bash
# Update API URL in lib/services/config.dart
flutter build apk --release
flutter build ios --release
```

## 🔧 Environment Configuration

### **Development URLs**
- **Backend**: `http://localhost:5080/api`
- **Frontend**: `http://localhost:5180`
- **Flutter**: Uses development API

### **Production URLs**
- **Backend**: `https://sda-church-api.onrender.com/api`
- **Frontend**: `https://sda-church-kiserian.onrender.com`
- **Flutter**: Uses production API

## 🚀 Deployment Commands

### **Initial Setup**
```bash
# Backend
cd backend
git add .
git commit -m "Add Render configuration"
git push origin main

# Frontend
cd frontend
git add .
git commit -m "Add Vercel configuration"
git push origin main

# Flutter
cd flutter-mobile
git add .
git commit -m "Add production configuration"
git push origin main
```

### **Automatic Deployment**
Once configured:
- **Push to main branch** → Auto-deploy to production
- **No manual deployment needed**
- **Zero downtime deployment**

## 🔄 Development Workflow

### **Daily Development**
1. **Work locally** in Windsurf
2. **Test changes** on localhost
3. **Commit changes** with descriptive messages
4. **Push to GitHub** → Auto-deploy to production

### **Environment Switching**
```bash
# Development (default)
flutter run

# Production testing
flutter run -d web --release
```

## 📱 Real-time Sync

### **How it works**
```
Local Changes → Push to GitHub → Auto-Deploy → Production API
                                                        ↓
                                              Flutter App (Production)
```

### **Instant Updates**
- **Web app updates** → Production API → Flutter app syncs
- **Flutter payments** → Production API → Web dashboard updates
- **Admin changes** → Production API → Both platforms update

## 🛡️ Security & Performance

### **Environment Variables**
- **Never commit** secrets to Git
- **Use different** keys for dev/prod
- **Rotate secrets** regularly

### **Database**
- **Render PostgreSQL** - Automatic backups
- **Connection pooling** - Handle traffic
- **SSL encryption** - Secure data

### **API Security**
- **Rate limiting** - Prevent abuse
- **CORS configuration** - Proper origins
- **JWT authentication** - Secure sessions

## 📊 Monitoring

### **Render Dashboard**
- **Server metrics** - CPU, memory, requests
- **Error logs** - Debug issues
- **Deployment logs** - Track deployments

### **Vercel Analytics**
- **Page views** - User engagement
- **Performance** - Load times
- **Error tracking** - Frontend issues

### **Flutter Analytics**
- **Crash reports** - App stability
- **Usage metrics** - Feature adoption
- **Performance data** - App optimization

## 🔧 Troubleshooting

### **Common Issues**

#### **Backend Deployment**
```bash
# Check Render logs
render logs sda-church-api

# Redeploy manually
render deploy sda-church-api

# Check environment variables
render env sda-church-api
```

#### **Frontend Deployment**
```bash
# Check Vercel logs
vercel logs

# Redeploy manually
vercel --prod
```

#### **Flutter Issues**
```bash
# Clear cache
flutter clean
flutter pub get

# Check API connectivity
curl https://sda-church-api.onrender.com/api/health
```

## 📞 Support

### **Deployment Issues**
- **Render Support**: support@render.com
- **Vercel Support**: support@vercel.com
- **GitHub Issues**: Repository issues tab

### **Application Issues**
- **Backend**: Check Render logs
- **Frontend**: Check Vercel logs
- **Mobile**: Check Flutter crash reports

---

## 🎯 Best Practices

### **Development**
- **Feature branches** for new features
- **Pull requests** for code review
- **Automated tests** before deployment
- **Staging environment** for testing

### **Deployment**
- **Zero downtime** deployments
- **Rollback capability** for issues
- **Health checks** for monitoring
- **Backup strategy** for data safety

### **Security**
- **Environment secrets** never in code
- **HTTPS everywhere** in production
- **Regular updates** for dependencies
- **Access control** for sensitive features

---

**Result**: Your SDA Church system runs in production while you continue developing locally in Windsurf! 🚀
