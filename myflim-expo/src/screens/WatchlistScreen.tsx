import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import MovieCard from '../components/MovieCard';
import { Bookmark } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function WatchlistScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { watchlist } = useAppStore();

  const handlePress = (item: any) => {
    navigation.navigate('Detail', { item });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Watchlist</Text>
      </View>

      <FlatList
        data={watchlist}
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
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Bookmark size={40} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
            <Text style={styles.emptySubtitle}>Save movies and series to watch them later.</Text>
          </View>
        }
      />
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
    paddingVertical: SPACING.lg,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  }
});
