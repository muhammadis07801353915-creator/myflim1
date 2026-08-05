import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import MovieCard from '../components/MovieCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { translations } from '../utils/translations';
import { getLocalized } from '../utils/localization';
import FloatingSocialButton from '../components/FloatingSocialButton';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    movies,
    categories,
    loading,
    fetchInitialData,
    language,
    isUnlocked,
  } = useAppStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const t = translations[language];

  const featured = isUnlocked ? movies.filter((m) => m.is_featured) : [];
  const topContents = isUnlocked
    ? movies.filter((m) => m.top_rank).sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99))
    : [];
  const animeItems = isUnlocked
    ? movies.filter(
        (a) =>
          a.genre?.includes('Anime') ||
          a.genre?.includes('Animation') ||
          a.type === 'Anime'
      )
    : [];

  const onRefresh = () => fetchInitialData();

  const handlePress = (item: any) => navigation.navigate('Detail', { item });

  const handlePressSeeAll = (title: string, data: any[], listName?: string) => {
    navigation.navigate('Category', { title, data, type: 'Movie', listName });
  };

  // ─── HERO SWIPE (PanResponder) ────────────────────────────────────────────
  const swipeDx = useRef(0);
  const swipeDy = useRef(0);

  const heroPan = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      swipeDx.current = g.dx;
      swipeDy.current = g.dy;
    },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 40 && featured.length > 1) {
        if (g.dx < 0) {
          setActiveIndex((prev) => (prev + 1) % featured.length);
        } else {
          setActiveIndex((prev) => (prev - 1 + featured.length) % featured.length);
        }
      } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8 && featured[activeIndex]) {
        // Tap — navigate to detail
        handlePress(featured[activeIndex]);
      }
      swipeDx.current = 0;
      swipeDy.current = 0;
    },
  });

  // ─── FEATURED HERO CARD ───────────────────────────────────────────────────
  const renderHero = () => {
    if (featured.length === 0) return null;
    const item = featured[activeIndex];
    if (!item) return null;

    return (
      <View style={[styles.heroWrapper, { paddingTop: insets.top }]}>
        <View style={styles.heroCard} {...heroPan.panHandlers}>
          {/* Background Image */}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />
          ) : null}

          {/* Gradients */}
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.55)', 'rgba(10,10,15,0.97)']}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(10,10,15,0.75)', 'rgba(10,10,15,0.28)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Bottom Content */}
          <View style={styles.heroContent}>
            {/* Title */}
            <Text style={styles.heroTitle} numberOfLines={2}>
              {getLocalized(item, 'title', language)}
            </Text>

            {/* Meta badges */}
            <View style={styles.metaRow}>
              {item.genre ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.genre.split(',')[0]}</Text>
                </View>
              ) : null}
              {item.year ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.year}</Text>
                </View>
              ) : null}
              {item.rating ? (
                <View style={[styles.badge, styles.ratingBadge]}>
                  <Star size={10} color="#FBBF24" fill="#FBBF24" />
                  <Text style={[styles.badgeText, { color: '#FBBF24', marginLeft: 3 }]}>
                    {item.rating}
                  </Text>
                </View>
              ) : null}
              {item.type ? (
                <View style={[styles.badge, styles.typeBadge]}>
                  <Text style={[styles.badgeText, { color: 'white' }]}>
                    {item.type.toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Dot indicators */}
            {featured.length > 1 ? (
              <View style={styles.dotsRow}>
                {featured.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setActiveIndex(i)}
                    style={[
                      styles.dot,
                      i === activeIndex ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  // ─── SECTION RENDERER ─────────────────────────────────────────────────────
  const renderSection = (title: string, data: any[], fullData?: any[], listName?: string) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={() => handlePressSeeAll(title, fullData || data, listName)}>
          <Text style={styles.seeAll}>{t.all}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <MovieCard item={item} onPress={handlePress} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );

  // ─── TOP CONTENT ITEM ─────────────────────────────────────────────────────
  const renderTopContentItem = ({ item, index }: any) => (
    <TouchableOpacity style={styles.topContentCard} onPress={() => handlePress(item)}>
      <View style={styles.topContentImageContainer}>
        <Image source={{ uri: item.image }} style={styles.topContentImage} />
        <View style={styles.movieBadge}>
          <Text style={styles.movieBadgeText}>
            {item.type === 'Series' ? t.series : t.movies}
          </Text>
        </View>
        <View style={styles.topNumberContainer}>
          <Text style={styles.topNumberText}>{index + 1}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.topContentTitle}>
        {getLocalized(item, 'title', language)}
      </Text>
    </TouchableOpacity>
  );

  if (loading && movies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        {renderHero()}

        {/* ── TOP CONTENTS ────────────────────────────────────────── */}
        {topContents.length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.popular || 'Top Contents'}</Text>
              <TouchableOpacity
                onPress={() =>
                  handlePressSeeAll(t.popular || 'Top Contents', topContents, 'Top Contents')
                }
              >
                <Text style={styles.seeAll}>{t.viewAll || 'All'}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={topContents}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderTopContentItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        ) : null}

        {/* ── ANIME ───────────────────────────────────────────────── */}
        <View style={{ marginTop: topContents.length > 0 ? 0 : 20 }}>
          {animeItems.length > 0
            ? renderSection(
                language === 'ku'
                  ? 'ئەنیمەیشنەکان'
                  : language === 'ar'
                  ? 'أنيمي'
                  : 'Animation',
                animeItems.slice(0, 15),
                animeItems,
                'Animation'
              )
            : null}

          {/* ── DYNAMIC CATEGORIES ───────────────────────────────── */}
          {categories.map((cat) => {
            if (!isUnlocked && cat.name !== 'زنجیرەی کوردی دۆبلاژ') return null;
            const catMovies = movies.filter((m) => m.list_name === cat.name);
            if (catMovies.length === 0) return null;
            const catTitle = String(getLocalized(cat, 'name', language) || cat.name || '');
            if (!catTitle) return null;
            return (
              <View key={cat.id}>
                {renderSection(catTitle, catMovies.slice(0, 20), catMovies, cat.name)}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <FloatingSocialButton />
    </View>
  );
}

const HERO_HEIGHT = width * 0.62; // 16:10 ratio approx

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F13',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F13',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── HERO ──────────────────────────────────────────────────────────────────
  heroWrapper: {
    width,
    marginBottom: 24,
  },
  heroCard: {
    width,
    height: HERO_HEIGHT,
    backgroundColor: '#141522',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // meta badges
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeBadge: {
    backgroundColor: '#CC222F',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
  },

  // dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#CC222F',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // ── SECTIONS ──────────────────────────────────────────────────────────────
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
  },

  // ── TOP CONTENT ───────────────────────────────────────────────────────────
  topContentCard: {
    width: 160,
    marginRight: SPACING.md,
  },
  topContentImageContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  topContentImage: {
    width: '100%',
    height: '100%',
  },
  movieBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E53935',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  movieBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  topNumberContainer: {
    position: 'absolute',
    bottom: -35,
    right: -10,
  },
  topNumberText: {
    color: 'white',
    fontSize: 140,
    fontWeight: '700',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 10,
  },
  topContentTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
});
