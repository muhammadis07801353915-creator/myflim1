import React, { useCallback, useState, useRef, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { getColors } from '../theme/theme';
import { getLocalized, translateCategoryName } from '../utils/localization';
import { Menu, X, Globe, CheckCircle2, Search, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LiveTVScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { liveTv, channelCategories, banners, countries, loading, fetchInitialData, language, isUnlocked, theme, user } = useAppStore();
  const themeColors = getColors(theme);
  const isRTL = language === 'ku' || language === 'ar';
  const isRestrictedUser = user?.name?.toLowerCase() === 'taban1';

  const categoryScrollRef = useRef<ScrollView>(null);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

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

  // ── Search results ────────────────────────────────────────────────────────
  const searchResults = searchQuery.trim()
    ? countryFiltered.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // ── Top Hero Carousel Banners (Admin Panel / Database slot) ──────────────
  const dbTopBanners = (banners || []).filter(
    (b: any) => b.type?.toLowerCase() === 'top' || b.type?.toLowerCase() === 'livetv_top' || b.type?.toLowerCase() === 'hero' || !b.placement_after
  );

  const defaultTopBanners = [
    {
      id: 'default_hero_1',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&auto=format&fit=crop&q=80',
      title: 'وەبەرهێنان بکە - قازانج وەرگرە!',
      subtitle: 'SafeHome Finance & Investment',
      link: 'https://tabanplay.com',
    },
    {
      id: 'default_hero_2',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      title: 'خەونەکانت بەدیبهێنە!',
      subtitle: 'KIIB International Bank',
      link: 'https://tabanplay.com',
    },
    {
      id: 'default_hero_3',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
      title: 'پەخشی ڕاستەوخۆی سەرجەم کەناڵەکان',
      subtitle: 'Taban Play Live Stream',
      link: 'https://tabanplay.com',
    },
  ];

  const topBanners = dbTopBanners.length > 0 ? dbTopBanners : defaultTopBanners;

  // Auto-scroll hero banner slider
  useEffect(() => {
    if (topBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => {
        const next = (prev + 1) % topBanners.length;
        bannerScrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [topBanners.length]);

  // ── Intersperse Category Banners ──────────────────────────────────────────
  const interspersedBanners = (banners || []).filter((b: any) => b.type?.toLowerCase() !== 'top' && b.type?.toLowerCase() !== 'livetv_top' && b.type?.toLowerCase() !== 'hero');

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
    const data = channelsByCategory[category] || [];
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

  const selectedCountryObj = selectedCountry
    ? countries.find((c: any) => c.name_en === selectedCountry)
    : null;

  if (isRestrictedUser) {
    return (
      <View style={[s.center, { backgroundColor: '#13151D', flex: 1 }]}>
        <Text style={{ color: '#8E95A5', fontSize: 14, fontWeight: 'bold' }}>
          {language === 'ku' ? 'هیچ پەخشێک بەردەست نییە' : 'No channels available'}
        </Text>
      </View>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && liveTv.length === 0) {
    return (
      <View style={[s.center, { backgroundColor: '#13151D' }]}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  // Exact 3-column card dimensions
  const H_PAD = 16;
  const GAP = 12;
  const cardW = Math.floor((width - (H_PAD * 2) - (GAP * 2)) / 3);

  return (
    <View style={[s.root, { backgroundColor: '#13151D', paddingTop: insets.top }]}>

      {/* ── TOP HEADER BAR ─────────────────────────────────────────── */}
      <View style={s.header}>
        {/* RTL: Search button on the left | LTR: Country button on the left */}
        <View style={s.headerSide}>
          {isRTL ? (
            <TouchableOpacity
              style={s.iconButton}
              onPress={() => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setSearchQuery(''); }}
              activeOpacity={0.8}
            >
              {isSearchOpen ? <X size={20} color="#FFFFFF" /> : <Search size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.countryPill, selectedCountry && s.countryPillActive]}
              onPress={() => setIsCountryModalOpen(true)}
              activeOpacity={0.8}
            >
              <Menu size={16} color={selectedCountry ? '#E53935' : '#FFFFFF'} />
              {selectedCountryObj?.flag_url ? (
                <Image source={{ uri: selectedCountryObj.flag_url }} style={s.countryFlag} />
              ) : null}
              <Text style={[s.countryText, { color: selectedCountry ? '#E53935' : '#FFFFFF' }]} numberOfLines={1}>
                {selectedCountryObj ? getCountryName(selectedCountryObj) : (language === 'ku' ? 'وڵات' : language === 'badini' ? 'وەڵات' : language === 'ar' ? 'الدولة' : 'Country')}
              </Text>
              {selectedCountry && (
                <TouchableOpacity onPress={() => setSelectedCountry(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color="#E53935" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Center Title */}
        <Text style={s.headerTitle} numberOfLines={1}>
          {language === 'ku' ? 'ڕاستەوخۆ' : language === 'badini' ? 'ڕاستەوخۆ' : language === 'ar' ? 'مباشر' : 'Live'}
        </Text>

        {/* RTL: Country button on the right | LTR: Search button on the right */}
        <View style={[s.headerSide, { alignItems: 'flex-end' }]}>
          {isRTL ? (
            <TouchableOpacity
              style={[s.countryPill, selectedCountry && s.countryPillActive, { flexDirection: 'row-reverse' }]}
              onPress={() => setIsCountryModalOpen(true)}
              activeOpacity={0.8}
            >
              <Menu size={16} color={selectedCountry ? '#E53935' : '#FFFFFF'} />
              {selectedCountryObj?.flag_url ? (
                <Image source={{ uri: selectedCountryObj.flag_url }} style={s.countryFlag} />
              ) : null}
              <Text style={[s.countryText, { color: selectedCountry ? '#E53935' : '#FFFFFF' }]} numberOfLines={1}>
                {selectedCountryObj ? getCountryName(selectedCountryObj) : (language === 'ku' ? 'وڵات' : language === 'badini' ? 'وەڵات' : language === 'ar' ? 'الدولة' : 'Country')}
              </Text>
              {selectedCountry && (
                <TouchableOpacity onPress={() => setSelectedCountry(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={12} color="#E53935" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.iconButton}
              onPress={() => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setSearchQuery(''); }}
              activeOpacity={0.8}
            >
              {isSearchOpen ? <X size={20} color="#FFFFFF" /> : <Search size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── COUNTRY MODAL ─────────────────────────────────────────── */}
      <Modal visible={isCountryModalOpen} animationType="slide" transparent onRequestClose={() => setIsCountryModalOpen(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} onPress={() => setIsCountryModalOpen(false)} activeOpacity={1} />
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>
                  {language === 'ku' ? 'وڵاتەکان' : language === 'badini' ? 'وەڵات' : language === 'ar' ? 'الدول' : 'Countries'}
                </Text>
                <Text style={s.modalSubtitle}>
                  {language === 'ku' ? 'وڵاتێک هەلبژێرە' : language === 'badini' ? 'وەڵاتەکێ هەڵبژێرە' : language === 'ar' ? 'اختر دولة' : 'Select a country to filter'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setIsCountryModalOpen(false); setCountrySearchQuery(''); }} style={s.modalClose}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={s.modalSearchWrap}>
              <Search size={16} color="#8E95A5" />
              <TextInput
                style={s.modalSearchInput}
                placeholder={language === 'ku' ? 'گەڕان بۆ وڵات...' : language === 'badini' ? 'لێگەڕیان بۆ وەڵاتی...' : language === 'ar' ? 'البحث عن دولة...' : 'Search country...'}
                placeholderTextColor="#64748B"
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
              />
              {countrySearchQuery ? (
                <TouchableOpacity onPress={() => setCountrySearchQuery('')}>
                  <X size={16} color="#8E95A5" />
                </TouchableOpacity>
              ) : null}
            </View>

            {!countrySearchQuery.trim() && (
              <TouchableOpacity
                style={[s.countryItem, !selectedCountry && s.countryItemActive]}
                onPress={() => { setSelectedCountry(null); setIsCountryModalOpen(false); }}
                activeOpacity={0.8}
              >
                <View style={s.countryItemFlag}>
                  <Globe size={22} color="#8E95A5" />
                </View>
                <Text style={[s.countryItemName, !selectedCountry && s.countryItemNameActive]}>
                  {language === 'ku' ? 'هەموو وڵاتەکان' : language === 'badini' ? 'تەڤایا وەڵاتان' : language === 'ar' ? 'جميع الدول' : 'All Countries'}
                </Text>
                {!selectedCountry && <CheckCircle2 size={20} color="#E53935" />}
              </TouchableOpacity>
            )}

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

            <View style={s.modalDivider} />

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
                        <Globe size={20} color="#8E95A5" />
                      )}
                    </View>
                    <Text style={[s.countryItemName, isSelected && s.countryItemNameActive]} numberOfLines={1}>
                      {getCountryName(item)}
                    </Text>
                    {isSelected && <CheckCircle2 size={20} color="#E53935" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

        {/* ── TOP HERO BANNER / AD SLIDER (قالبە گەورەکەی ڕیکلام) ───────── */}
        <View style={s.heroBannerWrapper}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveBannerIndex(idx);
            }}
          >
            {topBanners.map((banner: any, idx: number) => (
              <TouchableOpacity
                key={banner.id || idx}
                activeOpacity={0.92}
                style={{ width, height: 230 }}
                onPress={() => {
                  if (banner.link) {
                    Linking.openURL(banner.link).catch(() => {});
                  }
                }}
              >
                <Image
                  source={{ uri: banner.image }}
                  style={s.heroBannerImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(19, 21, 29, 0.35)', 'rgba(19, 21, 29, 0.95)']}
                  style={StyleSheet.absoluteFillObject}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pagination Dots (Matching screenshot) */}
          {topBanners.length > 1 && (
            <View style={s.heroPaginationDots}>
              {topBanners.map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.heroDot,
                    i === activeBannerIndex ? s.heroDotActive : s.heroDotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── CATEGORY PILLS ────────────────────────────────────────── */}
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.tabsScroll, isRTL && { flexDirection: 'row-reverse' }]}
          onContentSizeChange={() => scrollToRightEdgeRTL(categoryScrollRef)}
        >
          {tabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.tab, isActive ? s.tabActive : s.tabInactive]}
                onPress={() => setSelectedCategory(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[s.tabLabel, isActive ? s.tabLabelActive : s.tabLabelInactive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── SEARCH INPUT ───────────────────────────────────────────── */}
        {isSearchOpen && (
          <View style={s.searchBar}>
            <Search size={18} color="#8E95A5" />
            <TextInput
              style={s.searchInput}
              placeholder={language === 'ku' ? 'گەڕانی کەناڵ...' : language === 'badini' ? 'لێگەڕیانا کەناڵان...' : language === 'ar' ? 'البحث عن قناة...' : 'Search channels...'}
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#8E95A5" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* ── SEARCH RESULTS ─────────────────────────────────────────── */}
        {isSearchOpen && searchQuery.trim() ? (
          <View style={[s.gridContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            {searchResults.map((ch: any) => (
              <TouchableOpacity
                key={ch.id}
                style={[s.channelCard, { width: cardW, height: cardW }]}
                onPress={() => handlePress(ch)}
                activeOpacity={0.85}
              >
                {ch.image ? (
                  <Image source={{ uri: ch.image }} style={s.channelLogo} resizeMode="contain" />
                ) : (
                  <Text style={s.fallbackLetter} numberOfLines={1}>{ch.name[0]}</Text>
                )}
              </TouchableOpacity>
            ))}
            {searchResults.length === 0 && (
              <View style={s.emptyState}>
                <Text style={s.emptyText}>
                  {language === 'ku' ? 'هیچ کەناڵێک نەدۆزرایەوە' : language === 'badini' ? 'هیچ کەناڵەک نەهاتە دیتن' : language === 'ar' ? 'لا توجد قنوات' : 'No channels found'}
                </Text>
              </View>
            )}
          </View>
        ) : isUnlocked ? (
          <>
            {/* ── CATEGORY SECTIONS (EXACT 3x3 = 9 CHANNELS PER CATEGORY) ─── */}
            {categoriesToRender.map((cat: any) => {
              const catChannels = channelsByCategory[cat.name] || [];
              if (catChannels.length === 0) return null;
              const catBanners = interspersedBanners.filter((b: any) => b.placement_after === cat.name);
              const localizedCatName = getLocalized(cat, 'name', language) || translateCategoryName(cat.name, language);

              // Exactly 9 channels per list, matching user request and screenshot
              const displayedChannels = selectedCategory === 'All' ? catChannels.slice(0, 9) : catChannels;
              const hasMore = catChannels.length > 9;

              return (
                <React.Fragment key={cat.id || cat.name}>
                  <View style={s.section}>
                    {/* Header Row: Category Name + '+ View all' in red */}
                    <View style={[s.sectionHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
                      <Text style={s.sectionTitle} numberOfLines={1} ellipsizeMode="tail">{localizedCatName}</Text>
                      {hasMore && (
                        <TouchableOpacity 
                          onPress={() => handleViewAll(cat.name)} 
                          activeOpacity={0.7}
                          style={s.seeAllButton}
                        >
                          <Text style={s.seeAllRed} numberOfLines={1} ellipsizeMode="clip">
                            {language === 'ku' ? '+ زیاتر' : language === 'badini' ? '+ هەمیان' : language === 'ar' ? '+ الكل' : '+ View all'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* 3x3 Grid of 9 Cards (Matching Screenshot) */}
                    <View style={[s.gridContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                      {displayedChannels.map((ch: any) => (
                        <TouchableOpacity
                          key={ch.id}
                          style={[s.channelCard, { width: cardW, height: cardW }]}
                          onPress={() => handlePress(ch)}
                          activeOpacity={0.85}
                        >
                          {ch.image ? (
                            <Image source={{ uri: ch.image }} style={s.channelLogo} resizeMode="contain" />
                          ) : (
                            <Text style={s.fallbackLetter} numberOfLines={1}>{ch.name[0]}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Promotional Ad Banner between categories (Matching Screenshot) */}
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
            {selectedCountry && countryFiltered.length === 0 && (
              <View style={s.emptyState}>
                <Globe size={40} color="#64748B" />
                <Text style={s.emptyText}>
                  {language === 'ku' ? 'هیچ کەناڵێک نەدۆزرایەوە بۆ ئەم وڵاتە' : language === 'badini' ? 'هیچ کەناڵەک نەهاتە دیتن بۆ ڤی وەڵاتی' : language === 'ar' ? 'لا توجد قنوات لهذه الدولة' : 'No channels found for this country'}
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

// ─── STYLES (MATCHING USER SCREENSHOTS) ────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13151D' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Top App Bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: '#13151D',
  },
  headerSide: {
    flexShrink: 0,
    minWidth: 70,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    flex: 1,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#2F3344',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Country pill (≡ وڵات)
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#2F3344',
    height: 38,
  },
  countryPillActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.16)',
    borderColor: '#E53935',
  },
  countryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: 80,
  },
  countryFlag: {
    width: 20,
    height: 14,
    borderRadius: 3,
  },

  // Hero Banner Slider (قالبە گەورەکەی سەرەوە)
  heroBannerWrapper: {
    width: '100%',
    height: 230,
    position: 'relative',
    backgroundColor: '#13151D',
    marginBottom: 6,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroPaginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
  },
  heroDotActive: {
    width: 16,
    backgroundColor: '#E53935',
  },
  heroDotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  // Category Pills (Horizontal)
  tabsScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  tabInactive: {
    backgroundColor: '#1C1F2B',
    borderColor: '#2D3142',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    color: '#94A3B8',
  },

  // Search input
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1C1F2B',
    borderWidth: 1,
    borderColor: '#2F3344',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
  },

  // Category Sections
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    flex: 1,
  },
  seeAllButton: {
    flexShrink: 0,
    flexGrow: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingLeft: 4,
  },
  seeAllRed: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '700',
  },

  // 3-Column Grid Container
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },

  // Individual Channel Card (Exact match for the screenshot)
  channelCard: {
    borderRadius: 16,
    backgroundColor: '#1F222E',
    borderWidth: 1.5,
    borderColor: '#383B47',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  channelLogo: {
    width: '88%',
    height: '88%',
  },
  fallbackLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // Promotional Banner (Ad Banner between categories)
  bannerWrap: {
    width: '100%',
    marginVertical: 14,
    overflow: 'hidden',
    height: 76,
    backgroundColor: '#1F222E',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
    minHeight: '50%',
    paddingTop: 8,
    backgroundColor: '#181A24',
    borderColor: '#2F3344',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2F3344',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  modalSubtitle: { fontSize: 12, marginTop: 2, color: '#8E95A5' },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242837',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: { height: 1, backgroundColor: '#2F3344', marginVertical: 4 },
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
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#2F3344',
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: '#FFFFFF', paddingVertical: 0 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: '#1E212D',
    borderWidth: 1,
    borderColor: '#2F3344',
  },
  countryItemActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.16)',
    borderColor: '#E53935',
  },
  countryItemFlag: {
    width: 52,
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#242837',
  },
  flagImg: { width: '100%', height: '100%' },
  countryItemName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  countryItemNameActive: { color: '#E53935', fontWeight: '900' },

  // Empty & Locked
  emptyState: { width: '100%', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 14, fontWeight: '500', color: '#8E95A5', textAlign: 'center' },
  locked: { alignItems: 'center', marginTop: 80 },
  lockedText: { fontSize: 15, fontWeight: '600', color: '#8E95A5' },
});
