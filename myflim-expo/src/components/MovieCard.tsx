import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '../theme/theme';
import { Star } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getLocalized } from '../utils/localization';

interface MovieCardProps {
  item: any;
  onPress: (item: any) => void;
  width?: number;
  height?: number;
}

export default function MovieCard({ item, onPress, width = 140, height = 200 }: MovieCardProps) {
  const language = useAppStore(state => state.language);
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      style={[styles.container, { width }]} 
      onPress={() => onPress(item)}
    >
      <View style={[styles.imageContainer, { height }]}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.image}
          resizeMode="cover"
        />
        {item.is_pro && (
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        )}
        {item.rating && (
          <View style={styles.ratingBadge}>
            <Star size={10} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={styles.title}>{getLocalized(item, 'title', language)}</Text>
      <Text numberOfLines={1} style={styles.subtitle}>{item.genre}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: SPACING.md,
  },
  imageContainer: {
    width: '100%',
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  proBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  }
});
