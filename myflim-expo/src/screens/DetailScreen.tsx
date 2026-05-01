import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Dimensions, 
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Play, Bookmark, Share2, Star, Clock, Calendar, Users, X, Server, Eye } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { useAppStore } from '../store/useAppStore';
import CommentSection from '../components/CommentSection';
import { getLocalized } from '../utils/localization';
import { translations } from '../utils/translations';

const { width, height } = Dimensions.get('window');

export default function DetailScreen({ route, navigation }: any) {
  const { item } = route.params;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const serversRef = useRef<View>(null);
  const { incrementViews, toggleWatchlist, watchlist, language } = useAppStore();
  const t = translations[language];
  
  const [isWatchlisted, setIsWatchlisted] = useState(
    watchlist.some(i => String(i.id) === String(item.id))
  );

  const [isPlaying, setIsPlaying] = useState(item.type === 'LiveTV');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState<number | null>(null);
  const [showServerModal, setShowServerModal] = useState(false);
  const [viewCount, setViewCount] = useState(item.views || 0);
  const [selectedMovieServerUrl, setSelectedMovieServerUrl] = useState<string | null>(null);
  const [selectedMovieServerIndex, setSelectedMovieServerIndex] = useState<number | null>(null);
  
  const handleWatchlist = () => {
    toggleWatchlist(item);
    setIsWatchlisted(!isWatchlisted);
  };

  let servers: any[] = [];
  try {
    servers = JSON.parse(item.video_url || '[]');
  } catch (e) {
    if (typeof item.video_url === 'string' && item.video_url.length > 0) {
       servers = [{ name: 'Server 1', url: item.video_url }];
    }
  }

  const activeVideoUrl_original = currentVideoUrl || (item.type === 'LiveTV' ? item.stream_url : (servers.length > 0 ? (servers[selectedEpisodeIndex ?? 0].url || servers[selectedEpisodeIndex ?? 0].servers?.[0]?.url) : null));
  
  // Transform OK.ru links to embed if needed
  let activeVideoUrl = activeVideoUrl_original;
  if (activeVideoUrl?.includes('ok.ru/video/')) {
    activeVideoUrl = activeVideoUrl.replace('ok.ru/video/', 'ok.ru/videoembed/');
  }

  const injectedJS = `
    (function() {
      const style = document.createElement('style');
      style.innerHTML = 'div[class*="join-ok"], .vp-layer_join-ok, .footer, .header, .side-bar { display: none !important; }';
      document.head.appendChild(style);
      
      // Auto-play attempt
      const video = document.querySelector("video");
      if (video) {
        video.play();
      }
    })();
    true;
  `;

  const handleWatchNow = () => {
    if (item.type === 'Series') {
      // If no episode selected, pick the first one
      const targetIndex = selectedEpisodeIndex !== null ? selectedEpisodeIndex : 0;
      if (selectedEpisodeIndex === null) {
        setSelectedEpisodeIndex(targetIndex);
      }
      
      const epServers = servers[targetIndex]?.servers || [];
      if (epServers.length > 1) {
        setShowServerModal(true);
      } else if (epServers.length === 1) {
        handlePlayServer(epServers[0].url);
      } else if (servers[targetIndex]?.url) {
        handlePlayServer(servers[targetIndex].url);
      }
      return;
    }

    // Movie logic
    if (selectedMovieServerUrl) {
      handlePlayServer(selectedMovieServerUrl);
    } else if (servers.length > 0) {
      if (servers.length > 1) {
        setShowServerModal(true);
      } else {
        handlePlayServer(servers[0].url);
      }
    } else {
      scrollRef.current?.scrollTo({ y: 400, animated: true });
    }
  };

  const handlePlayServer = (url: string) => {
    setCurrentVideoUrl(url);
    setIsPlaying(true);
    setShowServerModal(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleEpisodeSelect = (index: number) => {
    if (item.type === 'Series') {
      setSelectedEpisodeIndex(index);
      
      // Directly display server options when selected
      const epServers = servers[index]?.servers || [];
      if (epServers.length > 1) {
        setShowServerModal(true);
      } else if (epServers.length === 1) {
        handlePlayServer(epServers[0].url);
      } else if (servers[index]?.url) {
        handlePlayServer(servers[index].url);
      }
    } else {
      // Movie Server Selection
      setSelectedMovieServerIndex(index);
      setSelectedMovieServerUrl(servers[index].url);
      handlePlayServer(servers[index].url);
    }
  };

  // Modal Content Logic
  const getModalServers = () => {
    if (selectedEpisodeIndex !== null && servers[selectedEpisodeIndex]?.servers) {
      return servers[selectedEpisodeIndex].servers;
    }
    return servers;
  };

  // Live TV Specific Layout
  if (item.type === 'LiveTV') {
    return (
      <View style={[styles.container, { backgroundColor: '#111' }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        {/* Top 16:9 Header area (Video Player) */}
        <View style={styles.liveVideoContainer}>
          {isPlaying && activeVideoUrl ? (
            <Video
              source={{ uri: activeVideoUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          ) : (
            <Image 
              source={{ uri: item.image }} 
              style={styles.backdrop}
              resizeMode="cover"
            />
          )}
          {!isPlaying && (
            <View style={styles.liveVideoOverlay}>
              <TouchableOpacity 
                style={[styles.backArrow, { top: insets.top + 10 }]}
                onPress={() => navigation.goBack()}
              >
                <ChevronLeft color="white" size={28} />
              </TouchableOpacity>

              <View style={[styles.liveBadgeCorner, { top: insets.top + 10 }]}>
                <View style={styles.liveDotAnimated} />
                <Text style={styles.liveBadgeCornerText}>LIVE</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.liveInfoContainer}>
          <View style={styles.liveInfoLeft}>
            <Text style={styles.liveTitle}>{getLocalized(item, 'title', language)}</Text>
            <Text style={styles.liveCategory}>{item.category || 'News'}</Text>
          </View>
          
          <TouchableOpacity style={styles.livePresenceButton}>
            <Users size={16} color="#E53935" />
            <Text style={styles.livePresenceText}>LIVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView ref={scrollRef} bounces={false}>
        <View style={styles.headerContainer}>
          {isPlaying && activeVideoUrl ? (
            <WebView
              key={activeVideoUrl}
              source={{ uri: activeVideoUrl }}
              style={StyleSheet.absoluteFillObject}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              injectedJavaScript={injectedJS}
              userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36"
              originWhitelist={['*']}
              allowsFullscreenVideo={true}
              androidLayerType="hardware"
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator color="#E53935" size="large" />
                </View>
              )}
            />
          ) : (
            <Image 
              source={{ uri: item.backdrop || item.image }} 
              style={styles.backdrop}
              resizeMode="cover"
            />
          )}

          {!isPlaying && (
            <LinearGradient
              colors={['rgba(10,10,10,0.7)', 'transparent', '#0a0a0a']}
              style={styles.gradient}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft color="white" size={28} />
          </TouchableOpacity>

          {!isPlaying && (
            <Image source={{ uri: item.image }} style={styles.floatingPoster} />
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.mainInfo}>
            <View style={{ flex: 1 }}>
               <Text style={styles.title}>{getLocalized(item, 'title', language)}</Text>
               <View style={styles.metaRow}>
                 <View style={styles.metaItem}>
                   <Calendar size={14} color="#888" />
                   <Text style={styles.metaText}>{item.year}</Text>
                 </View>
                 <View style={styles.metaItem}>
                   <Star size={14} color="#fbbf24" fill="#fbbf24" />
                   <Text style={styles.metaText}>{item.rating}</Text>
                 </View>
                 <View style={styles.metaItem}>
                   <Eye size={14} color="#888" />
                   <Text style={styles.metaText}>{viewCount}</Text>
                 </View>
               </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.mainPlayButton} onPress={handleWatchNow}>
              <Play size={20} color="black" fill="black" />
              <Text style={styles.mainPlayText}>{t.watchNow || 'Watch Now'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
               style={styles.iconAction}
               onPress={handleWatchlist}
            >
              <Bookmark size={24} color={isWatchlisted ? "#E53935" : "white"} fill={isWatchlisted ? "#E53935" : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconAction}>
              <Share2 size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
             <Text style={styles.sectionTitle}>{t.overview}</Text>
             <Text style={styles.description}>{getLocalized(item, 'description', language) || t.noDescription}</Text>
          </View>

          <View ref={serversRef} style={styles.infoSection}>
             <Text style={styles.sectionTitle}>
               {item.type === 'Series' ? (t.episodes) : (t.availableServers)}
             </Text>
             <View style={styles.serverGrid}>
               {servers.map((server: any, index: number) => {
                 let displayName = server.name;
                 if (!displayName) {
                   displayName = item.type === 'Series' 
                     ? `${t.episodes} ${index + 1}` 
                     : `${language === 'ku' ? 'سێرڤەری' : language === 'ar' ? 'سيرفر' : 'Server'} ${index + 1}`;
                 }
                 const isSelected = item.type === 'Series' 
                    ? selectedEpisodeIndex === index
                    : selectedMovieServerIndex === index;
                 return (
                   <TouchableOpacity 
                     key={index} 
                     style={[styles.serverButton, isSelected && styles.selectedServerButton]}
                     onPress={() => handleEpisodeSelect(index)}
                   >
                     <View style={styles.serverInfo}>
                        <Text style={[styles.serverText, isSelected && { color: 'white' }]}>{displayName}</Text>
                        <Text style={styles.qualityTag}>HD</Text>
                     </View>
                   </TouchableOpacity>
                 );
               })}
             </View>
          </View>
          <CommentSection movieId={String(item.id)} />
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Server Selection Modal */}
      <Modal
        visible={showServerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServerModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowServerModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t.chooseServer}</Text>
                <Text style={styles.modalSubtitle}>{getModalServers().length} {t.available}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowServerModal(false)}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalList}>
               {getModalServers().map((srv: any, idx: number) => (
                 <TouchableOpacity 
                   key={idx} 
                   style={styles.modalServerItem}
                   onPress={() => handlePlayServer(srv.url)}
                 >
                   <View style={styles.modalServerIconBox}>
                     <Server size={20} color="#E53935" />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.modalServerName}>{srv.name || `Server ${idx + 1}`}</Text>
                     <Text style={styles.modalServerSub}>{srv.provider || 'High Speed'}</Text>
                   </View>
                   <View style={styles.modalAutoBadge}>
                     <Text style={styles.modalAutoText}>Auto</Text>
                   </View>
                 </TouchableOpacity>
               ))}
                <TouchableOpacity 
                 style={styles.modalCancelButton}
                 onPress={() => setShowServerModal(false)}
               >
                 <Text style={styles.modalCancelText}>{t.cancel}</Text>
               </TouchableOpacity>
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
    backgroundColor: '#0F0F13',
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
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  modalList: {
    gap: 12,
  },
  modalServerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  modalServerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229,57,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalServerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalServerSub: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  modalAutoBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalAutoText: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 10,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
  },
  modalCancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // LIVE TV STYLES
  liveVideoContainer: {
    width: width,
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    position: 'relative',
  },
  liveVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backArrow: {
    position: 'absolute',
    left: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadgeCorner: {
    position: 'absolute',
    right: 15,
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 4,
  },
  liveDotAnimated: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  liveBadgeCornerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  liveInfoContainer: {
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  liveInfoLeft: {
    flex: 1,
  },
  liveTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  liveCategory: {
    color: '#888',
    fontSize: 14,
  },
  livePresenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  livePresenceText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },

  // MOVIE STYLES
  headerContainer: {
    width: width,
    height: width * 0.7,
    position: 'relative',
    backgroundColor: 'black',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingPoster: {
    position: 'absolute',
    right: 20,
    bottom: -30,
    width: 100,
    aspectRatio: 2/3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e1e24',
    zIndex: 20,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: 20,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    maxWidth: width * 0.65,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#888',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  mainPlayButton: {
    flex: 2,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 12,
    gap: 10,
  },
  mainPlayText: {
    color: 'black',
    fontWeight: '900',
    fontSize: 18,
  },
  iconAction: {
    flex: 0.5,
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginTop: 32,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    color: '#bbb',
    fontSize: 15,
    lineHeight: 24,
  },
  serverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serverButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '48.5%',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  selectedServerButton: {
    borderColor: '#E53935',
    backgroundColor: 'rgba(229,57,53,0.1)',
  },
  serverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    fontSize: 15,
  },
  qualityTag: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(229,57,53,0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  }
});
