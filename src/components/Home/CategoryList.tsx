import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Car } from 'lucide-react-native';
import { useLanguage } from '../../i18n/LanguageContext';

export const CategoryList = ({ selectedBrand, onSelectBrand }: { selectedBrand?: string | null, onSelectBrand?: (brand: string | null) => void }) => {
  const router = useRouter();
  const { t, getTranslatedName } = useLanguage();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from('brands').select('*');
      if (error) throw error;
      
      let sortedBrands = data || [];
      const brandOrder = [
        "Toyota", "Nissan", "BYD", "Mercedes-Benz", "Haval", "Jeep", 
        "Lexus", "Hyundai", "Ford", "Mitsubishi", "Jetour", "Geely", 
        "Land Rover", "MG", "Cadillac", "Mazda"
      ];
      
      sortedBrands.sort((a, bItem) => {
        const indexA = brandOrder.indexOf(a.name);
        const indexB = brandOrder.indexOf(bItem.name);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(bItem.name);
      });
      
      setBrands(sortedBrands.slice(0, 4));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="small" color="#CC222F" className="py-4" />;

  return (
    <View className="pb-6 pt-0 bg-white">
      <View className="flex-row justify-between px-2">
        {brands.map((brand) => (
          <TouchableOpacity 
            key={brand.id} 
            onPress={() => {
              if (onSelectBrand) {
                onSelectBrand(selectedBrand === brand.name ? null : brand.name);
              } else {
                router.push({ pathname: '/(tabs)/search', params: { brand: brand.name } });
              }
            }}
            className="items-center"
            style={{ width: '19%' }}
          >
            <View className={`w-[60px] h-[60px] rounded-full items-center justify-center border mb-2 overflow-hidden ${selectedBrand === brand.name ? 'bg-red-50 border-[#CC222F]' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
              {brand.image_url ? (
                <Image source={{ uri: brand.image_url }} className="w-10 h-10" resizeMode="contain" />
              ) : (
                <Car size={24} color="#94a3b8" />
              )}
            </View>
            <Text className="text-[11px] font-black text-slate-500 text-center" numberOfLines={1}>{getTranslatedName(brand.name, 'brands')}</Text>
          </TouchableOpacity>
        ))}

        {/* More Button */}
        <TouchableOpacity 
          onPress={() => router.push('/brands')}
          className="items-center"
          style={{ width: '19%' }}
        >
          <View className="w-[60px] h-[60px] bg-white rounded-full items-center justify-center border border-slate-100 shadow-sm mb-2">
            <ArrowRight size={24} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text className="text-[11px] font-black text-slate-500 text-center">{t('home.more') || 'زیاتر'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
