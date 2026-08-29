import React, { useCallback, useState, useRef } from 'react';
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
import { getColors, COLORS } from '../theme/theme';
import { getLocalized, translateCategoryName } from '../utils/localization';
import { Play, Menu, X, Globe, CheckCircle2, Search, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LiveTVScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { liveTv, channelCategories, banners, countries, loading, fetchInitialData, language, isUnlocked, theme, user } = useAppStore();
  const themeColors = getColors(theme);
  const isRTL = language === 'ku' || language === 'ar';
  const isRestrictedUser = user?.name?.toLowerCase() === 'taban1';

  const categoryScrollRef = useRef<ScrollView>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToRightEdgeRTL = (ref: React.RefObject<ScrollView | null>) => {
    if (isRTL) {
      setTimeout(() => {
        ref.current?.scrollToEnd({ animated: false });
      }, 30);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (liveTv.length === 0) {
        fetchInitialData();
      }
    }, [liveTv.length, fetchInitialData])
  );

  // ── Category tabs ─────────────────────────────────────────────────────────
  const tabs = [
    { id: 'All', label: language === 'ku' ? 'هەموو' : language === 'badini' ? 'هەمی' : language === 'ar' ? 'الكل' : 'All' },
    ...channelCategories.map((c) => ({
      id: c.name,
      label: getLocalized(c, 'name', language) || translateCategoryName(c.name, language),
    })),
  ];

  // ── Country-filtered channels ─────────────────────────────────────────────
  const countryFiltered = selectedCountry
    ? (selectedCountry === 'Taban Play VIP'
        ? liveTv.filter((c) => c.country === 'Taban Play VIP' || c.category === 'Taban Play VIP' || c.is_pro === true)
        : liveTv.filter((c) => c.country === selectedCountry))
    : liveTv;

  // ── Category-filtered channels ────────────────────────────────────────────
  const filteredChannels =
    selectedCategory === 'All' ? countryFiltered : countryFiltered.filter((c) => c.category === selectedCategory);

  // ── Search results ────────────────────────────────────────────────────────
  const searchResults = searchQuery.trim()
    ? countryFiltered.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

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

  if (isRestrictedUser) {
    return (
      <View style={[s.center, { backgroundColor: themeColors.background, flex: 1 }]}>
        <Text style={{ color: themeColors.textMuted, fontSize: 14, fontWeight: 'bold' }}>
          {language === 'ku' ? 'هیچ پەخشێک بەردەست نییە' : 'No channels available'}
        </Text>
      </View>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && liveTv.length === 0) {
    return (
      <View style={[s.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  // ── Grid card size ────────────────────────────────────────────────────────
  const cardW = Math.floor((width - 32 - 20) / 3);

  return (
    <View style={[s.root, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>

        {/* LEFT SIDE: Country button (LTR) or Search button (RTL) */}
        <View style={s.headerSide}>
          {isRTL ? (
            /* RTL: Search button on the left */
            <TouchableOpacity
              style={[s.searchBtn, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]}
              onPress={() => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setSearchQuery(''); }}
              activeOpacity={0.8}
            >
              {isSearchOpen
                ? <X size={20} color={themeColors.text} />
                : <Search size={20} color={themeColors.text} />
              }
            </TouchableOpacity>
          ) : (
            /* LTR: Country button on the left */
            <TouchableOpacity
              style={[
                s.countryBtn,
                { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                selectedCountry && s.countryBtnActive,
              ]}
              onPress={() => setIsCountryModalOpen(true)}
              activeOpacity={0.8}
            >
              <Menu size={16} color={selectedCountry ? '#CC222F' : themeColors.text} />
              {selectedCountryObj?.flag_url ? (
                <Image source={{ uri: selectedCountryObj.flag_url }} style={s.countryBtnFlag} />
              ) : null}
              <Text style={[s.countryBtnText, { color: selectedCountry ? '#CC222F' : themeColors.text }]} numberOfLines={1}>
                {selectedCountryObj ? getCountryName(selectedCountryObj) : (language === 'ku' ? 'وڵات' : language === 'badini' ? 'وەڵات' : language === 'ar' ? 'الدولة' : 'Country')}
              </Text>
              {selectedCountry && (
                <TouchableOpacity onPress={() => setSelectedCountry(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color="#CC222F" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Centered Title */}
        <Text style={[s.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
          {language === 'ku' ? 'ڕاستەوخۆ' : language === 'badini' ? 'ڕاستەوخۆ' : language === 'ar' ? 'مباشر' : 'Live'}
        </Text>

        {/* RIGHT SIDE: Search button (LTR) or Country button (RTL) */}
        <View style={[s.headerSide, { alignItems: 'flex-end' }]}>
          {isRTL ? (
            /* RTL: Country button on the right */
            <TouchableOpacity
              style={[
                s.countryBtn,
                { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                selectedCountry && s.countryBtnActive,
                { flexDirection: 'row-reverse' },
              ]}
              onPress={() => setIsCountryModalOpen(true)}
              activeOpacity={0.8}
            >
              <Menu size={16} color={selectedCountry ? '#CC222F' : themeColors.text} />
              {selectedCountryObj?.flag_url ? (
                <Image source={{ uri: selectedCountryObj.flag_url }} style={s.countryBtnFlag} />
              ) : null}
              <Text style={[s.countryBtnText, { color: selectedCountry ? '#CC222F' : themeColors.text }]} numberOfLines={1}>
                {selectedCountryObj ? getCountryName(selectedCountryObj) : (language === 'ku' ? 'وڵات' : language === 'badini' ? 'وەڵات' : language === 'ar' ? 'الدولة' : 'Country')}
              </Text>
              {selectedCountry && (
                <TouchableOpacity onPress={() => setSelectedCountry(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color="#CC222F" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ) : (
            /* LTR: Search button on the right */
            <TouchableOpacity
              style={[s.searchBtn, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]}
              onPress={() => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setSearchQuery(''); }}
              activeOpacity={0.8}
            >
              {isSearchOpen
                ? <X size={20} color={themeColors.text} />
                : <Search size={20} color={themeColors.text} />
              }
            </TouchableOpacity>
          )}
        </View>
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
                  {language === 'ku' ? 'وڵاتەکان' : language === 'badini' ? 'وەڵات' : language === 'ar' ? 'الدول' : 'Countries'}
                </Text>
                <Text style={[s.modalSubtitle, { color: themeColors.textSecondary }]}>
                  {language === 'ku' ? 'وڵاتێک هەلبژێرە' : language === 'badini' ? 'وەڵاتەکێ هەڵبژێرە' : language === 'ar' ? 'اختر دولة' : 'Select a country to filter'}
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
                placeholder={language === 'ku' ? 'گەڕان بۆ وڵات...' : language === 'badini' ? 'لێگەڕیان بۆ وەڵاتی...' : language === 'ar' ? 'البحث عن دولة...' : 'Search country...'}
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

            {/* All Countries option */}
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
                  {language === 'ku' ? 'هەموو وڵاتەکان' : language === 'badini' ? 'تەڤایا وەڵاتان' : language === 'ar' ? 'جميع الدول' : 'All Countries'}
                </Text>
                {!selectedCountry && <CheckCircle2 size={20} color="#CC222F" />}
              </TouchableOpacity>
            )}

            {/* Taban Play VIP Option (Option #1 right below All Countries) */}
            {(!countrySearchQuery.trim() || 'taban play vip'.includes(countrySearchQuery.toLowerCase()) || 'تابان پڵەی vip'.includes(countrySearchQuery.toLowerCase())) && (
              <TouchableOpacity
                style={[
                  s.countryItem,
                  { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                  selectedCountry === 'Taban Play VIP' && s.countryItemActive,
                ]}
                onPress={() => { setSelectedCountry('Taban Play VIP'); setIsCountryModalOpen(false); setCountrySearchQuery(''); }}
                activeOpacity={0.8}
              >
                <View style={[s.countryItemFlag, { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}>
                  <Sparkles size={20} color="#000" />
                </View>
                <Text style={[s.countryItemName, { color: '#F59E0B', fontWeight: '900' }]}>
                  {language === 'ku' ? 'تابان پڵەی VIP' : language === 'badini' ? 'تابان پڵەی VIP' : language === 'ar' ? 'تابان بلاي VIP' : 'Taban Play VIP'}
                </Text>
                {selectedCountry === 'Taban Play VIP' && <CheckCircle2 size={20} color="#F59E0B" />}
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
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.tabsScroll, isRTL && { flexDirection: 'row-reverse' }]}
          onContentSizeChange={() => scrollToRightEdgeRTL(categoryScrollRef)}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                s.tab,
                { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                selectedCategory === tab.id && s.tabActive,
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

        {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
        {isSearchOpen && (
          <View style={[s.searchBar, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]}>
            <Search size={16} color={themeColors.textSecondary} />
            <TextInput
              style={[s.searchInput, { color: themeColors.text }]}
              placeholder={language === 'ku' ? 'گەڕانی کەناڵ...' : language === 'badini' ? 'لێگەڕیانا کەناڵان...' : language === 'ar' ? 'البحث عن قناة...' : 'Search channels...'}
              placeholderTextColor={themeColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={themeColors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* ── SEARCH RESULTS ──────────────────────────────────────────── */}
        {isSearchOpen && searchQuery.trim() ? (
          <View style={{ paddingHorizontal: 16 }}>
            {searchResults.map((ch: any) => (
              <TouchableOpacity
                key={ch.id}
                style={[s.listRow, { borderBottomColor: themeColors.border }, isRTL ? { flexDirection: 'row' } : { flexDirection: 'row' }]}
                onPress={() => handlePress(ch)}
                activeOpacity={0.85}
              >
                {/* LTR: Logo left | RTL: Logo right (placed last in row) */}
                {!isRTL && (
                  <View style={[s.listLogoWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    {ch.image ? (
                      <Image source={{ uri: ch.image }} style={s.listLogo} resizeMode="contain" />
                    ) : (
                      <Text style={[s.listLogoFallback, { color: themeColors.text }]} numberOfLines={1}>{ch.name[0]}</Text>
                    )}
                    <View style={s.listLiveDot} />
                  </View>
                )}

                {/* Text info */}
                <View style={[s.listInfo, isRTL && { alignItems: 'flex-end' }]}>
                  <Text numberOfLines={1} style={[s.listName, { color: themeColors.text }]}>{ch.name}</Text>
                  <Text style={[s.listCat, { color: themeColors.textSecondary }]}>{ch.category}</Text>
                </View>

                {/* RTL: Logo right */}
                {isRTL && (
                  <View style={[s.listLogoWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    {ch.image ? (
                      <Image source={{ uri: ch.image }} style={s.listLogo} resizeMode="contain" />
                    ) : (
                      <Text style={[s.listLogoFallback, { color: themeColors.text }]} numberOfLines={1}>{ch.name[0]}</Text>
                    )}
                    <View style={s.listLiveDot} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {searchResults.length === 0 && (
              <View style={s.emptyState}>
                <Text style={[s.emptyText, { color: themeColors.textSecondary }]}>
                  {language === 'ku' ? 'هیچ کەناڵێک نەدۆزرایەوە' : language === 'badini' ? 'هیچ کەناڵەک نەهاتە دیتن' : language === 'ar' ? 'لا توجد قنوات' : 'No channels found'}
                </Text>
              </View>
            )}
          </View>
        ) : isUnlocked ? (
          <>
            {/* ── FEATURED / MOST WATCHED CHANNELS (3 Column x 2 Row Grid) ─── */}
            {featured.length > 0 && (
              <View style={s.section}>
                <View style={[s.sectionRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[s.sectionTitle, { color: themeColors.text }]}>
                    {language === 'ku' ? 'زۆرترین بیندراو' : language === 'badini' ? 'زۆرترین سەحکری' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched'}
                  </Text>
                  <TouchableOpacity onPress={() => handleViewAll(language === 'ku' ? 'زۆرترین بیندراو' : language === 'badini' ? 'زۆرترین سەحکری' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched')}>
                    <Text style={s.seeAll}>{language === 'ku' ? 'هەموویان' : language === 'badini' ? 'سەحکرنا هەمیان' : language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[s.gridContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                  {featured.slice(0, 6).map((ch: any) => (
                    <TouchableOpacity
                      key={ch.id}
                      style={[s.gridCard, { width: cardW, height: cardW, backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                      onPress={() => handlePress(ch)}
                      activeOpacity={0.85}
                    >
                      {ch.image ? (
                        <Image source={{ uri: ch.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <Text style={[s.listLogoFallback, { color: themeColors.text }]} numberOfLines={2}>{ch.name}</Text>
                      )}

                      {/* LIVE Badge */}
                      <View style={s.liveBadge}>
                        <View style={s.liveDot} />
                        <Text style={s.liveText}>LIVE</Text>
                      </View>

                      {/* Bottom gradient name overlay */}
                      <View style={s.gridTitleOverlay}>
                        <Text numberOfLines={1} style={s.gridTitleText}>{ch.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── ALL CHANNELS — grouped by category ────────────────── */}
            {categoriesToRender.map((cat: any) => {
              const catChannels = channelsByCategory[cat.name] || [];
              if (catChannels.length === 0) return null;
              const catBanners = interspersedBanners.filter((b: any) => b.placement_after === cat.name);
              return (
                <React.Fragment key={cat.id || cat.name}>
                  <View style={s.section}>
                    <View style={[s.sectionRow, isRTL && { flexDirection: 'row-reverse' }]}>
                      <Text style={[s.sectionTitle, { color: themeColors.text }]}>
                        {getLocalized(cat, 'name', language) || translateCategoryName(cat.name, language)}
                      </Text>
                      {catChannels.length > 6 && (
                        <TouchableOpacity onPress={() => handleViewAll(cat.name)}>
                          <Text style={s.seeAll}>{language === 'ku' ? 'هەموویان' : language === 'badini' ? 'سەحکرنا هەمیان' : language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Channel rows */}
                    {catChannels.slice(0, 6).map((ch: any) => (
                      <TouchableOpacity
                        key={ch.id}
                        style={[s.listRow, { borderBottomColor: themeColors.border }]}
                        onPress={() => handlePress(ch)}
                        activeOpacity={0.85}
                      >
                        {/* LTR: Logo on left */}
                        {!isRTL && (
                          <View style={[s.listLogoWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                            {ch.image ? (
                              <Image source={{ uri: ch.image }} style={s.listLogo} resizeMode="contain" />
                            ) : (
                              <Text style={[s.listLogoFallback, { color: themeColors.text }]} numberOfLines={1}>{ch.name[0]}</Text>
                            )}
                            <View style={s.listLiveDot} />
                          </View>
                        )}

                        {/* Text info */}
                        <View style={[s.listInfo, isRTL && { alignItems: 'flex-end' }]}>
                          <Text numberOfLines={1} style={[s.listName, { color: themeColors.text }]}>{ch.name}</Text>
                          <Text style={[s.listCat, { color: themeColors.textSecondary }]}>{ch.category}</Text>
                        </View>

                        {/* RTL: Logo on right */}
                        {isRTL && (
                          <View style={[s.listLogoWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                            {ch.image ? (
                              <Image source={{ uri: ch.image }} style={s.listLogo} resizeMode="contain" />
                            ) : (
                              <Text style={[s.listLogoFallback, { color: themeColors.text }]} numberOfLines={1}>{ch.name[0]}</Text>
                            )}
                            <View style={s.listLiveDot} />
                          </View>
                        )}
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
                  {language === 'ku' ? 'هیچ کەناڵێک نەدۆزرایەوە بۆ ئەم وڵاتە' : language === 'badini' ? 'هیچ کەناڵەک نەهاتە دیتن بۆ ڤی وەڵاتی' : language === 'ar' ? 'لا توجد قنوات لهذه الدولة' : 'No channels found for this country'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
    borderBottomWidth: 1,
  },
  headerSide: {
    flexShrink: 0,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    flex: 1,
  },

  // Search button (replaces Cast icon)
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },

  // Country button
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 140,
    height: 38,
  },
  countryBtnActive: { backgroundColor: 'rgba(204,34,47,0.16)', borderColor: 'rgba(204,34,47,0.45)' },
  countryBtnText: { fontSize: 13, fontWeight: '800', maxWidth: 80 },
  countryBtnFlag: { width: 22, height: 15, borderRadius: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  // Country Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
    minHeight: '50%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: { height: 1, marginVertical: 4 },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalSearchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  // Country list item
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  countryItemActive: {
    backgroundColor: 'rgba(204,34,47,0.18)',
    borderColor: 'rgba(204,34,47,0.45)',
  },
  countryItemFlag: {
    width: 54,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  flagImg: { width: '100%', height: '100%' },
  countryItemName: { flex: 1, fontSize: 17, fontWeight: '700' },
  countryItemNameActive: { color: '#CC222F', fontWeight: '900' },

  // Tabs
  tabsScroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 8 },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabActive: { backgroundColor: '#CC222F', borderColor: '#CC222F' },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },

  // Banner
  bannerWrap: { width: '100%', marginHorizontal: 0, marginBottom: 20, borderRadius: 0, overflow: 'hidden', height: 170, backgroundColor: '#1a1a22' },
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
  gridTitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingVertical: 6,
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
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(204,34,47,0.92)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // List rows — logo on RIGHT, text on LEFT (matching website design)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  listLogoWrap: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  listLogo: { width: '80%', height: '80%' },
  listLogoFallback: { fontSize: 20, fontWeight: '900' },
  listLiveDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E53935',
    borderWidth: 1.5, borderColor: '#0F0F13',
  },
  listInfo: { flex: 1 },
  listName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  listCat: { fontSize: 13, fontWeight: '500' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },

  // Locked
  locked: { alignItems: 'center', marginTop: 80 },
  lockedText: { fontSize: 15, fontWeight: '600' },
});
