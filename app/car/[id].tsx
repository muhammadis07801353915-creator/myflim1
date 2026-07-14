import {  View, Text as RNText, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, Linking, ActivityIndicator, FlatList, Modal, Clipboard, Alert, Platform  } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import { ChevronLeft, Share2, Heart, MapPin, Clock, Fuel, Gauge, MessageCircle, Cog, Globe, Wrench, X, BadgeCheck, Phone, Building2, User, Copy, Bookmark, ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { PistonIcon, GearStickIcon } from '../../src/components/CustomIcons';

const { width, height } = Dimensions.get('window');

const getRelativeTime = (dateString: string, t: any) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('carDetails.justNow');
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return t('carDetails.minutesAgo').replace('{min}', diffInMinutes.toString());
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return t('carDetails.hoursAgo').replace('{hr}', diffInHours.toString());
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return t('carDetails.yesterday');
  if (diffInDays < 7) return t('carDetails.daysAgo').replace('{day}', diffInDays.toString());
  return date.toLocaleDateString('ku-IQ');
};

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, getTranslatedName } = useLanguage();
  const flatListRef = useRef<FlatList>(null);
  
  const [car, setCar] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [similarCars, setSimilarCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [featuresModalVisible, setFeaturesModalVisible] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: carData } = await supabase.from('cars').select('*').eq('id', id).single();
      if (!carData) return;
      setCar(carData);

      // Track post view for showroom analytics
      if (carData.showroom_id) {
        supabase.rpc('increment_view', {
          p_showroom_id: carData.showroom_id,
          p_type: 'post',
          p_car_id: carData.id
        }).then(({ error }) => {
          if (error) console.warn('Showroom View tracking:', error.message);
        });
      }

      // Track total post views on the car itself
      supabase.rpc('increment_car_view', {
        car_id: carData.id
      }).then(({ error }) => {
        if (error) console.warn('Car View tracking:', error.message);
      });

      if (carData.showroom_id) {
        const { data: s } = await supabase.from('showrooms').select('*').eq('id', carData.showroom_id).single();
        if (s) setSeller({ name: s.name, image: s.logo_url, isVerified: true, type: 'showroom', phone: s.phone });
      } else if (carData.user_id) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', carData.user_id).single();
        if (p) setSeller({ name: p.full_name || t('carDetails.user'), image: p.avatar_url, isVerified: false, type: 'user', phone: p.phone });
      }

      const { data: sim } = await supabase.from('cars').select('*').eq('brand', carData.brand).neq('id', carData.id).eq('status', 'active').limit(4);
      setSimilarCars(sim || []);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleCopyLink = async () => {
    const link = `https://taban-share.vercel.app/car/${id}`;
    Clipboard.setString(link);
    setShareModalVisible(false);
    alert(t('carDetails.linkCopied'));
  };

  const handleSaveFavorite = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert(t('carDetails.loginFirst'));
        setShareModalVisible(false);
        return;
      }

      const { error } = await supabase.from('favorites').insert([{ user_id: user.id, car_id: id }]);
      
      if (error) {
        if (error.code === '23505') {
          alert(t('carDetails.alreadySaved'));
        } else {
          alert(t('carDetails.errorOccurred') + error.message);
        }
      } else {
        alert(t('carDetails.saveSuccess'));
      }
    } catch (e: any) {
      alert(t('carDetails.errorOccurred') + (e.message || t('carDetails.noConnection')));
    } finally {
      setIsSaving(false);
      setShareModalVisible(false);
    }
  };

  if (loading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#CC222F" /></View>;
  if (!car) return null;

  const images = (car.images?.length > 0) ? car.images : (car.image_urls?.length > 0) ? car.image_urls : ['https://images.unsplash.com/photo-1503376780353-7e6692767b70'];

  const scrollToImage = (index: number) => {
    setActiveImageIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Images */}
        <View className="relative">
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={1} onPress={() => setIsViewerVisible(true)}>
                <Image source={{ uri: item }} style={{ width, height: height * 0.4 }} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />
          <View className="absolute top-12 left-5 right-5 flex-row justify-between">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/20 rounded-full items-center justify-center"><ChevronLeft size={24} color="white" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setShareModalVisible(true)} className="w-10 h-10 bg-black/20 rounded-full items-center justify-center"><Share2 size={20} color="white" /></TouchableOpacity>
          </View>
          
          {/* Pagination Dots */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center" style={{ gap: 6 }}>
            {images.map((_, i) => (
              <View 
                key={i} 
                className={`h-1.5 rounded-full ${activeImageIndex === i ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/50'}`} 
              />
            ))}
          </View>

          <View className="absolute bottom-4 right-5 bg-black/30 px-2.5 py-0.5 rounded-full">
            <Text className="text-white text-[9px] font-bold">{activeImageIndex + 1}/{images.length}</Text>
          </View>
        </View>

        <View className="p-5">
          <Text className="text-gray-400 font-bold text-xs mb-1 uppercase tracking-wider">{getTranslatedName(car.brand, 'brands')}</Text>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-black text-slate-900 flex-1">{getTranslatedName(car.brand, 'brands')} {getTranslatedName(car.model, 'models')} {car.year}</Text>
            <View className="bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
               <Text className="text-[#CC222F] text-2xl font-black">${car.price?.toLocaleString()}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-6">
            <MapPin size={14} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-bold ml-1 mr-4">{car.city ? `${car.governorate ? `${getTranslatedName(car.governorate, 'locations')} - ` : ''}${getTranslatedName(car.city, 'locations')}` : getTranslatedName(car.governorate || car.city || 'Erbil', 'locations')}</Text>
            <Clock size={14} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-bold ml-1">{getRelativeTime(car.created_at, t)}</Text>
          </View>

          {/* Top Action Buttons (Call / WhatsApp) */}
          {car.status === 'sold' ? (
            <View className="bg-slate-900 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-slate-500/20 mb-8">
              <Text className="text-white font-black text-lg">ئەم ئۆتۆمبێلە فرۆشراوە</Text>
            </View>
          ) : (
            <View className="flex-row mb-8" style={{ gap: 10 }}>
               <TouchableOpacity 
                  onPress={() => {
                    const phoneStr = car.phone || car.phone2 || seller?.phone || '07500000000';
                    const cleanPhone = phoneStr.replace(/[^0-9+]/g, '');
                    Linking.openURL(`tel:${cleanPhone}`);
                  }} 
                  className="flex-1 bg-[#CC222F] h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-red-500/20"
               >
                  <Phone size={18} color="white" />
                  <Text className="text-white font-black text-md ml-2">{t('carDetails.callSeller')}</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setContactModalVisible(true)} className="w-14 h-14 bg-[#2dbb4e] rounded-2xl items-center justify-center shadow-lg shadow-green-500/20">
                  <MessageCircle size={22} color="white" />
               </TouchableOpacity>
            </View>
          )}

          {/* Quick Stats Grid */}
          <View className="flex-row flex-wrap justify-between mb-8">
             {[
               { icon: <Cog size={Platform.OS === 'ios' ? 26 : 20} color="#CC222F" />, val: car.engine_size ? car.engine_size : t('carDetails.notSpecified'), sub: t('carDetails.engine') },
               { icon: <PistonIcon size={Platform.OS === 'ios' ? 28 : 22} color="#CC222F" />, val: car.cylinders ? String(car.cylinders) : t('carDetails.notSpecified'), sub: t('carDetails.cylinder') },
               { icon: <GearStickIcon size={Platform.OS === 'ios' ? 28 : 22} color="#CC222F" />, val: getTranslatedName(car.transmission, 'transmissions') || car.transmission, sub: t('carDetails.transmission') },
               { icon: <Fuel size={Platform.OS === 'ios' ? 26 : 20} color="#CC222F" />, val: getTranslatedName(car.fuel_type, 'fuels') || car.fuel_type, sub: t('carDetails.fuel') },
               { icon: <Globe size={Platform.OS === 'ios' ? 26 : 20} color="#CC222F" />, val: car.spec || t('carDetails.notSpecified'), sub: t('carDetails.specs') },
               { icon: <Gauge size={Platform.OS === 'ios' ? 26 : 20} color="#CC222F" />, val: `${car.mileage || 0} km`, sub: t('carDetails.mileage') },
             ].map((s, i) => (
               <View key={i} className="w-[31%] bg-slate-50/50 border border-slate-100 rounded-3xl p-4 items-center mb-3">
                  {s.icon}
                  <Text style={{ fontSize: Platform.OS === 'ios' ? 13 : 11 }} className="text-slate-900 font-black mt-2 text-center" numberOfLines={1}>{s.val}</Text>
                  <Text style={{ fontSize: Platform.OS === 'ios' ? 11 : 9 }} className="text-slate-400 font-bold mt-1">{s.sub}</Text>
               </View>
             ))}
          </View>

          {/* Details Table */}
          <View className="space-y-4 mb-6">
             {[{l: t('carDetails.make'), v: getTranslatedName(car.brand, 'brands') || car.brand}, {l: t('carDetails.model'), v: getTranslatedName(car.model, 'models') || car.model}, {l: t('carDetails.year'), v: car.year}, {l: t('carDetails.transmission'), v: getTranslatedName(car.transmission, 'transmissions') || car.transmission}, {l: t('carDetails.fuel'), v: getTranslatedName(car.fuel_type, 'fuels') || car.fuel_type}, {l: t('carDetails.color'), v: getTranslatedName(car.color, 'colorsMap') || car.color}].map((x, i) => (
               <View key={i} className="flex-row justify-between py-3 border-b border-slate-50">
                  <Text className="text-slate-400 font-bold text-sm">{x.l}</Text>
                  <Text className="text-slate-900 font-black text-sm">{x.v}</Text>
               </View>
             ))}
          </View>

          {/* Features Section — shown only if car has features */}
          {car.features && car.features.length > 0 && (
            <TouchableOpacity
              onPress={() => setFeaturesModalVisible(true)}
              className="mb-6 bg-slate-50/80 rounded-3xl border border-slate-100 overflow-hidden"
              activeOpacity={0.8}
            >
              <View className="flex-row-reverse items-center justify-between px-5 py-4">
                <Text className="text-slate-900 font-black text-base">{t('carDetails.carFeatures')}</Text>
                <View className="flex-row items-center gap-2">
                  <View className="bg-[#CC222F] px-2.5 py-0.5 rounded-full">
                    <Text className="text-white text-xs font-black">{car.features.length}</Text>
                  </View>
                  <ChevronLeft size={18} color="#94a3b8" />
                </View>
              </View>
              <View className="flex-row-reverse flex-wrap px-5 pb-4 gap-2">
                {car.features.slice(0, 6).map((featureId: string) => {
                  const label = (t('sell.featuresList') as any)?.[featureId] || featureId;
                  return (
                    <View key={featureId} className="px-3 py-1.5 rounded-full bg-white border border-slate-200">
                      <Text className="text-slate-700 text-xs font-bold">{label}</Text>
                    </View>
                  );
                })}
                {car.features.length > 6 && (
                  <View className="px-3 py-1.5 rounded-full bg-red-50 border border-red-100">
                    <Text className="text-[#CC222F] text-xs font-bold">+{car.features.length - 6}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Description / Notes */}
          {car.description && car.description.trim().length > 0 && (
            <View className="mb-10 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
              <Text className="text-slate-900 font-black text-base mb-2">{t('carDetails.description') || "تێبینی و زانیاری زیاتر"}</Text>
              <Text className="text-slate-600 leading-6 text-sm" style={{ textAlign: 'left' }}>
                {car.description}
              </Text>
            </View>
          )}

          {/* Seller Card */}
          {seller && (
            <View className="mb-10 pt-4">
               {seller.type === 'showroom' ? (
                 <>
                   {/* Showroom Title */}
                   <Text className="text-2xl font-black text-slate-800 text-right mb-4">فرۆشیار</Text>
                   
                   <View className="bg-white rounded-[35px] border border-slate-100 p-5 shadow-sm">
                     <TouchableOpacity 
                       onPress={() => router.push(`/showroom/${car.showroom_id}`)}
                       className="flex-row-reverse items-center mb-6 justify-between"
                       activeOpacity={0.7}
                     >
                        {/* Avatar on Right */}
                        <View className="w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-slate-50 bg-white ml-4 shadow-sm">
                           <Image source={{ uri: seller.image || 'https://ui-avatars.com/api/?name=' + seller.name }} className="w-full h-full" resizeMode="cover" />
                        </View>

                        {/* Info on Left (Right aligned text) */}
                        <View className="flex-1 items-end pr-2">
                           <View className="flex-row-reverse items-center mb-1">
                              <Text className="text-xl font-black text-slate-900 ml-1">{seller.name}</Text>
                              {seller.isVerified && <BadgeCheck size={22} color="#ffffff" fill="#1DA1F2" />}
                           </View>
                           
                           <Text className="text-slate-500 font-bold text-[13px] mb-2 text-right">
                             {t('carDetails.verifiedCompany')}
                           </Text>
                           
                           <View className="flex-row-reverse items-center mb-1">
                              <MapPin size={12} color="#64748b" className="ml-1" />
                              <Text className="text-slate-500 font-bold text-xs">
                                 {car.city ? `${car.governorate ? `${getTranslatedName(car.governorate, 'locations')} - ` : ''}${getTranslatedName(car.city, 'locations')}` : getTranslatedName(car.governorate || car.city || 'Erbil', 'locations')}
                              </Text>
                           </View>

                           <Text className="text-slate-600 font-bold text-[11px] text-right mt-1 bg-slate-50 px-2 py-1 rounded-md">بۆ بازرگانی ئۆتۆمبێل</Text>
                        </View>
                     </TouchableOpacity>

                     {/* Action Buttons */}
                     {car.status === 'sold' ? null : (
                       <View className="flex-row" style={{ gap: 12 }}>
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(`tel:${car.phone || car.phone2 || seller.phone || '07500000000'}`)} 
                            className="flex-1 bg-[#4b4b4b] h-[55px] rounded-[18px] flex-row items-center justify-center"
                          >
                             <Phone size={22} color="white" />
                             <Text className="text-white font-black text-lg ml-3 mr-1">{t('carDetails.callSeller')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => setContactModalVisible(true)} 
                            className="w-[85px] h-[55px] bg-[#4ade80] rounded-[18px] items-center justify-center"
                          >
                             <MessageCircle size={28} color="white" />
                          </TouchableOpacity>
                       </View>
                     )}
                   </View>
                 </>
               ) : (
                 /* Normal User Card */
                 <View className="bg-white rounded-[30px] border border-slate-100 p-5 shadow-sm">
                   <View className="flex-row-reverse items-center mb-5">
                      <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-50 bg-white ml-4">
                         <Image source={{ uri: seller.image || 'https://ui-avatars.com/api/?name=' + seller.name }} className="w-full h-full" resizeMode="cover" />
                      </View>
                      <View className="flex-1 items-end">
                         <View className="flex-row-reverse items-center mb-1">
                            <Text className="text-lg font-black text-slate-900 ml-1">{seller.name}</Text>
                            {seller.isVerified && <BadgeCheck size={20} color="#ffffff" fill="#1DA1F2" />}
                         </View>
                         <Text className="text-slate-400 font-bold text-[13px] text-right">
                           {t('carDetails.verifiedUser')}
                         </Text>
                      </View>
                   </View>

                   {car.status === 'sold' ? null : (
                     <View className="flex-row" style={{ gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => Linking.openURL(`tel:${car.phone || car.phone2 || seller.phone || '07500000000'}`)} 
                          className="flex-1 bg-[#4b4b4b] h-[50px] rounded-[16px] flex-row items-center justify-center"
                        >
                           <Phone size={20} color="white" />
                           <Text className="text-white font-black text-base ml-2">{t('carDetails.callSeller')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => setContactModalVisible(true)} 
                          className="w-[70px] h-[50px] bg-[#4ade80] rounded-[16px] items-center justify-center"
                        >
                           <MessageCircle size={24} color="white" />
                        </TouchableOpacity>
                     </View>
                   )}
                 </View>
               )}
            </View>
          )}

          {/* Similar Cars */}
          {similarCars.length > 0 && (
            <View className="mb-10">
               <Text className="text-xl font-black text-slate-900 mb-6">{t('carDetails.similarCars')}</Text>
               <View className="flex-row flex-wrap justify-between">
                  {similarCars.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      onPress={() => { router.push(`/car/${item.id}`); }}
                      className="w-[48%] bg-white rounded-[25px] border border-slate-100 mb-6 overflow-hidden shadow-sm"
                    >
                       <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] }} className="w-full h-32" />
                       <View className="p-3">
                          <Text className="text-slate-900 font-black text-sm" numberOfLines={1}>{getTranslatedName(item.brand, 'brands')} {getTranslatedName(item.model, 'models')}</Text>
                          <View className="flex-row justify-between items-center mt-2">
                             <Text className="text-[#CC222F] font-black text-sm">${item.price?.toLocaleString()}</Text>
                             <Text className="text-slate-400 text-[9px] font-bold">{item.year}</Text>
                          </View>
                       </View>
                    </TouchableOpacity>
                  ))}
               </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Features Bottom Sheet Modal */}
      <Modal visible={featuresModalVisible} transparent={true} animationType="slide" statusBarTranslucent>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setFeaturesModalVisible(false)} />
          <View className="bg-white rounded-t-[40px] p-8" style={{ maxHeight: '65%' }}>
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
            <Text className="text-2xl font-black text-slate-900 mb-6 text-center">{t('carDetails.carFeatures')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row-reverse flex-wrap gap-3 pb-8">
                {(car?.features || []).map((featureId: string) => {
                  const label = (t('sell.featuresList') as any)?.[featureId] || featureId;
                  return (
                    <View key={featureId} className="px-4 py-2.5 rounded-full bg-red-50 border border-red-100">
                      <Text className="text-[#CC222F] font-bold text-sm">{label}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setFeaturesModalVisible(false)}
              className="mt-2 py-4 items-center bg-slate-50 rounded-2xl"
            >
              <Text className="text-slate-700 font-black text-base">{t('carDetails.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Modal (Action Sheet) */}
      <Modal visible={shareModalVisible} transparent={true} animationType="slide">
        <TouchableOpacity 
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setShareModalVisible(false)}
        >
          <View className="bg-white rounded-t-[40px] p-8">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-8" />
            <Text className="text-2xl font-black text-gray-900 mb-8 text-center">{t('carDetails.sharePost')}</Text>
            
            <View className="flex-row justify-around mb-4">
              <TouchableOpacity 
                onPress={handleSaveFavorite}
                disabled={isSaving}
                className="items-center w-[40%]"
              >
                <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-2">
                  {isSaving ? <ActivityIndicator color="#CC222F" /> : <Bookmark size={28} color="#CC222F" />}
                </View>
                <Text className="font-black text-gray-700">{t('carDetails.save')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleCopyLink}
                className="items-center w-[40%]"
              >
                <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-2">
                  <Copy size={28} color="#007AFF" />
                </View>
                <Text className="font-black text-gray-700">{t('carDetails.copyLink')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => setShareModalVisible(false)}
              className="mt-6 py-4 items-center"
            >
              <Text className="text-gray-400 font-black text-lg">{t('carDetails.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contact Method Selection Modal */}
      <Modal visible={contactModalVisible} transparent={true} animationType="slide" statusBarTranslucent>
        <View className="flex-1 bg-black/50 justify-end">
          {/* Backdrop tap to close */}
          <TouchableOpacity 
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setContactModalVisible(false)}
          />
          {/* Card - stops touch propagation to backdrop & images behind */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View className="bg-white rounded-t-[40px] p-8">
              <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-8" />
              <Text className="text-2xl font-black text-gray-900 mb-6 text-center">{t('carDetails.chooseContact')}</Text>
              <Text className="text-slate-400 font-bold text-center mb-8 px-6 text-base">{t('carDetails.howToContact')}</Text>
              
              <View className="space-y-4">
                {/* Option 1: In-App Chat */}
                <TouchableOpacity 
                  onPress={() => {
                    setContactModalVisible(false);
                    setTimeout(() => {
                      if (car.showroom_id) {
                        router.push({
                          pathname: '/showroom-chat',
                          params: {
                            autoStartChat: 'true',
                            showroomId: car.showroom_id,
                            showroomName: seller?.name || '',
                            showroomAvatar: seller?.image || '',
                            carBrand: car.brand,
                            carModel: car.model,
                            carYear: car.year,
                            carPrice: `$${car.price?.toLocaleString()}`,
                            carImage: images[0],
                            carId: car.id
                          }
                        });
                      } else {
                        router.push({
                          pathname: '/chats',
                          params: {
                            autoStartChat: 'true',
                            sellerId: car.user_id || '',
                            sellerName: seller?.name || '',
                            sellerAvatar: seller?.image || '',
                            carBrand: car.brand,
                            carModel: car.model,
                            carYear: car.year,
                            carPrice: `$${car.price?.toLocaleString()}`,
                            carImage: images[0],
                            carId: car.id
                          }
                        });
                      }
                    }, 300)}
                  }
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[25px] flex-row-reverse items-center justify-between shadow-sm mb-4"
                >
                  <View className="flex-row-reverse items-center gap-4">
                    <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center">
                      <MessageCircle size={24} color="#3b82f6" />
                    </View>
                    <View className="items-end">
                      <Text className="font-black text-slate-800 text-lg">{t('carDetails.inAppChat')}</Text>
                      <Text className="font-bold text-slate-400 text-sm mt-0.5">{t('carDetails.liveChat')}</Text>
                    </View>
                  </View>
                  <ChevronLeft size={20} color="#94a3b8" />
                </TouchableOpacity>

                {/* Option 2: WhatsApp */}
                <TouchableOpacity 
                  onPress={() => {
                    setContactModalVisible(false);
                    setTimeout(() => {
                      Linking.openURL(`whatsapp://send?phone=${(car.phone || car.phone2 || seller?.phone || '07500000000').replace(/^0/, '+964')}`);
                    }, 300);
                  }}
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[25px] flex-row-reverse items-center justify-between shadow-sm"
                >
                  <View className="flex-row-reverse items-center gap-4">
                    <View className="w-12 h-12 bg-emerald-500/10 rounded-2xl items-center justify-center">
                      <MessageCircle size={24} color="#10b981" />
                    </View>
                    <View className="items-end">
                      <Text className="font-black text-slate-800 text-lg">{t('carDetails.whatsapp')}</Text>
                      <Text className="font-bold text-slate-400 text-sm mt-0.5">{t('carDetails.whatsappMsg')}</Text>
                    </View>
                  </View>
                  <ChevronLeft size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={() => setContactModalVisible(false)}
                className="mt-8 py-4 items-center"
              >
                <Text className="text-gray-400 font-black text-lg">{t('carDetails.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Image Viewer */}
      <Modal visible={isViewerVisible} animationType="fade">
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-5 py-6 flex-row items-center border-b border-gray-50">
            <TouchableOpacity onPress={() => setIsViewerVisible(false)} className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center">
              <ArrowLeft size={28} color="#000" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-xl font-black mr-12">{t('carDetails.images')}</Text>
          </View>

          <View className="flex-1 justify-center py-10">
            <FlatList
              ref={flatListRef}
              data={images}
              horizontal
              pagingEnabled
              initialScrollIndex={activeImageIndex}
              onMomentumScrollEnd={(e) => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              showsHorizontalScrollIndicator={false}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              renderItem={({ item }) => (
                <View style={{ width, height: height * 0.5, justifyContent: 'center' }}>
                  <Image source={{ uri: item }} style={{ width, height: '100%' }} resizeMode="contain" />
                </View>
              )}
            />
          </View>

          {/* Thumbnail Strip */}
          <View className="py-8 px-5 border-t border-gray-50 bg-white">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {images.map((img, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => scrollToImage(index)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${activeImageIndex === index ? 'border-[#CC222F]' : 'border-transparent'}`}
                >
                  <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
