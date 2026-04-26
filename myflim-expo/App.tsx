import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, LogBox, Animated, StyleSheet, View, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/useAppStore';
import { getColors } from './src/theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

function App(): React.JSX.Element {
  const { fetchInitialData, theme } = useAppStore();
  const themeColors = getColors(theme);
  
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

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
    if (appIsReady) {
      // Hide native splash screen immediately, revealing our custom Animated View beneath it
      SplashScreen.hideAsync().catch(() => {});

      // Start a cinematic zoom-in and fade-out animation
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(2000), 
          Animated.timing(opacityValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => {
        setAnimationDone(true);
      });
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <View style={{ flex: 1, backgroundColor: '#0F0F13' }} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar 
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'} 
          backgroundColor={themeColors.background} 
        />
        <AppNavigator />
      </NavigationContainer>

      {!animationDone && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          { 
            backgroundColor: '#0F0F13',
            opacity: opacityValue,
            zIndex: 9999,
          }
        ]}>
          <Animated.Image 
            source={require('./assets/splash-screen-full.jpg')}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              resizeMode: 'cover',
              transform: [{ scale: scaleValue }]
            }}
          />
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
}

export default App;
