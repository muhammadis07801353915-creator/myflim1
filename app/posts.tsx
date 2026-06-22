import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Eye, CheckCircle2, CircleDollarSign, PencilLine, MapPin, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/i18n/LanguageContext';

type PostStatus = 'available' | 'pending' | 'sold';

export default function PostsScreen() {
  const router = useRouter();
  const { t, getTranslatedName } = useLanguage();
  const [activeTab, setActiveTab] = useState<PostStatus>('available');
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyCars = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching my cars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCars();
  }, [fetchMyCars]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyCars();
  }, [fetchMyCars]);

  const updatePostStatus = async (postId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: newStatus })
        .eq('id', postId);

      if (error) throw error;
      
      Alert.alert('سەرکەوتوو بوو', 'باری پۆستەکە گۆڕدرا');
      fetchMyCars();
    } catch (error: any) {
      Alert.alert('هەڵە', 'نەتوانرا بارەکە بگۆڕدرێت');
    }
  };

  const filteredPosts = useMemo(
    () => cars.filter((car) => {
      // Map 'active' in DB to 'available' in UI
      if (activeTab === 'available') return car.status === 'active';
      return car.status === activeTab;
    }),
    [cars, activeTab]
  );

  const tabs = [
    { key: 'available' as PostStatus, label: t('posts.available') },
    { key: 'pending' as PostStatus, label: t('posts.pending') },
    { key: 'sold' as PostStatus, label: t('posts.sold') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      {/* Header with Back Button */}
      <View className="px-5 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-[30px] font-black text-gray-900">{t('posts.title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC222F" />}
      >
        {/* Tab Switcher */}
        <View className="px-5 pb-6">
          <View className="bg-white rounded-3xl p-1.5 flex-row shadow-sm border border-gray-100">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 rounded-2xl items-center ${
                  activeTab === tab.key ? 'bg-[#CC222F]' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-[17px] font-black ${
                    activeTab === tab.key ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4 pb-20">
          {loading ? (
            <ActivityIndicator size="large" color="#CC222F" className="mt-10" />
          ) : (
            filteredPosts.map((post) => (
              <View key={post.id} className="bg-white rounded-[30px] mb-6 overflow-hidden border border-gray-100 shadow-md shadow-gray-200">
                <View className="relative">
                  <Image 
                    source={{ uri: post.images?.[0] || post.image_urls?.[0] || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea' }} 
                    className="w-full h-[220px]" 
                    resizeMode="cover" 
                  />
                  <View className="absolute left-4 top-4 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center">
                    <Eye size={14} color="#ffffff" />
                    <Text className="text-white ml-1.5 font-bold text-[13px]">{post.views || 0}</Text>
                  </View>
                </View>

                <View className="p-5">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="items-end flex-1">
                      <Text className="text-[22px] font-black text-gray-900 text-right">{post.brand} {post.model}</Text>
                      <Text className="text-[15px] text-gray-500 mt-1 text-right font-bold">{post.year} • {post.mileage} {post.mileage_unit || 'km'}</Text>
                    </View>
                    <View className="bg-[#fdf1f2] px-4 py-2.5 rounded-2xl border border-[#f3c6cb] ml-4">
                      <Text className="text-[#CC222F] text-[20px] font-black">${post.price?.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View className="h-[1px] bg-gray-50 w-full mb-4" />

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <MapPin size={16} color="#9ca3af" />
                      <Text className="text-gray-400 text-[14px] ml-1.5 font-bold">{post.city ? getTranslatedName(post.city, 'locations') : 'نادیار'}</Text>
                    </View>
                    
                    <View className="flex-row" style={{ gap: 8 }}>
                      {post.status !== 'sold' && (
                        <TouchableOpacity 
                          onPress={() => updatePostStatus(post.id, 'sold')}
                          className="bg-[#2dbb4e] px-4 py-2.5 rounded-xl flex-row items-center"
                        >
                          <CircleDollarSign size={16} color="#fff" />
                          <Text className="text-white text-[13px] font-black ml-1.5">{t('posts.sold')}</Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity onPress={() => router.push({ pathname: '/edit-post', params: { id: post.id } } as any)} className="bg-gray-100 px-4 py-2.5 rounded-xl flex-row items-center border border-gray-200">
                        <PencilLine size={16} color="#4b5563" />
                        <Text className="text-gray-600 text-[13px] font-black ml-1.5">{t('posts.edit')}</Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                </View>
              </View>
            ))
          )}

          {!loading && filteredPosts.length === 0 && (
            <View className="bg-white rounded-[30px] p-12 items-center border border-gray-100 shadow-sm">
              <Text className="text-gray-400 text-[16px] font-bold">{t('posts.noPosts')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
