# BikeRiders Mobile App

A React Native mobile app for the BikeRiders community platform. Connect with riders, track your rides, and explore routes on the go.

## Features

- **User Authentication**: Sign up and log in with email/password
- **Social Feed**: View and interact with posts from the community
- **Explore Routes & Rides**: Discover popular routes and upcoming group rides
- **GPS Tracking**: Real-time ride tracking with distance and speed metrics
- **Community**: Join groups and attend events
- **Profile Management**: View and manage your rider profile

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your phone (optional, for testing on device)

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings.

### 3. Run the App

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## Project Structure

```
mobile/
├── App.tsx                 # Main app component with navigation
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── lib/
│   │   └── supabase.ts       # Supabase client
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── RegisterScreen.tsx
│       ├── HomeScreen.tsx
│       ├── ExploreScreen.tsx
│       ├── RideTrackingScreen.tsx  # GPS tracking
│       ├── CommunityScreen.tsx
│       └── ProfileScreen.tsx
```

## Key Technologies

- **React Native**: Cross-platform mobile framework
- **Expo**: Development toolchain for React Native
- **React Navigation**: Navigation library
- **Supabase**: Backend and authentication
- **Expo Location**: GPS tracking
- **React Native Maps**: Map display and route visualization

## Features by Screen

### Home Screen
- View community feed
- Like and comment on posts
- Pull to refresh

### Explore Screen
- Browse popular routes
- Discover upcoming rides
- Filter and search

### Ride Tracking Screen
- Real-time GPS tracking
- Distance and speed metrics
- Route visualization on map
- Save completed rides

### Community Screen
- Browse and join groups
- View upcoming events
- RSVP to events

### Profile Screen
- View ride statistics
- Edit profile information
- Sign out

## Development Notes

### Testing on Real Device

1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. App will load on your device

### Location Permissions

The app requests location permissions for ride tracking. Make sure to:
- Allow location access when prompted
- For iOS: Location permission is required
- For Android: Location permission is required

### Common Issues

**App won't start:**
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Location not working:**
- Check location permissions in device settings
- Make sure GPS is enabled on device
- Try on a real device (simulators may have limited GPS support)

**Supabase connection issues:**
- Verify your `.env` file has correct credentials
- Check network connection
- Ensure Supabase project is active

## Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

Follow Expo's documentation for detailed build instructions.

## Contributing

This mobile app shares the same Supabase database as the web application, so changes to the database schema will affect both platforms.

## License

Proprietary - BikeRiders Community Platform
