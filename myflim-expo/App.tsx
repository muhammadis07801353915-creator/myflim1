import React, { useEffect, useState, useRef } from 'react';
import {
  StatusBar, LogBox, Animated, StyleSheet,
  View, Dimensions, Image, Text
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import AccessScreen from './src/screens/AccessScreen';
import UpdateChecker from './src/components/UpdateChecker';
import { useAppStore } from './src/store/useAppStore';
import { getColors } from './src/theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

function App(): React.JSX.Element {
  const { fetchInitialData, theme, isUnlocked } = useAppStore();
  const themeColors = getColors(theme);

  const [appIsReady, setAppIsReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Animation values
  const logoScale   = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Glow pulse
  const glowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function prepare() {
      try {
        await fetchInitialData();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!appIsReady) return;

    // Hide native splash immediately — our animated splash takes over
    SplashScreen.hideAsync().catch(() => {});

    // Phase 1: Logo fades + scales in (0 → 1s)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: Text fades in after 600ms
    setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 600);

    // Phase 3: Glow pulse loop
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1.00, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Phase 4: After 3.5s — fade out entire splash
    setTimeout(() => {
      pulse.stop();
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setSplashDone(true);
      });
    }, 3500);
  }, [appIsReady]);

  if (!appIsReady) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor={themeColors.background}
        />
        <AppNavigator />
        <UpdateChecker />
      </NavigationContainer>

      {/* Custom Animated Splash Screen */}
      {!splashDone && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.splashContainer,
            { opacity: screenOpacity },
          ]}
          pointerEvents="none"
        >
          {/* Dark gradient background */}
          <View style={styles.background} />

          {/* Red glow circle behind logo */}
          <Animated.View
            style={[
              styles.glowCircle,
              { transform: [{ scale: glowScale }] },
            ]}
          />

          {/* Logo image */}
          <Animated.Image
            source={require('./assets/app-logo-new.png')}
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
            resizeMode="contain"
          />

          {/* App name */}
          <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
            <Text style={styles.titleTaban}>Taban </Text>
            <Text style={styles.titlePlay}>Play</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
            WATCH · ENJOY · ANYTIME
          </Animated.Text>

          {/* Bottom wave decoration */}
          <View style={styles.waveContainer}>
            <View style={[styles.waveLine, { opacity: 0.15, bottom: 80 }]} />
            <View style={[styles.waveLine, { opacity: 0.10, bottom: 60 }]} />
            <View style={[styles.waveLine, { opacity: 0.06, bottom: 40 }]} />
          </View>
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    zIndex: 9999,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
  },
  glowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    // Soft shadow-like glow
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 20,
    top: SCREEN_HEIGHT / 2 - 200,
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 24,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  titleTaban: {
    fontSize: 38,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  titlePlay: {
    fontSize: 38,
    fontWeight: '900',
    color: '#e53935',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 4,
    fontWeight: '500',
    marginTop: 4,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  waveLine: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 80,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#e53935',
    backgroundColor: 'transparent',
  },
});

export default App;
