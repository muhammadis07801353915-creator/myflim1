import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Car, X } from 'lucide-react-native';
import { supabase } from '../src/lib/supabase';
import { useLanguage } from '../src/i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function AllBrandsScreen() {
  const router = useRouter();
  const { t, getTranslatedName } = useLanguage();
  const [brands, setBrands] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      setBrands(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 py-6 mt-10 flex-row items-center border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center">
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-2xl font-black mr-12">{t('brandsPage.allBrands')}</Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 py-4">
        <View className="flex-row-reverse items-center bg-gray-50 px-5 h-16 rounded-[25px] border border-gray-100 shadow-sm">
          <Search size={22} color="#9ca3af" />
          <TextInput 
            placeholder={t('brandsPage.searchBrand')} 
            className="flex-1 mr-4 text-right font-black text-lg text-gray-800"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC222F" />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-4 flex-row flex-wrap justify-between">
            {filteredBrands.map((brand) => (
              <TouchableOpacity 
                key={brand.id}
                onPress={() => router.push({ pathname: '/(tabs)/search', params: { brand: brand.name } })}
                className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[30px] items-center justify-center mb-6 shadow-sm"
              >
                {brand.image_url ? (
                  <Image source={{ uri: brand.image_url }} className="w-16 h-16" resizeMode="contain" />
                ) : (
                  <Car size={32} color="#EEE" />
                )}
                <Text numberOfLines={1} className="mt-2 text-[12px] font-black text-slate-800">{getTranslatedName(brand.name, 'brands')}</Text>
              </TouchableOpacity>
            ))}
            
            {filteredBrands.length === 0 && (
              <View className="w-full py-20 items-center">
                <Text className="text-gray-400 font-black text-xl">{t('brandsPage.noBrands')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
