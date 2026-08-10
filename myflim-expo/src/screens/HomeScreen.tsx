import React, { useState, useRef, useMemo } from 'react';
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
  RefreshControl,
  PanResponder,
  Modal,
  Pressable,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, getColors } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Flame, ChevronRight, ChevronLeft, Search, Bell, Info, X } from 'lucide-react-native';
import { translations } from '../utils/translations';
import { getLocalized } from '../utils/localization';
import FloatingSocialButton from '../components/FloatingSocialButton';

const formatNotifTime = (d: string, lang: string) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'ku' ? 'ئێستا' : lang === 'ar' ? 'الآن' : 'just now';
  if (mins < 60) return lang === 'ku' ? `پێش ${mins} خولەک` : lang === 'ar' ? `قبل ${mins} دقيقة` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'ku' ? `پێش ${hours} کاتژمێر` : lang === 'ar' ? `قبل ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === 'ku' ? `پێش ${days} ڕۆژ` : lang === 'ar' ? `قبل ${days} يوم` : `${days}d ago`;
};

const { width } = Dimensions.get('window');
const HERO_HEIGHT = width * 0.64; // ~16:10

// ─── Poster card (2:3) — used in all horizontal sections ──────────────────
function PosterCard({
  item,
  onPress,
  showRating = true,
  showType = false,
  language,
  themeColors,
}: {
  item: any;
  onPress: (i: any) => void;
  showRating?: boolean;
  showType?: boolean;
  language: string;
  themeColors: any;
}) {
  return (
    <TouchableOpacity
      style={card.wrap}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={[card.poster, { backgroundColor: themeColors.surface }]}>
        <Image source={{ uri: item.image }} style={card.img} />

        {/* Rating badge — top right */}
        {showRating && item.rating ? (
          <View style={card.ratingBadge}>
            <Star size={10} color="#FBBF24" fill="#FBBF24" />
            <Text style={card.ratingText}>{item.rating}</Text>
          </View>
        ) : null}

        {/* Type badge — top left */}
        {showType && item.type ? (
          <View style={card.typeBadge}>
            <Text style={card.typeBadgeText}>{item.type.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={1} style={[card.title, { color: themeColors.text }]}>
        {getLocalized(item, 'title', language)}
      </Text>
      {item.year ? <Text style={[card.year, { color: themeColors.textSecondary }]}>{item.year}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Section header — matches web layout ──────────────────────────────────
function SectionHeader({
  title,
  showFlame,
  onSeeAll,
  language,
  themeColors,
}: {
  title: string;
  showFlame?: boolean;
  onSeeAll?: () => void;
  language?: string;
  themeColors: any;
}) {
  const isRTL = language === 'ku' || language === 'ar';
  const seeAllText = language === 'ku' ? 'هەموویان' : language === 'ar' ? 'عرض الكل' : 'See All';

  return (
    <View style={[sh.row, isRTL && { flexDirection: 'row-reverse' }]}>
      {/* Title + optional flame icon */}
      <View style={[sh.titleRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={[sh.titleText, { color: themeColors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{title}</Text>
        {showFlame ? <Flame size={18} color="#CC222F" style={isRTL ? { marginRight: 5 } : { marginLeft: 5 }} /> : null}
      </View>

      {/* See All link */}
      <TouchableOpacity style={[sh.seeAllBtn, isRTL && { flexDirection: 'row-reverse' }]} onPress={onSeeAll}>
        <Text style={sh.seeAllText}>{seeAllText}</Text>
        {isRTL ? <ChevronLeft size={14} color="#CC222F" /> : <ChevronRight size={14} color="#CC222F" />}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    movies,
    categories,
    loading,
    fetchInitialData,
    language,
    isUnlocked,
    theme,
    notifications,
    unreadNotifCount,
    markNotificationsRead,
    fetchNotifications,
  } = useAppStore();

  const themeColors = getColors(theme);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const t = translations[language];
  const isRTL = language === 'ku' || language === 'ar';

  const handleOpenNotifModal = () => {
    setShowNotifModal(true);
    markNotificationsRead();
  };

  const featured = isUnlocked ? movies.filter((m) => m.is_featured) : [];
  const topContents = isUnlocked
    ? movies
        .filter((m) => m.top_rank)
        .sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99))
    : [];
  // Dynamically compute ALL movie lists present in database (Kurdish Cartoons, Kurdish Dubbed, etc.)
  const allDynamicLists = useMemo(() => {
    if (!isUnlocked) return [];
    const map = new Map<string, any[]>();

    // 1. Add lists from categories (movie_lists table)
    (categories || []).forEach((cat: any) => {
      const title = getLocalized(cat, 'name', language) || cat.name || '';
      if (!title) return;

      const matched = movies.filter(
        (m) =>
          m.list_name === cat.name ||
          m.category === cat.name ||
          (m.list_name && m.list_name.includes(cat.name)) ||
          (m.genre && m.genre.includes(cat.name))
      );

      if (matched.length > 0) {
        map.set(title, matched);
      }
    });

    // 2. Add any other custom list_name present in movies database
    movies.forEach((m) => {
      const listName = m.list_name;
      if (listName && !map.has(listName)) {
        const matched = movies.filter((x) => x.list_name === listName);
        if (matched.length > 0) {
          map.set(listName, matched);
        }
      }
    });

    return Array.from(map.entries());
  }, [categories, movies, isUnlocked, language]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };
  const handlePress = (item: any) => navigation.navigate('Detail', { item });
  const handleSeeAll = (title: string, data: any[], listName?: string) =>
    navigation.navigate('Category', { title, data, listName });

  // PanResponder for Hero Swipe
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!featured || featured.length === 0) return;
        if (gestureState.dx < -40) {
          // Swipe Left -> Next
          setActiveIndex((prev) => (prev + 1) % featured.length);
        } else if (gestureState.dx > 40) {
          // Swipe Right -> Prev
          setActiveIndex((prev) => (prev - 1 + featured.length) % featured.length);
        }
      },
    })
  ).current;

  // ── Hero Banner (16:10 wide layout matching web) ─────────────────────────
  const renderHero = () => {
    if (!isUnlocked) {
      return (
        <View style={hero.lockedWrap}>
          <Text style={hero.lockedTitle}>Taban Play</Text>
          <Text style={hero.lockedSub}>
            {language === 'ku'
              ? 'داخڵکردنی کۆد بۆ کردنەوەی سەرجەم بەشەکان'
              : 'Enter code to unlock all sections'}
          </Text>
        </View>
      );
    }

    if (featured.length === 0) return null;
    const current = featured[activeIndex] || featured[0];

    return (
      <View style={hero.container} {...panResponder.panHandlers}>
        {/* Backdrop Image */}
        <Image
          source={{ uri: current.backdrop || current.image }}
          style={hero.img}
          resizeMode="cover"
        />

        {/* Gradient overlay for top icon contrast and bottom text readability (No theme background shape) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.4, 1]}
          style={hero.gradient}
        >
          {/* Top-right: Rating badge */}
          {current.rating ? (
            <View style={hero.badgeWrap}>
              <View style={hero.ratingBadge}>
                <Star size={11} color="#FBBF24" fill="#FBBF24" />
                <Text style={hero.ratingText}>{current.rating}</Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>

        {/* Bottom Content Area */}
        <View style={[hero.contentRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {/* Small poster thumb — bottom left */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(current)}
            style={hero.thumbWrap}
          >
            <Image source={{ uri: current.image }} style={hero.thumbImg} />
          </TouchableOpacity>

          {/* Title & info */}
          <View style={[hero.info, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={hero.title} numberOfLines={1}>
              {getLocalized(current, 'title', language)}
            </Text>

            <View style={[hero.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
              {current.year ? <Text style={hero.metaText}>{current.year}</Text> : null}
              {current.type ? (
                <>
                  <Text style={hero.metaDot}>•</Text>
                  <Text style={hero.metaText}>{current.type}</Text>
                </>
              ) : null}
              {current.genre ? (
                <>
                  <Text style={hero.metaDot}>•</Text>
                  <Text style={hero.metaText} numberOfLines={1}>
                    {Array.isArray(current.genre)
                      ? current.genre.slice(0, 2).join(', ')
                      : current.genre}
                  </Text>
                </>
              ) : null}
            </View>

            {/* Carousel indicator dots */}
            {featured.length > 1 ? (
              <View style={[hero.dotsRow, isRTL && { flexDirection: 'row-reverse' }]}>
                {featured.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setActiveIndex(i)}
                    style={[
                      hero.dot,
                      i === activeIndex ? hero.dotActive : hero.dotInactive,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderSection = (
    title: string,
    data: any[],
    fullData?: any[],
    listName?: string,
    showFlame = false,
    showType = false
  ) => {
    return (
      <View style={styles.section} key={title}>
        <SectionHeader
          title={title}
          showFlame={showFlame}
          language={language}
          themeColors={themeColors}
          onSeeAll={() => handleSeeAll(title, fullData || data, listName)}
        />
        <FlatList
          data={data}
          horizontal
          inverted={isRTL}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PosterCard
              item={item}
              onPress={handlePress}
              showRating
              showType={showType}
              language={language}
              themeColors={themeColors}
            />
          )}
        />
      </View>
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && movies.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>

      {/* ── STICKY HEADER BAR (RTL Dynamic) ─────────────────────────── */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8, paddingBottom: 12, backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}>
        {/* Logo + Brand */}
        <View style={[header.brand, isRTL && { flexDirection: 'row-reverse' }]}>
          <Image
            source={require('../../assets/app-logo-new.png')}
            style={header.logo}
            resizeMode="contain"
          />
          <View style={[header.brandText, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={[header.brandBold, { color: themeColors.text }]}>Taban</Text>
            <Text style={[header.brandBold, { color: '#CC222F' }]}>Play</Text>
          </View>
        </View>

        {/* Right: Bell Notifications */}
        <View style={[header.actions, isRTL && { flexDirection: 'row-reverse' }]}>
          <View>
            <TouchableOpacity 
              style={[header.iconBtn, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]} 
              onPress={() => setShowNotifModal(true)}
              activeOpacity={0.8}
            >
              <Bell size={18} color={themeColors.text} />
              {unreadNotifCount > 0 && <View style={header.notifDot} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={[styles.root, { backgroundColor: themeColors.background }]}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── HERO ───────────────────────────────────── */}
        {renderHero()}

        <View style={[styles.body, { paddingTop: 24 }]}>
          {/* ── TOP 250 ─────────────────────────────────────── */}
          {topContents.length > 0
            ? renderSection(
                language === 'ku' ? 'تۆپ 250' : language === 'ar' ? 'أفضل 250' : 'Top 250',
                topContents.slice(0, 20),
                topContents,
                'Top Contents',
                true // flame icon
              )
            : null}

          {/* ── ALL DYNAMIC MOVIE LISTS (Kurdish Dubbed Movies, Cartoons, Dubbed Series, etc.) ──── */}
          {allDynamicLists.map(([listTitle, listMovies]) => {
            if (!isUnlocked || listMovies.length === 0) return null;

            return renderSection(
              listTitle,
              listMovies.slice(0, 15),
              listMovies,
              listTitle
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Social Media Button */}
      <FloatingSocialButton />

      {/* ── NOTIFICATIONS / ANNOUNCEMENTS INBOX MODAL ───────────────── */}
      <Modal
        visible={showNotifModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifModal(false)}
      >
        <Pressable style={styles.notifOverlay} onPress={() => setShowNotifModal(false)}>
          <Pressable style={[styles.notifSheet, { backgroundColor: themeColors.surface }]} onPress={() => {}}>
            {/* Sheet Handle */}
            <View style={[styles.notifHandle, { backgroundColor: themeColors.border }]} />

            {/* Header */}
            <View style={[styles.notifHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.notifHeaderLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                <Bell size={20} color="#CC222F" />
                <Text style={[styles.notifHeaderTitle, { color: themeColors.text }]}>
                  {language === 'ku' ? 'ئاگادارکردنەوەکان' : language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </Text>
                {notifications.length > 0 && (
                  <View style={[styles.notifBadgeCount, { backgroundColor: themeColors.surfaceLight }]}>
                    <Text style={[styles.notifBadgeCountText, { color: themeColors.textSecondary }]}>
                      {notifications.length}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowNotifModal(false)} style={styles.notifCloseBtn}>
                <X size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {notifications.length === 0 ? (
                <View style={styles.notifEmptyWrap}>
                  <Bell size={42} color={themeColors.textMuted} />
                  <Text style={[styles.notifEmptyText, { color: themeColors.textMuted }]}>
                    {language === 'ku' ? 'هیچ ئاگادارکردنەوە یان تێبینییەک نییە' : language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications available yet'}
                  </Text>
                </View>
              ) : (
                notifications.map((item: any) => {
                  const isPush = item.type === 'push_and_inbox';
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.notifItemCard,
                        { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border },
                        isPush && { borderLeftWidth: 4, borderLeftColor: '#CC222F' }
                      ]}
                    >
                      <View style={[styles.notifItemHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.notifTypeTag, isRTL && { flexDirection: 'row-reverse' }]}>
                          {isPush ? (
                            <>
                              <Bell size={14} color="#CC222F" />
                              <Text style={[styles.notifTypeTagText, { color: '#CC222F' }]}>
                                {language === 'ku' ? '📣 ڕاگەیاندن' : language === 'ar' ? 'إعلان عام' : 'Push Notice'}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Info size={14} color="#2196F3" />
                              <Text style={[styles.notifTypeTagText, { color: '#2196F3' }]}>
                                {language === 'ku' ? '📥 تێبینی / هەواڵ' : language === 'ar' ? 'ملاحظة' : 'Notice'}
                              </Text>
                            </>
                          )}
                        </View>
                        <Text style={[styles.notifTimeText, { color: themeColors.textMuted }]}>
                          {formatNotifTime(item.created_at, language)}
                        </Text>
                      </View>

                      <Text style={[styles.notifItemTitle, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}>
                        {item.title}
                      </Text>

                      <Text style={[styles.notifItemBody, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}>
                        {item.body}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const cardWidth = width * 0.32; // ~3 cards visible on screen
const cardHeight = cardWidth * 1.5;

const card = StyleSheet.create({
  wrap: {
    width: cardWidth,
    marginRight: 12,
  },
  poster: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#CC222F',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  year: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#CC222F',
    fontSize: 13,
    fontWeight: '700',
  },
});

const hero = StyleSheet.create({
  container: {
    width: width,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 14,
  },
  badgeWrap: {
    alignItems: 'flex-end',
    marginTop: 40,
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  contentRow: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  thumbWrap: {
    width: 60,
    height: 86,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#CC222F',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  metaDot: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#CC222F',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  lockedWrap: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161722',
  },
  lockedTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  lockedSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 6,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  section: {
    marginBottom: 28,
  },
  hList: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  notifSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  notifHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  notifHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notifBadgeCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notifBadgeCountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notifCloseBtn: {
    padding: 4,
  },
  notifEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  notifEmptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notifItemCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  notifItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notifTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifTypeTagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  notifTimeText: {
    fontSize: 11,
  },
  notifItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notifItemBody: {
    fontSize: 13,
    lineHeight: 19,
  },
});

// ─── HEADER STYLES ────────────────────────────────────────────────────────
const header = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  brandText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  brandBold: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#CC222F',
    borderWidth: 1.5,
    borderColor: '#0F0F13',
  },
});
