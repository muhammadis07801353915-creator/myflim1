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
import { getColors } from '../theme/theme';
import { Play, Cast, Menu, X, Globe, CheckCircle2, Search } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const FEATURED_W = width * 0.48;
const FEATURED_H = FEATURED_W * 0.68;

export default function LiveTVScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { liveTv, channelCategories, banners, countries, loading, fetchInitialData, language, isUnlocked, theme } = useAppStore();
  const themeColors = getColors(theme);
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
      <View style={[s.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={s.headerLeft}>
          {/* ☰ Country filter button — always visible */}
          <TouchableOpacity
            style={[
              s.countryBtn, 
              { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
              selectedCountry && s.countryBtnActive, 
              isRTL && { flexDirection: 'row-reverse' }
            ]}
            onPress={() => setIsCountryModalOpen(true)}
            activeOpacity={0.8}
          >
            <Menu size={17} color={selectedCountry ? '#CC222F' : themeColors.text} />
            {selectedCountryObj?.flag_url ? (
              <Image source={{ uri: selectedCountryObj.flag_url }} style={s.countryBtnFlag} />
            ) : null}
            <Text style={[s.countryBtnText, { color: themeColors.text }, selectedCountry && s.countryBtnTextActive]} numberOfLines={1}>
              {selectedCountryObj ? getCountryName(selectedCountryObj) : (language === 'ku' ? 'وڵات' : language === 'ar' ? 'الدولة' : 'Country')}
            </Text>
            {selectedCountry && (
              <TouchableOpacity onPress={() => setSelectedCountry(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={12} color="#CC222F" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        <Text style={[s.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
          {language === 'ku' ? 'ڕاستەوخۆ' : language === 'ar' ? 'مباشر' : 'Live'}
        </Text>
        <TouchableOpacity style={[s.castBtn, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]}>
          <Cast size={20} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      {/* ── COUNTRY MODAL ─────────────────────────────────────────── */}
      <Modal visible={isCountryModalOpen} animationType="slide" transparent onRequestClose={() => setIsCountryModalOpen(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} onPress={() => setIsCountryModalOpen(false)} activeOpacity={1} />
          <View style={[s.modalSheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            {/* Modal Header */}
            <View style={[s.modalHeader, { borderBottomColor: themeColors.border }]}>
              <View>
                <Text style={[s.modalTitle, { color: themeColors.text }]}>
                  {language === 'ku' ? 'وڵاتەکان' : language === 'ar' ? 'الدول' : 'Countries'}
                </Text>
                <Text style={[s.modalSubtitle, { color: themeColors.textSecondary }]}>
                  {language === 'ku' ? 'وڵاتێک هەلبژێرە' : language === 'ar' ? 'اختر دولة' : 'Select a country to filter'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setIsCountryModalOpen(false); setCountrySearchQuery(''); }} style={[s.modalClose, { backgroundColor: themeColors.surfaceLight }]}>
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Country Search Bar */}
            <View style={[s.modalSearchWrap, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]}>
              <Search size={16} color={themeColors.textSecondary} />
              <TextInput
                style={[s.modalSearchInput, { color: themeColors.text }]}
                placeholder={language === 'ku' ? 'گەڕان بۆ وڵات...' : language === 'ar' ? 'البحث عن دولة...' : 'Search country...'}
                placeholderTextColor={themeColors.textMuted}
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
              />
              {countrySearchQuery ? (
                <TouchableOpacity onPress={() => setCountrySearchQuery('')}>
                  <X size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* All Countries option (when not searching) */}
            {!countrySearchQuery.trim() && (
              <TouchableOpacity
                style={[s.countryItem, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }, !selectedCountry && s.countryItemActive]}
                onPress={() => { setSelectedCountry(null); setIsCountryModalOpen(false); }}
                activeOpacity={0.8}
              >
                <View style={s.countryItemFlag}>
                  <Globe size={22} color={themeColors.textSecondary} />
                </View>
                <Text style={[s.countryItemName, { color: themeColors.text }, !selectedCountry && s.countryItemNameActive]}>
                  {language === 'ku' ? 'هەموو وڵاتەکان' : language === 'ar' ? 'جميع الدول' : 'All Countries'}
                </Text>
                {!selectedCountry && <CheckCircle2 size={20} color="#CC222F" />}
              </TouchableOpacity>
            )}

            <View style={[s.modalDivider, { backgroundColor: themeColors.border }]} />

            {/* Country list */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item: any) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 4 }}
              renderItem={({ item }: any) => {
                const isSelected = selectedCountry === item.name_en;
                return (
                  <TouchableOpacity
                    style={[s.countryItem, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }, isSelected && s.countryItemActive]}
                    onPress={() => { setSelectedCountry(item.name_en); setIsCountryModalOpen(false); setCountrySearchQuery(''); }}
                    activeOpacity={0.8}
                  >
                    <View style={s.countryItemFlag}>
                      {item.flag_url ? (
                        <Image source={{ uri: item.flag_url }} style={s.flagImg} resizeMode="cover" />
                      ) : (
                        <Globe size={20} color={themeColors.textSecondary} />
                      )}
                    </View>
                    <Text style={[s.countryItemName, { color: themeColors.text }, isSelected && s.countryItemNameActive]} numberOfLines={1}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                s.tab, 
                { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                selectedCategory === tab.id && s.tabActive
              ]}
              onPress={() => setSelectedCategory(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabLabel, { color: themeColors.textSecondary }, selectedCategory === tab.id && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isUnlocked ? (
          <>
            {/* ── FEATURED / MOST WATCHED CHANNELS (3 Column x 2 Row Grid) ─────────── */}
            {featured.length > 0 && (
              <View style={s.section}>
                <View style={[s.sectionRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[s.sectionTitle, { color: themeColors.text }]}>
                    {language === 'ku' ? 'زۆرترین بیندراو' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched'}
                  </Text>
                  <TouchableOpacity onPress={() => handleViewAll(language === 'ku' ? 'زۆرترین بیندراو' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched')}>
                    <Text style={s.seeAll}>{language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[s.gridContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                  {featured.slice(0, 6).map((ch: any) => {
                    const cardW = Math.floor((width - 32 - 20) / 3);
                    return (
                      <TouchableOpacity 
                        key={ch.id} 
                        style={[s.gridCard, { width: cardW, height: cardW, backgroundColor: themeColors.surface, borderColor: themeColors.border }]} 
                        onPress={() => handlePress(ch)} 
                        activeOpacity={0.85}
                      >
                        {ch.image ? (
                          <Image source={{ uri: ch.image }} style={s.gridImg} resizeMode="contain" />
                        ) : (
                          <Text style={[s.listLogoFallback, { color: themeColors.text }]} numberOfLines={2}>{ch.name}</Text>
                        )}

                        {/* LIVE Badge */}
                        <View style={s.liveBadge}>
                          <View style={s.liveDot} />
                          <Text style={s.liveText}>LIVE</Text>
                        </View>

                        {/* Title Overlay at Bottom */}
                        <View style={s.gridTitleOverlay}>
                          <Text numberOfLines={1} style={s.gridTitleText}>{ch.name}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
                      <Text style={[s.sectionTitle, { color: themeColors.text }]}>{cat.name}</Text>
                      {catChannels.length > 6 && (
                        <TouchableOpacity onPress={() => handleViewAll(cat.name)}>
                          <Text style={s.seeAll}>{language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {catChannels.slice(0, 6).map((ch: any) => (
                      <TouchableOpacity key={ch.id} style={[s.listRow, { borderBottomColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => handlePress(ch)} activeOpacity={0.85}>
                        <View style={[s.listLogoWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                          {ch.image ? (
                            <Image source={{ uri: ch.image }} style={s.listLogo} resizeMode="contain" />
                          ) : (
                            <Text style={[s.listLogoFallback, { color: themeColors.text }]} numberOfLines={1}>{ch.name[0]}</Text>
                          )}
                          <View style={s.listLiveDot} />
                        </View>
                        <View style={s.listInfo}>
                          <Text numberOfLines={1} style={[s.listName, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>{ch.name}</Text>
                          <Text style={[s.listCat, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}>{ch.category}</Text>
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
                <Globe size={40} color={themeColors.textMuted} />
                <Text style={[s.emptyText, { color: themeColors.textSecondary }]}>
                  {language === 'ku' ? 'هیچ کەناڵێک نەدۆزرایەوە بۆ ئەم وڵاتە' : language === 'ar' ? 'لا توجد قنوات لهذه الدولة' : 'No channels found for this country'}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={s.locked}>
            <Text style={[s.lockedText, { color: themeColors.textSecondary }]}>
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
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingBottom: 12, paddingTop: 6,
    borderBottomWidth: 1,
  },
  headerLeft: { alignItems: 'flex-start', minWidth: 105 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, flex: 1, textAlign: 'center' },
  castBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },

  // Country button
  countryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
    borderWidth: 1,
    maxWidth: 150, height: 38,
  },
  countryBtnActive: { backgroundColor: 'rgba(204,34,47,0.16)', borderColor: 'rgba(204,34,47,0.45)' },
  countryBtnText: { fontSize: 14, fontWeight: '800', maxWidth: 95 },
  countryBtnTextActive: { color: '#CC222F' },
  countryBtnFlag: { width: 26, height: 17, borderRadius: 4, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' },

  // Country Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%', minHeight: '50%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  modalDivider: { height: 1, marginVertical: 4 },
  modalSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, marginTop: 10, marginBottom: 8,
    paddingHorizontal: 12, height: 42, borderRadius: 14,
    borderWidth: 1,
  },
  modalSearchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  // Country list item
  countryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 14,
    marginHorizontal: 8, marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  countryItemActive: {
    backgroundColor: 'rgba(204,34,47,0.18)',
    borderColor: 'rgba(204,34,47,0.45)',
  },
  countryItemFlag: {
    width: 54, height: 36, borderRadius: 8, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  flagImg: { width: '100%', height: '100%' },
  countryItemName: { flex: 1, fontSize: 17, fontWeight: '700' },
  countryItemNameActive: { color: '#CC222F', fontWeight: '900' },

  // Tabs
  tabsScroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1,
  },
  tabActive: { backgroundColor: '#CC222F', borderColor: '#CC222F' },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },

  // Banner
  bannerWrap: { marginHorizontal: 16, marginBottom: 20, borderRadius: 16, overflow: 'hidden', height: 160, backgroundColor: '#1a1a22' },
  bannerImg: { width: '100%', height: '100%' },

  // Sections
  section: { marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  seeAll: { color: '#CC222F', fontSize: 13, fontWeight: '700' },

  // Grid cards (3 col x 2 row)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  gridCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridImg: {
    width: '82%',
    height: '82%',
  },
  gridTitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  gridTitleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  // LIVE badge
  liveBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // List rows
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 14,
  },
  listLogoWrap: {
    width: 62, height: 62, borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
  },
  listLogo: { width: '78%', height: '78%' },
  listLogoFallback: { fontSize: 20, fontWeight: '900' },
  listLiveDot: {
    position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E53935', borderWidth: 1.5, borderColor: '#0F0F13',
  },
  listInfo: { flex: 1 },
  listName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  listCat: { fontSize: 13, fontWeight: '500' },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CC222F', alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },

  // Locked
  locked: { alignItems: 'center', marginTop: 80 },
  lockedText: { fontSize: 15, fontWeight: '600' },
});
