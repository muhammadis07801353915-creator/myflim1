import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ScrollView,
  Switch,
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
import { 
  Crown, 
  Bell, 
  Shield, 
  ChevronRight,
  Sun,
  Languages,
  Download,
  ScrollText,
  Camera,
  Pencil,
  X,
  CheckCircle2,
  Key,
  Bookmark,
  Clock,
  Settings,
  HelpCircle,
  Info,
  User
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, theme, updateUser, toggleTheme, language, setLanguage, isUnlocked, unlockApp, watchlist } = useAppStore();
  const t = translations[language];
  const themeColors = getColors(theme);
  const isRTL = language === 'ku' || language === 'ar';
  
  const [showProModal, setShowProModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [newName, setNewName] = useState(user.name);
  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const currentVersion = getCurrentVersion();

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

  const renderMenuItem = (icon: any, title: string, subtitle?: string, onPress?: () => void, rightElement?: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, isRTL && { flexDirection: 'row-reverse' }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.menuLeft, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.menuIconBox}>
          {icon}
        </View>
        <View>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={[styles.menuRight, isRTL && { flexDirection: 'row-reverse' }]}>
        {rightElement}
        <ChevronRight size={18} color="rgba(255,255,255,0.4)" style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
      </View>
    </TouchableOpacity>
  );

  const cardW = Math.floor((width - 32 - 20) / 3);

  return (
    <View style={[{ flex: 1, backgroundColor: '#0F0F13', paddingTop: insets.top }]}>
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
              <Text style={styles.greetingText}>
                {language === 'ku' ? `سڵاو، ${user?.name || 'کاربەر'}` : language === 'ar' ? `مرحباً، ${user?.name || 'مستخدم'}` : `Hi, ${user?.name || 'User'}`}
              </Text>
              <TouchableOpacity onPress={() => setShowNameModal(true)}>
                <Text style={styles.editProfileLink}>
                  {language === 'ku' ? 'دەستکاری پرۆفایل >' : language === 'ar' ? 'تعديل الملف الشخصي >' : 'Edit Profile >'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.settingsIconBtn} onPress={() => setShowNameModal(true)}>
            <Settings size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── 3 STATS CARDS ROW (Watchlist / History / Downloads) ──── */}
        <View style={[styles.statsGrid, isRTL && { flexDirection: 'row-reverse' }]}>
          {/* Watchlist */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardW }]} 
            onPress={() => navigation.navigate('Watchlist' as never)}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <Bookmark size={18} color="#CC222F" />
              <View style={styles.badgePlus}>
                <Text style={styles.badgePlusText}>+</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>{language === 'ku' ? 'لیستی بینین' : language === 'ar' ? 'قائمتي' : 'Watchlist'}</Text>
            <Text style={styles.statCount}>{watchlist?.length || 24}</Text>
          </TouchableOpacity>

          {/* History */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardW }]}
            onPress={() => navigation.navigate('History' as never)}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <Clock size={18} color="#CC222F" />
            </View>
            <Text style={styles.statLabel}>{language === 'ku' ? 'مێژوو' : language === 'ar' ? 'السجل' : 'History'}</Text>
            <Text style={styles.statCount}>56</Text>
          </TouchableOpacity>

          {/* Downloads */}
          <TouchableOpacity 
            style={[styles.statCard, { width: cardW }]}
            onPress={() => Alert.alert('Downloads', language === 'ku' ? 'بەشی داگرتنەکان لەم وەشاندایەدا ئامادەیە' : 'Downloads section active.')}
            activeOpacity={0.85}
          >
            <View style={styles.statCardHeader}>
              <Download size={18} color="#CC222F" />
              <View style={styles.badgePlus}>
                <Text style={styles.badgePlusText}>+</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>{language === 'ku' ? 'داگرتنەکان' : language === 'ar' ? 'التنزيلات' : 'Downloads'}</Text>
            <Text style={styles.statCount}>12</Text>
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
              <Text style={styles.proSubtitle}>
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
            <Bookmark size={20} color="rgba(255,255,255,0.85)" />,
            language === 'ku' ? 'لیستی من' : language === 'ar' ? 'قائمتي' : 'My List',
            undefined,
            () => navigation.navigate('Watchlist' as never)
          )}

          {renderMenuItem(
            <Clock size={20} color="rgba(255,255,255,0.85)" />,
            language === 'ku' ? 'بەردەوامبوون لە بینین' : language === 'ar' ? 'متابعة المشاهدة' : 'Continue Watching'
          )}

          {renderMenuItem(
            <Download size={20} color="rgba(255,255,255,0.85)" />,
            language === 'ku' ? 'داگرتنەکان' : language === 'ar' ? 'التنزيلات' : 'Downloads'
          )}

          {renderMenuItem(
            <User size={20} color="rgba(255,255,255,0.85)" />,
            language === 'ku' ? 'ڕێکخستنەکانی هەژمار' : language === 'ar' ? 'إعدادات الحساب' : 'Account Settings',
            undefined,
            () => setShowNameModal(true)
          )}

          {renderMenuItem(
            <Crown size={20} color="#FBBF24" />,
            language === 'ku' ? 'ئابوونەبوون' : language === 'ar' ? 'الاشتراك' : 'Subscription',
            undefined,
            () => setShowProModal(true)
          )}

          {renderMenuItem(
            <Languages size={20} color="rgba(255,255,255,0.85)" />,
            language === 'ku' ? 'زمانی ئەپەکە' : language === 'ar' ? 'لغة التطبيق' : 'Language',
            language.toUpperCase(),
            () => setShowLangModal(true)
          )}

          {renderMenuItem(
            <HelpCircle size={20} color="rgba(255,255,255,0.85)" />,
            language === 'ku' ? 'یارمەتی و پشتیوانی' : language === 'ar' ? 'المساعدة والدعم' : 'Help & Support'
          )}

          {renderMenuItem(
            <Info size={20} color="rgba(255,255,255,0.85)" />,
            language === 'ku' ? 'دەربارەی Taban Play' : language === 'ar' ? 'حول Taban Play' : 'About Taban Play',
            `v${currentVersion}`
          )}
        </View>

        {/* ── UPDATE CHECK CARD ─────────────────────────────────────── */}
        <View style={[styles.menuSection, { marginTop: 10 }]}>
          <View style={styles.updateCard}>
            <View style={[styles.updateHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.updateHeaderLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                <Download size={18} color="#CC222F" />
                <Text style={styles.updateTitle}>App Updates</Text>
              </View>
              {checkingUpdates ? (
                <ActivityIndicator color="#CC222F" />
              ) : (
                <TouchableOpacity onPress={refreshUpdateStatus}>
                  <Text style={styles.refreshText}>Check</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.updateMeta}>Current version: {currentVersion}</Text>

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
              <Text style={styles.updateMeta}>You are using the latest version.</Text>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowNameModal(false)}>
          <View style={styles.nameModalContent}>
            <Text style={styles.nameModalTitle}>{language === 'ku' ? 'دەستکاری ناو' : 'Edit User Name'}</Text>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoFocus
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNameModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
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
          <View style={styles.nameModalContent}>
            <Text style={styles.nameModalTitle}>{t.language}</Text>
            
            <TouchableOpacity 
              style={[styles.langOption, language === 'ku' && styles.langOptionActive]} 
              onPress={() => { setLanguage('ku'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>☀️</Text>
              <Text style={styles.langText}>Kurdish (کوردی)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, language === 'ar' && styles.langOptionActive]} 
              onPress={() => { setLanguage('ar'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>🇮🇶</Text>
              <Text style={styles.langText}>Arabic (عربي)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, language === 'en' && styles.langOptionActive]} 
              onPress={() => { setLanguage('en'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>🇬🇧</Text>
              <Text style={styles.langText}>English</Text>
            </TouchableOpacity>

            <View style={[styles.nameModalActions, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLangModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Unlock Code Modal */}
      <Modal visible={showUnlockModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowUnlockModal(false)}>
          <View style={styles.nameModalContent}>
            <Text style={styles.nameModalTitle}>
              {language === 'ku' ? 'داخڵکردنی کۆد' : 'Enter Code'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 15 }}>
              {language === 'ku' ? 'کۆدی چالاککردنی ئەپەکە بنووسە:' : 'Please enter activation code:'}
            </Text>
            <TextInput
              style={styles.nameInput}
              value={unlockCode}
              onChangeText={setUnlockCode}
              placeholder="Code..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoFocus
              autoCapitalize="none"
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowUnlockModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
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
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  editProfileLink: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: '#161722',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statCount: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
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
    color: 'rgba(255,255,255,0.55)',
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
    backgroundColor: '#161722',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  menuSubtitle: {
    color: 'rgba(255,255,255,0.4)',
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
    backgroundColor: '#161722',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  updateMeta: {
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: '#161722',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nameModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  nameModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.7)',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
