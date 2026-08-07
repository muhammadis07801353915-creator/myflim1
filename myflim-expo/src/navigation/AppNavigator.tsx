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
  const { language, theme } = useAppStore();
  const themeColors = getColors(theme);
  const t = translations[language] || translations.en;
  const isRTL = language === 'ku' || language === 'ar';

  const screens = [
    {
      name: "HomeTab",
      component: HomeScreen,
      label: t.home,
      icon: ({ color, size }: any) => <Home color={color} size={size} />,
    },
    {
      name: "LiveTVTab",
      component: LiveTVScreen,
      label: t.liveTv,
      icon: ({ color, size }: any) => <Tv color={color} size={size} />,
    },
    {
      name: "SearchTab",
      component: SearchScreen,
      label: t.search,
      icon: ({ color, size }: any) => <Search color={color} size={size} />,
    },
    {
      name: "WatchlistTab",
      component: WatchlistScreen,
      label: t.watchlist,
      icon: ({ color, size }: any) => <Bookmark color={color} size={size} />,
    },
    {
      name: "ProfileTab",
      component: ProfileScreen,
      label: t.profile,
      icon: ({ color, size }: any) => <User color={color} size={size} />,
    },
  ];

  // In RTL mode (Kurdish / Arabic), reverse tab order so Home is on far right, Profile on far left
  const orderedScreens = isRTL ? [...screens].reverse() : screens;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: theme === 'light' ? '#FFFFFF' : 'rgba(14, 15, 23, 0.95)',
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
          elevation: 4,
          height: Platform.OS === 'ios' ? 85 : 70 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView tint={theme === 'light' ? 'light' : 'dark'} intensity={95} style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
      }}
    >
      {orderedScreens.map((s) => (
        <Tab.Screen
          key={s.name}
          name={s.name}
          component={s.component}
          options={{
            tabBarLabel: s.label,
            tabBarIcon: s.icon,
          }}
        />
      ))}
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
