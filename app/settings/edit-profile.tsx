import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { ChevronRight, Camera, Phone, Pencil, ShieldCheck, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { uploadToR2 } from '../../src/lib/r2';

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Phone Change Modal State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [phoneStep, setPhoneStep] = useState(1); // 1: Input Phone, 2: OTP
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'sms' | 'whatsapp' | null>(null);

  const OTPIQ_KEY = 'sk_live_3c2cce85267eb321a50dae7afa9815c8d4b8f7ae';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         setLoading(false);
         return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setName(data.full_name || '');
        setAvatarUrl(data.avatar_url || null);
        // Phone: check profile first, then auth metadata, then email-based
        const phoneFromProfile = data.phone;
        const phoneFromMeta = user.user_metadata?.phone;
        const phoneFromEmail = user.email?.endsWith('@taban.com')
          ? user.email.replace('@taban.com', '')
          : null;
        setPhone(phoneFromProfile || phoneFromMeta || phoneFromEmail || '');
      } else {
        // Profile might not exist yet, fallback to auth data
        const phoneFromMeta = user.user_metadata?.phone;
        const phoneFromEmail = user.email?.endsWith('@taban.com')
          ? user.email.replace('@taban.com', '')
          : null;
        setPhone(phoneFromMeta || phoneFromEmail || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadAvatar(result.assets[0].base64);
    }
  };

  const uploadAvatar = async (base64: string) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileName = `profiles/${user.id}-${Date.now()}.jpg`;

      // Upload to Cloudflare R2
      const publicUrl = await uploadToR2(base64, fileName, 'image/jpeg');
      
      setAvatarUrl(publicUrl);
      Alert.alert('سەرکەوتوو بوو', 'وێنەکە بارکرا، تکایە پاشەکەوتی بکە');
    } catch (error: any) {
      Alert.alert('هەڵە', error.message || 'سەرکەوتوو نەبوو لە بارکردنی وێنەکە');
    } finally {
      setSaving(false);
    }
  };

  const sendPhoneOTP = async (provider: 'sms' | 'whatsapp' = 'sms') => {
    if (!newPhone || newPhone.length < 10) {
      Alert.alert('هەڵە', 'تکایە ژمارەکە بە دروستی بنووسە');
      return;
    }

    setSelectedProvider(provider);
    setPhoneLoading(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);

      let cleanPhone = newPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
      if (!cleanPhone.startsWith('964')) cleanPhone = `964${cleanPhone}`;

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
          verificationCode: code
        })
      });

      if (!response.ok) throw new Error('ناردنی کۆد سەرکەوتوو نەبوو');
      
      setPhoneStep(2);
    } catch (error: any) {
      Alert.alert('هەڵە', error.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const verifyPhoneOTP = async () => {
    if (verificationCode !== sentCode) {
      Alert.alert('هەڵە', 'کۆدەکە هەڵەیە');
      return;
    }
    setPhone(newPhone);
    setShowPhoneModal(false);
    Alert.alert('سەرکەوتوو بوو', 'ژمارەکە گۆڕدرا، تکایە پاشەکەوتی بکە');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('بەکارهێنەر نەدۆزرایەوە');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: name,
          phone: phone,
          avatar_url: avatarUrl,
          updated_at: new Date()
        });

      if (error) throw error;
      
      // Update auth metadata too
      await supabase.auth.updateUser({
        data: { full_name: name, avatar_url: avatarUrl }
      });

      Alert.alert('سەرکەوتوو بوو', 'گۆڕانکارییەکان پاشەکەوت کران');
      router.back();
    } catch (error: any) {
      Alert.alert('هەڵە', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-16 pb-4 border-b border-gray-100">
        <View className="w-8" />
        <Text className="text-xl font-bold text-gray-900">دەستکاریکردنی پرۆفایل</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronRight size={28} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center px-6 pt-6">
          <Text className="text-2xl font-black text-gray-900 mb-2 text-right w-full">ڕێکخستنەکانی پرۆفایل</Text>
          <Text className="text-gray-500 text-[15px] text-right w-full leading-6 mb-8">
            تکایە گۆڕانکارییەکان بکە و پاشەکەوتی بکە.
          </Text>
        </View>

        {/* Profile Picture */}
        <View className="items-center mb-10">
          <View className="relative">
            <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center overflow-hidden border-4 border-white shadow-sm">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-32 h-32" />
              ) : (
                <View className="w-32 h-32 bg-gray-100 items-center justify-center">
                  <Text className="text-gray-300 font-bold">بێ وێنە</Text>
                </View>
              )}
              {saving && <View className="absolute inset-0 bg-black/20 items-center justify-center"><ActivityIndicator color="white" /></View>}
            </View>
            <TouchableOpacity onPress={pickImage} className="absolute bottom-0 right-0 bg-[#CC222F] w-10 h-10 rounded-full items-center justify-center shadow-lg border-2 border-white">
              <Camera size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-400 text-sm mt-4 font-bold">بۆ گۆڕینی وێنە کلیک لە کامێرا بکە</Text>
        </View>

        {/* Name Input */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3 text-right">ناوی تەواو</Text>
          <View className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
            <TextInput 
              value={name}
              onChangeText={setName}
              className="text-gray-800 text-lg text-right font-bold"
              placeholder="ناوت بنووسە"
            />
          </View>
        </View>

        {/* Phone Section */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3 text-right">ژمارەی مۆبایل</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
            <TouchableOpacity 
              onPress={() => {
                setPhoneStep(1);
                setNewPhone('');
                setVerificationCode('');
                setShowPhoneModal(true);
              }}
              className="flex-row items-center bg-[#CC222F]/10 px-4 py-2 rounded-xl"
            >
              <Pencil size={14} color="#CC222F" />
              <Text className="text-[#CC222F] font-bold text-sm ml-1">گۆڕین</Text>
            </TouchableOpacity>
            <Text className="flex-1 text-gray-800 text-lg text-right mx-3 font-bold">{phone || 'دیاری نەکراوە'}</Text>
            <Phone size={20} color="#4b5563" />
          </View>
        </View>

        {/* Save Button */}
        <View className="px-6 mt-4">
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving}
            className="bg-[#CC222F] py-5 rounded-2xl items-center shadow-lg shadow-red-500/30"
          >
            {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-xl">پاشەکەوتکردنی گۆڕانکارییەکان</Text>}
          </TouchableOpacity>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Phone Change Modal */}
      <Modal visible={showPhoneModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-12">
            <View className="flex-row justify-between items-center mb-8">
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
              <Text className="text-xl font-black text-gray-900">گۆڕینی ژمارە</Text>
            </View>

            {phoneStep === 1 ? (
              <View>
                <Text className="text-gray-500 text-right mb-6 font-bold">ژمارە نوێیەکەت بنووسە بۆ ناردنی کۆد</Text>
                <View className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 mb-6">
                  <TextInput 
                    placeholder="07XXXXXXXX"
                    keyboardType="phone-pad"
                    value={newPhone}
                    onChangeText={setNewPhone}
                    className="text-right text-lg font-bold"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => sendPhoneOTP('sms')}
                  disabled={phoneLoading}
                  className="bg-[#CC222F] py-5 rounded-2xl items-center"
                >
                  {phoneLoading && selectedProvider === 'sms' ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">ناردنی کۆد</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text className="text-gray-500 text-right mb-6 font-bold">کۆدی دڵنیایی کە بۆت هات لێرە بنووسە</Text>
                <View className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 mb-6">
                  <TextInput 
                    placeholder="XXXXXX"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    className="text-center text-2xl font-black tracking-[10px]"
                  />
                </View>
                <TouchableOpacity 
                  onPress={verifyPhoneOTP}
                  className="bg-[#CC222F] py-5 rounded-2xl items-center"
                >
                  <Text className="text-white font-bold text-lg">پشتڕاستکردنەوە</Text>
                </TouchableOpacity>

                <View className="flex-row items-center justify-between mt-6">
                  <Text className="text-gray-600 font-bold">ناردنەوە لە ڕێگەی:</Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity onPress={() => sendPhoneOTP('whatsapp')} disabled={phoneLoading} className="bg-[#25D366]/10 px-3 py-1.5 rounded-lg ml-2">
                      <Text className="text-[#25D366] font-bold text-xs">وەتسئاپ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => sendPhoneOTP('sms')} disabled={phoneLoading} className="bg-[#CC222F]/10 px-3 py-1.5 rounded-lg">
                      <Text className="text-[#CC222F] font-bold text-xs">سیمکارت</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
