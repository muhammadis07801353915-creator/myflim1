import React, { useState } from 'react';
import {  View, Text as RNText, TouchableOpacity, Platform, StatusBar, Modal, TextInput, ScrollView, Image, Alert  } from 'react-native';
import { Text } from './CustomText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Car, Search, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { supabase } from '../../lib/supabase';

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

export const Header = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const { selectedCity, setSelectedCity } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { t, getTranslatedName, language } = useLanguage();
  const isKurdish = language === 'ckb' || language === 'ku';
  // On iOS, SafeAreaView handles the notch, but we add a small 12px gap for aesthetics. On Android use StatusBar height.
  const headerPaddingTop = Platform.OS === 'ios' ? 12 : (StatusBar.currentHeight || 0) + 8;

  return (
    <>
      <View 
        className="bg-white border-b border-gray-50 shadow-sm"
        style={{ paddingTop: headerPaddingTop }}
      >
        <View className="flex-row items-center px-4 pb-4">
          <View className="flex-row items-center" style={{ gap: 5 }}>
            {/* Location Button */}
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              className="flex-row items-center justify-center bg-gray-50 rounded-xl border border-gray-100"
              style={{ height: isKurdish ? 36 : 42, paddingHorizontal: isKurdish ? 8 : 12 }}
            >
              <MapPin size={isKurdish ? 14 : (Platform.OS === 'ios' ? 18 : 16)} color="#4b5563" />
              <Text style={{ fontSize: isKurdish ? 11 : (Platform.OS === 'ios' ? 15 : 13), lineHeight: 16 }} className="text-gray-700 ml-1 font-bold">
                {selectedCity === 'هەموو شارەکان' ? t('header.allCities') : getTranslatedName(selectedCity, 'locations')}
              </Text>
            </TouchableOpacity>

            {/* Sell Button */}
            <TouchableOpacity 
              onPress={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  Alert.alert(
                    t('settings.loginCreateAccount'),
                    '',
                    [
                      { text: t('header.cancel'), style: 'cancel' },
                      { text: t('settings.yes'), onPress: () => router.push('/auth/login') }
                    ]
                  );
                } else {
                  router.push('/sell');
                }
              }}
              className="flex-row items-center justify-center bg-[#b3191f]/5 rounded-xl border border-[#b3191f]/10"
              style={{ height: isKurdish ? 36 : 42, paddingHorizontal: isKurdish ? 8 : 12, gap: 4 }}
            >
              <Text style={{ fontSize: isKurdish ? 11 : (Platform.OS === 'ios' ? 15 : 13), lineHeight: 16 }} className="font-bold text-[#b3191f]">{t('header.sell')}</Text>
              <Car size={isKurdish ? 14 : (Platform.OS === 'ios' ? 18 : 16)} color="#b3191f" />
            </TouchableOpacity>
          </View>
          
          {/* Spacer */}
          <View style={{ flex: 1 }} />

          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Text className="text-[20px] font-bold text-gray-900 tracking-tight">Taban Cars</Text>
            <View className="w-11 h-11 rounded-full overflow-hidden shadow-sm">
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
                .filter(city => getTranslatedName(city, 'locations').toLowerCase().includes(searchQuery.toLowerCase()))
                .map((city, i) => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => setSelectedCity(city)}
                    className="flex-row-reverse items-center justify-between py-4 border-b border-gray-50"
                  >
                    <Text className="text-lg text-gray-700 text-right">{getTranslatedName(city, 'locations')}</Text>
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
    </>
  );
};
