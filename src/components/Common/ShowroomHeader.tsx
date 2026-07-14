import React, { useState, useEffect } from 'react';
import {  View, Text as RNText, TouchableOpacity, Platform, StatusBar, Modal, TextInput, ScrollView, Image, ActivityIndicator  } from 'react-native';
import { Text } from './CustomText';
import { MapPin, Car, Search, X, PhoneCall } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../i18n/LanguageContext';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 20;

const cities = [
  'هەولێر',
  'سلێمانی',
  'دهۆک',
  'کەرکوک',
  'هەڵەبجە',
  'بەغداد',
  'نەینەوا',
  'بەسڕە',
  'ئەنبار',
  'بابیل',
  'کەربەلا',
  'نەجەف',
  'واست',
  'مەیسان',
  'ذی قار',
  'موسەننا',
  'قادسیە',
  'سەڵاحەددین',
  'دیالە'
];

export const ShowroomHeader = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const { selectedCity, setSelectedCity } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  // Subscription check state
  const [isExpiredModalVisible, setIsExpiredModalVisible] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('+9647500000000');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('whatsapp_number').eq('id', 1).single();
        if (data && data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  const handleSellPress = async () => {
    setCheckingSubscription(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/showroom-sell');
        return;
      }
      
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle();
      const phone = profile?.phone || user.user_metadata?.phone || (user.email ? user.email.replace('@taban.com', '') : null);
      
      if (!phone) {
        router.push('/showroom-sell');
        return;
      }
      
      const { data: showroom } = await supabase.from('showrooms').select('verified_until, created_at, is_verified').eq('phone', phone).order('created_at', { ascending: false }).limit(1).maybeSingle();
      
      if (!showroom || !showroom.is_verified) {
        router.push('/showroom-sell');
        return;
      }
      
      let end: Date;
      if (showroom.verified_until) {
        end = new Date(showroom.verified_until);
      } else {
        end = new Date(showroom.created_at);
        end.setDate(end.getDate() + 30);
      }
      
      const remaining = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (remaining <= 0) {
        setIsExpired(true);
        setIsExpiredModalVisible(true);
      } else {
        router.push('/showroom-sell');
      }
    } catch (e) {
      console.error(e);
      router.push('/showroom-sell');
    } finally {
      setCheckingSubscription(false);
    }
  };

  return (
    <>
      <View 
        className="bg-white border-b border-gray-50 shadow-sm"
        style={{ paddingTop: STATUSBAR_HEIGHT + 10 }}
      >
        <View className="flex-row items-center justify-between px-4 pb-4">
          <View className="flex-row items-center" style={{ gap: 5 }}>
            {/* Location Button */}
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              className="flex-row items-center px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100"
            >
              <MapPin size={15} color="#4b5563" />
              <Text className="text-[12.5px] text-gray-700 ml-1 font-bold">
                {selectedCity === 'هەموو شارەکان' ? t('header.allCities') : selectedCity}
              </Text>
            </TouchableOpacity>

            {/* Sell Button */}
            <TouchableOpacity 
              onPress={handleSellPress}
              disabled={checkingSubscription}
              className="flex-row items-center px-2.5 py-1.5 bg-[#b3191f]/5 rounded-xl border border-[#b3191f]/10"
              style={{ gap: 4 }}
            >
              {checkingSubscription ? (
                <ActivityIndicator size="small" color="#b3191f" />
              ) : (
                <>
                  <Text className="text-[12.5px] font-bold text-[#b3191f]">{t('header.sell')}</Text>
                  <Car size={15} color="#b3191f" />
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <View className="items-end">
               <Text className="text-[20px] font-bold text-gray-900 tracking-tight leading-6">{t('header.showroom')}</Text>
               <Text className="text-[12px] font-bold text-[#b3191f]">{t('header.dashboard')}</Text>
            </View>
            <View className="w-11 h-11 rounded-full overflow-hidden shadow-sm border border-gray-100">
              <Image 
                source={require('../../../assets/logo.png')} 
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Location Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white w-full rounded-[35px] p-6 max-h-[80%]">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-right">{t('header.chooseCity')}</Text>
            
            <View className="bg-gray-100 rounded-2xl px-4 py-3 flex-row-reverse items-center mb-6">
              <Search size={20} color="#9ca3af" />
              <TextInput 
                placeholder={t('header.searchCities')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 mr-3 text-lg text-gray-800 text-right"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                onPress={() => setSelectedCity('هەموو شارەکان')}
                className="flex-row-reverse items-center justify-between py-4 border-b border-gray-50"
              >
                <Text className="text-lg text-gray-700 text-right">{t('header.allCities')}</Text>
                <View className={`w-6 h-6 border-2 rounded-md ${selectedCity === 'هەموو شارەکان' ? 'bg-purple-100 border-purple-500 items-center justify-center' : 'border-gray-200'}`}>
                  {selectedCity === 'هەموو شارەکان' && <View className="w-3 h-3 bg-purple-500 rounded-sm" />}
                </View>
              </TouchableOpacity>

              {cities
                .filter(city => city.includes(searchQuery))
                .map((city, i) => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => setSelectedCity(city)}
                    className="flex-row-reverse items-center justify-between py-4 border-b border-gray-50"
                  >
                    <Text className="text-lg text-gray-700 text-right">{city}</Text>
                    <View className={`w-6 h-6 border-2 rounded-md ${selectedCity === city ? 'bg-purple-100 border-purple-500 items-center justify-center' : 'border-gray-200'}`}>
                      {selectedCity === city && <View className="w-3 h-3 bg-purple-500 rounded-sm" />}
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View className="flex-row justify-start mt-6" style={{ gap: 20 }}>
              <TouchableOpacity onPress={() => { setSearchQuery(''); setModalVisible(false); }}>
                <Text className="text-purple-600 font-bold text-lg">{t('header.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSearchQuery(''); setModalVisible(false); }}>
                <Text className="text-purple-600 font-bold text-lg">{t('header.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Expiry Warning Modal */}
      <Modal visible={isExpiredModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 30, padding: 24, alignItems: 'center' }}>
            <TouchableOpacity 
              style={{ alignSelf: 'flex-start', padding: 8 }}
              onPress={() => setIsExpiredModalVisible(false)}
            >
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 40 }}>🔒</Text>
            </View>
            
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1f2937', textAlign: 'center', marginBottom: 16 }}>
              بەشداریەکەت کۆتایی هاتووە
            </Text>
            
            <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 20, padding: 16, width: '100%', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 26, marginBottom: 16 }}>
                بەرێزەکەم بەشداری مانگاکەت کۆتایی هاتووە تکایە بۆ بەشداری کردنی ئەکاونتی جالاکی مانگانە و پشتراستکراوە تکایە پەیوەندی بکەن بە وەتسئاپی ئەم ژمارەیە
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#25D366', padding: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => Linking.openURL(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`)}
              >
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{whatsappNumber}</Text>
                <PhoneCall size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
