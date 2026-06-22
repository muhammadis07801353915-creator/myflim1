import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { ChevronLeft, Check, Grid, List } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CarCard } from '../../src/components/Home/CarCard';

const { width } = Dimensions.get('window');

const mockCar = {
  id: '1',
  title: 'Mercedes-Benz G-Class AMG G63 2023 Full Option',
  price: '$180,000',
  image: 'https://images.unsplash.com/photo-1520031441870-4c041ad9564d?auto=format&fit=crop&q=80&w=800',
  location: 'Erbil',
  year: '2023',
};

export default function LayoutSettingsScreen() {
  const router = useRouter();
  const [layout, setLayout] = useState('grid'); // 'grid' or 'list'

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-50 p-2 rounded-full">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">ڕووکاڵی پۆست گۆڕین</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-500 mb-6 text-lg">هەڵبژێرە چۆن پۆستەکانت پیشان بدرێت:</Text>

        {/* Layout Options */}
        <View className="flex-row justify-between mb-10">
          <TouchableOpacity 
            onPress={() => setLayout('grid')}
            className={`w-[48%] p-6 rounded-[30px] border-2 items-center ${layout === 'grid' ? 'border-[#b3191f] bg-[#b3191f]/5' : 'border-gray-100 bg-gray-50'}`}
          >
            <Grid size={32} color={layout === 'grid' ? '#b3191f' : '#9ca3af'} />
            <Text className={`mt-3 font-bold text-lg ${layout === 'grid' ? 'text-[#b3191f]' : 'text-gray-500'}`}>دوو ڕیزی</Text>
            {layout === 'grid' && (
              <View className="absolute top-3 right-3 bg-[#b3191f] rounded-full p-1">
                <Check size={12} color="white" strokeWidth={4} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setLayout('list')}
            className={`w-[48%] p-6 rounded-[30px] border-2 items-center ${layout === 'list' ? 'border-[#b3191f] bg-[#b3191f]/5' : 'border-gray-100 bg-gray-50'}`}
          >
            <List size={32} color={layout === 'list' ? '#b3191f' : '#9ca3af'} />
            <Text className={`mt-3 font-bold text-lg ${layout === 'list' ? 'text-[#b3191f]' : 'text-gray-500'}`}>یەک ڕیزی (گەورە)</Text>
            {layout === 'list' && (
              <View className="absolute top-3 right-3 bg-[#b3191f] rounded-full p-1">
                <Check size={12} color="white" strokeWidth={4} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Preview Section */}
        <Text className="text-gray-900 font-bold text-xl mb-4">پێشبینین (Preview):</Text>
        <View className="bg-gray-50 p-4 rounded-[35px] border border-gray-100">
          {layout === 'grid' ? (
            <View className="flex-row justify-between">
              <CarCard car={mockCar} idx={0} />
              <CarCard car={mockCar} idx={1} />
            </View>
          ) : (
            <CarCard car={mockCar} idx={0} isLarge={true} />
          )}
        </View>

        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-[#b3191f] py-5 rounded-[20px] mt-10 shadow-lg shadow-[#b3191f]/40 items-center"
        >
          <Text className="text-white font-bold text-xl">پاشەکەوتکردن</Text>
        </TouchableOpacity>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
