# Quick Start Guide

Get your BikeRiders mobile app running in 5 minutes!

## 1. Install Dependencies

```bash
cd mobile
npm install
```

## 2. Set Up Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Add your Supabase credentials (from your main project's `.env`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Start the App

```bash
npm start
```

## 4. Run on Device

**Option A: Use Expo Go (Easiest)**
1. Install "Expo Go" app from App Store/Play Store
2. Scan the QR code from your terminal
3. App will load on your phone

**Option B: Use Simulator**
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator

## 5. Test the App

1. Create an account or sign in
2. View the community feed on Home tab
3. Explore routes and rides in Explore tab
4. Try the GPS tracking feature
5. Check out groups and events in Community
6. View your profile and stats

## Key Features

- ✅ Real-time GPS tracking with maps
- ✅ View and create posts
- ✅ Join rides and groups
- ✅ Track distance and speed
- ✅ Offline support (location tracking continues without internet)

## Troubleshooting

**"Cannot connect to Supabase"**
- Check your `.env` file has correct credentials
- Verify internet connection

**"Location permission denied"**
- Go to phone Settings → BikeRiders → Enable Location

**App crashes on startup**
- Clear cache: `expo start -c`
- Reinstall: `rm -rf node_modules && npm install`

## Next Steps

- Customize the app colors and branding
- Add push notifications
- Implement offline mode for posts
- Add social features like direct messaging

Happy riding! 🏍️
