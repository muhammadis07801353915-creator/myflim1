import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, getColors } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, X, SlidersHorizontal, Check, ArrowUpDown } from 'lucide-react-native';
import { translations } from '../utils/translations';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2; // Symmetrical 16px outer padding + 12px center gap

export default function SearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { movies, series, anime, liveTv, language, isUnlocked, theme } = useAppStore();
  const themeColors = getColors(theme);
  const t = translations[language];
  const isRTL = language === 'ku' || language === 'ar';

  const typeScrollRef = useRef<ScrollView>(null);
  const genreScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeYear, setActiveYear] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'popular'>('newest');
  const [results, setResults] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const typeOptions = [
    { id: 'All', label: language === 'ku' ? 'هەمووی' : language === 'badini' ? 'هەمی' : language === 'ar' ? 'الكل' : 'All' },
    { id: 'Movie', label: language === 'ku' ? 'فیلمەکان' : language === 'badini' ? 'فیلم' : language === 'ar' ? 'أفلام' : 'Movies' },
    { id: 'Series', label: language === 'ku' ? 'زنجیرەکان' : language === 'badini' ? 'زنجیرە' : language === 'ar' ? 'مسلسلات' : 'Series' },
    { id: 'Anime', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'badini' ? 'ئەنیمەیشن' : language === 'ar' ? 'أنيمي' : 'Anime' },
    { id: 'LiveTV', label: language === 'ku' ? 'ڕاستەوخۆ' : language === 'badini' ? 'ڕاستەوخۆ' : language === 'ar' ? 'بث مباشر' : 'Live TV' },
  ];

  const genresList = [
    { id: 'All', label: language === 'ku' ? 'هەموو جۆرەکان' : language === 'badini' ? 'تەڤایا جۆران' : language === 'ar' ? 'جميع الأنواع' : 'All Genres' },
    { id: 'Action', label: language === 'ku' ? 'ئەکشن' : language === 'badini' ? 'ئەکشن' : language === 'ar' ? 'أكشن' : 'Action' },
    { id: 'Comedy', label: language === 'ku' ? 'کۆمیدی' : language === 'badini' ? 'کۆمیدی' : language === 'ar' ? 'كوميدي' : 'Comedy' },
    { id: 'Drama', label: language === 'ku' ? 'دراما' : language === 'badini' ? 'دراما' : language === 'ar' ? 'دراما' : 'Drama' },
    { id: 'Horror', label: language === 'ku' ? 'ترسناک' : language === 'badini' ? 'ترسناک' : language === 'ar' ? 'رعب' : 'Horror' },
    { id: 'Romance', label: language === 'ku' ? 'رۆمانسی' : language === 'badini' ? 'رۆمانسی' : language === 'ar' ? 'رومانسي' : 'Romance' },
    { id: 'Sci-Fi', label: language === 'ku' ? 'زانستی' : language === 'badini' ? 'زانستی' : language === 'ar' ? 'خيال علمي' : 'Sci-Fi' },
    { id: 'Crime', label: language === 'ku' ? 'تاوان کاری' : language === 'badini' ? 'تاوان کاری' : language === 'ar' ? 'جريمة' : 'Crime' },
    { id: 'Animation', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'badini' ? 'ئەنیمەیشن' : language === 'ar' ? 'رسوم متحركة' : 'Animation' },
    { id: 'زنجیرەی کوردی دۆبلاژ', label: language === 'ku' ? 'کوردی دۆبلاژ' : language === 'badini' ? 'دۆبلاژکری یێن کوردی' : language === 'ar' ? 'مدبلج كوردي' : 'Kurdish Dubbed' },
  ];

  const yearsList = [
    { id: 'All', label: language === 'ku' ? 'هەموو ساڵەکان' : language === 'badini' ? 'تەڤایا ساڵان' : language === 'ar' ? 'جميع السنوات' : 'All Years' },
    { id: '2026', label: '2026' },
    { id: '2025', label: '2025' },
    { id: '2024', label: '2024' },
    { id: '2023', label: '2023' },
    { id: '2022', label: '2022' },
    { id: '2021', label: '2021' },
    { id: '2020', label: '2020' },
    { id: '2019', label: '2019' },
    { id: '2018', label: '2018' },
    { id: '2015', label: '2015' },
    { id: '2010', label: '2010' },
    { id: '2000s', label: language === 'ku' ? 'ساڵانی 2000' : language === 'badini' ? 'ساڵێن 2000' : language === 'ar' ? 'عقد 2000' : '2000s' },
    { id: '1990s', label: language === 'ku' ? 'ساڵانی 1990' : language === 'badini' ? 'ساڵێن 1990' : language === 'ar' ? 'عقد 1990' : '1990s' },
  ];

  const scrollToRightEdgeRTL = (ref: React.RefObject<ScrollView | null>) => {
    if (isRTL) {
      setTimeout(() => {
        ref.current?.scrollToEnd({ animated: false });
      }, 30);
    }
  };

  const isAnimeItem = (m: any) => {
    return (
      m.type === 'Anime' ||
      (m.genre && /animation|anime|cartoon|کارتۆن|ئەنیمەیشن/i.test(m.genre)) ||
      (m.list_name && /کارتۆن|ئەنیمەیشن|ئەنیمی|anime|cartoon/i.test(m.list_name)) ||
      (m.category && /کارتۆن|ئەنیمەیشن|anime|cartoon/i.test(m.category))
    );
  };

  const matchesGenreOrList = (m: any, genreId: string) => {
    if (genreId === 'All') return true;
    const genreStr = (m.genre || '').toLowerCase();
    const listStr = (m.list_name || '').toLowerCase();
    const catStr = (m.category || '').toLowerCase();
    const titleStr = (m.title || m.name || '').toLowerCase();

    if (genreId === 'زنجیرەی کوردی دۆبلاژ' || genreId === 'کوردی دۆبلاژ') {
      return (
        listStr.includes('دۆبلاژ') || 
        genreStr.includes('دۆبلاژ') || 
        genreStr.includes('کوردی') || 
        titleStr.includes('دۆبلاژ')
      );
    }

    if (genreId === 'Action') return /action|ئەکشن/i.test(genreStr);
    if (genreId === 'Comedy') return /comedy|کۆمیدی/i.test(genreStr);
    if (genreId === 'Drama') return /drama|دراما/i.test(genreStr);
    if (genreId === 'Horror') return /horror|ترسناک/i.test(genreStr);
    if (genreId === 'Romance') return /romance|رۆمانسی/i.test(genreStr);
    if (genreId === 'Sci-Fi') return /science|sci-fi|زانستی/i.test(genreStr);
    if (genreId === 'Crime') return /crime|تاوان/i.test(genreStr);
    if (genreId === 'Animation') return isAnimeItem(m);

    return (
      genreStr.includes(genreId.toLowerCase()) || 
      listStr.includes(genreId.toLowerCase()) || 
      catStr.includes(genreId.toLowerCase())
    );
  };

  useEffect(() => {
    if (!isUnlocked) {
      setResults([]);
      return;
    }

    let pool: any[] = [];
    if (activeType === 'All') {
      pool = [
        ...movies, 
        ...(liveTv || []).map(c => ({ ...c, type: 'LiveTV', title: c.name, rating: '8.5' }))
      ];
    } else if (activeType === 'Movie') {
      pool = movies.filter(m => m.type === 'Movie' || !m.type);
    } else if (activeType === 'Series') {
      pool = movies.filter(s => s.type === 'Series' || s.list_name?.includes('زنجیرە'));
    } else if (activeType === 'Anime') {
      pool = movies.filter(isAnimeItem);
    } else if (activeType === 'LiveTV') {
      pool = (liveTv || []).map(c => ({ ...c, type: 'LiveTV', title: c.name, rating: '8.5' }));
    }

    let filtered = Array.from(new Map(pool.map(item => [item.id, item])).values());

    if (query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        const titleKu = (item.title_ku || item.name_ku || '').toLowerCase();
        const titleAr = (item.title_ar || item.name_ar || '').toLowerCase();
        const titleEn = (item.title_en || item.name_en || '').toLowerCase();
        const genre = (item.genre || item.category || '').toLowerCase();
        const year = String(item.year || '');
        const desc = (item.description || '').toLowerCase();

        return title.includes(q) || titleKu.includes(q) || titleAr.includes(q) || 
               titleEn.includes(q) || genre.includes(q) || year.includes(q) || desc.includes(q);
      });
    }

    if (activeGenre !== 'All') {
      filtered = filtered.filter(item => matchesGenreOrList(item, activeGenre));
    }

    if (activeYear !== 'All') {
      filtered = filtered.filter(item => {
        const itemYear = Number(item.year);
        if (!itemYear) return false;
        if (activeYear === '2000s') return itemYear >= 2000 && itemYear < 2010;
        if (activeYear === '1990s') return itemYear >= 1990 && itemYear < 2000;
        return String(item.year) === activeYear;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      if (sortBy === 'popular') {
        return (Number(b.views) || 0) - (Number(a.views) || 0);
      }
      return (Number(b.year || b.id) || 0) - (Number(a.year || a.id) || 0);
    });

    setResults(filtered);
  }, [query, activeType, activeGenre, activeYear, sortBy, movies, series, anime, liveTv, isUnlocked]);

  const handlePress = (item: any) => {
    navigation.navigate('Detail', { item });
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top + 10 }]}>
      
      {/* ── SEARCH HEADER BAR (RTL Dynamic) ───────────────────────── */}
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}>
          <SearchIcon size={20} color={themeColors.textSecondary} />
          <TextInput
            placeholder={t.search || 'گەڕان...'}
            placeholderTextColor={themeColors.textMuted}
            style={[styles.input, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}
            value={query}
            onChangeText={setQuery}
            editable={isUnlocked}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            (activeType !== 'All' || activeGenre !== 'All' || sortBy !== 'newest') && { backgroundColor: COLORS.primary }
          ]} 
          onPress={() => isUnlocked && setShowFilterModal(true)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={20} color={(activeType !== 'All' || activeGenre !== 'All' || sortBy !== 'newest') ? '#ffffff' : themeColors.text} />
        </TouchableOpacity>
      </View>

      {/* ── TYPE FILTER PILLS (RTL flipped to Right side) ─────── */}
      <View style={{ marginBottom: 6 }}>
        <ScrollView
          ref={typeScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillsScroll, isRTL && { flexDirection: 'row-reverse' }]}
          onContentSizeChange={() => scrollToRightEdgeRTL(typeScrollRef)}
        >
          {typeOptions.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typePill, 
                { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                activeType === type.id && styles.typePillActive
              ]}
              onPress={() => setActiveType(type.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typePillText, { color: themeColors.textSecondary }, activeType === type.id && styles.typePillTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── GENRE FILTER PILLS (RTL flipped to Right side) ────────────────── */}
      <View style={{ marginBottom: 6 }}>
        <ScrollView
          ref={genreScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillsScroll, isRTL && { flexDirection: 'row-reverse' }]}
          onContentSizeChange={() => scrollToRightEdgeRTL(genreScrollRef)}
        >
          {genresList.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.genrePill, 
                { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                activeGenre === g.id && styles.genrePillActive
              ]}
              onPress={() => setActiveGenre(g.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.genrePillText, { color: themeColors.textSecondary }, activeGenre === g.id && styles.genrePillTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── YEAR FILTER PILLS (RTL flipped to Right side) ─────────────────── */}
      <View style={{ marginBottom: 6 }}>
        <ScrollView
          ref={yearScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillsScroll, isRTL && { flexDirection: 'row-reverse' }]}
          onContentSizeChange={() => scrollToRightEdgeRTL(yearScrollRef)}
        >
          {yearsList.map((y) => (
            <TouchableOpacity
              key={y.id}
              style={[
                styles.genrePill, 
                { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                activeYear === y.id && styles.genrePillActive
              ]}
              onPress={() => setActiveYear(y.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.genrePillText, { color: themeColors.textSecondary }, activeYear === y.id && styles.genrePillTextActive]}>
                {y.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── RESULTS GRID (Perfect Symmetrical 2-Column Grid) ──────── */}
      <FlatList
        data={isUnlocked ? results : []}
        renderItem={({ item }) => (
          <MovieCard 
            item={item} 
            onPress={handlePress} 
            width={CARD_WIDTH} 
            height={240}
            style={{ marginRight: 0 }}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        ListHeaderComponent={
          isUnlocked ? (
            <View style={[styles.listHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.listHeader, { color: themeColors.text }]}>
                {query.length > 0 || activeType !== 'All' || activeGenre !== 'All'
                  ? `${language === 'ku' ? 'ئەنجامەکان' : language === 'badini' ? 'ئەنجام' : language === 'ar' ? 'النتائج' : 'Results'} (${results.length})` 
                  : (language === 'ku' ? 'تۆپ 250' : language === 'badini' ? 'تۆپ 250' : language === 'ar' ? 'الرائج الآن' : 'Trending Now')}
              </Text>
              
              <TouchableOpacity 
                style={[styles.sortBtn, { backgroundColor: themeColors.surfaceLight }]} 
                onPress={() => setSortBy(prev => prev === 'newest' ? 'rating' : prev === 'rating' ? 'popular' : 'newest')}
              >
                <ArrowUpDown size={14} color="#CC222F" />
                <Text style={[styles.sortBtnText, { color: themeColors.textSecondary }]}>
                  {sortBy === 'newest' 
                    ? (language === 'ku' ? 'نوێترین' : language === 'badini' ? 'نوی‌ترین' : language === 'ar' ? 'الأحدث' : 'Newest')
                    : sortBy === 'rating'
                    ? (language === 'ku' ? 'هەڵسەنگاندن' : language === 'badini' ? 'هەلسەنگاندن' : language === 'ar' ? 'الأعلى تقييماً' : 'Rating')
                    : (language === 'ku' ? 'ناودارتر' : language === 'badini' ? 'دیارترین' : language === 'ar' ? 'الأكثر شعبية' : 'Popular')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              {isUnlocked 
                ? (language === 'ku' ? 'هیچ ئەنجامێک نەدۆزرایەوە' : language === 'badini' ? 'هیچ ئەنجامەک نەهاتە دیتن' : language === 'ar' ? 'لم يتم العثور على نتائج' : t.noResults)
                : t.noResults}
            </Text>
          </View>
        }
      />

      {/* ── ADVANCED FILTER MODAL ─────────────────────────────────── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {language === 'ku' ? 'پاڵاوتنی خێرا' : language === 'badini' ? 'پاڵاوتنا خێرا' : language === 'ar' ? 'تصفية سريعة' : 'Quick Filter'}
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X color={themeColors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.filterGroupTitle, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}>
              {language === 'ku' ? 'ڕێکخستن بەپێی:' : language === 'badini' ? 'ڕێکخستن ل دویڤ:' : language === 'ar' ? 'الترتيب حسب:' : 'Sort By:'}
            </Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'newest', label: language === 'ku' ? 'نوێترین' : language === 'badini' ? 'نوی‌ترین' : language === 'ar' ? 'الأحدث' : 'Newest' },
                { id: 'rating', label: language === 'ku' ? 'بەرزترین پلە' : language === 'badini' ? 'بەرزترین هەلسەنگاندن' : language === 'ar' ? 'الأعلى تقييماً' : 'Top Rated' },
                { id: 'popular', label: language === 'ku' ? 'ناودارترین' : language === 'badini' ? 'دیارترین' : language === 'ar' ? 'الأكثر شعبية' : 'Popular' },
              ].map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sortChip, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }, sortBy === s.id && styles.sortChipActive]}
                  onPress={() => setSortBy(s.id as any)}
                >
                  <Text style={[styles.sortChipText, { color: themeColors.text }, sortBy === s.id && { color: '#ffffff', fontWeight: 'bold' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterGroupTitle, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}>
              {language === 'ku' ? 'جۆری ناوەرۆک:' : language === 'badini' ? 'جۆرێ ناوەڕۆکێ:' : language === 'ar' ? 'نوع المحتوى:' : 'Content Type:'}
            </Text>
            <View style={styles.filterList}>
              {typeOptions.map(option => (
                <TouchableOpacity 
                  key={option.id} 
                  style={[styles.filterItem, { backgroundColor: themeColors.surfaceLight }, activeType === option.id && styles.filterItemActive, isRTL && { flexDirection: 'row-reverse' }]}
                  onPress={() => {
                    setActiveType(option.id);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[styles.filterItemText, { color: themeColors.text }, activeType === option.id && styles.filterItemTextActive]}>
                    {option.label}
                  </Text>
                  {activeType === option.id && <Check size={18} color="#ffffff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pillsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    borderWidth: 1,
  },
  typePillActive: {
    backgroundColor: '#CC222F',
    borderColor: '#CC222F',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  genrePill: {
    paddingHorizontal: 15,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  genrePillActive: {
    backgroundColor: '#CC222F',
    borderColor: '#CC222F',
  },
  genrePillText: {
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  genrePillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 18,
  },
  listHeader: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sortChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: 13,
  },
  filterList: {
    gap: 10,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
  },
  filterItemActive: {
    backgroundColor: COLORS.primary,
  },
  filterItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterItemTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  }
});
