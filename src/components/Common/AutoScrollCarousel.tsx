import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, Image, TouchableOpacity, Dimensions, Linking, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const { width } = Dimensions.get('window');

interface CarouselItem {
  id: string | number;
  image_url?: string;
  images?: string[];
  image_urls?: string[];
  link?: string;
  car_id?: string;
  [key: string]: any;
}

interface AutoScrollCarouselProps {
  data: CarouselItem[];
  height?: number;
  onPressItem?: (item: CarouselItem) => void;
  autoScrollInterval?: number;
  showIndicators?: boolean;
}

export function AutoScrollCarousel({ 
  data, 
  height = 250, 
  onPressItem, 
  autoScrollInterval = 5000,
  showIndicators = true
}: AutoScrollCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (data.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveSlide(current => {
        const nextSlide = (current + 1) % data.length;
        flatListRef.current?.scrollToIndex({
          index: nextSlide,
          animated: true,
        });
        return nextSlide;
      });
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [data.length, autoScrollInterval]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(newIndex);
  };

  const handlePress = (item: CarouselItem) => {
    if (onPressItem) {
      onPressItem(item);
    } else if (item.link) {
      Linking.openURL(item.link).catch(err => console.error("Couldn't load page", err));
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={item.link || onPressItem ? 0.8 : 1} 
            onPress={() => handlePress(item)}
          >
            <Image 
              source={{ uri: item.image_url || item.images?.[0] || item.image_urls?.[0] }} 
              style={{ width, height }} 
              resizeMode="cover" 
            />
          </TouchableOpacity>
        )}
      />
      {showIndicators && data.length > 1 && (
        <View className="flex-row justify-center mt-1 space-x-1.5 absolute bottom-4 self-center">
          {data.map((_, i) => (
            <View 
              key={i} 
              className={`h-1.5 rounded-full ${activeSlide === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} 
            />
          ))}
        </View>
      )}
    </View>
  );
}
