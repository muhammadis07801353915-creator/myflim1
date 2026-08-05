import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { getLocalized } from '../utils/localization';
import {
  Search as SearchIcon,
  X,
  Mic,
  TrendingUp,
  Clock,
  Film,
  Tv2,
  Smile,
  Zap,
  Heart,
  Ghost,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_W = (width - 16 * 2 - 12) / 2;

// ── Genre definition ──────────────────────────────────────────────────────
const GENRES = [
  { id: 'Action',      label: 'ئەکشن',      labelEn: 'Action',      icon: Zap,    color: '#E53935' },
  { id: 'Drama',       label: 'دراما',       labelEn: 'Drama',       icon: Heart,  color: '#8E24AA' },
  { id: 'Comedy',      label: 'کۆمیدی',      labelEn: 'Comedy',      icon: Smile,  color: '#F4511E' },
  { id: 'Horror',      label: 'ترسناک',      labelEn: 'Horror',      icon: Ghost,  color: '#546E7A' },
  { id: 'Animation',   label: 'ئەنیمەیشن',   labelEn: 'Animation',   icon: Film,   color: '#0288D1' },
  { id: 'Documentary', label: 'دۆکیومێنتەری', labelEn: 'Documentary', icon: Tv2,    color: '#2E7D32' },
];

export default function SearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { movies, language, isUnlocked } = useAppStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Vikings', 'Interstellar', 'The Godfather',
  ]);

  const inputRef = useRef<TextInput>(null);
  const isSearching = query.trim().length > 0;

  // ── Trending (top-rated) ──────────────────────────────────────────────────
  const trending = [...movies]
    .filter((m) => m.rating)
    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
    .slice(0, 5);

  // ── Search logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUnlocked || !isSearching) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(
      movies.filter((m) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.title_ar || '').toLowerCase().includes(q) ||
        (m.title_ku || '').toLowerCase().includes(q) ||
        (m.title_en || '').toLowerCase().includes(q)
      )
    );
  }, [query, movies, isUnlocked]);

  const addRecent = (term: string) => {
    setRecentSearches((prev) => [term, ...prev.filter((r) => r !== term)].slice(0, 6));
  };

  const handleSubmit = () => {
    if (query.trim()) addRecent(query.trim());
  };

  const handleSelect = (item: any) => {
    addRecent(getLocalized(item, 'title', language) || item.title);
    navigation.navigate('Detail', { item });
  };

  const handleGenre = (genre: { id: string; label: string; labelEn: string }) => {
    navigation.navigate('Category', {
      title: language === 'ku' ? genre.label : genre.labelEn,
      data: movies.filter((m) =>
        m.genre?.includes(genre.id) || m.type === genre.id
      ),
      type: 'Movie',
    });
  };

  // ── RESULT CARD ───────────────────────────────────────────────────────────
  const renderResult = ({ item }: any) => (
    <TouchableOpacity style={rc.wrap} onPress={() => handleSelect(item)} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={rc.poster} />
      <Text numberOfLines={1} style={rc.title}>
        {getLocalized(item, 'title', language)}
      </Text>
      {item.year ? <Text style={rc.year}>{item.year}</Text> : null}
    </TouchableOpacity>
  );

  // ── TRENDING ROW ──────────────────────────────────────────────────────────
  const renderTrendRow = (item: any, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={tr.row}
      onPress={() => handleSelect(item)}
      activeOpacity={0.85}
    >
      <Text style={tr.num}>{index + 1}</Text>
      <Image source={{ uri: item.image }} style={tr.thumb} />
      <View style={tr.info}>
        <Text numberOfLines={1} style={tr.name}>
          {getLocalized(item, 'title', language)}
        </Text>
        <Text style={tr.meta}>
          {item.type} · {item.year}
        </Text>
      </View>
      <TrendingUp size={16} color="#CC222F" />
    </TouchableOpacity>
  );

  // ── DISCOVERY PAGE (no query) ─────────────────────────────────────────────
  const DiscoveryPage = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

      {/* Recent Searches */}
      {recentSearches.length > 0 ? (
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>
              {language === 'ku' ? 'گەرانە نوێیەکان' : language === 'ar' ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
            </Text>
            <TouchableOpacity onPress={() => setRecentSearches([])}>
              <Text style={s.clearText}>
                {language === 'ku' ? 'پاک بکەوە' : language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={s.chips}>
            {recentSearches.map((r) => (
              <TouchableOpacity
                key={r}
                style={s.chip}
                onPress={() => { setQuery(r); inputRef.current?.focus(); }}
                activeOpacity={0.8}
              >
                <Clock size={12} color="rgba(255,255,255,0.5)" />
                <Text style={s.chipText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* Popular Genres */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          {language === 'ku' ? 'جۆرەکان' : language === 'ar' ? 'الأنواع الشائعة' : 'Popular Genres'}
        </Text>
        <View style={s.genreGrid}>
          {GENRES.map((g) => {
            const Icon = g.icon;
            return (
              <TouchableOpacity
                key={g.id}
                style={[s.genreCard, { backgroundColor: g.color + '22', borderColor: g.color + '44' }]}
                onPress={() => handleGenre(g)}
                activeOpacity={0.8}
              >
                <View style={[s.genreIconWrap, { backgroundColor: g.color + '33' }]}>
                  <Icon size={22} color={g.color} />
                </View>
                <Text style={s.genreLabel}>
                  {language === 'ku' ? g.label : g.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Trending Searches */}
      {isUnlocked && trending.length > 0 ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {language === 'ku' ? 'ناودارەکان' : language === 'ar' ? 'الأكثر بحثاً' : 'Trending Searches'}
          </Text>
          {trending.map((item, i) => renderTrendRow(item, i))}
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Search Bar ── */}
      <View style={s.barWrap}>
        <View style={s.bar}>
          <SearchIcon size={18} color="rgba(255,255,255,0.45)" />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder={language === 'ku' ? 'گەران بۆ فیلم، زنجیرە...' : language === 'ar' ? 'ابحث عن أفلام...' : 'Search for movies, series...'}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            editable={isUnlocked}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ) : (
            <Mic size={18} color="rgba(255,255,255,0.45)" />
          )}
        </View>
        {isSearching ? (
          <TouchableOpacity onPress={() => setQuery('')} style={s.cancelBtn}>
            <Text style={s.cancelText}>
              {language === 'ku' ? 'داخستن' : language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Content ── */}
      {isSearching ? (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
          ListHeaderComponent={
            <Text style={[s.sectionTitle, { margin: 16, marginBottom: 8 }]}>
              {results.length} {language === 'ku' ? 'ئەنجام' : language === 'ar' ? 'نتيجة' : 'results'}
            </Text>
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <SearchIcon size={48} color="rgba(255,255,255,0.1)" />
              <Text style={{ color: 'rgba(255,255,255,0.35)', marginTop: 16, fontSize: 15 }}>
                {language === 'ku' ? 'ئەنجامێک نەدۆزرایەوە' : 'No results found'}
              </Text>
            </View>
          }
        />
      ) : (
        <DiscoveryPage />
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F13' },

  // Search bar
  barWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  bar: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  cancelBtn: { paddingVertical: 6 },
  cancelText: { color: '#CC222F', fontSize: 14, fontWeight: '700' },

  // Sections
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 12, letterSpacing: -0.2 },
  clearText: { color: '#CC222F', fontSize: 13, fontWeight: '600' },

  // Recent chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },

  // Genre grid
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreCard: {
    width: (width - 16 * 2 - 10 * 2) / 3,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  genreIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreLabel: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});

// Trending row styles
const tr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  num: { color: 'rgba(255,255,255,0.25)', fontSize: 16, fontWeight: '900', width: 20, textAlign: 'center' },
  thumb: { width: 46, height: 64, borderRadius: 8, backgroundColor: '#1c1c24' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  meta: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500' },
});

// Result card styles
const rc = StyleSheet.create({
  wrap: { width: CARD_W },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: '#1c1c24',
    marginBottom: 6,
  },
  title: { color: '#fff', fontSize: 13, fontWeight: '700' },
  year: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500', marginTop: 2 },
});
