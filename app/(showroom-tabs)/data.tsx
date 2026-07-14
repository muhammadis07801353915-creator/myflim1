import React, { useState, useEffect, useCallback } from 'react';
import {  
  View, 
  Text as RNText, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  StatusBar
 } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical, Eye, Trash2, CheckCircle, Edit, MapPin, Search } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 20;

export default function ShowroomDataScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showroom, setShowroom] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Generate dates from showroom creation date to today
  // Each day that passes, a new date appears automatically
  const generateDates = (fromDate?: string) => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from showroom creation date, or 30 days ago if not available
    const start = fromDate ? new Date(fromDate) : new Date();
    if (!fromDate) start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    // Generate all dates from today back to start
    const current = new Date(today);
    while (current >= start) {
      dates.push(new Date(current));
      current.setDate(current.getDate() - 1);
    }
    return dates;
  };

  // Recalculate dates when showroom data arrives
  const datesList = generateDates(showroom?.created_at);


  // Find stats for the selected date
  // Format Date to YYYY-MM-DD matching Postgres date format
  const getPostgresDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateString = getPostgresDate(selectedDate);
  const statsForDate = dailyStats.find(s => s.date === selectedDateString);

  const displayProfileViews = statsForDate?.profile_views || 0;
  const displayPostViews = statsForDate?.post_views || 0;

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      const phoneToUse = profile?.phone || user.user_metadata?.phone || (user.email ? user.email.replace('@taban.com', '') : null);

      if (phoneToUse) {
        const { data: showroomData } = await supabase
          .from('showrooms')
          .select('*')
          .eq('phone', phoneToUse)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setShowroom(showroomData);

        if (showroomData) {
          const { data: carsData } = await supabase
            .from('cars')
            .select('*')
            .eq('showroom_id', showroomData.id)
            .order('created_at', { ascending: false });
            
          setCars(carsData || []);

          const { data: statsData } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('showroom_id', showroomData.id);
            
          setDailyStats(statsData || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const openMenu = (car: any) => {
    setSelectedCar(car);
    setIsMenuVisible(true);
  };

  const handleDelete = async () => {
    setIsMenuVisible(false);
    Alert.alert(
      "سڕینەوەی پۆست",
      "ئایا دڵنیای لە سڕینەوەی ئەم پۆستە؟",
      [
        { text: "نەخێر", style: "cancel" },
        { 
          text: "بەڵێ", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase.from('cars').delete().eq('id', selectedCar.id);
              if (error) throw error;
              setCars(cars.filter(c => c.id !== selectedCar.id));
            } catch (error) {
              Alert.alert("هەڵە", "نەتوانرا پۆستەکە بسڕدرێتەوە");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSold = async () => {
    setIsMenuVisible(false);
    try {
      setLoading(true);
      const updateData: any = { status: 'sold', sold_at: new Date().toISOString() };
      const { error } = await supabase.from('cars').update(updateData).eq('id', selectedCar.id);
      if (error) throw error;
      setCars(cars.map(c => c.id === selectedCar.id ? { ...c, ...updateData } : c));
    } catch (error) {
      Alert.alert("هەڵە", "نەتوانرا گۆڕانکاری بکرێت");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View className="p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-black text-gray-900 text-right">ئامارەکان</Text>
      </View>

      {/* Date Picker */}
      <View className="mb-6">
        {/* Selected date label */}
        <Text className="text-right font-black text-gray-500 text-sm mb-3 px-1">
          {selectedDate.toLocaleDateString('ku-Arab-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <FlatList
          data={datesList}
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.toISOString()}
          renderItem={({ item, index }) => {
            const isSelected = selectedDate.toDateString() === item.toDateString();
            const dayNumber = item.getDate();
            const isFirstOfMonth = dayNumber === 1;
            const isToday = item.toDateString() === new Date().toDateString();
            
            // Show month name on 1st of month or for today
            const topLabel = isToday
              ? 'ئەمرۆ'
              : isFirstOfMonth
              ? item.toLocaleDateString('ku-Arab-IQ', { month: 'short' })
              : item.toLocaleDateString('ku-Arab-IQ', { weekday: 'short' });
            
            return (
              <TouchableOpacity
                onPress={() => setSelectedDate(item)}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  marginHorizontal: 3,
                  width: 60,
                  backgroundColor: isSelected ? '#CC222F' : isFirstOfMonth ? '#fff4f4' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: isSelected ? '#CC222F' : isFirstOfMonth ? '#ffcdd2' : '#e2e8f0',
                }}
              >
                <Text style={{
                  fontWeight: 'bold',
                  fontSize: isFirstOfMonth ? 9 : 11,
                  marginBottom: 2,
                  color: isSelected ? 'white' : isFirstOfMonth ? '#CC222F' : '#64748b',
                }}>
                  {topLabel}
                </Text>
                <Text style={{
                  fontWeight: '900',
                  fontSize: 17,
                  color: isSelected ? 'white' : '#1e293b',
                }}>
                  {dayNumber}
                </Text>
                {isFirstOfMonth && !isSelected && (
                  <Text style={{ fontSize: 8, color: '#CC222F', fontWeight: '700', marginTop: 2 }}>
                    {item.toLocaleDateString('ku-Arab-IQ', { year: 'numeric' })}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
      
      {/* 4 Cards Grid */}
      <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
        {/* Card 1: Profile Views */}
        <View className="w-[48%] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-3">
            <Eye size={20} color="#3b82f6" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-1">{displayProfileViews.toLocaleString()}</Text>
          <Text className="text-gray-500 font-bold text-xs">سەردانیکەرانی پێشانگا</Text>
        </View>

        {/* Card 2: Post Views */}
        <View className="w-[48%] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mb-3">
            <Search size={20} color="#a855f7" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-1">{displayPostViews.toLocaleString()}</Text>
          <Text className="text-gray-500 font-bold text-xs">بینەری پۆستەکان</Text>
        </View>

        {/* Card 3: Empty */}
        <View className="w-[48%] bg-gray-50 p-4 rounded-2xl border border-gray-100 items-center justify-center min-h-[120px]">
          <Text className="text-gray-400 font-bold text-sm">بەتاڵ</Text>
        </View>

        {/* Card 4: Empty */}
        <View className="w-[48%] bg-gray-50 p-4 rounded-2xl border border-gray-100 items-center justify-center min-h-[120px]">
          <Text className="text-gray-400 font-bold text-sm">بەتاڵ</Text>
        </View>
      </View>

      <Text className="text-2xl font-black text-gray-900 mb-4 text-right">پۆستەکانت ({cars.length})</Text>
    </View>
  );

  const renderCarItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/car/${item.id}`)}
      className="bg-white mx-4 mb-4 rounded-[20px] overflow-hidden border border-gray-100 flex-row shadow-sm"
    >
      <Image 
        source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/200' }} 
        className="w-32 h-32"
        resizeMode="cover"
      />
      <View className="flex-1 p-3 justify-between">
        <View className="flex-row justify-between items-start">
          <TouchableOpacity onPress={() => openMenu(item)} className="p-2 -mt-2 -mr-2 bg-gray-50 rounded-full">
            <MoreVertical size={16} color="#475569" />
          </TouchableOpacity>
          <View className="flex-1 mr-2">
            <Text className="text-gray-900 font-black text-[15px] text-right" numberOfLines={1}>{item.brand} {item.model}</Text>
            <Text className="text-gray-500 text-[12px] font-bold text-right mt-1">{item.year}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-end mt-2">
           <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg">
             <Text className="text-gray-600 font-bold text-[11px] mr-1">{item.views || 0}</Text>
             <Eye size={12} color="#94a3b8" />
           </View>
           <Text className="text-[#CC222F] text-[16px] font-black">${item.price?.toLocaleString()}</Text>
        </View>

        {item.status === 'sold' && (
           <View className="absolute top-2 right-2 bg-emerald-500 px-2 py-0.5 rounded">
              <Text className="text-white text-[10px] font-black">فرۆشراوە</Text>
           </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View 
        className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100 bg-white"
        style={{ paddingTop: STATUSBAR_HEIGHT + 15 }}
      >
        <TouchableOpacity 
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-900">داتاکان و پۆستەکان</Text>
        <View className="w-10" />
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC222F" />
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={renderCarItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC222F" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center p-10">
              <Text className="text-gray-400 font-bold text-lg text-center">هیچ پۆستێکت نییە</Text>
            </View>
          }
        />
      )}

      {/* Action Menu Modal */}
      <Modal visible={isMenuVisible} transparent animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View className="bg-white rounded-t-[30px] p-6 pb-10" onStartShouldSetResponder={() => true}>
            <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />
            
            <TouchableOpacity onPress={handleMarkAsSold} className="flex-row items-center justify-end py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800 mr-3">نیشانکردن وەک فرۆشراو</Text>
              <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                <CheckCircle size={20} color="#10b981" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsMenuVisible(false); Alert.alert('تێبینی', 'ئەم بەشە لە داهاتوودا زیاد دەکرێت'); }} className="flex-row items-center justify-end py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800 mr-3">دەستکاریکردن (Edit)</Text>
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                <Edit size={20} color="#3b82f6" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} className="flex-row items-center justify-end py-4">
              <Text className="text-lg font-bold text-red-500 mr-3">سڕینەوەی پۆست</Text>
              <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
                <Trash2 size={20} color="#ef4444" />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
