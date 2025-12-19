import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-url-polyfill/auto';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { MockAuthProvider, useMockAuth } from './src/contexts/MockAuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import RideTrackingScreen from './src/screens/RideTrackingScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import EventsScreen from './src/screens/EventsScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import CreateRideScreen from './src/screens/CreateRideScreen';
import CommentsScreen from './src/screens/CommentsScreen';
import EditPostScreen from './src/screens/EditPostScreen';
import EditRideScreen from './src/screens/EditRideScreen';
import { NetworkTestScreen } from './src/screens/NetworkTestScreen';
import { DatabaseTestScreen } from './src/screens/DatabaseTestScreen';
import { RidesTableTestScreen } from './src/screens/RidesTableTestScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#B97232',
        tabBarInactiveTintColor: '#ECEAD1',
        tabBarStyle: {
          backgroundColor: '#1C1C1C',
          borderTopWidth: 1,
          borderTopColor: '#B97232',
          paddingBottom: 30,
          paddingTop: 5,
          height: 80,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Rides') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Rides" component={ExploreScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="CreatePost" 
              component={CreatePostScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Comments" 
              component={CommentsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="EditPost" 
              component={EditPostScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="CreateRide" 
              component={CreateRideScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="EditRide" 
              component={EditRideScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="DatabaseTest" 
              component={DatabaseTestScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="RidesTableTest" 
              component={RidesTableTestScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="RideTracking" 
              component={RideTrackingScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>

  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
