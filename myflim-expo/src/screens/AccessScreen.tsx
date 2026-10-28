import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, KeyRound } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
];

export default function AccessScreen() {
  const { language, updateUser } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = {
    title: language === 'ar' ? 'Taban Play' : 'Taban Play',
    subtitle:
      language === 'ku'
        ? 'کۆدەکە بنووسە بۆ چالاككردنی ئەپ'
        : language === 'badini'
        ? 'کۆدی بنڤێسە بۆ چالاككرنا ئەپێ'
        : language === 'ar'
        ? 'أدخل الكود لتفعيل التطبيق'
        : 'Enter the code to activate the app',
    placeholder:
      language === 'ku'
        ? 'کۆدەکە لێرە بنووسە...'
        : language === 'ar'
        ? 'أدخل الكود هنا...'
        : 'Enter your code here...',
    btnLabel:
      language === 'ku'
        ? 'چالاككردن'
        : language === 'ar'
        ? 'تفعيل'
        : 'Activate',
    invalidCode:
      language === 'ku'
        ? 'کۆدەکە هەڵەیە. تکایە کۆدێکی دروست بنووسە.'
        : language === 'ar'
        ? 'الكود غير صحيح.'
        : 'Invalid code. Please try again.',
    emptyCode:
      language === 'ku'
        ? 'تکایە کۆدەکە بنووسە'
        : language === 'ar'
        ? 'الرجاء إدخال الكود'
        : 'Please enter the code',
  };

  const isRTL = language === 'ku' || language === 'badini' || language === 'ar';

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t.emptyCode);
      return;
    }
    const lower = trimmed.toLowerCase();
    setLoading(true);
    setError('');

    try {
      // Full unlock
      if (
        lower === 'tabanplay1' ||
        lower === 'taban play1' ||
        lower === 'myflim1' ||
        lower === 'taban2026'
      ) {
        await AsyncStorage.setItem('app_unlocked', 'true');
        await AsyncStorage.removeItem('taban_app_device_user_id');
        await updateUser({ name: 'User', image: DEFAULT_AVATARS[0], isPro: true });
        useAppStore.setState({ isUnlocked: true });

        // Log usage
        try {
          const { supabase } = require('../api/supabase');
          let deviceId = await AsyncStorage.getItem('device_id');
          if (!deviceId) {
            deviceId = 'app_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            await AsyncStorage.setItem('device_id', deviceId);
          }
          await supabase.from('user_logins').insert([{ source: 'app_code', device_id: deviceId, code_used: lower }]);
        } catch {}
      }
      // Demo mode (sports section)
      else if (lower === 'mdhd123') {
        await AsyncStorage.setItem('app_unlocked', 'true');
        await AsyncStorage.setItem('taban_app_device_user_id', 'usr_taban1');
        await updateUser({ name: 'Taban1', image: DEFAULT_AVATARS[0], isPro: false });
        useAppStore.setState({ isUnlocked: true });
      }
      else {
        setError(t.invalidCode);
      }
    } catch (e) {
      setError(t.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0F', '#12111A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Red glow circle */}
      <View style={styles.glowCircle} />

      {/* Content */}
      <View style={[styles.content, isRTL && { alignItems: 'flex-end' }]}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/app-logo-new.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <View style={styles.lockBadge}>
            <Lock size={14} color="#fff" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.appName}>Taban <Text style={{ color: '#CC222F' }}>Play</Text></Text>
        <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>{t.subtitle}</Text>

        {/* Card */}
        <View style={styles.card}>

          {/* Icon row */}
          <View style={[styles.cardIconRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.cardIcon}>
              <KeyRound size={18} color="#CC222F" />
            </View>
            <Text style={[styles.cardLabel, isRTL && { textAlign: 'right' }]}>
              {language === 'ku' ? 'کۆدی چالاككردن' : language === 'ar' ? 'رمز التفعيل' : 'Activation Code'}
            </Text>
          </View>

          {/* Input */}
          <TextInput
            style={[styles.input, isRTL && { textAlign: 'right' }]}
            placeholder={t.placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={code}
            onChangeText={(txt) => { setCode(txt); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />

          {/* Error */}
          {error ? (
            <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{error}</Text>
          ) : null}

          {/* Button */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t.btnLabel}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom hint */}
        <Text style={[styles.hint, isRTL && { textAlign: 'right' }]}>
          {language === 'ku'
            ? 'بۆ وەرگرتنی کۆد، پەیوەندی بکە بە تیم Taban Play'
            : language === 'ar'
            ? 'للحصول على الكود، تواصل مع فريق Taban Play'
            : 'Contact Taban Play team to get your code'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  glowCircle: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(204,34,47,0.07)',
    top: height * 0.12,
    alignSelf: 'center',
    shadowColor: '#CC222F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
    elevation: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  logoWrap: {
    position: 'relative',
    marginBottom: 18,
  },
  logoImg: {
    width: 88,
    height: 88,
    borderRadius: 22,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CC222F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0F',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 36,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 14,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(204,34,47,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  btn: {
    width: '100%',
    height: 52,
    backgroundColor: '#CC222F',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CC222F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    marginTop: 2,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hint: {
    marginTop: 28,
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
