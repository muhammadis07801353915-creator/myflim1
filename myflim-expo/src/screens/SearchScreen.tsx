import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, SIZES } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, X, SlidersHorizontal, Check } from 'lucide-react-native';
import { translations } from '../utils/translations';

const { width } = Dimensions.get('window');

export default function SearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { movies, series, anime, language } = useAppStore();
  const t = translations[language];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Use a Map to ensure unique IDs when combining sources
  const allContent = Array.from(
    new Map([...movies, ...series, ...anime].map(item => [item.id, item])).values()
  );
  const filterOptions = ['All', 'Movie', 'Series', 'Anime'];

  useEffect(() => {
    let filtered = allContent;
    
    // Apply search query
    if (query.trim().length > 0) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply type filter
    if (activeFilter !== 'All') {
      filtered = filtered.filter(item => item.type === activeFilter);
    }

    setResults(filtered);
  }, [query, activeFilter, movies, series]);

  const handlePress = (item: any) => {
    navigation.navigate('Detail', { item });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={COLORS.textMuted} />
          <TextInput
            placeholder={t.search}
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter !== 'All' && { backgroundColor: COLORS.primary }]} 
          onPress={() => setShowFilter(true)}
        >
          <SlidersHorizontal size={20} color={activeFilter !== 'All' ? 'black' : 'white'} />
        </TouchableOpacity>
      </View>

      {/* Results */}
      <FlatList
        data={query.length > 0 || activeFilter !== 'All' ? results : movies.slice(0, 12)}
        renderItem={({ item }) => (
          <MovieCard 
            item={item} 
            onPress={handlePress} 
            width={(width - SPACING.md * 3) / 2} 
            height={240}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {query.length > 0 || activeFilter !== 'All' ? `${t.results} (${results.length})` : t.trendingNow}
          </Text>
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noResults}</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.filterByType}</Text>
            <View style={styles.filterList}>
              {filterOptions.map(option => (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.filterItem, activeFilter === option && styles.filterItemActive]}
                  onPress={() => {
                    setActiveFilter(option);
                    setShowFilter(false);
                  }}
                >
                  <Text style={[styles.filterItemText, activeFilter === option && styles.filterItemTextActive]}>
                    {option === 'All' ? t.all : option === 'Movie' ? t.movies : option === 'Series' ? t.series : option}
                  </Text>
                  {activeFilter === option && <Check size={18} color="black" />}
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
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  listHeader: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#1A1A22',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterList: {
    gap: 12,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterItemActive: {
    backgroundColor: COLORS.primary,
  },
  filterItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterItemTextActive: {
    color: 'black',
  }
});
