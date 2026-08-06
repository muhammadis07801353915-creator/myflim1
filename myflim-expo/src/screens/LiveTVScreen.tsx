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
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { Play, Cast, Menu, X, Globe, CheckCircle2, Search } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const FEATURED_W = width * 0.48;
const FEATURED_H = FEATURED_W * 0.68;

export default function LiveTVScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { liveTv, channelCategories, banners, countries, loading, fetchInitialData, language, isUnlocked } = useAppStore();
  const isRTL = language === 'ku' || language === 'ar';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

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

  // ── Country-filtered channels ─────────────────────────────────────────────
  const countryFiltered = selectedCountry
    ? liveTv.filter((c) => c.country === selectedCountry)
    : liveTv;

  // ── Category-filtered channels ────────────────────────────────────────────
  const filteredChannels =
    selectedCategory === 'All' ? countryFiltered : countryFiltered.filter((c) => c.category === selectedCategory);

  // ── Featured / Most Watched (Featured + News fallback + remaining) ────────
  const featuredChannelsList = countryFiltered.filter((c) => c.is_featured);
  const newsChannelsList = countryFiltered.filter((c) =>
    (c.category === 'News' || c.category === 'هەواڵ' || c.category === 'الأخبار') &&
    !featuredChannelsList.some((f) => f.id === c.id)
  );
  const remainingChannelsList = countryFiltered.filter((c) =>
    !featuredChannelsList.some((f) => f.id === c.id) &&
    !newsChannelsList.some((n) => n.id === c.id)
  );
  const featured = [...featuredChannelsList, ...newsChannelsList, ...remainingChannelsList];

  // ── Banners ───────────────────────────────────────────────────────────────
  const topBanners = (banners || []).filter((b: any) => b.type?.toLowerCase() === 'top');
  const interspersedBanners = (banners || []).filter((b: any) => b.type?.toLowerCase() !== 'top');

  // ── Categories to render ──────────────────────────────────────────────────
  const categoriesToRender =
    selectedCategory === 'All' ? channelCategories : channelCategories.filter((c) => c.name === selectedCategory);

  // ── Channels by category ──────────────────────────────────────────────────
  const channelsByCategory = countryFiltered.reduce((acc: any, ch: any) => {
    if (!acc[ch.category]) acc[ch.category] = [];
    acc[ch.category].push(ch);
    return acc;
  }, {} as Record<string, any[]>);

  const handlePress = (item: any) =>
    navigation.navigate('Detail', { item: { ...item, type: 'LiveTV' } });

  const handleViewAll = (category: string) => {
    const data = (category === 'Most Watched' || category === 'زۆرترین بیندراو' || category === 'الأكثر مشاهدة')
      ? featured
      : (channelsByCategory[category] || []);
    navigation.navigate('Category', { title: category, data, type: 'LiveTV' });
  };

  // ── Filtered countries list by search ────────────────────────────────────
  const filteredCountries = countrySearchQuery.trim()
    ? countries.filter((c: any) =>
        (c.name_ku && c.name_ku.toLowerCase().includes(countrySearchQuery.toLowerCase())) ||
        (c.name_ar && c.name_ar.toLowerCase().includes(countrySearchQuery.toLowerCase())) ||
        (c.name_en && c.name_en.toLowerCase().includes(countrySearchQuery.toLowerCase()))
      )
    : countries;

  // ── Country name helper ───────────────────────────────────────────────────
  const getCountryName = (c: any) => {
    if (language === 'ku') return c.name_ku || c.name_en;
    if (language === 'ar') return c.name_ar || c.name_en;
    return c.name_en;
  };

  // ── Selected country object ───────────────────────────────────────────────
  const selectedCountryObj = selectedCountry
    ? countries.find((c: any) => c.name_en === selectedCountry)
    : null;

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
      <View style={[s.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={s.headerLeft}>
          {/* ☰ Country filter button — always visible */}
          <TouchableOpacity
            style={[s.countryBtn, selectedCountry && s.countryBtnActive, isRTL && { flexDirection: 'row-reverse' }]}
            onPress={() => setIsCountryModalOpen(true)}
            activeOpacity={0.8}
          >
            <Menu size={15} color={selectedCountry ? '#CC222F' : 'rgba(255,255,255,0.7)'} />
            {selectedCountryObj?.flag_url ? (
              <Image source={{ uri: selectedCountryObj.flag_url }} style={s.countryBtnFlag} />
            ) : null}
            <Text style={[s.countryBtnText, selectedCountry && s.countryBtnTextActive]} numberOfLines={1}>
              {selectedCountryObj ? getCountryName(selectedCountryObj) : (language === 'ku' ? 'وڵات' : language === 'ar' ? 'الدولة' : 'Country')}
            </Text>
            {selectedCountry && (
              <TouchableOpacity onPress={() => setSelectedCountry(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={12} color="#CC222F" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        <Text style={s.headerTitle} numberOfLines={1}>
          {language === 'ku' ? 'ڕاستەوخۆ' : language === 'ar' ? 'مباشر' : 'Live'}
        </Text>
        <TouchableOpacity style={s.castBtn}>
          <Cast size={20} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>
      </View>

      {/* ── COUNTRY MODAL ─────────────────────────────────────────── */}
      <Modal visible={isCountryModalOpen} animationType="slide" transparent onRequestClose={() => setIsCountryModalOpen(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} onPress={() => setIsCountryModalOpen(false)} activeOpacity={1} />
          <View style={s.modalSheet}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>
                  {language === 'ku' ? 'وڵاتەکان' : language === 'ar' ? 'الدول' : 'Countries'}
                </Text>
                <Text style={s.modalSubtitle}>
                  {language === 'ku' ? 'وڵاتێک هەلبژێرە' : language === 'ar' ? 'اختر دولة' : 'Select a country to filter'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setIsCountryModalOpen(false); setCountrySearchQuery(''); }} style={s.modalClose}>
                <X size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Country Search Bar */}
            <View style={s.modalSearchWrap}>
              <Search size={16} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={s.modalSearchInput}
                placeholder={language === 'ku' ? 'گەڕان بۆ وڵات...' : language === 'ar' ? 'البحث عن دولة...' : 'Search country...'}
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
              />
              {countrySearchQuery ? (
                <TouchableOpacity onPress={() => setCountrySearchQuery('')}>
                  <X size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* All Countries option (when not searching) */}
            {!countrySearchQuery.trim() && (
              <TouchableOpacity
                style={[s.countryItem, !selectedCountry && s.countryItemActive]}
                onPress={() => { setSelectedCountry(null); setIsCountryModalOpen(false); }}
                activeOpacity={0.8}
              >
                <View style={s.countryItemFlag}>
                  <Globe size={22} color="rgba(255,255,255,0.6)" />
                </View>
                <Text style={[s.countryItemName, !selectedCountry && s.countryItemNameActive]}>
                  {language === 'ku' ? 'هەموو وڵاتەکان' : language === 'ar' ? 'جميع الدول' : 'All Countries'}
                </Text>
                {!selectedCountry && <CheckCircle2 size={20} color="#CC222F" />}
              </TouchableOpacity>
            )}

            <View style={s.modalDivider} />

            {/* Country list */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item: any) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 4 }}
              renderItem={({ item }: any) => {
                const isSelected = selectedCountry === item.name_en;
                return (
                  <TouchableOpacity
                    style={[s.countryItem, isSelected && s.countryItemActive]}
                    onPress={() => { setSelectedCountry(item.name_en); setIsCountryModalOpen(false); setCountrySearchQuery(''); }}
                    activeOpacity={0.8}
                  >
                    <View style={s.countryItemFlag}>
                      {item.flag_url ? (
                        <Image source={{ uri: item.flag_url }} style={s.flagImg} resizeMode="cover" />
                      ) : (
                        <Globe size={20} color="rgba(255,255,255,0.4)" />
                      )}
                    </View>
                    <Text style={[s.countryItemName, isSelected && s.countryItemNameActive]} numberOfLines={1}>
                      {getCountryName(item)}
                    </Text>
                    {isSelected && <CheckCircle2 size={20} color="#CC222F" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── CATEGORY TABS ──────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.tabsScroll, isRTL && { flexDirection: 'row-reverse' }]}>
          {(isRTL ? [...tabs].reverse() : tabs).map((tab) => (
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
              <TouchableOpacity key={banner.id} style={s.bannerWrap} activeOpacity={0.95}
                onPress={() => { if (banner.link) Linking.openURL(banner.link).catch(() => {}); }}>
                <Image source={{ uri: banner.image }} style={s.bannerImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}

            {/* ── FEATURED CHANNELS ─────────────────────────────────── */}
            {featured.length > 0 && (
              <View style={s.section}>
                <View style={[s.sectionRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={s.sectionTitle}>
                    {language === 'ku' ? 'زۆرترین بیندراو' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched'}
                  </Text>
                  <TouchableOpacity onPress={() => handleViewAll(language === 'ku' ? 'زۆرترین بیندراو' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched')}>
                    <Text style={s.seeAll}>{language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.featuredScroll, isRTL && { flexDirection: 'row-reverse' }]}>
                  {(isRTL ? [...featured].reverse() : featured).map((ch: any) => (
                    <TouchableOpacity key={ch.id} style={s.featCard} onPress={() => handlePress(ch)} activeOpacity={0.85}>
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
              const catBanners = interspersedBanners.filter((b: any) => b.placement_after === cat.name);
              return (
                <React.Fragment key={cat.id || cat.name}>
                  <View style={s.section}>
                    <View style={[s.sectionRow, isRTL && { flexDirection: 'row-reverse' }]}>
                      <Text style={s.sectionTitle}>{cat.name}</Text>
                      {catChannels.length > 6 && (
                        <TouchableOpacity onPress={() => handleViewAll(cat.name)}>
                          <Text style={s.seeAll}>{language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {catChannels.slice(0, 6).map((ch: any) => (
                      <TouchableOpacity key={ch.id} style={[s.listRow, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => handlePress(ch)} activeOpacity={0.85}>
                        <View style={s.listLogoWrap}>
                          {ch.image ? (
                            <Image source={{ uri: ch.image }} style={s.listLogo} resizeMode="contain" />
                          ) : (
                            <Text style={s.listLogoFallback} numberOfLines={1}>{ch.name[0]}</Text>
                          )}
                          <View style={s.listLiveDot} />
                        </View>
                        <View style={s.listInfo}>
                          <Text numberOfLines={1} style={[s.listName, isRTL && { textAlign: 'right' }]}>{ch.name}</Text>
                          <Text style={[s.listCat, isRTL && { textAlign: 'right' }]}>{ch.category}</Text>
                        </View>
                        <View style={s.playBtn}>
                          <Play size={16} color="#fff" fill="#fff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {catBanners.map((banner: any) => (
                    <TouchableOpacity key={banner.id} style={s.bannerWrap} activeOpacity={0.95}
                      onPress={() => { if (banner.link) Linking.openURL(banner.link).catch(() => {}); }}>
                      <Image source={{ uri: banner.image }} style={s.bannerImg} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Empty state when country filter yields no results */}
            {selectedCountry && filteredChannels.length === 0 && (
              <View style={s.emptyState}>
                <Globe size={40} color="rgba(255,255,255,0.15)" />
                <Text style={s.emptyText}>
                  {language === 'ku' ? 'هیچ کەناڵێک نەدۆزرایەوە بۆ ئەم وڵاتە' : language === 'ar' ? 'لا توجد قنوات لهذه الدولة' : 'No channels found for this country'}
                </Text>
              </View>
            )}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6,
  },
  headerLeft: { alignItems: 'flex-start', minWidth: 90 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, flex: 1, textAlign: 'center' },
  castBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },

  // Country button
  countryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: 130,
  },
  countryBtnActive: { backgroundColor: 'rgba(204,34,47,0.12)', borderColor: 'rgba(204,34,47,0.35)' },
  countryBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', maxWidth: 70 },
  countryBtnTextActive: { color: '#CC222F' },
  countryBtnFlag: { width: 22, height: 15, borderRadius: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },

  // Country Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#111118', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '80%', minHeight: '50%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 4 },
  modalSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, marginTop: 10, marginBottom: 8,
    paddingHorizontal: 12, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalSearchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 0 },

  // Country list item
  countryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 14,
    marginHorizontal: 8, marginVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  countryItemActive: {
    backgroundColor: 'rgba(204,34,47,0.18)',
    borderColor: 'rgba(204,34,47,0.45)',
  },
  countryItemFlag: {
    width: 54, height: 36, borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#1c1c28',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  flagImg: { width: '100%', height: '100%' },
  countryItemName: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 17, fontWeight: '700' },
  countryItemNameActive: { color: '#fff', fontWeight: '900' },

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
  bannerWrap: { marginHorizontal: 16, marginBottom: 20, borderRadius: 16, overflow: 'hidden', height: 160, backgroundColor: '#1a1a22' },
  bannerImg: { width: '100%', height: '100%' },

  // Sections
  section: { marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  seeAll: { color: '#CC222F', fontSize: 13, fontWeight: '700' },

  // Featured
  featuredScroll: { paddingLeft: 16, paddingRight: 8, gap: 12 },
  featCard: { width: FEATURED_W, marginRight: 4 },
  featImgWrap: {
    width: FEATURED_W, height: FEATURED_H, backgroundColor: '#1c1c28',
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  featImg: { width: '70%', height: '70%' },
  featName: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 },
  featTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  featCat: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },

  // LIVE badge
  liveBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // List rows
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 14,
  },
  listLogoWrap: {
    width: 62, height: 62, borderRadius: 14, backgroundColor: '#1c1c28',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
  },
  listLogo: { width: '78%', height: '78%' },
  listLogoFallback: { color: '#fff', fontSize: 20, fontWeight: '900' },
  listLiveDot: {
    position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E53935', borderWidth: 1.5, borderColor: '#0F0F13',
  },
  listInfo: { flex: 1 },
  listName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 3 },
  listCat: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '500' },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CC222F', alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },

  // Locked
  locked: { alignItems: 'center', marginTop: 80 },
  lockedText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: '600' },
});
