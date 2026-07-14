import React, { useEffect, useState } from 'react';
import {  View, Text as RNText, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, Modal  } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import { ChevronRight, Camera, Phone, Pencil, ShieldCheck, X, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { uploadToR2 } from '../../src/lib/r2';
import { useLanguage } from '../../src/i18n/LanguageContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useLanguage();
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

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: Confirmation, 2: Verify OTP
  const [deleteCode, setDeleteCode] = useState('');
  const [sentDeleteCode, setSentDeleteCode] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      Alert.alert(t('settings.successTitle'), t('editProfile.successUpload'));
    } catch (error: any) {
      Alert.alert(t('settings.errorTitle'), error.message || t('editProfile.errorUpload'));
    } finally {
      setSaving(false);
    }
  };

  const sendPhoneOTP = async (provider: 'sms' | 'whatsapp' = 'sms') => {
    if (!newPhone || newPhone.length < 10) {
      Alert.alert(t('settings.errorTitle'), t('editProfile.errorValidPhone'));
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

      if (!response.ok) throw new Error(t('editProfile.errorCodeSend'));
      
      setPhoneStep(2);
    } catch (error: any) {
      Alert.alert(t('settings.errorTitle'), error.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const verifyPhoneOTP = async () => {
    if (verificationCode !== sentCode) {
      Alert.alert(t('settings.errorTitle'), t('editProfile.errorWrongCode'));
      return;
    }
    setPhone(newPhone);
    setShowPhoneModal(false);
    Alert.alert(t('settings.successTitle'), t('editProfile.successPhone'));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('editProfile.userNotFound'));

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

      Alert.alert(t('settings.successTitle'), t('editProfile.successSave'));
      router.back();
    } catch (error: any) {
      Alert.alert(t('settings.errorTitle'), error.message);
    } finally {
      setSaving(false);
    }
  };

  const sendDeleteAccountOTP = async () => {
    if (!phone) {
      Alert.alert(t('settings.errorTitle'), t('editProfile.errorValidPhone'));
      return;
    }

    setDeleteLoading(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentDeleteCode(code);

      let cleanPhone = phone.replace(/[^0-9]/g, '');
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
          provider: 'whatsapp',
          verificationCode: code
        })
      });

      if (!response.ok) throw new Error(t('editProfile.errorCodeSend'));
      
      setDeleteStep(2);
    } catch (error: any) {
      Alert.alert(t('settings.errorTitle'), error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const verifyDeleteOTP = async () => {
    if (deleteCode !== sentDeleteCode) {
      Alert.alert(t('settings.errorTitle'), t('editProfile.errorWrongCode'));
      return;
    }

    setDeleteLoading(true);
    try {
      // Execute the RPC to delete the user
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      
      // Sign out and close modal
      await supabase.auth.signOut();
      setShowDeleteModal(false);
      Alert.alert(t('editProfile.confirmDelete'), t('editProfile.confirmDeleteDesc'));
      router.replace('/');
    } catch (error: any) {
      Alert.alert(t('settings.errorTitle'), error.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
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
        <Text className="text-xl font-bold text-gray-900">{t('editProfile.title')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronRight size={28} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center px-6 pt-6">
          <Text className="text-2xl font-black text-gray-900 mb-2 text-right w-full">{t('editProfile.settings')}</Text>
          <Text className="text-gray-500 text-[15px] text-right w-full leading-6 mb-8">
            {t('editProfile.desc')}
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
                  <Text className="text-gray-300 font-bold">{t('editProfile.noImage')}</Text>
                </View>
              )}
              {saving && <View className="absolute inset-0 bg-black/20 items-center justify-center"><ActivityIndicator color="white" /></View>}
            </View>
            <TouchableOpacity onPress={pickImage} className="absolute bottom-0 right-0 bg-[#CC222F] w-10 h-10 rounded-full items-center justify-center shadow-lg border-2 border-white">
              <Camera size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-400 text-sm mt-4 font-bold">{t('editProfile.clickCamera')}</Text>
        </View>

        {/* Name Input */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3 text-right">{t('editProfile.fullName')}</Text>
          <View className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
            <TextInput 
              value={name}
              onChangeText={setName}
              className="text-gray-800 text-lg text-right font-bold"
              placeholder={t('editProfile.namePlaceholder')}
            />
          </View>
        </View>

        {/* Phone Section */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3 text-right">{t('editProfile.phone')}</Text>
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
              <Text className="text-[#CC222F] font-bold text-sm ml-1">{t('editProfile.change')}</Text>
            </TouchableOpacity>
            <Text className="flex-1 text-gray-800 text-lg text-right mx-3 font-bold">{phone || t('editProfile.notSet')}</Text>
            <Phone size={20} color="#4b5563" />
          </View>
        </View>

        {/* Save Button */}
        <View className="px-6 mt-4 mb-8">
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving}
            className="bg-[#CC222F] py-5 rounded-2xl items-center shadow-lg shadow-red-500/30"
          >
            {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-xl">{t('editProfile.saveChanges')}</Text>}
          </TouchableOpacity>
        </View>

        {/* Delete Account Section */}
        <View className="px-6 pb-20">
          <View className="border-t border-gray-100 pt-8">
            <TouchableOpacity 
              onPress={() => {
                setDeleteStep(1);
                setDeleteCode('');
                setShowDeleteModal(true);
              }}
              className="flex-row items-center justify-between bg-red-50 py-4 px-5 rounded-2xl border border-red-100"
            >
              <ChevronRight size={20} color="#ef4444" />
              <View className="flex-row items-center">
                <Text className="text-red-500 font-bold text-lg mr-3">{t('editProfile.deleteAccount')}</Text>
                <Trash2 size={20} color="#ef4444" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Phone Change Modal */}
      <Modal visible={showPhoneModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-12">
            <View className="flex-row justify-between items-center mb-8">
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
              <Text className="text-xl font-black text-gray-900">{t('editProfile.changePhoneTitle')}</Text>
            </View>

            {phoneStep === 1 ? (
              <View>
                <Text className="text-gray-500 text-right mb-6 font-bold">{t('editProfile.enterNewPhone')}</Text>
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
                  {phoneLoading && selectedProvider === 'sms' ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">{t('editProfile.sendCode')}</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text className="text-gray-500 text-right mb-6 font-bold">{t('editProfile.enterVerificationCode')}</Text>
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
                  <Text className="text-white font-bold text-lg">{t('editProfile.verify')}</Text>
                </TouchableOpacity>

                <View className="flex-row items-center justify-between mt-6">
                  <Text className="text-gray-600 font-bold">{t('editProfile.resendVia')}</Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity onPress={() => sendPhoneOTP('whatsapp')} disabled={phoneLoading} className="bg-[#25D366]/10 px-3 py-1.5 rounded-lg ml-2">
                      <Text className="text-[#25D366] font-bold text-xs">{t('editProfile.whatsapp')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => sendPhoneOTP('sms')} disabled={phoneLoading} className="bg-[#CC222F]/10 px-3 py-1.5 rounded-lg">
                      <Text className="text-[#CC222F] font-bold text-xs">{t('editProfile.sms')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-white w-full rounded-[32px] p-6 pt-8">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <Trash2 size={32} color="#ef4444" />
              </View>
              <Text className="text-2xl font-black text-gray-900 mb-2 text-center">{deleteStep === 1 ? t('editProfile.deleteAccount') : t('editProfile.deleteOtpTitle')}</Text>
              <Text className="text-gray-500 text-center font-bold text-sm leading-6 px-2">
                {deleteStep === 1 ? t('editProfile.deleteAccountDesc') : t('editProfile.deleteOtpDesc')}
              </Text>
            </View>

            {deleteStep === 1 ? (
              <View>
                <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                  <Text className="text-red-500 text-center font-bold text-xs">
                    {t('editProfile.deleteAccountWarning')}
                  </Text>
                </View>

                <View className="space-y-3">
                  <TouchableOpacity 
                    onPress={sendDeleteAccountOTP}
                    disabled={deleteLoading}
                    className="bg-[#ef4444] py-4 rounded-2xl items-center shadow-lg shadow-red-500/20"
                  >
                    {deleteLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">{t('editProfile.deleteAccountConfirm')}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowDeleteModal(false)}
                    disabled={deleteLoading}
                    className="bg-gray-100 py-4 rounded-2xl items-center"
                  >
                    <Text className="text-gray-700 font-bold text-lg">{t('editProfile.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 mb-6">
                  <TextInput 
                    placeholder="XXXXXX"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={deleteCode}
                    onChangeText={setDeleteCode}
                    className="text-center text-2xl font-black tracking-[10px]"
                  />
                </View>
                <View className="space-y-3">
                  <TouchableOpacity 
                    onPress={verifyDeleteOTP}
                    disabled={deleteLoading}
                    className="bg-[#ef4444] py-4 rounded-2xl items-center shadow-lg shadow-red-500/20"
                  >
                    {deleteLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">{t('editProfile.verify')}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowDeleteModal(false)}
                    disabled={deleteLoading}
                    className="bg-gray-100 py-4 rounded-2xl items-center"
                  >
                    <Text className="text-gray-700 font-bold text-lg">{t('editProfile.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
