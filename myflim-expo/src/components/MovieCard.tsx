import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { SPACING, SIZES, getColors } from '../theme/theme';
import { Star } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getLocalized } from '../utils/localization';

interface MovieCardProps {
  item: any;
  onPress: (item: any) => void;
  width?: number;
  height?: number;
  style?: any;
}

export default function MovieCard({ item, onPress, width = 140, height = 200, style }: MovieCardProps) {
  const theme = useAppStore(state => state.theme);
  const language = useAppStore(state => state.language);
  const themeColors = getColors(theme);
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      style={[styles.container, { width }, style]} 
      onPress={() => onPress(item)}
    >
      <View style={[styles.imageContainer, { height, backgroundColor: themeColors.surface }]}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.image}
          resizeMode="cover"
        />
        {item.is_pro ? (
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        ) : null}
        {item.rating ? (
          <View style={styles.ratingBadge}>
            <Star size={10} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: themeColors.text }]}>{getLocalized(item, 'title', language)}</Text>
      <Text numberOfLines={1} style={[styles.subtitle, { color: themeColors.textSecondary }]}>{item.genre}</Text>
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  proBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#CC222F',
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
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  }
});
