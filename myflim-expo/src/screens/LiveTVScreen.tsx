import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { Play, Cast } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const FEATURED_W = width * 0.48;
const FEATURED_H = FEATURED_W * 0.68;

export default function LiveTVScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    liveTv,
    channelCategories,
    banners,
    loading,
    fetchInitialData,
    language,
    isUnlocked,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState('All');

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  // ── Category tabs ─────────────────────────────────────────────────────────
  const tabs = [
    { id: 'All', label: language === 'ku' ? 'هەموو' : language === 'ar' ? 'الكل' : 'All' },
    ...channelCategories.map((c) => ({ id: c.name, label: c.name })),
  ];

  // ── Filtered channels ─────────────────────────────────────────────────────
  const filteredChannels =
    selectedCategory === 'All' ? liveTv : liveTv.filter((c) => c.category === selectedCategory);

  // ── Featured (top 6 of filtered) ─────────────────────────────────────────
  const featured = filteredChannels.slice(0, 6);

  // ── Top & interspersed banners ────────────────────────────────────────────
  const topBanners = (banners || []).filter((b: any) => b.type?.toLowerCase() === 'top');
  const interspersedBanners = (banners || []).filter(
    (b: any) => b.type?.toLowerCase() !== 'top'
  );

  // ── Categories to render (for grouped list) ───────────────────────────────
  const categoriesToRender =
    selectedCategory === 'All'
      ? channelCategories
      : channelCategories.filter((c) => c.name === selectedCategory);

  // ── Channels by category map ──────────────────────────────────────────────
  const channelsByCategory = liveTv.reduce((acc: any, ch: any) => {
    if (!acc[ch.category]) acc[ch.category] = [];
    acc[ch.category].push(ch);
    return acc;
  }, {} as Record<string, any[]>);

  const handlePress = (item: any) =>
    navigation.navigate('Detail', { item: { ...item, type: 'LiveTV' } });

  const handleViewAll = (category: string) => {
    const data = channelsByCategory[category] || [];
    navigation.navigate('Category', { title: category, data, type: 'LiveTV' });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && liveTv.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          {language === 'ku' ? 'تەلەڤیزیۆنی ڕاستەوخۆ' : language === 'ar' ? 'التلفزيون المباشر' : 'Live TV'}
        </Text>
        <TouchableOpacity style={s.castBtn}>
          <Cast size={20} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── CATEGORY TABS ──────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[s.tab, selectedCategory === tab.id && s.tabActive]}
              onPress={() => setSelectedCategory(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabLabel, selectedCategory === tab.id && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isUnlocked ? (
          <>
            {/* ── TOP BANNER ─────────────────────────────────────────── */}
            {topBanners.length > 0 && topBanners.map((banner: any) => (
              <TouchableOpacity
                key={banner.id}
                style={s.bannerWrap}
                activeOpacity={0.95}
                onPress={() => {
                  if (banner.link) Linking.openURL(banner.link).catch(() => {});
                }}
              >
                <Image source={{ uri: banner.image }} style={s.bannerImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}

            {/* ── FEATURED CHANNELS ─────────────────────────────────── */}
            {featured.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionRow}>
                  <Text style={s.sectionTitle}>
                    {language === 'ku' ? 'زۆرترین بیندراو' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched'}
                  </Text>
                  <TouchableOpacity>
                    <Text style={s.seeAll}>
                      {language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featuredScroll}>
                  {featured.map((ch: any) => (
                    <TouchableOpacity
                      key={ch.id}
                      style={s.featCard}
                      onPress={() => handlePress(ch)}
                      activeOpacity={0.85}
                    >
                      <View style={s.featImgWrap}>
                        {ch.image ? (
                          <Image source={{ uri: ch.image }} style={s.featImg} resizeMode="contain" />
                        ) : (
                          <Text style={s.featName} numberOfLines={2}>{ch.name}</Text>
                        )}
                        <View style={s.liveBadge}>
                          <View style={s.liveDot} />
                          <Text style={s.liveText}>LIVE</Text>
                        </View>
                      </View>
                      <Text numberOfLines={1} style={s.featTitle}>{ch.name}</Text>
                      <Text style={s.featCat}>{ch.category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── ALL CHANNELS — grouped by category ─────────────────── */}
            {categoriesToRender.map((cat: any) => {
              const catChannels = channelsByCategory[cat.name] || [];
              if (catChannels.length === 0) return null;

              // find interspersed banners after this category
              const catBanners = interspersedBanners.filter(
                (b: any) => b.placement_after === cat.name
              );

              return (
                <React.Fragment key={cat.id || cat.name}>
                  <View style={s.section}>
                    <View style={s.sectionRow}>
                      <Text style={s.sectionTitle}>{cat.name}</Text>
                      {catChannels.length > 6 && (
                        <TouchableOpacity onPress={() => handleViewAll(cat.name)}>
                          <Text style={s.seeAll}>
                            {language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {catChannels.slice(0, 6).map((ch: any) => (
                      <TouchableOpacity
                        key={ch.id}
                        style={s.listRow}
                        onPress={() => handlePress(ch)}
                        activeOpacity={0.85}
                      >
                        {/* Logo */}
                        <View style={s.listLogoWrap}>
                          {ch.image ? (
                            <Image source={{ uri: ch.image }} style={s.listLogo} resizeMode="contain" />
                          ) : (
                            <Text style={s.listLogoFallback} numberOfLines={1}>{ch.name[0]}</Text>
                          )}
                          <View style={s.listLiveDot} />
                        </View>

                        {/* Info */}
                        <View style={s.listInfo}>
                          <Text numberOfLines={1} style={s.listName}>{ch.name}</Text>
                          <Text style={s.listCat}>{ch.category}</Text>
                        </View>

                        {/* Play button */}
                        <View style={s.playBtn}>
                          <Play size={16} color="#fff" fill="#fff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Interspersed banners after this category */}
                  {catBanners.map((banner: any) => (
                    <TouchableOpacity
                      key={banner.id}
                      style={s.bannerWrap}
                      activeOpacity={0.95}
                      onPress={() => {
                        if (banner.link) Linking.openURL(banner.link).catch(() => {});
                      }}
                    >
                      <Image source={{ uri: banner.image }} style={s.bannerImg} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </React.Fragment>
              );
            })}
          </>
        ) : (
          <View style={s.locked}>
            <Text style={s.lockedText}>
              {language === 'ku' ? 'قفڵ کراوە — بەشدار بکەوە' : 'Locked — Subscribe to watch'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F13' },
  center: { flex: 1, backgroundColor: '#0F0F13', justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 6,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  castBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Tabs
  tabsScroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: { backgroundColor: '#CC222F', borderColor: '#CC222F' },
  tabLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },

  // Banner
  bannerWrap: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    backgroundColor: '#1a1a22',
  },
  bannerImg: { width: '100%', height: '100%' },

  // Sections
  section: { marginBottom: 24 },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  seeAll: { color: '#CC222F', fontSize: 13, fontWeight: '700' },

  // Featured cards
  featuredScroll: { paddingLeft: 16, paddingRight: 8, gap: 12 },
  featCard: { width: FEATURED_W, marginRight: 4 },
  featImgWrap: {
    width: FEATURED_W, height: FEATURED_H,
    backgroundColor: '#1c1c28',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  featImg: { width: '70%', height: '70%' },
  featName: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 },
  featTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  featCat: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },

  // LIVE badge
  liveBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // List rows
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 14,
  },
  listLogoWrap: {
    width: 62, height: 62, borderRadius: 14,
    backgroundColor: '#1c1c28',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
  },
  listLogo: { width: '78%', height: '78%' },
  listLogoFallback: { color: '#fff', fontSize: 20, fontWeight: '900' },
  listLiveDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E53935',
    borderWidth: 1.5, borderColor: '#0F0F13',
  },
  listInfo: { flex: 1 },
  listName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 3 },
  listCat: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '500' },
  playBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#CC222F',
    alignItems: 'center', justifyContent: 'center',
  },

  // Locked
  locked: { alignItems: 'center', marginTop: 80 },
  lockedText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: '600' },
});
