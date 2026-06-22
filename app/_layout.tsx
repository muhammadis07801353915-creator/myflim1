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
