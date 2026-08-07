import React, { useCallback, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, getColors } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { checkForAvailableUpdate, downloadAndInstallUpdate, getCurrentVersion, type AppUpdateInfo } from '../utils/appUpdate';
import { supabase } from '../api/supabase';
import { 
  Crown, 
  ChevronRight,
  Languages,
  Download,
  Camera,
  X,
  Key,
  Bookmark,
  Clock,
  Settings,
  HelpCircle,
  Info,
  User,
  Play,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, theme, toggleTheme, updateUser, language, setLanguage, isUnlocked, unlockApp, watchlist, watchHistory } = useAppStore();
  const t = translations[language];
  const themeColors = getColors(theme);
  const isRTL = language === 'ku' || language === 'ar';
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [unlockCode, setUnlockCode] = useState('');
  const [newName, setNewName] = useState(user.name);
  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const currentVersion = getCurrentVersion();

  const historyItems = watchHistory ? Object.values(watchHistory).sort((a, b) => b.updatedAt - a.updatedAt) : [];

  useEffect(() => {
    async function fetchAbout() {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'about_taban_play').single();
        if (data?.value) setAboutText(data.value);
      } catch (e) {
        console.warn(e);
      }
    }
    fetchAbout();
  }, []);

  const handleUnlockSubmit = async () => {
    const normalized = unlockCode.trim().toLowerCase();
    if (normalized === 'taban play1' || normalized === 'tabanplay1') {
      const success = await unlockApp('myflim1');
      if (success) {
        setShowUnlockModal(false);
        setUnlockCode('');
        Alert.alert(
          language === 'ku' ? 'سەرکەوتوو بوو' : 'Success',
          language === 'ku' ? 'ئەپەکە بە سەرکەوتوویی بەتەواوی کرایەوە!' : 'App successfully unlocked!'
        );
      } else {
        Alert.alert('Error', 'Failed to unlock');
      }
    } else {
      Alert.alert(
        language === 'ku' ? 'هەڵە' : 'Error',
        language === 'ku' ? 'کۆدەکە هەڵەیە، تکایە دووبارە هەوڵبدەرەوە.' : 'Invalid code, please try again.'
      );
    }
  };

  const handleUpdateName = () => {
    if (newName.trim()) {
      updateUser({ name: newName });
      setShowNameModal(false);
    }
  };

  const refreshUpdateStatus = useCallback(async () => {
    try {
      setCheckingUpdates(true);
      const update = await checkForAvailableUpdate();
      setAvailableUpdate(update);
    } catch (error) {
      console.warn('Update check failed:', error);
    } finally {
      setCheckingUpdates(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUpdateStatus();
    }, [refreshUpdateStatus])
  );

  const handleInstallUpdate = async () => {
    if (!availableUpdate) return;

    try {
      setInstallingUpdate(true);
      await downloadAndInstallUpdate(availableUpdate);
    } catch (error) {
      Alert.alert(
        'Update failed',
        'Could not download or install the APK. Make sure Android allows installs from this app.'
      );
    } finally {
      setInstallingUpdate(false);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderMenuItem = (icon: any, title: string, subtitle?: string, onPress?: () => void, rightElement?: any) => (
    <TouchableOpacity 
      style={[
        styles.menuItem, 
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        isRTL && { flexDirection: 'row-reverse' }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.menuLeft, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.menuIconBox}>
          {icon}
        </View>
        <View>
          <Text style={[styles.menuTitle, { color: themeColors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={[styles.menuRight, isRTL && { flexDirection: 'row-reverse' }]}>
        {rightElement}
        <ChevronRight size={18} color={themeColors.textMuted} style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
      </View>
    </TouchableOpacity>
  );

  const cardW = Math.floor((width - 32 - 20) / 3);

  return (
    <View style={[{ flex: 1, backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── TOP HEADER (User Info & Settings Icon) ────────────────── */}
        <View style={[styles.headerRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.userInfo, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: user?.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' }} 
                style={styles.avatar} 
              />
              <TouchableOpacity style={styles.cameraButton} onPress={() => Alert.alert('Notice', 'Image change feature enabled.')}>
                <Camera size={11} color="white" />
              </TouchableOpacity>
            </View>
            <View style={[styles.userTextCol, isRTL && { alignItems: 'flex-end' }]}>
              <Text style={[styles.greetingText, { color: themeColors.text }]}>
                {language === 'ku' ? `سڵاو، ${user?.name || 'کاربەر'}` : language === 'ar' ? `مرحباً، ${user?.name || 'مستخدم'}` : `Hi, ${user?.name || 'User'}`}
              </Text>
              <TouchableOpacity onPress={() => setShowNameModal(true)}>
                <Text style={[styles.editProfileLink, { color: themeColors.textSecondary }]}>
                  {language === 'ku' ? 'دەستکاری پرۆفایل >' : language === 'ar' ? 'تعديل الملف الشخصي >' : 'Edit Profile >'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.settingsIconBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => setShowNameModal(true)}>
            <Settings size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        {/* ── 3 STATS CARDS ROW ────────────────────────────────────── */}
        <View style={[styles.statsGrid, isRTL && { flexDirection: 'row-reverse' }]}>
          {/* Card 1: Saved Items (سەیڤکراوەکان) */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardW, backgroundColor: themeColors.surface, borderColor: themeColors.border }]} 
            onPress={() => setShowSavedModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <Bookmark size={18} color="#CC222F" />
              <View style={styles.badgePlus}>
                <Text style={styles.badgePlusText}>+</Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{language === 'ku' ? 'سەیڤکراوەکان' : language === 'ar' ? 'المحفوظات' : 'Saved'}</Text>
            <Text style={[styles.statCount, { color: themeColors.text }]}>{watchlist?.length || 0}</Text>
          </TouchableOpacity>

          {/* Card 2: History / Resume Playback (لە هەمان شوێن) */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardW, backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={() => setShowHistoryModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <Clock size={18} color="#CC222F" />
            </View>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{language === 'ku' ? 'لە هەمان شوێن' : language === 'ar' ? 'متابعة المشاهدة' : 'Continue Watching'}</Text>
            <Text style={[styles.statCount, { color: themeColors.text }]}>{historyItems.length}</Text>
          </TouchableOpacity>

          {/* Card 3: Downloads (دابەزاندن — Count: بەمزوانە) */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardW, backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={() => Alert.alert('Downloads', language === 'ku' ? 'بەشی دابەزاندن بەمزوانە بەردەست دەبێت!' : 'Downloads section coming soon!')}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <Download size={18} color="#CC222F" />
              <View style={styles.badgePlus}>
                <Text style={styles.badgePlusText}>+</Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{language === 'ku' ? 'دابەزاندن' : language === 'ar' ? 'التنزيلات' : 'Downloads'}</Text>
            <Text style={styles.statCountSmall}>{language === 'ku' ? 'بەمزوانە' : language === 'ar' ? 'قريباً' : 'Coming Soon'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── ENTER CODE / PRO BANNER ─────────────────────────────── */}
        <TouchableOpacity style={styles.proBanner} onPress={() => setShowUnlockModal(true)}>
          <View style={[styles.proLeft, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.crownIconCircle}>
               <Key size={22} color="#CC222F" />
            </View>
            <View style={styles.proTextContainer}>
              <Text style={styles.proTitle}>
                {isUnlocked 
                  ? (language === 'ku' ? 'کۆد چالاککراوە' : 'Code Activated') 
                  : (language === 'ku' ? 'داخڵکردنی کۆد' : 'Enter Code')
                }
              </Text>
              <Text style={[styles.proSubtitle, { color: theme === 'light' ? '#64748B' : 'rgba(255,255,255,0.55)' }]}>
                {isUnlocked 
                  ? (language === 'ku' ? 'سەرجەم بەشەکان بە سەرکەوتوویی کراونەتەوە' : 'All app sections successfully unlocked') 
                  : (language === 'ku' ? 'کۆدەکە بنووسە بۆ چالاککردنی سەرجەم بەشەکان' : 'Enter code to unlock all sections of the app')
                }
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#CC222F" style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </TouchableOpacity>

        {/* ── MENU OPTIONS LIST ────────────────────────────────────── */}
        <View style={styles.menuSection}>
          {renderMenuItem(
            theme === 'dark' ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="#6366F1" />,
            theme === 'dark' ? t.lightMode : t.darkMode,
            undefined,
            toggleTheme
          )}

          {renderMenuItem(
            <User size={20} color={themeColors.text} />,
            language === 'ku' ? 'ڕێکخستنەکانی هەژمار' : language === 'ar' ? 'إعدادات الحساب' : 'Account Settings',
            undefined,
            () => setShowNameModal(true)
          )}

          {/* Subscription Option (Free Notification) */}
          {renderMenuItem(
            <Crown size={20} color="#FBBF24" />,
            language === 'ku' ? 'ئابوونەبوون' : language === 'ar' ? 'الاشتراك' : 'Subscription',
            undefined,
            () => Alert.alert(
              language === 'ku' ? 'ئابوونەبوون' : 'Subscription',
              language === 'ku' ? 'ئابوونەبوون لە تابان پڵەی لەئێستادا بەخۆڕاییە بۆ سەرجەم بەکارهێنەران!' : 'Subscription is currently FREE for all users!'
            )
          )}

          {/* Language Menu Option (گۆڕینی زمان) */}
          {renderMenuItem(
            <Languages size={20} color={themeColors.text} />,
            language === 'ku' ? 'گۆڕینی زمان' : language === 'ar' ? 'تغيير اللغة' : 'Change Language',
            language.toUpperCase(),
            () => setShowLangModal(true)
          )}

          {renderMenuItem(
            <HelpCircle size={20} color={themeColors.text} />,
            language === 'ku' ? 'یارمەتی و پشتیوانی' : language === 'ar' ? 'المساعدة والدعم' : 'Help & Support'
          )}

          {renderMenuItem(
            <Info size={20} color={themeColors.text} />,
            language === 'ku' ? 'دەربارەی Taban Play' : language === 'ar' ? 'حول Taban Play' : 'About Taban Play',
            `v${currentVersion}`,
            () => setShowAboutModal(true)
          )}
        </View>

        {/* ── UPDATE CHECK CARD ─────────────────────────────────────── */}
        <View style={[styles.menuSection, { marginTop: 10 }]}>
          <View style={[styles.updateCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.updateHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.updateHeaderLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                <Download size={18} color="#CC222F" />
                <Text style={[styles.updateTitle, { color: themeColors.text }]}>App Updates</Text>
              </View>
              {checkingUpdates ? (
                <ActivityIndicator color="#CC222F" />
              ) : (
                <TouchableOpacity onPress={refreshUpdateStatus}>
                  <Text style={styles.refreshText}>Check</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.updateMeta, { color: themeColors.textSecondary }]}>Current version: {currentVersion}</Text>

            {availableUpdate ? (
              <TouchableOpacity
                style={[styles.updateActionButton, installingUpdate && { opacity: 0.7 }]}
                onPress={handleInstallUpdate}
                disabled={installingUpdate}
              >
                {installingUpdate ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.updateActionText}>New update available — Download</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={[styles.updateMeta, { color: themeColors.textSecondary }]}>You are using the latest version.</Text>
            )}
          </View>
        </View>

      </ScrollView>

      {/* ── ABOUT TABAN PLAY MODAL ───────────────────────────────── */}
      <Modal visible={showAboutModal} transparent animationType="fade" onRequestClose={() => setShowAboutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAboutModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.modalSheetHeader, { borderBottomColor: themeColors.border, paddingHorizontal: 0, paddingVertical: 10, marginBottom: 12 }, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.modalTitleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Image source={require('../../assets/app-logo-new.png')} style={{ width: 32, height: 32, borderRadius: 8 }} resizeMode="contain" />
                <Text style={[styles.modalSheetTitle, { color: themeColors.text }]}>Taban Play</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAboutModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.surfaceLight }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: themeColors.text, fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 14 }}>
              {aboutText || (language === 'ku' 
                ? 'پلاتفۆرمی تابان پڵەی (Taban Play) پلاتفۆرمێکی سەردەمیانەی ژێرنووس و دۆبلاژی کوردییە بۆ سەیرکردنی نوێترین فیلم، زنجیرە، ئەنیمەیشن، و پەخشی ڕاستەوخۆی کەناڵە تەلەڤیزیۆنییەکان بە بەرزترین کوالێتی HD و بێ پچڕان.'
                : 'Taban Play is the premier Kurdish streaming platform for movies, series, animation, and live TV channels in high definition.')}
            </Text>

            <View style={{ backgroundColor: themeColors.surfaceLight, padding: 12, borderRadius: 14, gap: 8, marginBottom: 14 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#CC222F" />
                <Text style={{ color: themeColors.text, fontSize: 12, fontWeight: '600' }}>{language === 'ku' ? 'نوێترین فیلم و زنجیرە ژێرنووس و دۆبلاژکراوەکان' : 'Latest dubbed & subtitled movies & series'}</Text>
              </View>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#CC222F" />
                <Text style={{ color: themeColors.text, fontSize: 12, fontWeight: '600' }}>{language === 'ku' ? 'پەخشی ڕاستەوخۆی کەناڵە ناوخۆیی و جیهانییەکان' : 'Live streaming of local & international TV channels'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justify: 'space-between', borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 10 }}>
              <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>Version {currentVersion}</Text>
              <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>© 2026 Taban Play</Text>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ── SAVED ITEMS (WATCHLIST) MODAL ──────────────────────────── */}
      <Modal visible={showSavedModal} animationType="slide" transparent onRequestClose={() => setShowSavedModal(false)}>
        <View style={styles.modalSheetOverlay}>
          <View style={[styles.modalSheetContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.modalSheetHeader, { borderBottomColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.modalTitleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Bookmark size={20} color="#CC222F" />
                <Text style={[styles.modalSheetTitle, { color: themeColors.text }]}>{language === 'ku' ? 'سەیڤکراوەکان' : language === 'ar' ? 'المحفوظات' : 'Saved Items'}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSavedModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.surfaceLight }]}>
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {watchlist.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Bookmark size={40} color={themeColors.textMuted} />
                <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{language === 'ku' ? 'هیچ بەرهەمێک سەیڤ نەکراوە' : 'No items saved yet'}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {watchlist.map((item: any) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.itemCardRow, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}
                    onPress={() => {
                      setShowSavedModal(false);
                      navigation.navigate('Detail', { item });
                    }}
                  >
                    <Image source={{ uri: item.image }} style={styles.itemCardImg} resizeMode="cover" />
                    <View style={[styles.itemCardInfo, isRTL && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.itemCardTitle, { color: themeColors.text }]} numberOfLines={1}>{item.title || item.name}</Text>
                      <Text style={[styles.itemCardSub, { color: themeColors.textSecondary }]}>{item.year || item.type}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.playMiniBtn}
                      onPress={() => {
                        setShowSavedModal(false);
                        navigation.navigate('Detail', { item });
                      }}
                    >
                      <Play size={14} color="#fff" fill="#fff" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── CONTINUE WATCHING (HISTORY) MODAL ───────────────────────── */}
      <Modal visible={showHistoryModal} animationType="slide" transparent onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalSheetOverlay}>
          <View style={[styles.modalSheetContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.modalSheetHeader, { borderBottomColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.modalTitleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Clock size={20} color="#CC222F" />
                <Text style={[styles.modalSheetTitle, { color: themeColors.text }]}>{language === 'ku' ? 'لە هەمان شوێن' : language === 'ar' ? 'متابعة المشاهدة' : 'Continue Watching'}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.surfaceLight }]}>
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {historyItems.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Clock size={40} color={themeColors.textMuted} />
                <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{language === 'ku' ? 'هیچ سەیرکردنێکی پێشوو نییە' : 'No watch history yet'}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {historyItems.map((h: any) => (
                  <TouchableOpacity 
                    key={h.item.id} 
                    style={[styles.itemCardRow, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }, isRTL && { flexDirection: 'row-reverse' }]}
                    onPress={() => {
                      setShowHistoryModal(false);
                      navigation.navigate('Detail', { item: h.item, resumeTime: h.timestamp });
                    }}
                  >
                    <Image source={{ uri: h.item.image }} style={styles.itemCardImg} resizeMode="cover" />
                    <View style={[styles.itemCardInfo, isRTL && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.itemCardTitle, { color: themeColors.text }]} numberOfLines={1}>{h.item.title || h.item.name}</Text>
                      <Text style={{ color: '#CC222F', fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                        {language === 'ku' ? `بەردەوامبوون لە ${formatTime(h.timestamp)}` : `Resume at ${formatTime(h.timestamp)}`}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.playMiniBtn}
                      onPress={() => {
                        setShowHistoryModal(false);
                        navigation.navigate('Detail', { item: h.item, resumeTime: h.timestamp });
                      }}
                    >
                      <Play size={14} color="#fff" fill="#fff" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowNameModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.nameModalTitle, { color: themeColors.text }]}>{language === 'ku' ? 'دەستکاری ناو' : 'Edit User Name'}</Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name..."
              placeholderTextColor={themeColors.textMuted}
              autoFocus
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: themeColors.surfaceLight }]} onPress={() => setShowNameModal(false)}>
                <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateName}>
                <Text style={styles.saveBtnText}>{language === 'ku' ? 'پاشەکەوتکردن' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.nameModalTitle, { color: themeColors.text }]}>{language === 'ku' ? 'گۆڕینی زمان' : language === 'ar' ? 'تغيير اللغة' : 'Change Language'}</Text>
            
            <TouchableOpacity 
              style={[styles.langOption, { backgroundColor: themeColors.surfaceLight }, language === 'ku' && styles.langOptionActive]} 
              onPress={() => { setLanguage('ku'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>☀️</Text>
              <Text style={[styles.langText, { color: themeColors.text }]}>Kurdish (کوردی)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, { backgroundColor: themeColors.surfaceLight }, language === 'ar' && styles.langOptionActive]} 
              onPress={() => { setLanguage('ar'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>🇮🇶</Text>
              <Text style={[styles.langText, { color: themeColors.text }]}>Arabic (عربي)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, { backgroundColor: themeColors.surfaceLight }, language === 'en' && styles.langOptionActive]} 
              onPress={() => { setLanguage('en'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>🇬🇧</Text>
              <Text style={[styles.langText, { color: themeColors.text }]}>English</Text>
            </TouchableOpacity>

            <View style={[styles.nameModalActions, { marginTop: 16 }]}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: themeColors.surfaceLight }]} onPress={() => setShowLangModal(false)}>
                <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Unlock Code Modal */}
      <Modal visible={showUnlockModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowUnlockModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.nameModalTitle, { color: themeColors.text }]}>
              {language === 'ku' ? 'داخڵکردنی کۆد' : 'Enter Code'}
            </Text>
            <Text style={{ color: themeColors.textSecondary, marginBottom: 15 }}>
              {language === 'ku' ? 'کۆدی چالاککردنی ئەپەکە بنووسە:' : 'Please enter activation code:'}
            </Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border }]}
              value={unlockCode}
              onChangeText={setUnlockCode}
              placeholder="Code..."
              placeholderTextColor={themeColors.textMuted}
              autoFocus
              autoCapitalize="none"
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: themeColors.surfaceLight }]} onPress={() => setShowUnlockModal(false)}>
                <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUnlockSubmit}>
                <Text style={styles.saveBtnText}>{language === 'ku' ? 'چالاککردن' : 'Activate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 12,
  },

  // Top Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
    padding: 2,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#CC222F',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#181924',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#CC222F',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#0F0F13',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextCol: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  editProfileLink: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3 Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgePlus: {
    backgroundColor: 'rgba(204,34,47,0.15)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePlusText: {
    color: '#CC222F',
    fontSize: 12,
    fontWeight: '900',
    marginTop: -2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '900',
  },
  statCountSmall: {
    color: '#CC222F',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  // Pro Banner
  proBanner: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(204, 34, 47, 0.12)',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(204, 34, 47, 0.3)',
  },
  proLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  crownIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(204, 34, 47, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTextContainer: {
    flex: 1,
  },
  proTitle: {
    color: '#CC222F',
    fontSize: 16,
    fontWeight: '800',
  },
  proSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  // Menu List
  menuSection: {
    paddingHorizontal: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Update card
  updateCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  updateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  updateMeta: {
    fontSize: 12,
  },
  refreshText: {
    color: '#CC222F',
    fontWeight: '700',
    fontSize: 13,
  },
  updateActionButton: {
    marginTop: 10,
    backgroundColor: '#CC222F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  nameModalContent: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  nameModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  nameInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  nameModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#CC222F',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  langOptionActive: {
    backgroundColor: 'rgba(204,34,47,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(204,34,47,0.5)',
  },
  langFlag: {
    fontSize: 20,
  },
  langText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal Sheet (Saved & History)
  modalSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '40%',
    borderWidth: 1,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    gap: 12,
    borderWidth: 1,
  },
  itemCardImg: {
    width: 50,
    height: 65,
    borderRadius: 10,
    backgroundColor: '#000',
  },
  itemCardInfo: {
    flex: 1,
  },
  itemCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  playMiniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#CC222F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
