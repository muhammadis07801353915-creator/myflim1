import React, { useEffect, useState, useCallback } from 'react';
import {  View, Text as RNText, SafeAreaView, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Image, Dimensions, ScrollView, BackHandler, Linking  } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import { supabase } from '../../src/lib/supabase';
import { Header } from '../../src/components/Common/Header';
import { CategoryList } from '../../src/components/Home/CategoryList';
import { AutoScrollCarousel } from '../../src/components/Common/AutoScrollCarousel';
import { useViewMode } from '../../src/context/ViewModeContext';
import { useLocation } from '../../src/context/LocationContext';
import { useRouter } from 'expo-router';
import { MapPin, Heart, CheckCircle2 } from 'lucide-react-native';
import { useLanguage } from '../../src/i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode } = useViewMode();
  const { selectedCity, setSelectedCity } = useLocation();
  const { t, getTranslatedName, language } = useLanguage();
  const [cars, setCars] = useState<any[]>([]);
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0); // Keeping for fallback if needed
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (selectedBrand) {
        setSelectedBrand(null);
        return true; // Prevent default behavior
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedBrand]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: settings } = await supabase.from('app_settings').select('sold_retention_days').eq('id', 1).single();
      const retentionDays = settings?.sold_retention_days || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffIso = cutoffDate.toISOString();

      const { data: carsData } = await supabase
        .from('cars')
        .select('*')
        .or(`status.eq.active,and(status.eq.sold,sold_at.gte.${cutoffIso})`)
        .order('vip_plan', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
        
      setCars(carsData || []);
      
      const { data: showroomCars } = await supabase
        .from('cars')
        .select('*')
        .or(`status.eq.active,and(status.eq.sold,sold_at.gte.${cutoffIso})`)
        .not('showroom_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setFeaturedCars(showroomCars || []);

      const { data: adsData } = await supabase.from('meta_ads').select('*');
      setAds(adsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSelectedCity('هەموو شارەکان');
    await fetchData();
    setRefreshing(false);
  }, [setSelectedCity]);

  const getFilteredCars = () => {
    let filtered = cars;
    if (selectedCity && selectedCity !== 'هەموو شارەکان') {
      filtered = filtered.filter(car => {
        const selected = selectedCity.trim();
        const carCity = car.city ? car.city.trim() : '';
        const carGov = car.governorate ? car.governorate.trim() : '';
        return carCity === selected || carGov === selected;
      });
    }
    if (selectedBrand) {
      filtered = filtered.filter(car => car.brand === selectedBrand);
    }
    return filtered;
  };

  const getInterleavedData = () => {
    const data: any[] = [];
    const isList = viewMode === 'list';
    let carIndex = 0;
    const displayCars = getFilteredCars();
    
    while (carIndex < displayCars.length) {
      const carGroup = displayCars.slice(carIndex, carIndex + (isList ? 3 : 6));
      
      if (isList) {
        carGroup.forEach(car => data.push({ type: 'car_row', items: [car] }));
        carIndex += 3;
      } else {
        for (let i = 0; i < carGroup.length; i += 2) {
          data.push({ type: 'car_row', items: carGroup.slice(i, i + 2) });
        }
        carIndex += 6;
      }

      // Show Ad + Showrooms after the first row or if it's the end of a short list
      if (!data.some(d => d.type === 'showrooms_posts') && (carIndex >= (isList ? 3 : 6) || carIndex >= displayCars.length)) {
        data.push({ type: 'ad', id: 'ad-main' });
        data.push({ type: 'showrooms_posts', id: 'posts-main' });
      } else if (carIndex % 12 === 0 && carIndex < displayCars.length) {
        data.push({ type: 'ad', id: `ad-${carIndex}` });
      }
    }

    // If no cars at all, still show the sections
    if (displayCars.length === 0) {
      data.push({ type: 'ad', id: 'ad-main' });
      data.push({ type: 'showrooms_posts', id: 'posts-main' });
    }

    return data;
  };

  const getAdImage = (ad: any) => {
    if (language === 'ar' && ad.image_url_ar) return ad.image_url_ar;
    if (language === 'en' && ad.image_url_en) return ad.image_url_en;
    return ad.image_url;
  };

  const renderTopSlider = () => {
    const sliderItems = ads.filter(a => a.type === 'slider' || !a.type).map(a => ({...a, image_url: getAdImage(a)}));
    const sliderData = sliderItems.length > 0 ? sliderItems : cars.slice(0, 3);
    if (sliderData.length === 0) return null;

    return (
      <View className="mb-0">
        <AutoScrollCarousel 
          data={sliderData} 
          height={250} 
          autoScrollInterval={5000}
          onPressItem={(item) => {
            if (item.link) {
              Linking.openURL(item.link).catch(err => console.error("Couldn't load page", err));
            } else if (item.car_id || item.id) {
              router.push(`/car/${item.car_id || item.id}`);
            }
          }}
        />
      </View>
    );
  };

  const renderCarCard = (item: any, isHorizontal = false) => {
    const isList = viewMode === 'list' && !isHorizontal;

    if (isList) {
      // PREMIUM FULL-WIDTH LIST CARD (Based on latest image)
      return (
        <TouchableOpacity 
          key={item.id}
          onPress={() => router.push(`/car/${item.id}`)}
          className="w-full bg-white rounded-[20px] overflow-hidden border border-gray-50 mb-6 shadow-sm"
        >
          <View className="relative">
            <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] }} className="w-full h-56" resizeMode="cover" />
            {item.vip_plan && (
               <View className="absolute top-0 left-0 bg-[#FF5A5F] px-5 py-2 rounded-br-2xl rotate-[-5deg] mt-[-3px] ml-[-3px] shadow-sm shadow-red-500/50">
                  <Text className="text-white font-black text-[15px] tracking-widest">VIP</Text>
               </View>
            )}
            {item.status === 'sold' && (
              <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#CC222F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                <CheckCircle2 size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>{t('posts.soldBadge')}</Text>
              </View>
            )}
          </View>
          <View className="p-4">
            <Text className="text-gray-800 font-black text-xl" numberOfLines={1}>{getTranslatedName(item.brand, 'brands')} {getTranslatedName(item.model, 'models')}</Text>
             <View className="flex-row items-center mt-2">
               <MapPin size={14} color="#94a3b8" />
               <Text className={`text-slate-400 text-sm font-bold ${language === 'en' ? 'ml-1' : 'mr-1'}`}>{item.city ? `${item.governorate ? `${getTranslatedName(item.governorate, 'locations')} - ` : ''}${getTranslatedName(item.city, 'locations')}` : getTranslatedName(item.governorate || item.city || 'Erbil', 'locations')}</Text>
            </View>
            <Text className="text-[#FF5A5F] text-2xl font-black mt-3">${item.price?.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // ORIGINAL GRID CARD (untouched)
    return (
      <TouchableOpacity 
        key={item.id}
        onPress={() => router.push(`/car/${item.id}`)}
        className={isHorizontal ? "w-44 mr-4" : "w-[48%]"}
      >
        <View className="relative">
          <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] }} className={`w-full ${isHorizontal ? 'h-28' : 'h-36'} rounded-[20px]`} resizeMode="cover" />
          {item.vip_plan && (
             <View className="absolute top-0 left-0 bg-[#FF5A5F] px-4 py-1.5 rounded-br-xl rotate-[-5deg] mt-[-2px] ml-[-2px] shadow-sm shadow-red-500/50">
                <Text className="text-white font-black text-[11px] tracking-widest">VIP</Text>
             </View>
          )}
          {item.status === 'sold' && (
            <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#CC222F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }}>
              <CheckCircle2 size={12} color="white" style={{ marginRight: 4 }} />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 12 }}>{t('posts.soldBadge')}</Text>
            </View>
          )}
        </View>
        <View className="mt-2 px-1">
          <Text className="text-gray-900 font-black text-[14px]" numberOfLines={1}>{getTranslatedName(item.brand, 'brands')} {getTranslatedName(item.model, 'models')}</Text>
          <Text className="text-slate-400 text-[11px] font-bold mt-0.5">{item.year} • {item.mileage || 0} km</Text>
          <View className="flex-row justify-between items-center mt-2">
             <Text className="text-[#CC222F] text-[16px] font-black">${item.price?.toLocaleString()}</Text>
             <View className="flex-row items-center flex-1 justify-end ml-2">
                 <Text numberOfLines={1} ellipsizeMode="tail" className={`text-slate-400 text-[10px] font-bold flex-shrink ${language === 'en' ? 'ml-1' : 'mr-1'}`}>{item.city ? `${item.governorate ? `${getTranslatedName(item.governorate, 'locations')} - ` : ''}${getTranslatedName(item.city, 'locations')}` : getTranslatedName(item.governorate || item.city || 'Erbil', 'locations')}</Text>
                 <MapPin size={10} color="#94a3b8" />
              </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAdSection = () => {
    const banners = ads.filter(a => a.type === 'banner').map(a => ({...a, image_url: getAdImage(a)}));
    if (banners.length > 0) {
      // Instead of picking a random banner, we show the carousel with all banners
      return (
        <View className="my-2 overflow-hidden shadow-sm border-y border-slate-100">
          <AutoScrollCarousel 
            data={banners} 
            height={112} // equivalent to h-28
            autoScrollInterval={5000}
            showIndicators={false}
            onPressItem={(item) => {
              if (item.link) {
                Linking.openURL(item.link).catch(err => console.error("Couldn't load page", err));
              }
            }}
          />
        </View>
      );
    }
    return (
      <TouchableOpacity className="my-2">
        <Image source={{ uri: 'https://via.placeholder.com/800x400?text=Taban+Cars' }} className="w-full h-28" />
      </TouchableOpacity>
    );
  };

  const renderAd = () => (
    <TouchableOpacity className="w-full h-32 bg-slate-900 rounded-[30px] my-6 overflow-hidden items-center justify-center">
       <Image source={{ uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7' }} className="absolute w-full h-full opacity-40" />
       <Text className="text-white font-black text-2xl">{t('home.tabanCars')}</Text>
       <Text className="text-white/70 font-bold mt-1">{t('home.trustedPlace')}</Text>
    </TouchableOpacity>
  );

  const renderShowroomPostsSection = () => {
    if (featuredCars.length === 0) return null;
    return (
      <View className="my-6">
        <View className="flex-row justify-end items-center mb-4">
          <Text className="text-2xl font-black text-gray-900">{t('home.topShowrooms')}</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ gap: 12, paddingRight: 4 }}
        >
          {featuredCars.map((car) => (
            <TouchableOpacity 
              key={car.id}
              onPress={() => router.push(`/car/${car.id}`)}
              className="w-44 bg-white rounded-[25px] border border-slate-100 overflow-hidden shadow-sm"
            >
              <View className="relative">
                <Image 
                  source={{ uri: car.images?.[0] || car.image_urls?.[0] || 'https://via.placeholder.com/400' }} 
                  className="w-full h-32"
                  resizeMode="cover"
                />
                {car.vip_plan && (
                  <View className="absolute top-0 left-0 bg-[#FF5A5F] px-4 py-1.5 rounded-br-2xl rotate-[-5deg] mt-[-2px] ml-[-2px] shadow-sm shadow-red-500/50">
                    <Text className="text-white font-black text-[11px] tracking-widest">VIP</Text>
                  </View>
                )}
                {car.status === 'sold' && (
                  <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#CC222F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }}>
                    <CheckCircle2 size={12} color="white" style={{ marginRight: 4 }} />
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 12 }}>{t('posts.soldBadge')}</Text>
                  </View>
                )}
                <TouchableOpacity className="absolute top-2 right-2 bg-black/10 p-1 rounded-full">
                  <Heart size={14} color="white" />
                </TouchableOpacity>
              </View>
              
              <View className="p-2.5">
                <Text className="text-gray-900 font-black text-[13px]" numberOfLines={1}>
                  {getTranslatedName(car.brand, 'brands')} {getTranslatedName(car.model, 'models')} {car.year}
                </Text>
                
                <View className="flex-row justify-between items-center mt-2.5">
                  <Text className="text-[#CC222F] font-black text-[15px]">${car.price?.toLocaleString()}</Text>
                  <View className="flex-row items-center flex-1 justify-end ml-2">
                    <Text numberOfLines={1} ellipsizeMode="tail" className={`text-slate-400 text-[9px] font-bold flex-shrink ${language === 'en' ? 'ml-1' : 'mr-1'}`}>{car.city ? `${car.governorate ? `${getTranslatedName(car.governorate, 'locations')} - ` : ''}${getTranslatedName(car.city, 'locations')}` : getTranslatedName(car.governorate || car.city || 'Erbil', 'locations')}</Text>
                    <MapPin size={10} color="#94a3b8" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#CC222F" /></View>
      ) : (
        <FlatList
          data={getInterleavedData()}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              {renderTopSlider()}
              <View className="px-4 mt-4"><CategoryList selectedBrand={selectedBrand} onSelectBrand={setSelectedBrand} /></View>
            </>
          }
          renderItem={({ item }) => {
            if (item.type === 'car_row') {
              const isList = viewMode === 'list';
              return (
                <View className={`px-4 mb-8 ${isList ? 'flex-col' : 'flex-row justify-between'}`}>
                  {item.items.map((car: any) => renderCarCard(car))}
                  {!isList && item.items.length === 1 && <View className="w-[48%]" />}
                </View>
              );
            }
            if (item.type === 'ad') return <View>{renderAdSection()}</View>;
            if (item.type === 'showrooms_posts') return <View className="px-4">{renderShowroomPostsSection()}</View>;
            return null;
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC222F" />}
        />
      )}
    </SafeAreaView>
  );
}
