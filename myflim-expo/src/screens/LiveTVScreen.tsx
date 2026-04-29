import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { Search, ChevronDown, Check, X, ExternalLink } from 'lucide-react-native';
import { Linking } from 'react-native';
import { translations } from '../utils/translations';

const { width } = Dimensions.get('window');

export default function LiveTVScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { liveTv, channelCategories, banners, loading, fetchInitialData, language } = useAppStore();
  const t = translations[language];
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  const renderChannel = (item: any) => (
    <TouchableOpacity 
      key={item.id}
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

  const renderCategory = (category: any) => {
    // Filter channels by search query and category
    let channels = liveTv.filter(c => c.category === category.name);
    
    if (searchQuery.trim().length > 0) {
      channels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedCategory !== 'All' && category.name !== selectedCategory) return null;
    if (channels.length === 0) return null;

    const visibleChannels = searchQuery.trim().length > 0 ? channels : channels.slice(0, 6);

    return (
      <View key={category.id} style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          {channels.length > 6 && searchQuery.trim().length === 0 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Category', { 
                title: category.name, 
                data: channels,
                type: 'LiveTV'
              })}
            >
              <Text style={styles.viewAllText}>+ {t.viewAll}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.channelGrid}>
          {visibleChannels.map(renderChannel)}
        </View>
      </View>
    );
  };

  if (loading && liveTv.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Custom Header matching Web */}
      <View style={styles.header}>
        {!isSearchActive ? (
          <>
            <TouchableOpacity style={styles.headerLeft} onPress={() => setShowCategoryModal(true)}>
              <Text style={styles.categoryText}>{selectedCategory === 'All' ? t.category : selectedCategory}</Text>
              <ChevronDown size={16} color="white" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Text style={styles.logoTextBold}>MY </Text>
              <Text style={styles.logoTextLight}>Film</Text>
              <View style={styles.logoDot} />
            </View>
            
            <TouchableOpacity onPress={() => setIsSearchActive(true)}>
              <Search size={22} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.searchContainer}>
            <Search size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchChannels}
              placeholderTextColor="#888"
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => {
              setIsSearchActive(false);
              setSearchQuery('');
            }}>
              <X size={22} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Real Banners */}
        {banners.filter(b => b.type === 'top' || b.type === 'interspersed').map((banner) => (
          <TouchableOpacity 
            key={banner.id}
            style={styles.promoContainer}
            onPress={() => banner.link && Linking.openURL(banner.link)}
          >
            <Image 
              source={{ uri: banner.image }} 
              style={styles.promoImage} 
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}

        {channelCategories.map(renderCategory)}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.category}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
               <TouchableOpacity 
                 style={[styles.modalItem, selectedCategory === 'All' && styles.modalItemActive]}
                 onPress={() => {
                   setSelectedCategory('All');
                   setShowCategoryModal(false);
                 }}
               >
                 <Text style={[styles.modalItemText, selectedCategory === 'All' && styles.modalItemTextActive]}>{t.all}</Text>
                 {selectedCategory === 'All' && <Check size={18} color="black" />}
               </TouchableOpacity>

               {channelCategories.map(cat => (
                 <TouchableOpacity 
                   key={cat.id}
                   style={[styles.modalItem, selectedCategory === cat.name && styles.modalItemActive]}
                   onPress={() => {
                     setSelectedCategory(cat.name);
                     setShowCategoryModal(false);
                   }}
                 >
                   <Text style={[styles.modalItemText, selectedCategory === cat.name && styles.modalItemTextActive]}>{cat.name}</Text>
                   {selectedCategory === cat.name && <Check size={18} color="black" />}
                 </TouchableOpacity>
               ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E24', // Web dark background
  },
  center: {
    flex: 1,
    backgroundColor: '#1E1E24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 15,
    backgroundColor: '#27272F', // Header color
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    padding: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoTextBold: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  logoTextLight: {
    color: '#E0E0E0',
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
  scrollContent: {
    paddingBottom: 100,
  },
  promoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#111',
    marginBottom: SPACING.xl,
  },
  promoImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  viewAllButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  channelCard: {
    width: '31%',
    marginBottom: SPACING.md,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalList: {
    marginBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  modalItemActive: {
    backgroundColor: 'rgba(229,57,53,0.1)',
    borderRadius: 12,
  },
  modalItemText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: '#E53935',
  }
});
