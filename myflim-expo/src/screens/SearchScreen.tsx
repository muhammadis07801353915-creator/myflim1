import React, { useState, useEffect } from 'react';
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
import { COLORS, SPACING, SIZES } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, X, SlidersHorizontal, Check, ArrowUpDown } from 'lucide-react-native';
import { translations } from '../utils/translations';

const { width } = Dimensions.get('window');

export default function SearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { movies, series, anime, liveTv, language, isUnlocked } = useAppStore();
  const t = translations[language];
  const isRTL = language === 'ku' || language === 'ar';

  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'popular'>('newest');
  const [results, setResults] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const typeOptions = [
    { id: 'All', label: language === 'ku' ? 'هەمووی' : language === 'ar' ? 'الكل' : 'All' },
    { id: 'Movie', label: language === 'ku' ? 'فیلمەکان' : language === 'ar' ? 'أفلام' : 'Movies' },
    { id: 'Series', label: language === 'ku' ? 'زنجیرەکان' : language === 'ar' ? 'مسلسلات' : 'Series' },
    { id: 'Anime', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'ar' ? 'أنيمي' : 'Anime' },
    { id: 'LiveTV', label: language === 'ku' ? 'ڕاستەوخۆ' : language === 'ar' ? 'بث مباشر' : 'Live TV' },
  ];

  const genresList = [
    { id: 'All', label: language === 'ku' ? 'هەموو جۆرەکان' : language === 'ar' ? 'جميع الأنواع' : 'All Genres' },
    { id: 'Action', label: language === 'ku' ? 'ئەکشن' : language === 'ar' ? 'أكشن' : 'Action' },
    { id: 'Comedy', label: language === 'ku' ? 'کۆمیدی' : language === 'ar' ? 'كوميدي' : 'Comedy' },
    { id: 'Drama', label: language === 'ku' ? 'دراما' : language === 'ar' ? 'دراما' : 'Drama' },
    { id: 'Horror', label: language === 'ku' ? 'ترسناک' : language === 'ar' ? 'رعب' : 'Horror' },
    { id: 'Romance', label: language === 'ku' ? 'رۆمانسی' : language === 'ar' ? 'رومانسي' : 'Romance' },
    { id: 'Sci-Fi', label: language === 'ku' ? 'زانستی' : language === 'ar' ? 'خيال علمي' : 'Sci-Fi' },
    { id: 'Crime', label: language === 'ku' ? 'تاوان کاری' : language === 'ar' ? 'جريمة' : 'Crime' },
    { id: 'Animation', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'ar' ? 'رسوم متحركة' : 'Animation' },
    { id: 'زنجیرەی کوردی دۆبلاژ', label: language === 'ku' ? 'کوردی دۆبلاژ' : language === 'ar' ? 'مدبلج كودي' : 'Kurdish Dubbed' },
  ];

  useEffect(() => {
    if (!isUnlocked) {
      setResults([]);
      return;
    }

    let pool: any[] = [];
    if (activeType === 'All') {
      pool = [
        ...movies, 
        ...series, 
        ...anime, 
        ...(liveTv || []).map(c => ({ ...c, type: 'LiveTV', title: c.name, rating: '8.5' }))
      ];
    } else if (activeType === 'Movie') {
      pool = movies.filter(m => m.type === 'Movie');
    } else if (activeType === 'Series') {
      pool = series.filter(s => s.type === 'Series');
    } else if (activeType === 'Anime') {
      pool = anime;
    } else if (activeType === 'LiveTV') {
      pool = (liveTv || []).map(c => ({ ...c, type: 'LiveTV', title: c.name, rating: '8.5' }));
    }

    // Deduplicate by ID
    let filtered = Array.from(new Map(pool.map(item => [item.id, item])).values());

    // 1. Multi-field text search
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

    // 2. Genre filter
    if (activeGenre !== 'All') {
      filtered = filtered.filter(item => {
        const genreStr = (item.genre || item.category || item.list_name || '').toLowerCase();
        return genreStr.includes(activeGenre.toLowerCase());
      });
    }

    // 3. Sorting
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
  }, [query, activeType, activeGenre, sortBy, movies, series, anime, liveTv, isUnlocked]);

  const handlePress = (item: any) => {
    navigation.navigate('Detail', { item });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* ── SEARCH HEADER BAR ─────────────────────────────────────── */}
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.searchBar, isRTL && { flexDirection: 'row-reverse' }]}>
          <SearchIcon size={20} color={COLORS.textMuted} />
          <TextInput
            placeholder={t.search || 'گەڕان...'}
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, isRTL && { textAlign: 'right' }]}
            value={query}
            onChangeText={setQuery}
            editable={isUnlocked}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.filterButton, (activeType !== 'All' || activeGenre !== 'All' || sortBy !== 'newest') && { backgroundColor: COLORS.primary }]} 
          onPress={() => isUnlocked && setShowFilterModal(true)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={20} color={(activeType !== 'All' || activeGenre !== 'All' || sortBy !== 'newest') ? 'black' : 'white'} />
        </TouchableOpacity>
      </View>

      {/* ── TYPE FILTER PILLS ─────── */}
      <View style={{ marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillsScroll, isRTL && { flexDirection: 'row-reverse' }]}>
          {(isRTL ? [...typeOptions].reverse() : typeOptions).map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typePill, activeType === type.id && styles.typePillActive]}
              onPress={() => setActiveType(type.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typePillText, activeType === type.id && styles.typePillTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── GENRE FILTER PILLS ────────────────────────────────────── */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillsScroll, isRTL && { flexDirection: 'row-reverse' }]}>
          {(isRTL ? [...genresList].reverse() : genresList).map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.genrePill, activeGenre === g.id && styles.genrePillActive]}
              onPress={() => setActiveGenre(g.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.genrePillText, activeGenre === g.id && styles.genrePillTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── RESULTS GRID ──────────────────────────────────────────── */}
      <FlatList
        data={isUnlocked ? (query.length > 0 || activeType !== 'All' || activeGenre !== 'All' ? results : movies.slice(0, 16)) : []}
        renderItem={({ item }) => (
          <MovieCard 
            item={item} 
            onPress={handlePress} 
            width={(width - SPACING.md * 3) / 2} 
            height={240}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        ListHeaderComponent={
          isUnlocked ? (
            <View style={[styles.listHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.listHeader}>
                {query.length > 0 || activeType !== 'All' || activeGenre !== 'All'
                  ? `${t.results || 'ئەنجامەکان'} (${results.length})` 
                  : (language === 'ku' ? 'ناو بەرز و دیارەکان' : language === 'ar' ? 'الرائج الآن' : 'Trending Now')}
              </Text>
              
              <TouchableOpacity 
                style={styles.sortBtn} 
                onPress={() => setSortBy(prev => prev === 'newest' ? 'rating' : prev === 'rating' ? 'popular' : 'newest')}
              >
                <ArrowUpDown size={14} color="#CC222F" />
                <Text style={styles.sortBtnText}>
                  {sortBy === 'newest' 
                    ? (language === 'ku' ? 'نوێترین' : language === 'ar' ? 'الأحدث' : 'Newest')
                    : sortBy === 'rating'
                    ? (language === 'ku' ? 'هەڵسەنگاندن' : language === 'ar' ? 'الأعلى تقييماً' : 'Rating')
                    : (language === 'ku' ? 'ناودارتر' : language === 'ar' ? 'الأكثر شعبية' : 'Popular')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={[styles.columnWrapper, isRTL && { flexDirection: 'row-reverse' }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isUnlocked 
                ? (language === 'ku' ? 'هیچ ئەنجامێک نەدۆزرایەوە' : language === 'ar' ? 'لم يتم العثور على نتائج' : t.noResults)
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
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.filterByType || 'پاڵاوتنی خێرا'}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.filterGroupTitle, isRTL && { textAlign: 'right' }]}>
              {language === 'ku' ? 'ڕێکخستن بەپێی:' : language === 'ar' ? 'الترتيب حسب:' : 'Sort By:'}
            </Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'newest', label: language === 'ku' ? 'نوێترین' : 'Newest' },
                { id: 'rating', label: language === 'ku' ? 'بەرزترین پلە' : 'Top Rated' },
                { id: 'popular', label: language === 'ku' ? 'ناودارترین' : 'Popular' },
              ].map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sortChip, sortBy === s.id && styles.sortChipActive]}
                  onPress={() => setSortBy(s.id as any)}
                >
                  <Text style={[styles.sortChipText, sortBy === s.id && { color: '#000', fontWeight: 'bold' }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterGroupTitle, isRTL && { textAlign: 'right' }]}>
              {language === 'ku' ? 'جۆری ناوەرۆک:' : language === 'ar' ? 'نوع المحتوى:' : 'Content Type:'}
            </Text>
            <View style={styles.filterList}>
              {typeOptions.map(option => (
                <TouchableOpacity 
                  key={option.id} 
                  style={[styles.filterItem, activeType === option.id && styles.filterItemActive, isRTL && { flexDirection: 'row-reverse' }]}
                  onPress={() => {
                    setActiveType(option.id);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[styles.filterItemText, activeType === option.id && styles.filterItemTextActive]}>
                    {option.label}
                  </Text>
                  {activeType === option.id && <Check size={18} color="black" />}
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
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 15,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typePillActive: {
    backgroundColor: '#CC222F',
    borderColor: '#CC222F',
  },
  typePillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: 'bold',
  },
  typePillTextActive: {
    color: '#fff',
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  genrePillActive: {
    backgroundColor: 'rgba(204, 34, 47, 0.2)',
    borderColor: 'rgba(204, 34, 47, 0.5)',
  },
  genrePillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  genrePillTextActive: {
    color: '#CC222F',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  listHeader: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sortBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#181820',
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
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterGroupTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sortChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    color: 'white',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterItemActive: {
    backgroundColor: COLORS.primary,
  },
  filterItemText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  filterItemTextActive: {
    color: 'black',
    fontWeight: 'bold',
  }
});
