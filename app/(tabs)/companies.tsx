import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ImageBackground, ActivityIndicator } from 'react-native';
import { MapPin, Search, BadgeCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useLanguage } from '../../src/i18n/LanguageContext';

export default function CompaniesScreen() {
  const router = useRouter();
  const { t, getTranslatedName } = useLanguage();
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShowrooms();
  }, []);

  const fetchShowrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('showrooms')
        .select('*')
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setShowrooms(data);
    } catch (error) {
      console.error('Error fetching showrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header Title */}
      <View className="px-5 py-4 mt-8 flex-row justify-end">
        <Text className="text-3xl font-black text-slate-900">{t('companies.title')}</Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center bg-slate-50 px-5 py-4 rounded-[25px] border border-slate-100 shadow-sm">
          <Search size={20} color="#94a3b8" />
          <TextInput 
            placeholder={t('companies.searchPlaceholder')} 
            className="flex-1 ml-3 text-[16px] text-slate-800 font-bold text-right"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC222F" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {showrooms.map((item, index) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => router.push(`/showroom/${item.id}`)}
              className="mb-6 rounded-[35px] overflow-hidden shadow-2xl h-56 relative bg-slate-100"
            >
              {/* Cover Image - Fixed column name to cover_url */}
              <Image 
                source={{ uri: item.cover_url || 'https://images.unsplash.com/photo-1562519819-016930ada31c?q=80&w=1000' }} 
                className="w-full h-full absolute"
                resizeMode="cover"
              />
              
              {/* Stronger Overlay for visibility */}
              <View className="absolute inset-0 bg-black/30" />
              <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              
              {/* Content Overlay */}
              <View className="p-6 flex-row items-center justify-between mt-auto">
                {/* Left Side: Logo */}
                <View className="w-16 h-16 bg-white rounded-full items-center justify-center border-2 border-white/30 shadow-xl overflow-hidden">
                  <Image 
                    source={{ uri: item.logo_url || 'https://via.placeholder.com/100' }} 
                    className="w-full h-full" 
                    resizeMode="cover" 
                  />
                </View>

                {/* Right Side: Text Info */}
                <View className="items-end flex-1 ml-4">
                  <View className="flex-row items-center justify-end">
                    {item.is_verified && (
                      <View className="mr-2 bg-blue-500 rounded-full p-0.5">
                        <BadgeCheck size={14} color="white" />
                      </View>
                    )}
                    <Text className="text-white text-2xl font-black text-right shadow-lg" numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-white/90 text-sm font-bold mr-1">{item.address ? getTranslatedName(item.address, 'locations') : getTranslatedName('Erbil', 'locations')}</Text>
                    <MapPin size={14} color="white" opacity={0.9} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {showrooms.length === 0 && (
            <View className="py-20 items-center">
              <Text className="text-slate-400 font-bold text-lg">{t('companies.noShowrooms')}</Text>
            </View>
          )}
          <View className="h-24" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
