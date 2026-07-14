import React, { useState, useEffect } from 'react';
import {  
  View, 
  Text as RNText, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Image, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar
 } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import { ChevronLeft, Camera, Building, MapPin, Clock, CheckCircle2, ChevronDown, Search, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import { uploadToR2 } from '../../src/lib/r2';
import * as Linking from 'expo-linking';
import { FlatList, Modal } from 'react-native';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 20;

export default function CompanyAccountScreen() {
  const router = useRouter();
  const { t, language, getTranslatedName } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('07500000000');
  
  // State 0: form, 1: pending, 2: approved
  const [accountState, setAccountState] = useState<0 | 1 | 2>(0);
  const [showroomData, setShowroomData] = useState<any>(null);
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    location: '',
    working_hours: '',
    governorate: '',
    governorate_id: '',
    city: '',
    city_id: '',
    cover_image: null as string | null,
    profile_image: null as string | null,
  });

  // Modal for governorate/city
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'governorate' | 'city'>('governorate');
  const [modalData, setModalData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkShowroomStatus();
    fetchWhatsapp();
  }, []);

  const fetchWhatsapp = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('whatsapp_number').eq('id', 1).single();
      if (data?.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
    } catch (e) {}
  };

  const checkShowroomStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Also get profile to grab the phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      const phoneToUse = profile?.phone || user.user_metadata?.phone || (user.email ? user.email.replace('@taban.com', '') : null);

      if (phoneToUse) {
        // We'll check by phone since user_id doesn't exist in showrooms table
        const { data: showroom, error } = await supabase
          .from('showrooms')
          .select('*')
          .eq('phone', phoneToUse)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (showroom) {
          setShowroomData(showroom);
          if (showroom.status === 'approved' || showroom.is_verified) {
            setAccountState(2);
          } else {
            setAccountState(1);
          }
        } else {
          setAccountState(0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (field: 'cover_image' | 'profile_image') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'cover_image' ? [16, 9] : [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setForm({ ...form, [field]: result.assets[0].base64 });
    }
  };

  const openModal = async (type: 'governorate' | 'city') => {
    setModalType(type);
    setSearchQuery('');
    setModalVisible(true);
    if (type === 'governorate') {
      const { data } = await supabase.from('governorates').select('*').order('id');
      setModalData(data || []);
    } else {
      if (form.governorate_id) {
        const { data } = await supabase.from('cities').select('*').eq('governorate_id', form.governorate_id).order('name');
        setModalData(data || []);
      } else {
        const { data } = await supabase.from('cities').select('*').order('name');
        setModalData(data || []);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address) {
      Alert.alert(t('companyAccount.errorTitle'), t('companyAccount.fillNameAndAddress'));
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      let coverUrl = '';
      let logoUrl = '';

      if (form.cover_image) {
        const coverName = `showroom-covers/${user.id}-${Date.now()}.jpg`;
        coverUrl = await uploadToR2(form.cover_image, coverName);
      }

      if (form.profile_image) {
        const logoName = `showroom-logos/${user.id}-${Date.now()}.jpg`;
        logoUrl = await uploadToR2(form.profile_image, logoName);
      }

      let finalAddress = form.address;
      if (form.location) finalAddress += `\nلۆکەیشن: ${form.location}`;
      if (form.working_hours) finalAddress += `\nکاتی کرانەوە: ${form.working_hours}`;

      const phoneToUse = profile?.phone || user.user_metadata?.phone || (user.email ? user.email.replace('@taban.com', '') : null);
      if (!phoneToUse) {
        Alert.alert(t('companyAccount.errorTitle'), t('companyAccount.noPhoneFound'));
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('showrooms').insert({
        phone: phoneToUse,
        name: form.name,
        address: finalAddress,
        cover_url: coverUrl,
        logo_url: logoUrl,
        governorate: form.governorate || null,
        governorate_id: form.governorate_id || null,
        city: form.city || null,
        city_id: form.city_id || null,
        status: 'pending',
        is_verified: false
      });

      if (error) throw error;
      
      setAccountState(1);
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('companyAccount.errorTitle'), t('companyAccount.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const openShowroomApp = () => {
    router.replace('/(showroom-tabs)');
  };

  const calculateDays = () => {
    if (!showroomData) return { passed: 0, remaining: 30, total: 30 };
    
    let end = new Date();
    let start = showroomData.created_at ? new Date(showroomData.created_at) : new Date();

    if (showroomData.verified_until) {
      end = new Date(showroomData.verified_until);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + 30);
    }

    const today = new Date();
    const remainingMs = end.getTime() - today.getTime();
    let remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    if (remainingDays < 0) remainingDays = 0;
    
    let totalDays = 30;
    if (showroomData.verified_until) {
       const totalMs = end.getTime() - start.getTime();
       totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
       if (totalDays <= 0) totalDays = 30;
    }
    
    let passedDays = totalDays - remainingDays;
    if (passedDays < 0) passedDays = 0;
    if (passedDays > totalDays) passedDays = totalDays;
    if (remainingDays > totalDays) remainingDays = totalDays;
    
    return { passed: passedDays, remaining: remainingDays, total: totalDays };
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
      <View 
        className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100"
        style={{ paddingTop: STATUSBAR_HEIGHT + 15 }}
      >
        <TouchableOpacity 
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-900">{t('companyAccount.title')}</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          {accountState === 0 && (
            <View className="p-5 pt-8">
              <Text className="text-right text-gray-500 font-bold mb-8 text-[15px] leading-6">
                {t('companyAccount.description')}
              </Text>

              {/* Cover Image Pick */}
              <Text className="text-right font-black text-gray-700 mb-2">{t('companyAccount.coverImage')}</Text>
              <TouchableOpacity 
                className="w-full h-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 items-center justify-center mb-6 overflow-hidden"
                onPress={() => pickImage('cover_image')}
              >
                {form.cover_image ? (
                  <Image source={{ uri: `data:image/jpeg;base64,${form.cover_image}` }} className="w-full h-full" />
                ) : (
                  <View className="items-center">
                    <Camera size={32} color="#94a3b8" />
                    <Text className="text-gray-400 font-bold mt-2">{t('companyAccount.addImage')}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Profile Image Pick */}
              <Text className="text-right font-black text-gray-700 mb-2">{t('companyAccount.showroomLogo')}</Text>
              <View className="items-end mb-6">
                <TouchableOpacity 
                  className="w-24 h-24 bg-gray-50 rounded-full border-2 border-dashed border-gray-200 items-center justify-center overflow-hidden"
                  onPress={() => pickImage('profile_image')}
                >
                  {form.profile_image ? (
                    <Image source={{ uri: `data:image/jpeg;base64,${form.profile_image}` }} className="w-full h-full" />
                  ) : (
                    <Camera size={24} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View className="space-y-4 mb-8">
                <View>
                  <Text className="text-right font-black text-gray-700 mb-2">{t('companyAccount.companyName')}</Text>
                  <View className="flex-row items-center bg-gray-50 px-4 py-4 rounded-2xl border border-gray-100">
                    <Building size={20} color="#94a3b8" />
                    <TextInput 
                      className="flex-1 ml-3 text-right font-bold text-gray-800"
                      placeholder={t('companyAccount.namePlaceholder')}
                      placeholderTextColor="#94a3b8"
                      value={form.name}
                      onChangeText={(t) => setForm({...form, name: t})}
                    />
                  </View>
                </View>

                {/* Governorate & City */}
                <View className="mt-4">
                  <Text className="text-right font-black text-gray-700 mb-2">{t('companyAccount.govAndCity')}</Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-between bg-gray-50 px-4 py-4 rounded-2xl border border-gray-100"
                      onPress={() => openModal('city')}
                    >
                      <ChevronDown size={16} color="#94a3b8" />
                      <Text className={`font-bold ${form.city ? 'text-gray-800' : 'text-gray-300'}`}>
                        {form.city ? getTranslatedName(form.city, 'locations') : t('companyAccount.city')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-between bg-gray-50 px-4 py-4 rounded-2xl border border-gray-100"
                      onPress={() => openModal('governorate')}
                    >
                      <ChevronDown size={16} color="#94a3b8" />
                      <Text className={`font-bold ${form.governorate ? 'text-gray-800' : 'text-gray-300'}`}>
                        {form.governorate ? getTranslatedName(form.governorate, 'locations') : t('companyAccount.governorate')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-right font-black text-gray-700 mb-2">{t('companyAccount.address')}</Text>
                  <View className="flex-row items-center bg-gray-50 px-4 py-4 rounded-2xl border border-gray-100">
                    <MapPin size={20} color="#94a3b8" />
                    <TextInput 
                      className="flex-1 ml-3 text-right font-bold text-gray-800"
                      placeholder={t('companyAccount.addressExample')}
                      placeholderTextColor="#94a3b8"
                      value={form.address}
                      onChangeText={(t) => setForm({...form, address: t})}
                    />
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-right font-black text-gray-700 mb-2">{t('companyAccount.locationOptional')}</Text>
                  <View className="flex-row items-center bg-gray-50 px-4 py-4 rounded-2xl border border-gray-100">
                    <MapPin size={20} color="#94a3b8" />
                    <TextInput 
                      className="flex-1 ml-3 text-right font-bold text-gray-800"
                      placeholder={t('companyAccount.locationPlaceholder')}
                      placeholderTextColor="#94a3b8"
                      value={form.location}
                      onChangeText={(t) => setForm({...form, location: t})}
                    />
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-right font-black text-gray-700 mb-2">{t('companyAccount.workingHours')}</Text>
                  <View className="flex-row items-center bg-gray-50 px-4 py-4 rounded-2xl border border-gray-100">
                    <Clock size={20} color="#94a3b8" />
                    <TextInput 
                      className="flex-1 ml-3 text-right font-bold text-gray-800"
                      placeholder={t('companyAccount.workingHoursExample')}
                      placeholderTextColor="#94a3b8"
                      value={form.working_hours}
                      onChangeText={(t) => setForm({...form, working_hours: t})}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                className="w-full bg-[#CC222F] py-4 rounded-2xl items-center justify-center flex-row shadow-lg shadow-red-500/30 mb-8"
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black text-[18px]">{t('companyAccount.createAccount')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {accountState === 1 && (
            <View className="flex-1 items-center justify-center p-8 min-h-[500px]">
              <View className="w-24 h-24 bg-orange-100 rounded-full items-center justify-center mb-6">
                <Clock size={40} color="#f97316" />
              </View>
              <Text className="text-2xl font-black text-gray-900 mb-4 text-center">{t('companyAccount.waitingVerification')}</Text>
              <Text className="text-center font-bold text-gray-500 text-[16px] leading-8">
                {t('companyAccount.waitingDesc')}
              </Text>
            </View>
          )}

          {accountState === 2 && (() => {
            const { remaining, passed, total } = calculateDays();
            const isExpired = remaining === 0;
            return (
              <View className="flex-1 items-center justify-center p-8 min-h-[500px]">
                {/* Icon */}
                <View className={`w-28 h-28 rounded-full items-center justify-center mb-6 ${isExpired ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <CheckCircle2 size={50} color={isExpired ? '#CC222F' : '#10b981'} />
                </View>

                <Text className="text-3xl font-black text-gray-900 mb-4 text-center">
                  {isExpired ? t('companyAccount.subEnded') : t('companyAccount.congrats')}
                </Text>

                {/* Expiry Warning */}
                {isExpired ? (
                  <View className="bg-red-50 border border-red-100 rounded-3xl p-5 mb-6 w-full">
                    <Text className="text-center font-bold text-gray-700 text-[15px] leading-8 mb-4">
                      {t('companyAccount.subEndedDesc')}
                    </Text>
                    <TouchableOpacity
                      className="bg-[#25D366] py-4 rounded-2xl items-center justify-center flex-row gap-2"
                      onPress={() => Linking.openURL(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`)}
                    >
                      <Text className="text-white font-black text-[17px]">{whatsappNumber} 📞</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="text-center font-bold text-gray-500 text-[16px] leading-8 mb-6">
                    {t('companyAccount.subActiveDesc').replace('30', total.toString())}
                  </Text>
                )}

                {/* Days Counter */}
                <View className="flex-row items-center justify-between bg-slate-50 w-full p-4 rounded-2xl mb-6 border border-slate-100">
                  <View className="items-center flex-1">
                    <Text className={`text-2xl font-black ${isExpired ? 'text-[#CC222F]' : 'text-[#CC222F]'}`}>{remaining}</Text>
                    <Text className="text-gray-500 font-bold text-[13px] mt-1">{t('companyAccount.daysRemaining')}</Text>
                  </View>
                  <View className="w-[1px] h-10 bg-slate-200" />
                  <View className="items-center flex-1">
                    <Text className="text-2xl font-black text-gray-800">{passed}</Text>
                    <Text className="text-gray-500 font-bold text-[13px] mt-1">{t('companyAccount.daysPassed')}</Text>
                  </View>
                </View>

                {/* Go to Dashboard - always visible */}
                <TouchableOpacity 
                  className="w-full bg-slate-900 py-5 rounded-2xl items-center justify-center flex-row shadow-xl shadow-slate-900/30"
                  onPress={openShowroomApp}
                >
                  <Text className="text-white font-black text-[18px]">{t('companyAccount.goToDashboard')}</Text>
                </TouchableOpacity>
              </View>
            );
          })()}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Governorate / City Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full max-h-[70%] rounded-[30px] overflow-hidden p-5 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
              <Text className="text-lg font-black text-gray-900">
                {modalType === 'governorate' ? t('companyAccount.chooseGov') : t('companyAccount.chooseCity')}
              </Text>
              <View className="w-6" />
            </View>

            <View className="flex-row-reverse items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 mb-4">
              <Search size={16} color="#94a3b8" />
              <TextInput
                placeholder={t('companyAccount.search')}
                className="flex-1 mr-3 font-bold text-right"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={modalData.filter(i => getTranslatedName(i.name, 'locations').includes(searchQuery) || i.name.includes(searchQuery))}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const translatedName = getTranslatedName(item.name, 'locations');
                const isSelected =
                  modalType === 'governorate'
                    ? form.governorate === item.name
                    : form.city === item.name;
                return (
                  <TouchableOpacity
                    className="flex-row items-center justify-between py-4 border-b border-slate-50"
                    onPress={() => {
                      if (modalType === 'governorate') {
                        setForm({ ...form, governorate: item.name, governorate_id: item.id.toString(), city: '', city_id: '' });
                      } else {
                        setForm({ ...form, city: item.name, city_id: item.id.toString() });
                      }
                      setModalVisible(false);
                    }}
                  >
                    <View className={`w-6 h-6 rounded-lg items-center justify-center border-2 ${isSelected ? 'border-[#CC222F] bg-[#CC222F]' : 'border-slate-200'}`}>
                      {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                    </View>
                    <Text className={`text-base font-bold ${isSelected ? 'text-[#CC222F]' : 'text-slate-600'}`}>
                      {translatedName}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
