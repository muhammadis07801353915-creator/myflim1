import 'react-native-get-random-values';
import { useEffect, useState, useRef } from 'react';
import { Platform, Image, Animated, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ViewModeProvider } from '../src/context/ViewModeContext';
import { LocationProvider } from '../src/context/LocationContext';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native splash immediately
    SplashScreen.hideAsync();

    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }

    // Track app visit (once per day per device)
    const trackVisit = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const storageKey = `app_visited_${todayStr}`;
        const alreadyVisited = await AsyncStorage.getItem(storageKey);
        
        if (!alreadyVisited) {
          // Get or create device ID
          let deviceId = await AsyncStorage.getItem('device_id');
          if (!deviceId) {
            deviceId = uuidv4();
            await AsyncStorage.setItem('device_id', deviceId);
          }

          // Get current user (if logged in)
          const { data: { user } } = await supabase.auth.getUser();

          await supabase.from('app_visits').insert({
            device_id: deviceId,
            user_id: user?.id || null,
            visited_at: new Date().toISOString(),
          });

          await AsyncStorage.setItem(storageKey, '1');
        }
      } catch (e) {
        // Silently fail - don't disrupt the user
        console.warn('Visit tracking failed:', e);
      }
    };

    trackVisit();

    // Show custom splash for 3 seconds, then fade out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ViewModeProvider>
          <LocationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </LocationProvider>
        </ViewModeProvider>
      </LanguageProvider>

      {/* Custom Splash Screen - overlays everything */}
      {showSplash && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: width,
            height: height,
            backgroundColor: '#CC222F',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            opacity: fadeAnim,
          }}
        >
          <Image
            source={require('../assets/splash-icon.png')}
            style={{
              width: width,
              height: height,
              resizeMode: 'contain',
            }}
          />
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
}
