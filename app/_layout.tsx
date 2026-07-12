import 'react-native-get-random-values';
import { useEffect, useState, useRef } from 'react';
import { Platform, Image, Animated, Dimensions, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ViewModeProvider } from '../src/context/ViewModeContext';
import { LocationProvider } from '../src/context/LocationContext';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { registerForPushNotificationsAsync, savePushToken } from '../src/lib/notifications';
import { showChatNotification } from '../src/lib/useMessageSound';

// Simple UUID generator that works in React Native without the uuid package
function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Global message notification listener refs
  const globalChatRef = useRef<any>(null);
  const globalShowroomRef = useRef<any>(null);
  const globalSupportRef = useRef<any>(null);

  // ── Global realtime listener: shows notification banner for new messages ──
  useEffect(() => {
    let userId: string | null = null;

    const setupGlobalListeners = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      userId = data.user.id;

      // ── 1. Regular chats ──────────────────────────────────────────────────
      globalChatRef.current = supabase
        .channel('global_chat_msgs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload: any) => {
            // Only notify for messages sent by others
            if (payload.new.sender_id === userId) return;
            try {
              // Get the chat to find sender name
              const { data: chat } = await supabase
                .from('chats')
                .select('buyer_id, seller_id')
                .eq('id', payload.new.chat_id)
                .maybeSingle();
              if (!chat) return;
              // Make sure we are a participant
              if (chat.buyer_id !== userId && chat.seller_id !== userId) return;
              const senderId = payload.new.sender_id;
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', senderId)
                .maybeSingle();
              const senderName = profile?.full_name || profile?.phone || 'پیامی تازە';
              showChatNotification(senderName, payload.new.text || '...');
            } catch (e) {}
          }
        )
        .subscribe();

      // ── 2. Showroom chats ─────────────────────────────────────────────────
      globalShowroomRef.current = supabase
        .channel('global_showroom_msgs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'showroom_messages' },
          async (payload: any) => {
            if (payload.new.sender_id === userId) return;
            try {
              const { data: chat } = await supabase
                .from('showroom_chats')
                .select('buyer_id, showroom_id')
                .eq('id', payload.new.chat_id)
                .maybeSingle();
              if (!chat) return;
              if (chat.buyer_id !== userId && chat.showroom_id !== userId) return;

              // Determine sender name — could be a showroom
              let senderName = 'پیامی تازە';
              const { data: showroom } = await supabase
                .from('showrooms')
                .select('name')
                .eq('id', payload.new.sender_id)
                .maybeSingle();
              if (showroom?.name) {
                senderName = showroom.name;
              } else {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name, phone')
                  .eq('id', payload.new.sender_id)
                  .maybeSingle();
                senderName = profile?.full_name || profile?.phone || 'پیامی تازە';
              }
              showChatNotification(senderName, payload.new.text || '...');
            } catch (e) {}
          }
        )
        .subscribe();

      // ── 3. Support / Admin chat ───────────────────────────────────────────
      globalSupportRef.current = supabase
        .channel('global_support_msgs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'support_messages' },
          async (payload: any) => {
            if (payload.new.sender_type !== 'admin') return;
            // Verify this chat belongs to us
            try {
              const { data: chat } = await supabase
                .from('support_chats')
                .select('user_id')
                .eq('id', payload.new.chat_id)
                .maybeSingle();
              if (!chat || chat.user_id !== userId) return;
              showChatNotification('تیمی پشتگیری تابان', payload.new.text || '...');
            } catch (e) {}
          }
        )
        .subscribe();
    };

    // Set up listeners on auth change
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Clean up old channels first
        if (globalChatRef.current) supabase.removeChannel(globalChatRef.current);
        if (globalShowroomRef.current) supabase.removeChannel(globalShowroomRef.current);
        if (globalSupportRef.current) supabase.removeChannel(globalSupportRef.current);
        setupGlobalListeners();
      } else {
        // Signed out — remove channels
        if (globalChatRef.current) supabase.removeChannel(globalChatRef.current);
        if (globalShowroomRef.current) supabase.removeChannel(globalShowroomRef.current);
        if (globalSupportRef.current) supabase.removeChannel(globalSupportRef.current);
      }
    });

    setupGlobalListeners();

    return () => {
      authListener.subscription.unsubscribe();
      if (globalChatRef.current) supabase.removeChannel(globalChatRef.current);
      if (globalShowroomRef.current) supabase.removeChannel(globalShowroomRef.current);
      if (globalSupportRef.current) supabase.removeChannel(globalSupportRef.current);
    };
  }, []);

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
            deviceId = generateUUID();
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

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) savePushToken(token);
    });

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


