import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const { width } = Dimensions.get('window');
const BANNER_CARD_WIDTH = width; // Full screen width, no gaps
const BANNER_CARD_HEIGHT = 240; // Bigger banner height

// Temporary hardcoded banners for testing.
// You can replace these URLs directly for now, then move to DB/admin later.
const BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1400',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=1400',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1400',
];

export const Banner = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNER_IMAGES.length;
        scrollRef.current?.scrollTo({ x: next * BANNER_CARD_WIDTH, animated: true });
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / BANNER_CARD_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View className="mb-4">
      <View
        className="w-full bg-white overflow-hidden"
        style={{ height: BANNER_CARD_HEIGHT }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
        >
          {BANNER_IMAGES.map((image, index) => (
            <Image
              key={`banner-${index}`}
              source={{ uri: image }}
              style={{ width: BANNER_CARD_WIDTH, height: '100%' }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View className="absolute bottom-4 self-center flex-row items-center" style={{ gap: 6 }}>
          {BANNER_IMAGES.map((_, index) => (
            <View
              key={`dot-${index}`}
              className={`rounded-full ${activeIndex === index ? 'bg-white w-5 h-2' : 'bg-white/70 w-2 h-2'}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
};
