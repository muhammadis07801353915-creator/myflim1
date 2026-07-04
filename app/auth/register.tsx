import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { ChevronLeft, Phone, ShieldCheck, User } from 'lucide-react-native';
import { useLanguage } from '../../src/i18n/LanguageContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'sms' | 'whatsapp' | null>(null);
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  const OTPIQ_KEY = 'sk_live_3c2cce85267eb321a50dae7afa9815c8d4b8f7ae';

  const handleSendOtp = async (provider: 'sms' | 'whatsapp' = 'sms') => {
    if (!name || name.trim().length < 2) {
      Alert.alert('هەڵە', 'تکایە ناوەکەت بە دروستی بنووسە');
      return;
    }

    if (!phone || phone.length < 10) {
      Alert.alert('هەڵە', 'تکایە ژمارەی مۆبایل بە دروستی بنووسە');
      return;
    }

    setSelectedProvider(provider);
    setLoading(true);
    try {
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
      if (!cleanPhone.startsWith('964')) cleanPhone = `964${cleanPhone}`;

      const rawDigits = phone.replace(/[^0-9]/g, '');
      const email = `u${rawDigits}@taban.com`;
      const password = `OTP_${rawDigits}_SECURE`;

      // Try sign up - if user already exists we handle gracefully
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { phone, full_name: name.trim() }
        }
      });

      const alreadyExists = signUpError &&
        (signUpError.message.includes('User already registered') ||
         signUpError.message.includes('already exists') ||
         signUpError.message.includes('already registered'));

      if (signUpError && !alreadyExists) {
        Alert.alert('هەڵە', signUpError.message);
        setLoading(false);
        return;
      }

      // If already exists, verify password works (account is complete)
      if (alreadyExists) {
        const { error: checkError } = await supabase.auth.signInWithPassword({ email, password });
        if (checkError) {
          // Account exists but password wrong - old account with different system
          Alert.alert('هەڵە', 'کێشەیەک هەیە لە ئەکاونتەکەت، پەیوەندی بکە بە پشتیوانی.');
          setLoading(false);
          return;
        }
        await supabase.auth.signOut();
      } else {
        // New account created, sign out
        await supabase.auth.signOut();
      }

      // Send OTP code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);

      const response = await fetch('https://api.otpiq.com/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OTPIQ_KEY}`
        },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          smsType: 'verification',
          provider: provider,
          verificationCode: newCode
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || resData.error || 'ناردنی کۆد سەرکەوتوو نەبوو');
      
      setCountdown(60);
      if (step === 1) setStep(2);
    } catch (error: any) {
      Alert.alert('هەڵە', error.message || 'کێشەیەک ڕوویدا لە ناردنی کۆد');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code || code.length < 6) {
      Alert.alert('هەڵە', 'تکایە کۆدی ٦ ژمارەیی بنووسە');
      return;
    }

    if (code !== generatedCode) {
      Alert.alert('هەڵە', 'کۆدەکە هەڵەیە');
      return;
    }

    setLoading(true);
    try {
      const rawDigits = phone.replace(/[^0-9]/g, '');
      const email = `u${rawDigits}@taban.com`;
      const password = `OTP_${rawDigits}_SECURE`;

      // Sign in (account was already created in handleSendOtp)
      const { data: signInResult, error: finalError } = await supabase.auth.signInWithPassword({ email, password });
      if (finalError) throw finalError;

      // Auto-create profile if it doesn't exist
      const userId = signInResult.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: name.trim(),
          phone: phone.trim(),
          avatar_url: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false });
      }

      router.replace('/(tabs)/profile');
    } catch (error: any) {
      Alert.alert('هەڵە', error.message || 'کێشەیەک لە دروستکردنی ئەکاونت هەیە');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="px-6 pt-10">
            <TouchableOpacity onPress={() => router.back()} className="bg-gray-50 w-12 h-12 rounded-full items-center justify-center mb-10">
              <ChevronLeft size={28} color="#000" />
            </TouchableOpacity>
            <Text className="text-3xl font-black text-gray-900 text-right mb-2">{t('auth.createAccount')}</Text>
            <Text className="text-gray-500 text-lg font-bold text-right mb-12">
              {step === 1 ? t('auth.enterDetails') : 'کۆدی دڵنیایی کە بۆت هاتووە لێرە بنووسە'}
            </Text>

            {step === 1 ? (
              <View className="space-y-6">
                <View className="flex-row-reverse items-center bg-gray-50 px-5 h-16 rounded-2xl border border-gray-100">
                  <User size={22} color="#9ca3af" />
                  <TextInput placeholder={t('auth.fullName')} placeholderTextColor="#9ca3af" className="flex-1 mr-4 text-right text-lg font-bold" value={name} onChangeText={setName} />
                </View>

                <View className="flex-row-reverse items-center bg-gray-50 px-5 h-16 rounded-2xl border border-gray-100 mt-4">
                  <Phone size={22} color="#9ca3af" />
                  <TextInput placeholder="07XX XXX XXXX" placeholderTextColor="#9ca3af" keyboardType="phone-pad" className="flex-1 mr-4 text-right text-lg font-bold" value={phone} onChangeText={setPhone} />
                </View>

                <TouchableOpacity onPress={() => {
                  if (!name || name.trim().length < 2) {
                    Alert.alert('هەڵە', 'تکایە ناوەکەت بە دروستی بنووسە');
                    return;
                  }
                  if (!phone || phone.length < 10) {
                    Alert.alert('هەڵە', 'تکایە ژمارەی مۆبایل بە دروستی بنووسە');
                    return;
                  }
                  setStep(2);
                }} className="bg-[#CC222F] h-16 rounded-2xl items-center justify-center shadow-lg shadow-red-500/30 mt-6">
                  <Text className="text-white font-black text-lg">{t('auth.continue')}</Text>
                </TouchableOpacity>

                <View className="mt-8 items-center flex-row justify-center space-x-2">
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-[#CC222F] font-bold text-[16px]">{t('auth.login')}</Text>
                  </TouchableOpacity>
                  <Text className="text-gray-500 font-bold text-[16px]">{t('auth.alreadyHaveAccount')}</Text>
                </View>
              </View>
            ) : (
              <View className="space-y-6">
                <View className="flex-row-reverse items-center bg-gray-50 px-5 h-16 rounded-2xl border border-gray-100">
                  <ShieldCheck size={22} color="#9ca3af" />
                  <TextInput placeholder="XXXXXX" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={6} className="flex-1 mr-4 text-right text-lg font-bold tracking-[10px]" value={code} onChangeText={setCode} />
                </View>
                <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} className="bg-[#CC222F] h-16 rounded-2xl items-center justify-center shadow-lg shadow-red-500/30 mt-6">
                  {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">پشتڕاستکردنەوە</Text>}
                </TouchableOpacity>
                <View className="flex-col mt-4 space-y-4">
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => setStep(1)}>
                      <Text className="text-gray-400 font-bold">گۆڕینی زانیارییەکان</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {countdown > 0 && (
                    <Text className="text-center text-[#CC222F] font-bold text-xs mt-2 mb-4">
                      دەتوانیت دوای ({countdown}) چرکە دووبارە کۆد بنێریتەوە
                    </Text>
                  )}

                  <View className="space-y-4 mt-2">
                    <TouchableOpacity onPress={() => handleSendOtp('sms')} disabled={loading || countdown > 0} className={`h-16 rounded-2xl items-center justify-center shadow-lg ${countdown > 0 ? 'bg-gray-300' : 'bg-[#CC222F] shadow-red-500/30'}`}>
                      {loading && selectedProvider === 'sms' ? <ActivityIndicator color="white" /> : <Text className={`${countdown > 0 ? 'text-gray-500' : 'text-white'} font-black text-lg`}>کۆد بنێرە بۆ سیمکارت (SMS)</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => handleSendOtp('whatsapp')} disabled={loading || countdown > 0} className={`h-16 rounded-2xl items-center justify-center shadow-lg ${countdown > 0 ? 'bg-gray-300' : 'bg-[#25D366] shadow-green-500/30'}`}>
                      {loading && selectedProvider === 'whatsapp' ? <ActivityIndicator color="white" /> : <Text className={`${countdown > 0 ? 'text-gray-500' : 'text-white'} font-black text-lg`}>کۆد بنێرە بۆ وەتسئاپ</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
