import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  Image, 
  Dimensions, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import MovieCard from '../components/MovieCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import { translations } from '../utils/translations';
import { getLocalized } from '../utils/localization';
import FloatingSocialButton from '../components/FloatingSocialButton';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { 
    movies, 
    series, 
    anime, 
    categories, 
    loading, 
    error,
    fetchInitialData,
    language,
    isUnlocked
  } = useAppStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const t = translations[language];

  // Data is fetched once in App.tsx on mount. 
  // Manual refresh is available via pull-to-refresh.

  const featured = isUnlocked ? movies.filter(m => m.is_featured) : [];
  const topContents = isUnlocked ? movies.filter(m => m.top_rank).sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99)) : [];
  const animeItems = isUnlocked ? movies.filter(a => 
    a.genre?.includes('Anime') || a.genre?.includes('Animation') || a.type === 'Anime'
  ) : [];

  const onRefresh = () => {
    fetchInitialData();
  };

  const handlePress = (item: any) => {
    navigation.navigate('Detail', { item });
  };

  const handlePressSeeAll = (title: string, data: any[], listName?: string) => {
    navigation.navigate('Category', { title, data, type: 'Movie', listName });
  };

  const renderSection = (title: string, data: any[], fullData?: any[], listName?: string) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={() => handlePressSeeAll(title, fullData || data, listName)}>
          <Text style={styles.seeAll}>{t.all}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <MovieCard item={item} onPress={handlePress} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );

  const renderFeaturedItem = ({ item }: any) => {
    return (
      <TouchableOpacity 
        style={styles.featuredCard}
        onPress={() => handlePress(item)}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: item.image }} 
          style={styles.featuredImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.4)', 'rgba(10,10,10,0.95)']}
          style={styles.featuredGradient}
        />
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle}>{getLocalized(item, 'title', language)}</Text>
          <Text style={styles.featuredYear}>{item.year}</Text>
          
          <View style={styles.featuredBottomRow}>
            {/* App Logo */}
            <View style={styles.logoMimicContainer}>
              <Image 
                source={require('../../assets/app-logo-new.png')} 
                style={{ width: 28, height: 28, borderRadius: 7, marginRight: 8 }} 
                resizeMode="contain" 
              />
              <Text style={styles.logoTextBold}>Taban Play</Text>
            </View>
            
            {item.genre ? (
               <View style={styles.genreBadge}>
                 <Text style={styles.genreText}>{item.genre.split(',')[0]}</Text>
               </View>
            ) : null}
          </View>
        </View>

      </TouchableOpacity>
    );
  };

  const renderTopContentItem = ({ item, index }: any) => {
    return (
      <TouchableOpacity 
        style={styles.topContentCard}
        onPress={() => handlePress(item)}
      >
        <View style={styles.topContentImageContainer}>
          <Image source={{ uri: item.image }} style={styles.topContentImage} />
          
          <View style={styles.movieBadge}>
             <Text style={styles.movieBadgeText}>{item.type === 'Series' ? t.series : t.movies}</Text>
          </View>
          
          <View style={styles.topNumberContainer}>
             <Text style={styles.topNumberText}>{index + 1}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.topContentTitle}>{getLocalized(item, 'title', language)}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && movies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
      {/* Featured Header / Billboard */}
      {featured.length > 0 ? (
        <View style={[styles.billboardContainer, { paddingTop: insets.top + 10 }]}>
          <FlatList
             data={featured}
             horizontal
             pagingEnabled
             showsHorizontalScrollIndicator={false}
             snapToInterval={width * 0.9 + SPACING.md}
             decelerationRate="fast"
             onScroll={(e) => {
               const x = e.nativeEvent.contentOffset.x;
               const itemWidth = width * 0.9 + SPACING.md;
               setActiveIndex(Math.round(x / itemWidth));
             }}
             renderItem={renderFeaturedItem}
             keyExtractor={i => i.id.toString()}
             contentContainerStyle={{ paddingHorizontal: width * 0.05 }}
          />
          
          <View style={styles.paginationDots}>
             {featured.map((_, i) => (
               <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
             ))}
          </View>
        </View>
      ) : null}

      {/* Top Contents */}
      {topContents.length > 0 ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.popular || 'Top Contents'}</Text>
            <TouchableOpacity onPress={() => handlePressSeeAll(t.popular || 'Top Contents', topContents, 'Top Contents')}>
              <Text style={styles.seeAll}>{t.viewAll || 'All'}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={topContents}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderTopContentItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      ) : null}

      <View style={{ marginTop: topContents.length > 0 ? 0 : 20 }}>
        {animeItems.length > 0 ? renderSection(
          language === 'ku' ? 'ئەنیمەیشنەکان' : language === 'ar' ? 'أنيمي' : 'Animation',
          animeItems.slice(0, 15),
          animeItems,
          'Animation'
        ) : null}

        {/* Dynamic Categories From Database */}
        {categories.map(cat => {
           if (!isUnlocked && cat.name !== "زنجیرەی کوردی دۆبلاژ") return null;
           const catMovies = movies.filter(m => m.list_name === cat.name);
           if (catMovies.length === 0) return null;
           const catTitle = String(getLocalized(cat, 'name', language) || cat.name || '');
           if (!catTitle) return null;
           return (
             <View key={cat.id}>
               {renderSection(catTitle, catMovies.slice(0, 20), catMovies, cat.name)}
             </View>
           );
        })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <FloatingSocialButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F13', // Website dark background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F13',
    justifyContent: 'center',
    alignItems: 'center',
  },
  billboardContainer: {
    width: width,
    marginBottom: SPACING.xl,
  },
  featuredCard: {
    width: width * 0.9,
    height: width * 0.9 * 1.2,
    marginRight: SPACING.md,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  featuredTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  featuredYear: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuredBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  logoMimicContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mIconContainer: {
    width: 24,
    height: 18,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    position: 'relative',
  },
  mText: {
    color: 'black',
    fontWeight: '900',
    fontSize: 14,
    marginTop: -2,
  },
  mDot: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 4,
    height: 4,
    backgroundColor: 'red',
    borderRadius: 2,
  },
  mTriangle: {
    position: 'absolute',
    right: -4,
    top: 4,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderTopColor: 'transparent',
    borderLeftWidth: 5,
    borderLeftColor: 'red',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  logoTextBold: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  logoTextLight: {
    color: 'white',
    fontSize: 20,
    fontWeight: '300',
  },
  logoDot: {
    width: 6,
    height: 6,
    backgroundColor: '#E53935',
    borderRadius: 3,
    position: 'absolute',
    top: -2,
    right: -8,
  },
  genreBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  genreText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  kurdishOverlay: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    opacity: 0.5,
  },
  kurdishText: {
    color: 'white',
    fontSize: 10,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: width * 0.05,
    marginTop: 15,
    gap: 6,
  },
  dot: {
    width: 15,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  activeDot: {
    width: 30,
    backgroundColor: '#3b82f6',
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.lg,
  },
  topContentCard: {
    width: 160,
    marginRight: SPACING.md,
  },
  topContentImageContainer: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  topContentImage: {
    width: '100%',
    height: '100%',
  },
  movieBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E53935',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  movieBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  topNumberContainer: {
    position: 'absolute',
    bottom: -35,
    right: -10,
  },
  topNumberText: {
    color: 'white',
    fontSize: 140,
    fontWeight: '700',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 10,
  },
  topContentTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  }
});
