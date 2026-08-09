import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, getColors } from '../theme/theme';
import { ChevronLeft, Star } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getLocalized } from '../utils/localization';

const tabTr: any = {
  ku: { all: 'گشتی', movie: 'فیلم', series: 'زنجیرە', animation: 'ئەنیمەیشن', korean: 'کۆری', hindi: 'هیندی', persian: 'فارسی' },
  en: { all: 'All', movie: 'Movie', series: 'Series', animation: 'Animation', korean: 'Korean', hindi: 'Hindi', persian: 'Persian' },
  ar: { all: 'الكل', movie: 'فيلم', series: 'مسلسل', animation: 'أنمي', korean: 'كوري', hindi: 'هندي', persian: 'فارسي' },
};

const { width } = Dimensions.get('window');
const GAP = 12;
const H_PAD = 16;
const CARD_W = (width - H_PAD * 2 - GAP) / 2;

export default function CategoryScreen({ route, navigation }: any) {
  const { title, data, type, listName } = route.params;
  const insets = useSafeAreaInsets();
  const { language, theme } = useAppStore();
  const themeColors = getColors(theme);
  const isRTL = language === 'ku' || language === 'ar';
  const t = tabTr[language] || tabTr['ku'];

  const [activeTab, setActiveTab] = React.useState('All');

  // ── Tabs config ──────────────────────────────────────────────────────────
  let tabs: { id: string; label: string }[] = [];
  if (listName === 'نوێترین بەرهەمەکان 2026') {
    tabs = [
      { id: 'All', label: t.all },
      { id: 'Movie', label: t.movie },
      { id: 'Series', label: t.series },
      { id: 'Animation', label: t.animation },
    ];
  } else if (listName === 'فیلمی کوردی دۆبلاژ') {
    tabs = [
      { id: 'All', label: t.all },
      { id: 'Korean', label: t.korean },
      { id: 'Hindi', label: t.hindi },
      { id: 'Persian', label: t.persian },
    ];
  } else if (listName === 'کارتۆنی کوردی' || listName === 'کارتۆنی نوێ') {
    tabs = [
      { id: 'All', label: t.all },
      { id: 'Series', label: t.series },
      { id: 'Animation', label: t.animation },
    ];
  } else if (type !== 'LiveTV') {
    // Generic: show All / Series / Movie
    tabs = [
      { id: 'All', label: t.all },
      { id: 'Series', label: t.series },
      { id: 'Movie', label: t.movie },
    ];
  }

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredData = React.useMemo(() => {
    if (!tabs.length || activeTab === 'All') return data;
    return data.filter((item: any) => {
      if (activeTab === 'Movie') return item.type === 'Movie';
      if (activeTab === 'Series') return item.type === 'Series';
      if (activeTab === 'Animation') return item.type === 'Animation';
      if (activeTab === 'Korean') return item.country?.toLowerCase().includes('korea') || item.country?.includes('کۆری');
      if (activeTab === 'Hindi') return item.country?.toLowerCase().includes('india') || item.country?.includes('هیندی');
      if (activeTab === 'Persian') return item.country?.toLowerCase().includes('iran') || item.country?.includes('فارسی') || item.country?.includes('ئێران');
      return true;
    });
  }, [data, activeTab]);

  // ── Render: Movie / Series card (2-column) ───────────────────────────────
  const renderMovieCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Detail', { item })}
      activeOpacity={0.85}
    >
      {/* Poster */}
      <View style={[styles.posterWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <Image source={{ uri: item.image }} style={styles.poster} />

        {/* Rating badge — top right / top left for RTL */}
        {item.rating ? (
          <View style={[
            styles.ratingBadge,
            isRTL ? { left: 8, right: 'auto' } : { right: 8, left: 'auto' },
            isRTL && { flexDirection: 'row-reverse' }
          ]}>
            <Star size={10} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        ) : null}
      </View>

      {/* Title + Year */}
      <Text numberOfLines={1} style={[styles.cardTitle, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>
        {getLocalized(item, 'title', language)}
      </Text>
      {item.year ? <Text style={[styles.cardYear, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}>{item.year}</Text> : null}
    </TouchableOpacity>
  );

  // ── Render: Live TV card ─────────────────────────────────────────────────
  const renderTVCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Detail', { item: { ...item, type: 'LiveTV' } })}
      activeOpacity={0.85}
    >
      <View style={[styles.tvLogoWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <Image source={{ uri: item.image }} style={styles.tvLogo} resizeMode="contain" />
        <View style={[styles.liveBadge, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: any) =>
    type === 'LiveTV' ? renderTVCard({ item }) : renderMovieCard({ item });

  // ── Header component (passed to FlatList as ListHeaderComponent) ─────────
  const ListHeader = () => (
    <>
      {/* Back + Title */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: themeColors.background }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backBtn, { backgroundColor: theme === 'light' ? themeColors.surfaceLight : 'rgba(255,255,255,0.08)' }]}
        >
          <ChevronLeft color={themeColors.text} size={26} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>{title}</Text>
          {filteredData.length > 0 ? (
            <Text style={[styles.itemCount, { color: themeColors.textSecondary }]}>
              {language === 'ar' ? `${filteredData.length} عنصر` : language === 'ku' ? `${filteredData.length} ئایتەم` : `${filteredData.length} items`}
            </Text>
          ) : null}
        </View>
        {/* Spacer to center title */}
        <View style={{ width: 38 }} />
      </View>

      {/* Filter tabs */}
      {tabs.length > 0 ? (
        <View style={[styles.tabsRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? themeColors.primary : themeColors.surface,
                    borderColor: active ? themeColors.primary : themeColors.border,
                  }
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabLabel,
                  { color: active ? '#ffffff' : themeColors.textSecondary },
                  active && { fontWeight: '700' }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={themeColors.background} />

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={[styles.columnWrapper, isRTL && { flexDirection: 'row-reverse' }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F13',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0F0F13',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  itemCount: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: {
    backgroundColor: '#CC222F',
    borderColor: '#CC222F',
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: 'white',
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GAP,
  },

  // Movie card (2-col)
  card: {
    width: CARD_W,
  },
  posterWrap: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 8,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardYear: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },

  // TV card
  tvLogoWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tvLogo: {
    width: '65%',
    height: '65%',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53935',
  },
  liveText: {
    color: '#E0E0E0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
