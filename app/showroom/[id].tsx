import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, Linking, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Phone, Globe, Share2, Info, BadgeCheck, Car, Building2, ExternalLink } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useLanguage } from '../../src/i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function ShowroomDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, getTranslatedName } = useLanguage();
  const [activeTab, setActiveTab] = useState('Cars');
  const [showroom, setShowroom] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShowroomData();
  }, [id]);

  const fetchShowroomData = async () => {
    try {
      // Fetch Showroom Profile
      const { data: showroomData, error: showroomError } = await supabase
        .from('showrooms')
        .select('*')
        .eq('id', id)
        .single();

      if (showroomError) throw showroomError;
      setShowroom(showroomData);

      // Track profile view
      supabase.rpc('increment_view', {
        p_showroom_id: id,
        p_type: 'profile'
      }).then(({ error }) => {
        if (error) console.warn('View tracking:', error.message);
      });

      // Fetch Showroom Cars
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .or(`showroom_id.eq.${id},user_id.eq.${id}`)
        .order('created_at', { ascending: false });

      if (carsError) throw carsError;
      setCars(carsData || []);

    } catch (error) {
      console.error('Error fetching showroom data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  if (!showroom) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500 font-bold">پێشانگاکە نەدۆزرایەوە</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View className="relative h-72 bg-slate-900">
          <Image 
            source={{ uri: showroom.cover_url || 'https://images.unsplash.com/photo-1562519819-016930ada31c?q=80&w=1200' }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
          {/* Stronger Overlay for visibility */}
          <View className="absolute inset-0 bg-black/50" />
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          
          <SafeAreaView className="absolute top-0 left-0 right-0">
            <View className="flex-row justify-between px-4 py-4 mt-6">
              <TouchableOpacity onPress={() => router.back()} className="bg-black/30 p-2.5 rounded-full backdrop-blur-md border border-white/20">
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-black/30 p-2.5 rounded-full backdrop-blur-md border border-white/20">
                <Share2 size={22} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Showroom Title Overlay */}
          <View className="absolute bottom-8 left-6 right-6 flex-row items-center">
            <View className="w-20 h-20 bg-white rounded-[24px] items-center justify-center border-4 border-white/20 overflow-hidden shadow-2xl">
              <Image source={{ uri: showroom.logo_url || 'https://via.placeholder.com/100' }} className="w-14 h-14" resizeMode="contain" />
            </View>
            <View className="ml-5 flex-1">
              <View className="flex-row items-center">
                <Text className="text-white text-3xl font-black shadow-lg">{showroom.name}</Text>
                {showroom.is_verified && (
                  <View className="ml-2 bg-blue-500 rounded-full p-1 border border-white/20">
                    <BadgeCheck size={16} color="white" />
                  </View>
                )}
              </View>
              <View className="flex-row items-center mt-1">
                <MapPin size={16} color="white" opacity={0.7} />
                <Text className="text-white/80 text-sm font-bold ml-1">{showroom.address || 'Erbil'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View className="px-6 py-8">
          <Text className="text-slate-600 leading-7 text-[16px] font-medium text-right">
            {showroom.bio || 'باشترین و نوێترین ئۆتۆمبێلەکان لای ئێمە دەست دەکەوێت بە باشترین نرخ.'}
          </Text>

          {/* Authorized Dealer Card */}
          <View className="mt-8 flex-row items-center bg-slate-50 border border-slate-100 p-5 rounded-[30px] shadow-sm">
            <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center border border-slate-100 shadow-sm">
               <Building2 size={28} color="#0f172a" />
            </View>
            <View className="ml-4">
              <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">{t('companies.authorizedDealer') || 'Authorized Dealer For'}</Text>
              <Text className="text-xl font-black text-slate-900">{showroom.category || 'Toyota & More'}</Text>
            </View>
          </View>
        </View>

        {/* Tabs Selection */}
        <View className="flex-row px-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('About')}
            className={`flex-1 py-4 items-center ${activeTab === 'About' ? 'border-b-4 border-red-600' : 'border-b-4 border-slate-50'}`}
          >
            <Text className={`font-black text-lg ${activeTab === 'About' ? 'text-slate-900' : 'text-slate-300'}`}>{t('companies.about') || 'زانیاری'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('Cars')}
            className={`flex-1 py-4 items-center ${activeTab === 'Cars' ? 'border-b-4 border-red-600' : 'border-b-4 border-slate-50'}`}
          >
            <Text className={`font-black text-lg ${activeTab === 'Cars' ? 'text-slate-900' : 'text-slate-300'}`}>{t('companies.cars') || 'سەیارەکان'} ({cars.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View className="p-6">
          {activeTab === 'Cars' ? (
            <View>
              {cars.map((car, index) => (
                <TouchableOpacity 
                  key={car.id} 
                  onPress={() => router.push(`/car/${car.id}`)}
                  className="flex-row mb-6 bg-white overflow-hidden"
                >
                  <Image source={{ uri: car.images?.[0] || car.image_urls?.[0] || 'https://via.placeholder.com/400' }} className="w-32 h-24 rounded-[20px]" />
                  <View className="flex-1 ml-4 justify-between py-1">
                    <Text className="text-[17px] font-black text-slate-900 text-right">{getTranslatedName(car.brand, 'brands')} {getTranslatedName(car.model, 'models')}</Text>
                    <View className="flex-row items-center justify-end" style={{ gap: 8 }}>
                      <View className="bg-slate-50 px-3 py-1 rounded-lg">
                        <Text className="text-slate-500 text-xs font-bold">{car.year}</Text>
                      </View>
                      <View className="bg-slate-50 px-3 py-1 rounded-lg">
                        <Text className="text-slate-500 text-xs font-bold">{car.mileage || '0'} km</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[#CC222F] text-xl font-black">${car.price?.toLocaleString()}</Text>
                      <View className="flex-row items-center">
                        <MapPin size={12} color="#94a3b8" />
                        <Text className="text-slate-400 text-xs font-bold ml-1">{car.city ? getTranslatedName(car.city, 'locations') : (t('companies.unknown') || 'نادیار')}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {cars.length === 0 && (
                <View className="py-20 items-center">
                  <Car size={48} color="#cbd5e1" />
                  <Text className="text-slate-400 font-bold mt-4">{t('companies.noCars') || 'هیچ ئۆتۆمبێلێک نییە'}</Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              {/* Contact Info */}
              <TouchableOpacity 
                onPress={() => Linking.openURL(`tel:${showroom.phone}`)}
                className="flex-row items-center bg-slate-50 p-5 rounded-[25px] mb-4 border border-slate-100"
              >
                <View className="bg-green-500 p-3 rounded-2xl shadow-sm shadow-green-200">
                  <Phone size={22} color="white" />
                </View>
                <Text className="ml-4 text-[18px] font-black text-slate-900">{showroom.phone || 'ژمارە نییە'}</Text>
              </TouchableOpacity>
              
              {showroom.website && (
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://${showroom.website}`)}
                  className="flex-row items-center bg-slate-50 p-5 rounded-[25px] mb-6 border border-slate-100"
                >
                  <View className="bg-blue-500 p-3 rounded-2xl shadow-sm shadow-blue-200">
                    <Globe size={22} color="white" />
                  </View>
                  <Text className="ml-4 text-[18px] font-black text-slate-900">{showroom.website}</Text>
                </TouchableOpacity>
              )}

              <View className="bg-slate-50 p-6 rounded-[30px] border border-slate-100">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">{t('companies.address') || 'نیشانە'}</Text>
                  <MapPin size={18} color="#CC222F" />
                </View>
                <Text className="text-slate-900 text-lg font-bold leading-7 text-right">
                  {showroom.address || 'ناونیشان دیاری نەکراوە'}
                </Text>
                
                <TouchableOpacity className="mt-6 flex-row items-center justify-center bg-white p-4 rounded-2xl border border-slate-100">
                  <ExternalLink size={18} color="#0f172a" />
                  <Text className="ml-2 font-black text-slate-900">{t('companies.openMap') || 'کردنەوە لە نەخشە'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
