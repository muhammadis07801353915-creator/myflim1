import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Heart } from 'lucide-react-native';
import { supabase } from '../src/lib/supabase';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          car_id,
          cars (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const carList = data?.map(item => item.cars).filter(car => car !== null) || [];
      setFavorites(carList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/car/${item.id}`)}
      className="w-full bg-white rounded-[30px] mb-6 overflow-hidden border border-gray-100 shadow-sm"
    >
      <Image 
        source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70' }} 
        className="w-full h-56" 
        resizeMode="cover" 
      />
      <View className="p-5">
        <View className="flex-row justify-between items-start">
          <View className="items-end flex-1">
            <Text className="text-2xl font-black text-gray-900">{item.brand} {item.model}</Text>
            <Text className="text-gray-500 font-black mt-1 text-lg">{item.year} • {item.mileage || 0} km</Text>
          </View>
          <Text className="text-[#CC222F] text-3xl font-black ml-4">${item.price?.toLocaleString()}</Text>
        </View>
        <View className="flex-row items-center mt-4 pt-4 border-t border-gray-50">
          <MapPin size={16} color="#94a3b8" />
          <Text className="text-slate-400 text-sm font-black ml-1.5">{item.city || 'Erbil'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View className="py-20 items-center px-10">
      <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
        <Heart size={40} color="#cbd5e1" />
      </View>
      <Text className="text-gray-400 font-black text-xl text-center">هیچ سەیارەیەک لە لیستی دڵخوازەکانت نییە</Text>
      <TouchableOpacity 
        onPress={() => router.push('/')}
        className="mt-8 bg-[#CC222F] px-8 py-4 rounded-2xl"
      >
        <Text className="text-white font-black text-lg">گەڕان بەدوای سەیارە</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View className="px-5 py-6 flex-row items-center border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center">
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-2xl font-black mr-12">دڵخوازەکانم</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC222F" />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          ListEmptyComponent={EmptyState}
        />
      )}
    </SafeAreaView>
  );
}
