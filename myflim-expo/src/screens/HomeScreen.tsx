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
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Flame, ChevronRight, ChevronLeft, Search, Bell } from 'lucide-react-native';
import { translations } from '../utils/translations';
import { getLocalized } from '../utils/localization';
import FloatingSocialButton from '../components/FloatingSocialButton';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = width * 0.64; // ~16:10

// ─── Poster card (2:3) — used in all horizontal sections ──────────────────
function PosterCard({
  item,
  onPress,
  showRating = true,
  showType = false,
  language,
}: {
  item: any;
  onPress: (i: any) => void;
  showRating?: boolean;
  showType?: boolean;
  language: string;
}) {
  return (
    <TouchableOpacity
      style={card.wrap}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={card.poster}>
        <Image source={{ uri: item.image }} style={card.img} />

        {/* Rating badge — top right */}
        {showRating && item.rating ? (
          <View style={card.ratingBadge}>
            <Star size={10} color="#FBBF24" fill="#FBBF24" />
            <Text style={card.ratingText}>{item.rating}</Text>
          </View>
        ) : null}

        {/* Type badge — top left */}
        {showType && item.type ? (
          <View style={card.typeBadge}>
            <Text style={card.typeBadgeText}>{item.type.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={1} style={card.title}>
        {getLocalized(item, 'title', language)}
      </Text>
      {item.year ? <Text style={card.year}>{item.year}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Section header — matches web layout ──────────────────────────────────
function SectionHeader({
  title,
  showFlame,
  onSeeAll,
  language,
}: {
  title: string;
  showFlame?: boolean;
  onSeeAll?: () => void;
  language?: string;
}) {
  const isRTL = language === 'ku' || language === 'ar';
  const seeAllText = language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All';

  return (
    <View style={[sh.row, isRTL && { flexDirection: 'row-reverse' }]}>
      {/* Title + optional flame icon */}
      <View style={[sh.titleRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={sh.titleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{title}</Text>
        {showFlame ? <Flame size={18} color="#CC222F" style={isRTL ? { marginRight: 5 } : { marginLeft: 5 }} /> : null}
      </View>

      {/* See All link */}
      <TouchableOpacity style={[sh.seeAllBtn, isRTL && { flexDirection: 'row-reverse' }]} onPress={onSeeAll}>
        <Text style={sh.seeAllText}>{seeAllText}</Text>
        {isRTL ? <ChevronLeft size={14} color="#CC222F" /> : <ChevronRight size={14} color="#CC222F" />}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
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
  const isRTL = language === 'ku' || language === 'ar';

  const featured = isUnlocked ? movies.filter((m) => m.is_featured) : [];
  const topContents = isUnlocked
    ? movies
        .filter((m) => m.top_rank)
        .sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99))
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
  const handleSeeAll = (title: string, data: any[], listName?: string) =>
    navigation.navigate('Category', { title, data, type: 'Movie', listName });

  // ── Swipe handler for hero ───────────────────────────────────────────────
  const panRef = useRef<any>(null);
  const heroPan = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 40 && featured.length > 1) {
        setActiveIndex((prev) =>
          g.dx < 0
            ? (prev + 1) % featured.length
            : (prev - 1 + featured.length) % featured.length
        );
      } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8 && featured[activeIndex]) {
        handlePress(featured[activeIndex]);
      }
    },
  });

  // ── Hero render ──────────────────────────────────────────────────────────
  const renderHero = () => {
    if (featured.length === 0) return null;
    const item = featured[activeIndex];
    if (!item) return null;

    return (
      <View style={hero.wrapper}>
        <View style={hero.card} {...heroPan.panHandlers}>
          {/* BG image */}
          {item.image ? (
            <Image source={{ uri: item.image }} style={hero.img} resizeMode="cover" />
          ) : null}

          {/* Subtle clean overlay without dark shapes */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Content */}
          <View style={[hero.content, isRTL && { alignItems: 'flex-end' }]}>
            {/* Title */}
            <Text style={[hero.title, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
              {getLocalized(item, 'title', language)}
            </Text>

            {/* Badges row: Type · Rating · Year · Genre */}
            <View style={[hero.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
              {item.type ? (
                <View style={[hero.badge, hero.typeBadge]}>
                  <Text style={[hero.badgeText, { color: '#fff' }]}>
                    {item.type.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              {item.rating ? (
                <View style={[hero.badge, hero.ratingBadge, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Star size={10} color="#FBBF24" fill="#FBBF24" />
                  <Text style={[hero.badgeText, { color: '#FBBF24', marginLeft: isRTL ? 0 : 3, marginRight: isRTL ? 3 : 0 }]}>
                    {item.rating}
                  </Text>
                </View>
              ) : null}
              {item.year ? (
                <View style={hero.badge}>
                  <Text style={hero.badgeText}>{item.year}</Text>
                </View>
              ) : null}
              {typeof item.genre === 'string' && item.genre.trim() ? (
                <View style={hero.badge}>
                  <Text style={hero.badgeText}>{item.genre.split(',')[0]}</Text>
                </View>
              ) : null}
            </View>

            {/* Dots */}
            {featured.length > 1 ? (
              <View style={[hero.dotsRow, isRTL && { flexDirection: 'row-reverse' }]}>
                {featured.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setActiveIndex(i)}
                    style={[
                      hero.dot,
                      i === activeIndex ? hero.dotActive : hero.dotInactive,
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

  const renderSection = (
    title: string,
    data: any[],
    fullData?: any[],
    listName?: string,
    showFlame = false,
    showType = false
  ) => {
    return (
      <View style={styles.section} key={title}>
        <SectionHeader
          title={title}
          showFlame={showFlame}
          language={language}
          onSeeAll={() => handleSeeAll(title, fullData || data, listName)}
        />
        <FlatList
          data={data}
          horizontal
          inverted={isRTL}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PosterCard
              item={item}
              onPress={handlePress}
              showRating
              showType={showType}
              language={language}
            />
          )}
        />
      </View>
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && movies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>

      {/* ── STICKY HEADER BAR (RTL Dynamic) ─────────────────────────── */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 6 }, isRTL && { flexDirection: 'row-reverse' }]}>
        {/* Logo + Brand */}
        <View style={[header.brand, isRTL && { flexDirection: 'row-reverse' }]}>
          <Image
            source={require('../../assets/app-logo-new.png')}
            style={header.logo}
            resizeMode="contain"
          />
          <View style={[header.brandText, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={header.brandBold}>Taban</Text>
            <Text style={[header.brandBold, { color: '#CC222F' }]}>Play</Text>
          </View>
        </View>

        {/* Right: Search + Bell */}
        <View style={[header.actions, isRTL && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity
            style={header.iconBtn}
            onPress={() => navigation.navigate('Search' as never)}
            activeOpacity={0.8}
          >
            <Search size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View>
            <TouchableOpacity style={header.iconBtn} activeOpacity={0.8}>
              <Bell size={18} color="rgba(255,255,255,0.85)" />
              <View style={header.bellDot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.root}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── HERO ───────────────────────────────────── */}
        {renderHero()}

        <View style={styles.body}>
          {/* ── TRENDING NOW ─────────────────────────────────────── */}
          {topContents.length > 0
            ? renderSection(
                language === 'ku' ? 'ناودار' : language === 'ar' ? 'الأكثر مشاهدةً' : 'Trending Now',
                topContents.slice(0, 20),
                topContents,
                'Top Contents',
                true // flame icon
              )
            : null}

          {/* ── ANIME / ANIMATION ────────────────────────────────── */}
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
            const catTitle = String(
              getLocalized(cat, 'name', language) || cat.name || ''
            );
            if (!catTitle) return null;
            return renderSection(
              catTitle,
              catMovies.slice(0, 20),
              catMovies,
              cat.name,
              false,
              true // show type badge
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <FloatingSocialButton />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────

const hero = StyleSheet.create({
  wrapper: {
    width,
    marginBottom: 20,
  },
  card: {
    width,
    height: HERO_HEIGHT,
    backgroundColor: '#141522',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#CC222F',
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
  },
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
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#CC222F',
    fontSize: 13,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: width * 0.6,
  },
  titleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
});

const card = StyleSheet.create({
  wrap: {
    width: 130,
    marginRight: 12,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeBadgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  year: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F13',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F13',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  section: {
    marginBottom: 28,
  },
  hList: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(10,10,15,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
});


// ─── HEADER STYLES ────────────────────────────────────────────────────────
const header = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  brandText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  brandBold: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,21,34,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#CC222F',
    borderWidth: 1.5,
    borderColor: '#0F0F13',
  },
});

