import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS, getColors } from '../theme/theme';
import { Home, Tv, Search, User, Bookmark } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import LiveTVScreen from '../screens/LiveTVScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import DetailScreen from '../screens/DetailScreen';
import CategoryScreen from '../screens/CategoryScreen';

import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { language } = useAppStore();
  const t = translations[language];
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(10, 10, 10, 0.9)',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 70 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          borderTopColor: 'transparent',
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView tint="dark" intensity={90} style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: t.home,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="LiveTVTab" 
        component={LiveTVScreen} 
        options={{
          tabBarLabel: t.liveTv,
          tabBarIcon: ({ color, size }) => <Tv color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen} 
        options={{
          tabBarLabel: t.search,
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="WatchlistTab" 
        component={WatchlistScreen} 
        options={{
          tabBarLabel: t.watchlist,
          tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: t.profile,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useAppStore();
  const themeColors = getColors(theme);
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeColors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
    </Stack.Navigator>
  );
}
