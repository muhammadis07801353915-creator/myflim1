import React, { useState, useRef, useEffect } from 'react';
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
import { COLORS, SPACING, SIZES, getColors } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Play, Bookmark, Share2, Star, Clock, Calendar, Users, X, Server, Eye } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { useAppStore } from '../store/useAppStore';
import CommentSection from '../components/CommentSection';
import { getLocalized } from '../utils/localization';
import { translations } from '../utils/translations';
import { supabase } from '../api/supabase';
import WatchPartyModal from '../components/WatchPartyModal';
import { useWatchParty } from '../utils/useWatchParty';

const { width, height } = Dimensions.get('window');

export default function DetailScreen({ route, navigation }: any) {
  const { item } = route.params;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const serversRef = useRef<View>(null);
  const { incrementViews, toggleWatchlist, watchlist, language, liveTv, saveWatchProgress, theme } = useAppStore();
  const themeColors = getColors(theme);
  const isRTL = language === 'ku' || language === 'ar';
  const t = translations[language];
  const party = useWatchParty();
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [activeChannel, setActiveChannel] = useState(item);
  const [realLiveViewers, setRealLiveViewers] = useState<number>(1);

  // Listen for real-time video sync events from Host
  const registerSync = party.registerVideoSyncListener;
  useEffect(() => {
    registerSync((payload) => {
      if (payload.type === 'PLAY') {
        setIsPlaying(true);
      } else if (payload.type === 'PAUSE') {
        setIsPlaying(false);
      }
    });
  }, [registerSync]);

  // Auto-play when party is accepted
  const isInParty = party.isInParty;
  useEffect(() => {
    if (isInParty && !isPlaying) {
      const srvUrl = (item?.servers && item.servers.length > 0 ? item.servers[0]?.url : null) || item?.url || item?.video_url || '';
      if (srvUrl) setCurrentVideoUrl(srvUrl);
      setIsPlaying(true);
    }
  }, [isInParty, isPlaying, item?.url]);

  // Real-time Supabase Presence for live viewers count in app
  useEffect(() => {
    if (item.type !== 'LiveTV' || !activeChannel?.id) return;

    const channelKey = `channel_live_watchers_${activeChannel.id}`;
    const presenceChannel = supabase.channel(channelKey, {
      config: {
        presence: {
          key: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const count = Object.keys(state).length;
        setRealLiveViewers(count > 0 ? count : 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [item.type, activeChannel?.id]);
  
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

  // Parse video_url format dynamically
  let servers: any[] = [];
  let episodes: any[] = [];

  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    // Extract src if raw iframe HTML tag was provided
    if (url.includes('<iframe')) {
      const match = url.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        url = match[1];
      }
    }

    url = url.replace(/^\/+/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('vidsrc://')) {
      url = 'https://' + url;
    }

    if (url.startsWith('vidsrc://')) {
      const parts = url.replace('vidsrc://', '').split('/');
      const type = parts[0];
      const id = parts[1];
      if (type === 'movie') {
        return `https://vidsrc.pm/embed/movie/${id}`;
      } else {
        const season = parts[2] || '1';
        const ep = parts[3] || '1';
        return `https://vidsrc.pm/embed/tv/${id}/${season}/${ep}`;
      }
    }
    return url;
  };

  try {
    const parsed = JSON.parse(item.video_url || '[]');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.servers && Array.isArray(parsed.servers)) {
        servers = parsed.servers.map((s: any, i: number) => ({
          name: s.name || `Server ${i + 1}`,
          url: getEmbedUrl(s.url || ''),
          quality: s.quality || 'HD'
        }));
      }
      if (parsed.episodes && Array.isArray(parsed.episodes)) {
        episodes = parsed.episodes;
      }
    } else if (Array.isArray(parsed)) {
      if (parsed.length > 0 && parsed[0].number !== undefined) {
        episodes = parsed;
      } else {
        servers = parsed.map((s: any, i: number) => ({
          name: s.name || `Server ${i + 1}`,
          url: getEmbedUrl(s.url || ''),
          quality: s.quality || 'HD'
        }));
      }
    }
  } catch (e) {
    if (item.video_url) {
      servers = [{ name: 'Server 1', url: getEmbedUrl(item.video_url), quality: 'HD' }];
    }
  }

  const isSeriesContent = item.type === 'Series';

  if (!servers || !Array.isArray(servers)) servers = [];
  if (!episodes || !Array.isArray(episodes)) episodes = [];

  const gridItems = isSeriesContent ? episodes : servers;

  let activeVideoUrl_original: string | null = currentVideoUrl;
  if (!activeVideoUrl_original) {
    if (item.type === 'LiveTV') {
      activeVideoUrl_original = item.stream_url;
    } else if (isSeriesContent && episodes.length > 0) {
      const epIdx = selectedEpisodeIndex ?? 0;
      const ep = episodes[epIdx];
      const epUrl = ep?.servers?.[0]?.url || ep?.url || '';
      activeVideoUrl_original = getEmbedUrl(epUrl);
    } else if (servers.length > 0) {
      activeVideoUrl_original = servers[0].url;
    }
  }

  let activeVideoUrl = activeVideoUrl_original;
  if (activeVideoUrl?.includes('ok.ru/video/')) {
    activeVideoUrl = activeVideoUrl.replace('ok.ru/video/', 'ok.ru/videoembed/');
  }
  if (activeVideoUrl?.includes('ok.ru/videoembed/') && !activeVideoUrl.includes('autoplay=')) {
    const sep = activeVideoUrl.includes('?') ? '&' : '?';
    activeVideoUrl += `${sep}autoplay=1`;
  }
  if (activeVideoUrl?.includes('dailymotion.com/video/')) {
    activeVideoUrl = activeVideoUrl.replace('dailymotion.com/video/', 'dailymotion.com/embed/video/');
  }

  const isDirectVideo = activeVideoUrl?.toLowerCase().split('?')[0].endsWith('.mp4') || 
                        activeVideoUrl?.toLowerCase().includes('.m3u8');

  const injectedJS = `
    (function() {
      try {
        const style = document.createElement('style');
        style.innerHTML = '.footer, .header, .side-bar { display: none !important; }';
        document.head.appendChild(style);
        const video = document.querySelector("video");
        if (video) {
          video.style.display = "block";
          video.style.visibility = "visible";
          video.play().catch(function(){});
        }
      } catch(e) {}
    })();
    true;
  `;

  const handleWatchNow = () => {
    if (isSeriesContent) {
      const targetIndex = selectedEpisodeIndex !== null ? selectedEpisodeIndex : 0;
      if (selectedEpisodeIndex === null) setSelectedEpisodeIndex(targetIndex);
      const ep = episodes[targetIndex];
      const epServers = ep?.servers || [];
      if (epServers.length > 1) {
        setShowServerModal(true);
      } else if (epServers.length === 1) {
        handlePlayServer(getEmbedUrl(epServers[0].url));
      } else if (ep?.url) {
        handlePlayServer(getEmbedUrl(ep.url));
      }
      return;
    }
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

  const handleWatchlist = () => {
    toggleWatchlist(item);
    setIsWatchlisted(prev => !prev);
  };

  const handlePlayServer = (url: string) => {
    setCurrentVideoUrl(url);
    setIsPlaying(true);
    setShowServerModal(false);
    if (party.isInParty && party.isHost) {
      party.broadcastVideoSync('PLAY', 0);
    }
    if (item.type !== 'LiveTV') {
      saveWatchProgress(item, 0, 0);
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleEpisodeSelect = (index: number) => {
    if (isSeriesContent) {
      setSelectedEpisodeIndex(index);
      const ep = episodes[index];
      const epServers = ep?.servers || [];
      if (epServers.length > 1) {
        setShowServerModal(true);
      } else if (epServers.length === 1) {
        handlePlayServer(getEmbedUrl(epServers[0].url));
      } else if (ep?.url) {
        handlePlayServer(getEmbedUrl(ep.url));
      }
    } else {
      setSelectedMovieServerIndex(index);
      setSelectedMovieServerUrl(servers[index].url);
      handlePlayServer(servers[index].url);
    }
  };

  const getModalServers = () => {
    if (isSeriesContent && selectedEpisodeIndex !== null) {
      return (episodes[selectedEpisodeIndex]?.servers || []).map((s: any) => ({
        ...s,
        url: getEmbedUrl(s.url)
      }));
    }
    return servers;
  };

  if (item.type === 'LiveTV') {
    const liveVideoUrl = activeChannel.stream_url || item.stream_url;

    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        <View style={styles.liveVideoContainer}>
          {isPlaying && liveVideoUrl ? (
            <Video
              source={{ uri: liveVideoUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          ) : (
            <Image 
              source={{ uri: activeChannel.image || item.image }} 
              style={styles.backdrop}
              resizeMode="cover"
            />
          )}
          
          <TouchableOpacity 
            style={[styles.backArrow, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft color="white" size={28} />
          </TouchableOpacity>
        </View>

        <View style={[styles.liveInfoContainer, { borderBottomColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={styles.liveInfoLeft}>
            <Text style={[styles.liveTitle, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>{activeChannel.name || getLocalized(item, 'title', language)}</Text>
            <Text style={[styles.liveCategory, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}>{activeChannel.category || item.category || 'Live TV'}</Text>
          </View>
          
          <TouchableOpacity style={[styles.livePresenceButton, isRTL && { flexDirection: 'row-reverse' }]}>
            <Users size={16} color="#E53935" />
            <Text style={styles.livePresenceText}>LIVE</Text>
            <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>•</Text>
            <Text style={{ color: themeColors.text, fontSize: 12, fontWeight: '700' }}>{realLiveViewers.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {(() => {
          const categoryChannels = activeChannel?.category
            ? (liveTv || []).filter((c: any) => c.category === activeChannel.category)
            : (liveTv || []);
          const displayChannels = categoryChannels.length > 0 ? categoryChannels : (liveTv || []);
          const activeCatName = activeChannel?.category || '';

          return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
                <Text style={{ color: themeColors.text, fontSize: 16, fontWeight: 'bold' }}>
                  {language === 'ku' ? `کەناڵەکانی (${activeCatName})` : language === 'ar' ? `قنوات (${activeCatName})` : `(${activeCatName}) Channels`}
                </Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>
                  {displayChannels.length} {language === 'ku' ? 'کەناڵ' : language === 'ar' ? 'قناة' : 'channels'}
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {displayChannels.map((ch: any) => {
                  const isCurrent = ch.id === activeChannel.id;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: isCurrent ? 'rgba(229, 57, 53, 0.18)' : themeColors.surface,
                        borderWidth: 1,
                        borderColor: isCurrent ? '#E53935' : themeColors.border,
                      }}
                      onPress={() => {
                        setActiveChannel(ch);
                        setIsPlaying(true);
                      }}
                    >
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
                        <Image 
                          source={{ uri: ch.image }} 
                          style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#000' }} 
                          resizeMode="cover" 
                        />
                        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                          <Text style={{ color: themeColors.text, fontWeight: '700', fontSize: 15 }}>{ch.name}</Text>
                          <Text style={{ color: themeColors.textMuted, fontSize: 12, marginTop: 2 }}>{ch.category || 'Live TV'}</Text>
                        </View>
                      </View>
                      {isCurrent ? (
                        <View style={{ backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>Playing</Text>
                        </View>
                      ) : (
                        <Play size={16} color={themeColors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          );
        })()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView ref={scrollRef} bounces={false} style={{ backgroundColor: themeColors.background }}>
        <View style={[styles.headerContainer, isPlaying && { marginTop: insets.top + 14 }]}>
          {isPlaying && activeVideoUrl ? (
            isDirectVideo ? (
              <Video
                source={{ uri: activeVideoUrl }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                useNativeControls
              />
            ) : (
              <WebView
                key={activeVideoUrl}
                source={{
                  uri: activeVideoUrl,
                  headers: {
                    'Referer': 'https://www.myflim.com/',
                    'Origin': 'https://www.myflim.com',
                  },
                }}
                style={StyleSheet.absoluteFillObject}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                setSupportMultipleWindows={false}
                injectedJavaScript={injectedJS}
                userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36"
                originWhitelist={['*']}
                allowsFullscreenVideo={true}
                androidLayerType="none"
                startInLoadingState={false}
              />
            )
          ) : (
            <Image 
              source={{ uri: item.backdrop || item.image }} 
              style={styles.backdrop}
              resizeMode="cover"
            />
          )}

          {!isPlaying && (
            <LinearGradient
              colors={theme === 'light' ? ['rgba(248,250,252,0.4)', 'transparent', '#F8FAFC'] : ['rgba(10,10,10,0.7)', 'transparent', '#0a0a0a']}
              style={styles.gradient}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.backButton, { top: isPlaying ? 10 : insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft color="white" size={28} />
          </TouchableOpacity>

          {!isPlaying && (
            <Image source={{ uri: item.image }} style={styles.floatingPoster} />
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={[styles.mainInfo, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={{ flex: 1 }}>
               <Text style={[styles.title, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>{getLocalized(item, 'title', language)}</Text>
               <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                 <View style={[styles.metaItem, isRTL && { flexDirection: 'row-reverse' }]}>
                   <Calendar size={14} color={themeColors.textSecondary} />
                   <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{item.year}</Text>
                 </View>
                 <View style={[styles.metaItem, isRTL && { flexDirection: 'row-reverse' }]}>
                   <Star size={14} color="#fbbf24" fill="#fbbf24" />
                   <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{item.rating}</Text>
                 </View>
                 <View style={[styles.metaItem, isRTL && { flexDirection: 'row-reverse' }]}>
                   <Eye size={14} color={themeColors.textSecondary} />
                   <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{viewCount}</Text>
                 </View>
               </View>
            </View>
          </View>

          <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity style={[styles.mainPlayButton, { backgroundColor: theme === 'light' ? themeColors.primary : '#fff' }]} onPress={handleWatchNow}>
              <Play size={20} color={theme === 'light' ? 'white' : 'black'} fill={theme === 'light' ? 'white' : 'black'} />
              <Text style={[styles.mainPlayText, { color: theme === 'light' ? 'white' : 'black' }]}>{t.watchNow || 'Watch Now'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
               style={[styles.iconAction, { backgroundColor: theme === 'light' ? themeColors.surfaceLight : 'rgba(255,255,255,0.1)' }]}
               onPress={handleWatchlist}
            >
              <Bookmark size={24} color={isWatchlisted ? "#E53935" : themeColors.text} fill={isWatchlisted ? "#E53935" : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconAction, { backgroundColor: theme === 'light' ? themeColors.surfaceLight : 'rgba(255,255,255,0.1)' }]}>
              <Share2 size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.synopsisContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>
              {t.storyLine}
            </Text>
            <Text style={[styles.synopsisText, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}>
              {getLocalized(item, 'description', language) || item.description || t.noDescription}
            </Text>
          </View>

          {/* Grid Selection: Episodes or Servers */}
          {gridItems.length > 0 && (
            <View ref={serversRef} style={styles.episodesContainer}>
              <View style={[styles.episodesHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>
                  {isSeriesContent ? t.episodesTitle : t.availableServers}
                </Text>
                <Text style={styles.episodesCount}>
                  {gridItems.length} {isSeriesContent ? t.episodes : t.available}
                </Text>
              </View>

              <View style={[styles.episodesGrid, isRTL && { flexDirection: 'row-reverse' }]}>
                {gridItems.map((gridItem: any, index: number) => {
                  const isSelected = isSeriesContent 
                    ? selectedEpisodeIndex === index 
                    : selectedMovieServerIndex === index;

                  const epNum = gridItem.number || (typeof gridItem.name === 'string' && gridItem.name.match(/\d+/) ? gridItem.name.match(/\d+/)[0] : index + 1);

                  let epTitle = `Ep ${epNum}`;
                  let epSub = `Episode ${epNum}`;
                  if (language === 'ku') {
                    epTitle = `ئەڵقەی ${epNum}`;
                    epSub = `ئەڵقەی ${epNum}`;
                  } else if (language === 'badini') {
                    epTitle = `ئەڵقەیا ${epNum}`;
                    epSub = `ئەڵقەیا ${epNum}`;
                  } else if (language === 'ar') {
                    epTitle = `الحلقة ${epNum}`;
                    epSub = `الحلقة ${epNum}`;
                  }

                  const displayName = isSeriesContent 
                    ? epTitle
                    : (gridItem.name || `Server ${index + 1}`);

                  const subLabel = isSeriesContent 
                    ? epSub
                    : (gridItem.quality || 'HD');

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.gridCard,
                        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                        isSelected && styles.gridCardActive
                      ]}
                      onPress={() => handleEpisodeSelect(index)}
                    >
                      <View style={[styles.gridCardTop, isRTL && { flexDirection: 'row-reverse' }]}>
                        {isSelected ? (
                          <Play size={16} color="#E53935" fill="#E53935" />
                        ) : (
                          <Server size={16} color={themeColors.textSecondary} />
                        )}
                        <Text style={[styles.gridCardTitle, { color: themeColors.text }, isSelected && styles.gridCardTitleActive, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                          {displayName}
                        </Text>
                      </View>
                      <Text style={[styles.gridCardSub, { color: themeColors.textMuted }, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                        {subLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <CommentSection movieId={item.id} />
        </View>
      </ScrollView>

      {/* Server Picker Modal */}
      <Modal visible={showServerModal} transparent animationType="slide">
        <Pressable style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={() => setShowServerModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{language === 'ku' ? 'سێرڤەر هەڵبژێرە' : 'Choose Server'}</Text>
              <TouchableOpacity onPress={() => setShowServerModal(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {getModalServers().map((srv: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.serverOption, { borderBottomColor: themeColors.border }]}
                  onPress={() => handlePlayServer(srv.url)}
                >
                  <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center' }, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Server size={20} color="#E53935" />
                    <View style={[{ flex: 1 }, isRTL ? { marginRight: 12 } : { marginLeft: 12 }]}>
                      <Text style={[styles.serverOptionName, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>{srv.name || `Server ${idx + 1}`}</Text>
                      <Text style={[styles.serverOptionQuality, { color: themeColors.textMuted }, isRTL && { textAlign: 'right' }]}>{srv.quality || 'HD'}</Text>
                    </View>
                  </View>
                  <ChevronLeft size={20} color={themeColors.textMuted} style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Watch Party Modal */}
      <WatchPartyModal
        isOpen={showPartyModal}
        onClose={() => setShowPartyModal(false)}
        onSendInvite={(friendUsername) => party.sendInvite(friendUsername, item)}
        incomingInvite={party.incomingInvite}
        onAcceptInvite={(invite) => party.acceptInvite(invite)}
        onDeclineInvite={(inviteId) => party.declineInvite(inviteId)}
        activeParty={party.activeInvite}
        isHost={party.isHost}
        isMicOn={party.isMicOn}
        onToggleMic={party.toggleMic}
        onLeaveParty={party.leaveParty}
        partnerUsername={party.partnerUsername}
        onNavigateToMovie={(movieId) => {
          if (movieId && movieId !== item.id) {
            navigation.replace('Detail', { item: { ...item, id: movieId } });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  headerContainer: {
    height: height * 0.38,
    width: '100%',
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingPoster: {
    position: 'absolute',
    bottom: -30,
    left: 16,
    width: 100,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E53935',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 60,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  mainPlayButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mainPlayText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  iconAction: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  synopsisContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  synopsisText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 22,
  },
  episodesContainer: {
    marginBottom: 24,
  },
  episodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  episodesCount: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '700',
  },
  episodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: '#181924',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gridCardActive: {
    borderColor: '#E53935',
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  gridCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  gridCardTitleActive: {
    color: '#E53935',
  },
  gridCardSub: {
    color: '#666',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#181924',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  serverOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  serverOptionName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  serverOptionQuality: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  liveVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  backArrow: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  liveInfoLeft: {
    flex: 1,
  },
  liveTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  liveCategory: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  livePresenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229,57,53,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.3)',
  },
  livePresenceText: {
    color: '#E53935',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
