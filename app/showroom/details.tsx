import React, { useState } from 'react';
import {  View, Text as RNText, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, Linking  } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Phone, Globe, Share2, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const mockCars = [
  { id: '1', title: 'Toyota Land Cruiser', price: '$79,000', image: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&q=80&w=400', location: 'Baghdad', year: '2023', mileage: '16,000 mile' },
  { id: '2', title: 'Toyota RAV4 Hybrid', price: '$35,500', image: 'https://images.unsplash.com/photo-1621348160394-211805922834?auto=format&fit=crop&q=80&w=400', location: 'Erbil', year: '2022', mileage: '8,500 mile' },
];

export default function ShowroomDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Cars');

  const showroom = {
    name: 'Cihan Motors HQ',
    location: 'Erbil',
    image: 'https://images.unsplash.com/photo-1562519819-016930ada31c?auto=format&fit=crop&q=80&w=800',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_car_logo.svg/1024px-Toyota_car_logo.svg.png',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tincidunt maximus est. Nulla ornare. Ut a diam justo. Ut tortor nibh, fermentum a vulputate pharetra.',
    phone: '07503821872',
    website: 'www.aminsamad.com',
    address: 'Erbil Headquarter Branch Cihan Group Plaza, Kirkuk Road'
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View className="relative h-64">
          <Image source={{ uri: showroom.image }} className="w-full h-full" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/20" />
          
          <SafeAreaView className="absolute top-0 left-0 right-0">
            <View className="flex-row justify-between px-4 py-4 mt-6">
              <TouchableOpacity onPress={() => router.back()} className="bg-white/90 p-2.5 rounded-full shadow-sm">
                <ChevronLeft size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-white/90 p-2.5 rounded-full shadow-sm">
                <Share2 size={22} color="black" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Showroom Title Overlay */}
          <View className="absolute bottom-6 left-6 flex-row items-center">
            <View className="w-16 h-16 bg-white rounded-full items-center justify-center border-2 border-gray-100 overflow-hidden shadow-lg">
              <Image source={{ uri: showroom.logo }} className="w-12 h-12" resizeMode="contain" />
            </View>
            <View className="ml-4">
              <Text className="text-white text-2xl font-bold">{showroom.name}</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={16} color="white" />
                <Text className="text-white text-sm ml-1">{showroom.location}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View className="px-5 py-6">
          <Text className="text-gray-500 leading-6 text-[15px]">
            {showroom.description}
          </Text>

          {/* Authorized Dealer Card */}
          <View className="mt-6 flex-row items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
            <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center border border-gray-100">
              <Image source={{ uri: showroom.logo }} className="w-8 h-8" resizeMode="contain" />
            </View>
            <View className="ml-4">
              <Text className="text-gray-400 text-xs">Authorized Dealer for</Text>
              <Text className="text-xl font-bold text-gray-800">Toyota</Text>
            </View>
          </View>
        </View>

        {/* Tabs Selection */}
        <View className="flex-row border-b border-gray-100 px-5">
          <TouchableOpacity 
            onPress={() => setActiveTab('Cars')}
            className={`flex-1 py-4 items-center ${activeTab === 'Cars' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'Cars' ? 'text-blue-500' : 'text-gray-400'}`}>Cars</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('About')}
            className={`flex-1 py-4 items-center ${activeTab === 'About' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'About' ? 'text-blue-500' : 'text-gray-400'}`}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View className="p-5">
          {activeTab === 'Cars' ? (
            <View>
              {mockCars.map((car, index) => (
                <TouchableOpacity key={index} className="flex-row mb-6 bg-white overflow-hidden">
                  <Image source={{ uri: car.image }} className="w-32 h-24 rounded-xl" />
                  <View className="flex-1 ml-4 justify-between py-1">
                    <Text className="text-[17px] font-bold text-gray-800">{car.title}</Text>
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                        <Text className="text-gray-500 text-xs">{car.year}</Text>
                      </View>
                      <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                        <Text className="text-gray-500 text-xs">{car.mileage}</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[#b3191f] text-lg font-bold">{car.price}</Text>
                      <View className="flex-row items-center">
                        <MapPin size={12} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs ml-1">{car.location}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View>
              {/* Contact Buttons */}
              <TouchableOpacity className="flex-row items-center bg-gray-50 p-4 rounded-3xl mb-4 border border-gray-100">
                <View className="bg-green-500 p-2 rounded-full">
                  <Phone size={20} color="white" />
                </View>
                <Text className="ml-4 text-[17px] font-bold text-gray-800">{showroom.phone}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-row items-center bg-gray-50 p-4 rounded-3xl mb-6 border border-gray-100">
                <View className="bg-blue-500 p-2 rounded-full">
                  <Globe size={20} color="white" />
                </View>
                <Text className="ml-4 text-[17px] font-bold text-gray-800">{showroom.website}</Text>
              </TouchableOpacity>

              <Text className="text-gray-500 mb-2 font-bold">Address: {showroom.address}</Text>
              
              {/* Map View Placeholder */}
              <View className="w-full h-48 bg-gray-100 rounded-3xl overflow-hidden mt-4">
                <Image 
                  source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=36.1912,44.0091&zoom=14&size=600x300&key=YOUR_API_KEY' }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>
          )}
        </View>
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
