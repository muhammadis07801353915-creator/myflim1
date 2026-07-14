import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MapPin, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const CarCard = ({ car, idx, fullWidth = false, isLarge = false }: any) => {
  const router = useRouter();

  if (!car) return null;

  if (isLarge) {
    return (
      <TouchableOpacity 
        onPress={() => router.push(`/car/${car.id}`)}
        className="w-full bg-white rounded-[20px] mb-4 overflow-hidden shadow-sm"
        style={{ borderWidth: 1, borderColor: '#cbd5e1' }}
      >
        <View className="relative">
          <Image 
            source={{ uri: car.image }} 
            className="w-full h-44" // Reduced from h-52
            resizeMode="cover"
          />
          {car.vip_plan && (
            <View className="absolute top-0 left-0 bg-[#CC222F] px-4 py-1.5 rounded-br-2xl">
              <Text className="text-white text-xs font-black italic tracking-widest">VIP</Text>
            </View>
          )}
          <TouchableOpacity className="absolute top-3 right-3 bg-black/20 p-1.5 rounded-full">
            <Heart size={18} color="white" />
          </TouchableOpacity>
        </View>
        
        <View className="p-3">
          <Text className="text-[16px] font-bold text-gray-900 mb-1" numberOfLines={1}>
            {car.title}
          </Text>
          
          <View className="flex-row items-center mb-2">
            <MapPin size={12} color="#9ca3af" />
            <Text className="text-gray-500 text-[13px] ml-1.5">Iraq, Erbil, Dream City</Text>
          </View>
          
          <Text className="text-[#ea4335] font-bold text-lg">
            {car.price}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Regular/Small card
  return (
    <TouchableOpacity 
      onPress={() => router.push(`/car/${car.id}`)}
      className="w-full bg-white rounded-[20px] mb-4 overflow-hidden shadow-sm"
      style={{ borderWidth: 1, borderColor: '#cbd5e1' }}
    >
      <View className="relative">
        <Image 
          source={{ uri: car.image }} 
          className="w-full h-32"
          resizeMode="cover"
          style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        />
        {car.vip_plan && (
          <View className="absolute top-0 left-0 bg-[#CC222F] px-3 py-1 rounded-br-2xl">
            <Text className="text-white text-[10px] font-black italic tracking-widest">VIP</Text>
          </View>
        )}
        <TouchableOpacity className="absolute top-2 right-2 bg-white/20 p-1.5 rounded-full">
          <Heart size={16} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="p-2.5">
        <Text className="text-[12px] font-bold text-gray-800 leading-4" numberOfLines={2}>
          {car.title}
        </Text>
        
        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <MapPin size={10} color="#9ca3af" />
            <Text className="text-gray-400 text-[10px] ml-1">{car.location}</Text>
          </View>
          <Text className="text-[#b3191f] font-bold text-[12px]">{car.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
