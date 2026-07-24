import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import { ChevronLeft, Play } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';

const translations: any = {
  ku: {
    all: 'گشتی',
    movie: 'فیلم',
    series: 'زنجیرە',
    animation: 'ئەنیمەیشن',
    korean: 'کۆری',
    hindi: 'هیندی',
    persian: 'فارسی'
  },
  en: {
    all: 'All',
    movie: 'Movie',
    series: 'Series',
    animation: 'Animation',
    korean: 'Korean',
    hindi: 'Hindi',
    persian: 'Persian'
  },
  ar: {
    all: 'الكل',
    movie: 'فيلم',
    series: 'مسلسل',
    animation: 'أنمي',
    korean: 'كوري',
    hindi: 'هندي',
    persian: 'فارسي'
  }
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (SPACING.md * 4)) / 3; 

export default function CategoryScreen({ route, navigation }: any) {
  const { title, data, type, listName } = route.params;
  const insets = useSafeAreaInsets();
  const { language } = useAppStore();
  const t = translations[language] || translations['ku'];

  const [activeTab, setActiveTab] = React.useState('All');

  // Determine which tabs to show based on listName
  let tabs: any[] = [];
  if (listName === 'نوێترین بەرهەمەکان 2026') {
    tabs = [
      { id: 'All', label: t.all },
      { id: 'Movie', label: t.movie },
      { id: 'Series', label: t.series },
      { id: 'Animation', label: t.animation },
    ];
  } else if (listName === 'فیلمی کوردی دۆبلاژ') {
    tabs = [
      { id: 'All', label: t.all },
      { id: 'Korean', label: t.korean },
      { id: 'Hindi', label: t.hindi },
      { id: 'Persian', label: t.persian },
    ];
  } else if (listName === 'کارتۆنی کوردی' || listName === 'کارتۆنی نوێ') {
    tabs = [
      { id: 'All', label: t.all },
      { id: 'Series', label: t.series },
      { id: 'Animation', label: t.animation },
    ];
  }

  // Filter data based on activeTab
  const filteredData = React.useMemo(() => {
    if (!tabs.length || activeTab === 'All') return data;
    
    return data.filter((item: any) => {
      if (activeTab === 'Movie') return item.type === 'Movie';
      if (activeTab === 'Series') return item.type === 'Series';
      if (activeTab === 'Animation') return item.type === 'Animation';
      
      if (activeTab === 'Korean') {
        return item.country?.toLowerCase().includes('korea') || item.country?.includes('کۆری');
      }
      if (activeTab === 'Hindi') {
        return item.country?.toLowerCase().includes('india') || item.country?.includes('هیندی');
      }
      if (activeTab === 'Persian') {
        return item.country?.toLowerCase().includes('iran') || item.country?.includes('فارسی') || item.country?.includes('ئێران');
      }
      
      return true;
    });
  }, [data, activeTab, tabs]);

  const renderItem = ({ item }: any) => {
    if (type === 'LiveTV') {
      return (
        <TouchableOpacity 
          style={styles.channelCard}
          onPress={() => navigation.navigate('Detail', { item: { ...item, type: 'LiveTV' } })}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.logo} resizeMode="contain" />
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    
    // Default Movie/Series rendering
    return (
      <TouchableOpacity 
        style={styles.movieCard}
        onPress={() => navigation.navigate('Detail', { item })}
      >
        <Image source={{ uri: item.image }} style={styles.poster} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>

      {tabs.length > 0 && (
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E24',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 15,
    backgroundColor: '#27272F',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: SPACING.md,
  },
  channelCard: {
    width: CARD_WIDTH,
    marginBottom: SPACING.md,
  },
  movieCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    marginBottom: SPACING.md,
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2A2A35',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '65%',
    height: '65%',
  },
  liveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53935',
  },
  liveText: {
    color: '#E0E0E0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A35',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#E53935',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  }
});
