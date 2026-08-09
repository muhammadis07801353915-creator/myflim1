import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, getColors } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { checkForAvailableUpdate, downloadAndInstallUpdate, getCurrentVersion, type AppUpdateInfo } from '../utils/appUpdate';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  CheckCircle2,
  MessageSquare,
  Send,
  Check,
  LogOut
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
];

interface ChatMessage {
  id?: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  message: string;
  sender: 'user' | 'admin';
  created_at: string;
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, theme, toggleTheme, updateUser, language, setLanguage, isUnlocked, unlockApp, watchlist, watchHistory } = useAppStore();
  const t = translations[language] || translations.en;
  const themeColors = getColors(theme);
  const isRTL = language === 'ku' || language === 'ar';
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  
  const [aboutText, setAboutText] = useState('');
  const [unlockCode, setUnlockCode] = useState('');
  const [newName, setNewName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.image || DEFAULT_AVATARS[0]);

  // Auth / Code Modal States
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [authCode, setAuthCode] = useState('Taban Play1');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Support Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const currentVersion = getCurrentVersion();

  const historyItems = watchHistory ? Object.values(watchHistory).sort((a, b) => b.updatedAt - a.updatedAt) : [];

  useEffect(() => {
    async function fetchAbout() {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'about_taban_play').maybeSingle();
        if (data?.value) setAboutText(data.value);
      } catch (e) {
        console.warn(e);
      }
    }
    fetchAbout();
  }, []);

  // Fetch Support Chat messages (Synced with Admin Panel & Web app key 'taban_live_support_chats')
  useEffect(() => {
    if (!showChatModal) return;

    const userName = user?.name || 'app_user';
    const storageKey = `@myflim_chat_history_${userName}`;

    const loadLocalMessages = async () => {
      try {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChatMessages(parsed);
          }
        }
      } catch (e) {
        console.warn('Load local chat error:', e);
      }
    };

    const fetchChatMessages = async () => {
      try {
        const userName = user?.name || 'app_user';
        let msgs: ChatMessage[] = [];

        // 1. Fetch from settings table (taban_live_support_chats - read by Admin Panel)
        const { data: setRes } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'taban_live_support_chats')
          .maybeSingle();

        if (setRes?.value) {
          try {
            const parsed = JSON.parse(setRes.value);
            if (Array.isArray(parsed)) {
              msgs = parsed.filter((m: any) =>
                m.user_id === userName ||
                m.user_name === userName
              );
            }
          } catch (e) {
            console.warn('Parse settings chat error:', e);
          }
        }

        // 2. Fallback query support_messages table
        const { data: suppData } = await supabase
          .from('support_messages')
          .select('*')
          .or(`user_name.eq.${userName},user_id.eq.${userName}`)
          .order('created_at', { ascending: true });

        if (suppData && suppData.length > 0) {
          suppData.forEach((m: any) => {
            if (!msgs.some(x => x.message === m.message && x.created_at === m.created_at)) {
              msgs.push(m as ChatMessage);
            }
          });
        }

        msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (msgs.length > 0) {
          setChatMessages(msgs);
          await AsyncStorage.setItem(storageKey, JSON.stringify(msgs));
        }
      } catch (e) {
        console.warn('Fetch chat messages error:', e);
      }
    };

    loadLocalMessages();
    fetchChatMessages();

    const interval = setInterval(fetchChatMessages, 3000);

    const channel = supabase
      .channel(`mobile_support_chat_${userName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.taban_live_support_chats' },
        () => fetchChatMessages()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [showChatModal, user?.name]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    setSendingChat(true);

    const userName = user?.name || 'User';
    const messageText = chatInput.trim();
    const newMsgObj: ChatMessage = {
      id: 'msg_' + Date.now(),
      user_id: userName,
      user_name: userName,
      user_avatar: user?.image || DEFAULT_AVATARS[0],
      message: messageText,
      sender: 'user',
      created_at: new Date().toISOString(),
    };

    setChatInput('');

    // Update local state and persistent AsyncStorage immediately
    const storageKey = `@myflim_chat_history_${userName}`;
    setChatMessages((prev) => {
      const updated = [...prev, newMsgObj];
      AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    try {
      // 1. Fetch existing list from settings table
      const { data: setRes } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'taban_live_support_chats')
        .maybeSingle();

      let existingList: any[] = [];
      if (setRes?.value) {
        try {
          const parsed = JSON.parse(setRes.value);
          if (Array.isArray(parsed)) existingList = parsed;
        } catch (e) {}
      }

      existingList.push(newMsgObj);

      // 2. Save back to settings table (Admin panel reads this!)
      const jsonVal = JSON.stringify(existingList);
      const { error } = await supabase
        .from('settings')
        .update({ value: jsonVal })
        .eq('key', 'taban_live_support_chats');

      if (error) {
        await supabase.from('settings').insert([{ key: 'taban_live_support_chats', value: jsonVal }]);
      }

      // 3. Fallback insert to support_messages table
      await supabase.from('support_messages').insert([{
        user_id: userName,
        user_name: userName,
        user_avatar: user?.image || DEFAULT_AVATARS[0],
        message: messageText,
        sender: 'user',
      }]);

    } catch (e) {
      console.error('Send chat error:', e);
    } finally {
      setSendingChat(false);
    }
  };

  const fetchRemoteAccounts = async (): Promise<any[]> => {
    try {
      const rawLocal = await AsyncStorage.getItem('@myflim_registered_users');
      const localUsers = rawLocal ? JSON.parse(rawLocal) : [];

      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'taban_registered_user_accounts')
        .maybeSingle();

      if (data && data.value) {
        const remoteUsers = JSON.parse(data.value);
        const mergedMap = new Map<string, any>();
        [...remoteUsers, ...localUsers].forEach(u => {
          if (u && u.username) {
            mergedMap.set(u.username.toLowerCase(), u);
          }
        });
        const mergedList = Array.from(mergedMap.values());
        await AsyncStorage.setItem('@myflim_registered_users', JSON.stringify(mergedList));
        return mergedList;
      }
      return localUsers;
    } catch (e) {
      console.warn('Error fetching remote accounts in App:', e);
      const rawLocal = await AsyncStorage.getItem('@myflim_registered_users');
      return rawLocal ? JSON.parse(rawLocal) : [];
    }
  };

  const saveRemoteAccounts = async (accounts: any[]) => {
    try {
      await AsyncStorage.setItem('@myflim_registered_users', JSON.stringify(accounts));

      const { data } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'taban_registered_user_accounts')
        .maybeSingle();

      if (data && data.id) {
        await supabase
          .from('settings')
          .update({ value: JSON.stringify(accounts) })
          .eq('key', 'taban_registered_user_accounts');
      } else {
        await supabase
          .from('settings')
          .insert([{ key: 'taban_registered_user_accounts', value: JSON.stringify(accounts) }]);
      }
    } catch (e) {
      console.warn('Error saving remote accounts in App:', e);
    }
  };

  const handleRegisterAccount = async () => {
    const code = authCode.trim().toLowerCase();
    const username = authUsername.trim();
    const password = authPassword.trim();

    if (code !== 'taban play1' && code !== 'tabanplay1' && code !== 'myflim1' && code !== 'taban2026' && code !== 'vip2026') {
      Alert.alert(
        language === 'ku' ? 'هەڵە' : 'Error',
        language === 'ku' ? 'کۆدەکە هەڵەیە! تکایە کۆدی Taban Play1 بنووسە.' : 'Invalid Code! Please enter code Taban Play1.'
      );
      return;
    }

    if (!username) {
      Alert.alert(
        language === 'ku' ? 'هەڵە' : 'Error',
        language === 'ku' ? 'تکایە ناوی بەکارهێنەر بنووسە.' : 'Please enter a username.'
      );
      return;
    }

    if (!password) {
      Alert.alert(
        language === 'ku' ? 'هەڵە' : 'Error',
        language === 'ku' ? 'تکایە وشەی نهێنی (پاسۆرد) بنووسە.' : 'Please enter a password.'
      );
      return;
    }

    setAuthLoading(true);
    try {
      const storedUsers = await fetchRemoteAccounts();
      const exists = storedUsers.find((u: any) => u.username.toLowerCase() === username.toLowerCase());

      if (exists) {
        Alert.alert(
          language === 'ku' ? 'هەڵە' : 'Error',
          language === 'ku' ? 'ئەم ناوی بەکارهێنەرە پێشتر بەکارهاتووە. تکایە چوونە ژوورەوە بکە یان ناوێکی تر بنووسە.' : 'Username already taken. Please login or choose another.'
        );
        setAuthLoading(false);
        return;
      }

      const userKey = `usr_${username.toLowerCase()}`;
      const avatar = user?.image || DEFAULT_AVATARS[0];

      const newAcc = {
        id: userKey,
        username,
        password,
        avatar,
        createdAt: new Date().toISOString()
      };

      storedUsers.push(newAcc);
      await saveRemoteAccounts(storedUsers);
      await AsyncStorage.setItem('taban_app_device_user_id', userKey);
      await AsyncStorage.setItem('app_unlocked', 'true');

      await updateUser({ name: username, image: avatar, isPro: true });
      useAppStore.setState({ isUnlocked: true });

      try {
        await supabase.from('profiles').upsert({
          id: userKey,
          display_name: username,
          avatar_url: avatar,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase profile sync warning:', e);
      }

      setShowUnlockModal(false);
      setAuthUsername('');
      setAuthPassword('');
      Alert.alert(
        language === 'ku' ? 'سەرکەوتوو بوو' : 'Success',
        language === 'ku' ? `بەخێربێیت ${username}! هەژمارەکەت بە سەرکەوتوویی دروستکرا.` : `Welcome ${username}! Account successfully created.`
      );
    } catch (e) {
      console.error('Register error:', e);
      Alert.alert('Error', 'Could not create account.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginAccount = async () => {
    const username = authUsername.trim();
    const password = authPassword.trim();

    if (!username) {
      Alert.alert(
        language === 'ku' ? 'هەڵە' : 'Error',
        language === 'ku' ? 'تکایە ناوی بەکارهێنەر بنووسە.' : 'Please enter username.'
      );
      return;
    }

    if (!password) {
      Alert.alert(
        language === 'ku' ? 'هەڵە' : 'Error',
        language === 'ku' ? 'تکایە وشەی نهێنی (پاسۆرد) بنووسە.' : 'Please enter password.'
      );
      return;
    }

    setAuthLoading(true);
    try {
      const storedUsers = await fetchRemoteAccounts();
      const match = storedUsers.find((u: any) => u.username.toLowerCase() === username.toLowerCase());

      if (!match) {
        Alert.alert(
          language === 'ku' ? 'هەڵە' : 'Error',
          language === 'ku' ? 'هیچ ئەکاونتێک دروست نەکراوە بەم ناوی بەکارهێنەرە. تکایە سەرەتا ئەکاونت دروست بکه.' : 'Invalid username or account not found.'
        );
        setAuthLoading(false);
        return;
      }

      match.password = password;
      await saveRemoteAccounts(storedUsers);

      const userKey = match.id || `usr_${username.toLowerCase()}`;
      const avatar = match.avatar || user?.image || DEFAULT_AVATARS[0];

      await AsyncStorage.setItem('taban_app_device_user_id', userKey);
      await AsyncStorage.setItem('app_unlocked', 'true');

      await updateUser({ name: match.username, image: avatar, isPro: true });
      useAppStore.setState({ isUnlocked: true });

      setShowUnlockModal(false);
      setAuthUsername('');
      setAuthPassword('');
      Alert.alert(
        language === 'ku' ? 'سەرکەوتوو بوو' : 'Success',
        language === 'ku' ? `چوونە ژوورەوە بە سەرکەوتوویی ئەنجامدرا. بەخێربێیتەوە ${match.username}!` : `Welcome back ${match.username}!`
      );
    } catch (e) {
      console.error('Login error:', e);
      Alert.alert('Error', 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutAccount = () => {
    Alert.alert(
      language === 'ku' ? 'چوونە دەرەوە لە هەژمار' : 'Log Out',
      language === 'ku' ? 'ئایا دڵنیایت لە چوونە دەرەوە لە هەژمارەکەت؟' : 'Are you sure you want to log out of your account?',
      [
        { text: language === 'ku' ? 'نەخێر' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ku' ? 'بەڵێ، بچۆ دەرەوە' : 'Yes, Log Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('app_unlocked');
            await AsyncStorage.removeItem('user_data');
            await AsyncStorage.removeItem('taban_app_device_user_id');

            useAppStore.setState({
              isUnlocked: false,
              user: {
                name: 'User Name',
                image: DEFAULT_AVATARS[0],
                isPro: false
              }
            });

            Alert.alert(
              language === 'ku' ? 'چوونە دەرەوە' : 'Logged Out',
              language === 'ku' ? 'بە سەرکەوتوویی لە هەژمارەکەت چوویتە دەرەوە.' : 'Successfully logged out.'
            );
          }
        }
      ]
    );
  };

  const handlePickCustomAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const imgUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setSelectedAvatar(imgUri);
      }
    } catch (e) {
      console.warn('Custom avatar pick error:', e);
    }
  };

  const handleUpdateAccount = () => {
    if (newName.trim()) {
      updateUser({ name: newName, image: selectedAvatar });
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
      <View style={[styles.menuLeft, { flex: 1 }, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.menuIconBox}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text 
            style={[styles.menuTitle, { color: themeColors.text }, isRTL && { textAlign: 'right' }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text 
              style={[styles.menuSubtitle, { color: themeColors.textSecondary }, isRTL && { textAlign: 'right' }]}
            >
              {subtitle}
            </Text>
          ) : null}
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
        
        {/* ── TOP HEADER ───────────────────────────────────────────── */}
        <View style={[styles.headerRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.userInfo, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: user?.image || DEFAULT_AVATARS[0] }} 
                style={styles.avatar} 
              />
              <TouchableOpacity style={styles.cameraButton} onPress={() => setShowNameModal(true)}>
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

          {/* Card 2: History / Resume Playback */}
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

          {/* Card 3: Downloads */}
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

        {/* ── ENTER CODE / PRO BANNER (Shown only when logged out) ─────────────────────────────── */}
        {!isUnlocked && (
          <TouchableOpacity style={styles.proBanner} onPress={() => setShowUnlockModal(true)}>
            <View style={[styles.proLeft, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.crownIconCircle}>
                 <Key size={22} color="#CC222F" />
              </View>
              <View style={styles.proTextContainer}>
                <Text style={[styles.proTitle, { color: '#ffffff', fontWeight: '900' }]}>
                  {language === 'ku' ? 'دروستکردنی هەژمار / داخڵکردنی کۆد' : 'Register Account / Enter Code'}
                </Text>
                <Text style={[styles.proSubtitle, { color: 'rgba(255,255,255,0.92)' }]}>
                  {language === 'ku' ? 'کۆدەکە بنووسە بۆ چالاککردنی سەرجەم بەشەکان' : 'Enter code to unlock all sections of the app'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#CC222F" style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
          </TouchableOpacity>
        )}

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

          {/* Support Live Chat (پشتیوانی ڕاستەوخۆ) */}
          {renderMenuItem(
            <MessageSquare size={20} color="#CC222F" />,
            language === 'ku' ? 'پشتیوانی و چاتی ڕاستەوخۆ' : language === 'ar' ? 'الدعم والدردشة المباشرة' : 'Support & Live Chat',
            undefined,
            () => setShowChatModal(true)
          )}

          {/* Language Menu Option */}
          {renderMenuItem(
            <Languages size={20} color={themeColors.text} />,
            language === 'ku' ? 'گۆڕینی زمان' : language === 'ar' ? 'تغيير اللغة' : 'Change Language',
            language.toUpperCase(),
            () => setShowLangModal(true)
          )}

          {renderMenuItem(
            <Info size={20} color={themeColors.text} />,
            language === 'ku' ? 'دەربارەی Taban Play' : language === 'ar' ? 'حول Taban Play' : 'About Taban Play',
            `v${currentVersion}`,
            () => setShowAboutModal(true)
          )}

          {/* Log Out or Register/Login Button */}
          {isUnlocked ? (
            <TouchableOpacity 
              style={[
                styles.menuItem, 
                { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.35)', marginTop: 8 },
                isRTL && { flexDirection: 'row-reverse' }
              ]} 
              onPress={handleLogoutAccount}
              activeOpacity={0.8}
            >
              <View style={[styles.menuLeft, { flex: 1 }, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={styles.menuIconBox}>
                  <LogOut size={20} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: '#ef4444', fontWeight: '800' }, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                    {language === 'ku' ? 'چوونە دەرەوە لە هەژمار' : language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#ef4444" style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.menuItem, 
                { backgroundColor: 'rgba(204, 34, 47, 0.12)', borderColor: 'rgba(204, 34, 47, 0.35)', marginTop: 8 },
                isRTL && { flexDirection: 'row-reverse' }
              ]} 
              onPress={() => setShowUnlockModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuLeft, { flex: 1 }, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={styles.menuIconBox}>
                  <Key size={20} color="#CC222F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: '#CC222F', fontWeight: '800' }, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                    {language === 'ku' ? 'دروستکردنی هەژمار / داخڵکردنی کۆد' : language === 'ar' ? 'إنشاء حساب / إدخال الكود' : 'Register Account / Enter Code'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#CC222F" style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* ── SUPPORT LIVE CHAT MODAL ─────────────────────────────── */}
      <Modal visible={showChatModal} animationType="slide" onRequestClose={() => setShowChatModal(false)}>
        <SafeAreaView style={[styles.chatModalContainer, { backgroundColor: themeColors.background }]}>
          {/* Chat Header */}
          <View style={[styles.chatHeader, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
            <View style={styles.chatHeaderTitleRow}>
              <MessageSquare color={COLORS.primary} size={22} />
              <View>
                <Text style={[styles.chatTitleText, { color: themeColors.text }]}>
                  {language === 'ku' ? 'پشتیوانی تابان پڵەی' : 'Taban Play Support'}
                </Text>
                <Text style={[styles.chatSubTitleText, { color: themeColors.textSecondary }]}>
                  {language === 'ku' ? 'چاتی ڕاستەوخۆ لەگەڵ ئادمن' : 'Live Chat with Admin'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowChatModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.surfaceLight }]}>
              <X size={20} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Messages Feed */}
          <ScrollView contentContainerStyle={styles.chatFeed} showsVerticalScrollIndicator={false}>
            {chatMessages.length === 0 ? (
              <View style={styles.emptyChatWrap}>
                <MessageSquare size={48} color={themeColors.textMuted} />
                <Text style={[styles.emptyChatText, { color: themeColors.textSecondary }]}>
                  {language === 'ku' ? 'چۆن دەتوانین یارمەتیت بدەین؟ نامەکەت بنووسە.' : 'How can we help you? Send us a message.'}
                </Text>
              </View>
            ) : (
              chatMessages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id || index}
                    style={[
                      styles.chatBubbleRow,
                      isUser ? styles.chatBubbleRowUser : styles.chatBubbleRowAdmin
                    ]}
                  >
                    <Image source={{ uri: msg.user_avatar || DEFAULT_AVATARS[0] }} style={styles.chatAvatar} />
                    <View style={[
                      styles.chatBubble,
                      isUser
                        ? { backgroundColor: COLORS.primary }
                        : { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }
                    ]}>
                      <Text style={[styles.chatSenderName, { color: isUser ? '#ffbebe' : COLORS.primary }]}>
                        {msg.user_name}
                      </Text>
                      <Text style={[styles.chatMsgText, { color: isUser ? '#fff' : themeColors.text }]}>
                        {msg.message}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Chat Input Bar */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.chatInputBar, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
              <TextInput
                style={[styles.chatTextInput, { backgroundColor: themeColors.surface, color: themeColors.text, borderColor: themeColors.border }]}
                placeholder={language === 'ku' ? 'نامەیەک بنووسە...' : 'Type a message...'}
                placeholderTextColor={themeColors.textSecondary}
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, !chatInput.trim() && { opacity: 0.5 }]}
                onPress={handleSendChat}
                disabled={sendingChat || !chatInput.trim()}
              >
                {sendingChat ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 10 }}>
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

      {/* ── EDIT ACCOUNT & AVATAR MODAL ─────────────────────────── */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowNameModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.nameModalTitle, { color: themeColors.text }]}>
              {language === 'ku' ? 'ڕێکخستنەکانی پرۆفایل' : 'Edit Profile'}
            </Text>

            {/* Avatar Selector (Preset + Gallery Photo Upload) */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>
              {language === 'ku' ? 'وێنەی پڕۆفایل هەڵبژێرە:' : 'Select Avatar:'}
            </Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
              {/* Custom Upload Button */}
              <TouchableOpacity 
                style={[
                  styles.avatarChoice, 
                  { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border, justifyContent: 'center', alignItems: 'center' },
                  !DEFAULT_AVATARS.includes(selectedAvatar) && styles.avatarChoiceSelected
                ]} 
                onPress={handlePickCustomAvatar}
              >
                {!DEFAULT_AVATARS.includes(selectedAvatar) && selectedAvatar ? (
                  <Image source={{ uri: selectedAvatar }} style={{ width: '100%', height: '100%', borderRadius: 27 }} />
                ) : (
                  <Camera size={20} color="#CC222F" />
                )}
                {!DEFAULT_AVATARS.includes(selectedAvatar) && (
                  <View style={styles.avatarCheckBadge}>
                    <Check size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Preset Avatars */}
              {DEFAULT_AVATARS.map((av, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedAvatar(av)}>
                  <Image source={{ uri: av }} style={[styles.avatarChoice, selectedAvatar === av && styles.avatarChoiceSelected]} />
                  {selectedAvatar === av && (
                    <View style={styles.avatarCheckBadge}>
                      <Check size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Name Input */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>
              {language === 'ku' ? 'ناو:' : 'Name:'}
            </Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name..."
              placeholderTextColor={themeColors.textMuted}
            />

            <View style={styles.nameModalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: themeColors.surfaceLight }]} onPress={() => setShowNameModal(false)}>
                <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateAccount}>
                <Text style={styles.saveBtnText}>{language === 'ku' ? 'پاشەکەوتکردن' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ── LANGUAGE MODAL ───────────────────────────────────────── */}
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

      {/* ── WEBSITE-STYLE AUTHENTICATION & CODE MODAL ───────────────────────── */}
      <Modal visible={showUnlockModal} transparent animationType="fade" onRequestClose={() => setShowUnlockModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowUnlockModal(false)}>
          <Pressable style={[styles.nameModalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border, width: width - 32 }]}>
            
            {/* Modal Header */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[styles.nameModalTitle, { color: themeColors.text, marginBottom: 0, fontSize: 18 }]}>
                {authTab === 'register' 
                  ? (language === 'ku' ? 'دروستکردنی هەژماری نوێ' : language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account')
                  : (language === 'ku' ? 'چوونە ژوورەوە' : language === 'ar' ? 'تسجيل الدخول' : 'Account Log In')
                }
              </Text>
              <TouchableOpacity onPress={() => setShowUnlockModal(false)} style={[styles.closeBtn, { backgroundColor: themeColors.surfaceLight }]}>
                <X size={18} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Top Pink Alert Banner */}
            <View style={{ backgroundColor: 'rgba(204, 34, 47, 0.1)', borderColor: 'rgba(204, 34, 47, 0.3)', borderWidth: 1, padding: 10, borderRadius: 12, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Key size={16} color="#CC222F" />
              <Text style={{ color: themeColors.text, fontSize: 11, fontWeight: '700', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                {language === 'ku' 
                  ? 'تکایە ئەم کۆدە لە بەشی بەکارهێنانی کۆد بنووسە: Taban Play1'
                  : 'Please enter this code in code entry section: Taban Play1'}
              </Text>
            </View>

            {/* Tabs: Register vs Log In */}
            <View style={{ flexDirection: 'row', backgroundColor: themeColors.surfaceLight, borderRadius: 12, padding: 3, marginBottom: 14 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center', backgroundColor: authTab === 'register' ? '#CC222F' : 'transparent' }}
                onPress={() => setAuthTab('register')}
              >
                <Text style={{ color: authTab === 'register' ? '#fff' : themeColors.textSecondary, fontSize: 13, fontWeight: 'bold' }}>
                  {language === 'ku' ? 'تۆماربوون' : language === 'ar' ? 'إنشاء حساب' : 'Register'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center', backgroundColor: authTab === 'login' ? '#CC222F' : 'transparent' }}
                onPress={() => setAuthTab('login')}
              >
                <Text style={{ color: authTab === 'login' ? '#fff' : themeColors.textSecondary, fontSize: 13, fontWeight: 'bold' }}>
                  {language === 'ku' ? 'چوونە ژوورەوە' : language === 'ar' ? 'تسجيل الدخول' : 'Log In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Form */}
            {authTab === 'register' ? (
              <View style={{ gap: 10 }}>
                <View>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {language === 'ku' ? 'کۆدی چالاککردن:' : 'Activation Code:'}
                  </Text>
                  <TextInput
                    style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border, height: 42, fontSize: 13 }]}
                    value={authCode}
                    onChangeText={setAuthCode}
                    placeholder="Taban Play1"
                    placeholderTextColor={themeColors.textMuted}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {language === 'ku' ? 'ناوی بەکارهێنەر:' : 'Username:'}
                  </Text>
                  <TextInput
                    style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border, height: 42, fontSize: 13 }]}
                    value={authUsername}
                    onChangeText={setAuthUsername}
                    placeholder={language === 'ku' ? 'ناوێک هەڵبژێرە...' : 'Choose a username...'}
                    placeholderTextColor={themeColors.textMuted}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {language === 'ku' ? 'وشەی نهێنی (پاسۆرد):' : 'Password:'}
                  </Text>
                  <TextInput
                    style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border, height: 42, fontSize: 13 }]}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    placeholder="******"
                    placeholderTextColor={themeColors.textMuted}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, { marginTop: 6, height: 44, justifyContent: 'center', borderRadius: 12 }]}
                  onPress={handleRegisterAccount}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.saveBtnText, { fontSize: 14, fontWeight: '900' }]}>
                      {language === 'ku' ? 'دروستکردنی هەژمار' : 'Create Account'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Log In Form */
              <View style={{ gap: 10 }}>
                <View>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {language === 'ku' ? 'ناوی بەکارهێنەر:' : 'Username:'}
                  </Text>
                  <TextInput
                    style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border, height: 42, fontSize: 13 }]}
                    value={authUsername}
                    onChangeText={setAuthUsername}
                    placeholder={language === 'ku' ? 'ناوی بەکارهێنەر بنووسە...' : 'Enter username...'}
                    placeholderTextColor={themeColors.textMuted}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                    {language === 'ku' ? 'وشەی نهێنی (پاسۆرد):' : 'Password:'}
                  </Text>
                  <TextInput
                    style={[styles.nameInput, { backgroundColor: themeColors.surfaceLight, color: themeColors.text, borderColor: themeColors.border, height: 42, fontSize: 13 }]}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    placeholder="******"
                    placeholderTextColor={themeColors.textMuted}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, { marginTop: 6, height: 44, justifyContent: 'center', borderRadius: 12 }]}
                  onPress={handleLoginAccount}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.saveBtnText, { fontSize: 14, fontWeight: '900' }]}>
                      {language === 'ku' ? 'چوونە ژوورەوە' : 'Log In'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </Pressable>
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
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F0F13',
  },
  userTextCol: {
    gap: 2,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
  },
  editProfileLink: {
    fontSize: 13,
    fontWeight: '500',
  },
  settingsIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 3 Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePlus: {
    backgroundColor: 'rgba(204, 34, 47, 0.15)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePlusText: {
    color: '#CC222F',
    fontSize: 11,
    fontWeight: '800',
    marginTop: -1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
  },
  statCountSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CC222F',
  },

  // Pro Banner
  proBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#CC222F',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  crownIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTextContainer: {
    flex: 1,
  },
  proTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Menu Items
  menuSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Updates
  updateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  refreshText: {
    color: '#CC222F',
    fontSize: 13,
    fontWeight: '700',
  },
  updateMeta: {
    fontSize: 12,
  },
  updateActionButton: {
    backgroundColor: '#CC222F',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  updateActionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  nameModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  nameModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  nameModalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#CC222F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  avatarChoice: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarChoiceSelected: {
    borderWidth: 3,
    borderColor: '#CC222F',
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#CC222F',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Language Modal
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  langOptionActive: {
    borderWidth: 1,
    borderColor: '#CC222F',
  },
  langFlag: {
    fontSize: 20,
  },
  langText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Sheet Modal Overlay
  modalSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '80%',
    minHeight: 300,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemCardImg: {
    width: 50,
    height: 70,
    borderRadius: 8,
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
    marginTop: 4,
  },
  playMiniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#CC222F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Chat Modal Styles
  chatModalContainer: {
    flex: 1,
  },
  chatHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  chatTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatSubTitleText: {
    fontSize: 11,
  },
  chatFeed: {
    padding: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: 20,
  },
  emptyChatWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyChatText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chatBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  chatBubbleRowUser: {
    flexDirection: 'row-reverse',
  },
  chatBubbleRowAdmin: {
    flexDirection: 'row',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  chatBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  chatSenderName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  chatMsgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  chatTextInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  chatSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
