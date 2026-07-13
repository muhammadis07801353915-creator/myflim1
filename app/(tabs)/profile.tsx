import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Alert, Animated, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { useViewMode } from '../../src/context/ViewModeContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { 
  User as UserIcon, 
  LayoutGrid, 
  List, 
  Car, 
  Heart,
  MessageSquare,
  Phone,
  UserPlus,
  LogOut,
  Pencil,
  ChevronRight,
  MessageCircle,
  Building,
  ChevronLeft,
  Globe,
  Check,
  DollarSign,
  Bot
} from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen() {
  const { viewMode, setViewMode } = useViewMode();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [adminUnread, setAdminUnread] = useState(0);
  const { t, language, setLanguage } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const adminChatRealtimeRef = useRef<any>(null);
  const chatsRealtimeRef = useRef<any>(null);

  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setLangModalVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setLangModalVisible(false));
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentChats = async () => {
    try {
      // First try from Supabase for accurate unread count
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: chatsData } = await supabase
          .from('chats')
          .select('buyer_id, buyer_unread, seller_unread')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
        const { data: showroomChatsData } = await supabase
          .from('showroom_chats')
          .select('buyer_unread')
          .eq('buyer_id', user.id);
        
        let unread = 0;
        if (chatsData) {
          unread += chatsData.reduce((sum: number, c: any) => {
            return sum + (c.buyer_id === user.id ? c.buyer_unread || 0 : c.seller_unread || 0);
          }, 0);
        }
        if (showroomChatsData) {
          unread += showroomChatsData.reduce((sum: number, c: any) => sum + (c.buyer_unread || 0), 0);
        }
        setTotalUnread(unread);
      }
      // Fallback to AsyncStorage
      const saved = await AsyncStorage.getItem('@taban_chats_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentChats(parsed.slice(0, 3));
      }
    } catch (e) {
      // Fallback to AsyncStorage on error
      try {
        const saved = await AsyncStorage.getItem('@taban_chats_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          setRecentChats(parsed.slice(0, 3));
          const unread = parsed.reduce((sum: number, c: any) => sum + (c.myUnread || 0), 0);
          setTotalUnread(unread);
        }
      } catch {}
    }
  };

  const subscribeChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (chatsRealtimeRef.current) supabase.removeChannel(chatsRealtimeRef.current);
    chatsRealtimeRef.current = supabase
      .channel('profile_chats_unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `buyer_id=eq.${user.id}` },
        () => fetchRecentChats()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `seller_id=eq.${user.id}` },
        () => fetchRecentChats()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showroom_chats', filter: `buyer_id=eq.${user.id}` },
        () => fetchRecentChats()
      )
      .subscribe();
  };

  const fetchAdminUnread = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('support_chats')
        .select('user_unread')
        .eq('user_id', user.id)
        .single();
      if (data) setAdminUnread(data.user_unread || 0);
    } catch (e) {}
  };

  const subscribeAdminChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Clean up old subscription
    if (adminChatRealtimeRef.current) {
      supabase.removeChannel(adminChatRealtimeRef.current);
    }
    adminChatRealtimeRef.current = supabase
      .channel('support_chats_user')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_chats', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          setAdminUnread(payload.new.user_unread || 0);
        }
      )
      .subscribe();
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchRecentChats();
      fetchAdminUnread();
      subscribeAdminChat();
      subscribeChats();
      return () => {
        if (adminChatRealtimeRef.current) {
          supabase.removeChannel(adminChatRealtimeRef.current);
        }
        if (chatsRealtimeRef.current) {
          supabase.removeChannel(chatsRealtimeRef.current);
        }
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
    fetchRecentChats();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      t('settings.signOutConfirmTitle'),
      t('settings.signOutConfirmDesc'),
      [
        { text: t('settings.no'), style: "cancel" },
        { 
          text: t('settings.yes'), 
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const handleSupportChat = async () => {
    if (!profile) {
      Alert.alert(t('settings.loginCreateAccount'), '', [
        { text: t('settings.cancel'), style: 'cancel' },
        { text: t('settings.yes'), onPress: () => router.push('/auth/login') }
      ]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if chat exists
      let { data: chat, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is not found
        console.error('Error fetching support chat:', error);
        return;
      }

      if (!chat) {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('support_chats')
          .insert({ user_id: user.id })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating support chat:', createError);
          return;
        }
        chat = newChat;
      }

      router.push(`/support-chat?chatId=${chat.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  const ListMenuItem = ({ icon: Icon, title, onPress, isLast = false, color = "#1f2937", badge = 0 }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-row items-center py-5 ${!isLast ? 'border-b border-gray-50' : ''}`}
    >
      <ChevronRight size={18} color="#CBD5E1" />
      <View className="flex-1" />
      <Text className={`mr-4 font-bold text-[16px]`} style={{ color }}>{title}</Text>
      <View className="relative">
        <Icon size={22} color={color} />
        {badge > 0 && (
          <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#CC222F', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
            <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const languages = [
    { code: 'ckb', label: 'کوردی (سۆرانی)', kurdFlag: true },
    { code: 'ku',  label: 'کوردی (بادینی)', kurdFlag: true },
    { code: 'ar',  label: 'العربية',         flagEmoji: '🇮🇶', kurdFlag: false },
    { code: 'en',  label: 'English',          flagEmoji: '🇬🇧', kurdFlag: false },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1 px-5" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC222F" />
        }
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        <View className="flex-row justify-between items-start pt-12 pb-4">
          <TouchableOpacity 
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100 mt-4"
            onPress={() => router.push('/settings/edit-profile')}
          >
            <Pencil size={18} color="#94a3b8" />
          </TouchableOpacity>
          <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
             {profile?.avatar_url ? (
               <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
             ) : (
               <View className="w-full h-full items-center justify-center">
                 <UserIcon size={40} color="#cbd5e1" />
               </View>
             )}
          </View>
        </View>

        <View className="items-end mb-8">
          <Text className="text-[26px] font-black text-gray-900">{profile?.full_name || t('settings.dearGuest')}</Text>
          <Text className="text-gray-400 font-bold text-[14px] mt-1">{profile?.phone || t('settings.welcome')}</Text>
        </View>

        <Text className="text-right text-[18px] font-black text-gray-800 mb-5">{t('settings.commonActions')}</Text>
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity 
            className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[25px] items-center justify-center shadow-sm"
            onPress={() => router.push('/posts')}
          >
            <UserIcon size={32} color="#1f2937" />
            <Text className="mt-3 font-black text-gray-700 text-[13px]">{t('settings.posts')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[25px] items-center justify-center shadow-sm relative"
            onPress={() => router.push('/chats')}
          >
            <MessageSquare size={32} color="#1f2937" />
            <Text className="mt-3 font-black text-gray-700 text-[13px]">{t('settings.chat')}</Text>
            {totalUnread > 0 && (
              <View className="absolute top-3 right-3 bg-emerald-500 min-w-[20px] h-5 rounded-full items-center justify-center px-1">
                <Text className="text-white text-[10px] font-black">{totalUnread}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Sell */}
          <TouchableOpacity 
            className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[25px] items-center justify-center shadow-sm"
            onPress={() => {
              if (!profile) {
                Alert.alert(t('settings.loginCreateAccount'), '', [
                  { text: t('settings.cancel'), style: 'cancel' },
                  { text: t('settings.yes'), onPress: () => router.push('/auth/login') }
                ]);
              } else {
                router.push('/sell');
              }
            }}
          >
            <Car size={32} color="#1f2937" />
            <Text className="mt-3 font-black text-gray-700 text-[13px]">{t('settings.sell')}</Text>
          </TouchableOpacity>
        </View>

        {/* Second row: Favorites, Currency, AI Chat */}
        <View className="flex-row justify-between mb-8">
          {/* Favorites */}
          <TouchableOpacity
            className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[25px] items-center justify-center shadow-sm"
            onPress={() => router.push('/favorites')}
          >
            <Heart size={32} color="#FF5A5F" fill="#FF5A5F" />
            <Text className="mt-3 font-black text-gray-700 text-[13px]">{t('settings.favoriteCars')}</Text>
          </TouchableOpacity>

          {/* Currency Rates */}
          <TouchableOpacity
            className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[25px] items-center justify-center shadow-sm"
            onPress={() => router.push('/settings/currency-rates')}
          >
            <DollarSign size={32} color="#1f2937" />
            <Text className="mt-3 font-black text-gray-700 text-[13px]" numberOfLines={1}>{t('settings.exchangeRates')}</Text>
          </TouchableOpacity>

          {/* AI Chat */}
          <TouchableOpacity 
            className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[25px] items-center justify-center shadow-sm"
            onPress={() => router.push('/ai-chat')}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#CC222F', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={22} color="white" />
            </View>
            <Text className="mt-3 font-black text-gray-700 text-[13px]">{t('settings.aiChat') || 'چاتی AI'}</Text>
          </TouchableOpacity>
        </View>

        {/* Third row: Language */}
        <View className="flex-row justify-start mb-8">
          {/* Language */}
          <TouchableOpacity
            className="w-[31%] aspect-square bg-white border border-gray-100 rounded-[25px] items-center justify-center shadow-sm"
            onPress={openModal}
          >
            <Globe size={32} color="#1f2937" />
            <Text className="mt-3 font-black text-gray-700 text-[13px]">{t('settings.language')}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center mb-10">
          <View className="flex-row bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
             <TouchableOpacity 
               onPress={() => setViewMode('grid')}
               className={`w-14 h-12 items-center justify-center rounded-xl ${viewMode === 'grid' ? 'bg-[#CC222F]' : 'bg-white'}`}
             >
               <LayoutGrid size={22} color={viewMode === 'grid' ? 'white' : '#94a3b8'} />
             </TouchableOpacity>
             <View className="w-2" />
             <TouchableOpacity 
               onPress={() => setViewMode('list')}
               className={`w-14 h-12 items-center justify-center rounded-xl ${viewMode === 'list' ? 'bg-[#CC222F]' : 'bg-white'}`}
             >
               <List size={22} color={viewMode === 'list' ? 'white' : '#94a3b8'} />
             </TouchableOpacity>
          </View>
          <View className="items-end">
            <Text className="text-[20px] font-black text-gray-800">{t('settings.appLayout')}</Text>
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-right text-[18px] font-black text-gray-400 mb-2">{t('settings.settingsAbout')}</Text>
          <View className="bg-white rounded-3xl">
             <ListMenuItem icon={Phone} title={t('settings.contactUs')} onPress={() => {}} />
             <ListMenuItem icon={MessageCircle} title={t('settings.feedback')} onPress={handleSupportChat} badge={adminUnread} />
             <ListMenuItem icon={UserPlus} title={t('settings.inviteFriends')} onPress={() => {}} />
             <ListMenuItem icon={Building} title={t('settings.companyAccount')} onPress={() => router.push('/settings/company-account')} />
             {profile ? (
               <ListMenuItem icon={LogOut} title={t('settings.signOut')} color="#ef4444" onPress={handleSignOut} isLast={true} />
             ) : (
               <ListMenuItem icon={UserPlus} title={t('settings.loginCreateAccount')} color="#2563eb" onPress={() => router.push('/auth/login')} isLast={true} />
             )}
          </View>
        </View>

      </ScrollView>

      {/* Language Bottom Sheet */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <Animated.View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
                opacity: backdropAnim,
              }}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              transform: [{ translateY: slideAnim }],
              backgroundColor: 'white',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 44,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Drag Handle */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 44, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10 }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <TouchableOpacity
                onPress={closeModal}
                style={{
                  width: 40, height: 40,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <ChevronLeft size={22} color="#64748b" />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>
                {t('settings.languageSelect')}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Language Options */}
            {[
              { code: 'ckb', label: 'کوردی (سۆرانی)', kurdFlag: true },
              { code: 'ku',  label: 'کوردی (بادینی)', kurdFlag: true },
              { code: 'ar',  label: 'العربية',         flagEmoji: '🇮🇶' },
              { code: 'en',  label: 'English',          flagEmoji: '🇬🇧' },
            ].map((lang) => {
              const isActive = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => { setLanguage(lang.code as any); closeModal(); }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 15,
                    paddingHorizontal: 16,
                    marginBottom: 10,
                    borderRadius: 20,
                    backgroundColor: isActive ? '#FFF1F2' : '#F8FAFC',
                    borderWidth: 2,
                    borderColor: isActive ? '#CC222F' : 'transparent',
                  }}
                >
                  {/* Check circle */}
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: isActive ? '#CC222F' : '#E2E8F0',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isActive && <Check size={15} color="white" strokeWidth={3} />}
                  </View>

                  {/* Language name */}
                  <Text style={{
                    flex: 1, textAlign: 'right',
                    fontSize: 17, fontWeight: '800',
                    color: isActive ? '#CC222F' : '#334155',
                    marginHorizontal: 12,
                  }}>
                    {lang.label}
                  </Text>

                  {/* Flag */}
                  <View style={{
                    width: 46, height: 32, borderRadius: 8,
                    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: '#E2E8F0',
                  }}>
                    {lang.kurdFlag ? (
                      <View style={{ width: 46, height: 32 }}>
                        <View style={{ flex: 1, backgroundColor: '#EF4444' }} />
                        <View style={{ flex: 1, backgroundColor: '#F5F5F5' }} />
                        <View style={{ flex: 1, backgroundColor: '#22C55E' }} />
                        <View style={{
                          position: 'absolute', top: '50%', left: '50%',
                          marginTop: -8, marginLeft: -8,
                          width: 16, height: 16, borderRadius: 8,
                          backgroundColor: '#F59E0B',
                        }} />
                      </View>
                    ) : (
                      <Text style={{ fontSize: 22 }}>{lang.flagEmoji}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
