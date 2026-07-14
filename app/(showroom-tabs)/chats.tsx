import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View,
  Text as RNText,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
 } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import {
  ChevronLeft,
  Search,
  Send,
  CheckCheck,
  Phone,
  MoreVertical,
  Car,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUSBAR_HEIGHT =
  Platform.OS === 'ios'
    ? 44
    : Platform.OS === 'android'
    ? StatusBar.currentHeight || 0
    : 20;

const getStorageKey = (uid: string | null) => `@taban_showroom_chats_v2_${uid || 'guest'}`;

export default function ChatsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showroomId, setShowroomId] = useState<string | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);
  const [dbChecked, setDbChecked] = useState(false);

  const hasProcessedAutoStart = useRef(false);
  const messagesScrollRef = useRef<ScrollView>(null);
  const realtimeRef = useRef<any>(null);

  // ── 1. Get current user & detect if Supabase tables exist ───────────
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
        const phone = profile?.phone || user.user_metadata?.phone || (user.email ? user.email.replace('@taban.com', '') : null);
        
        if (phone) {
          const { data: sr } = await supabase.from('showrooms').select('id').eq('phone', phone).order('created_at', { ascending: false }).limit(1).single();
          if (sr) setShowroomId(sr.id);
        }
      }

      try {
        const { error } = await supabase.from('showroom_chats').select('id').limit(1);
        if (!error) {
          setUseSupabase(true);
        }
      } catch {
        setUseSupabase(false);
      }

      setDbChecked(true);
      setIsUserLoaded(true);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUserId(session?.user?.id || null);
      setIsUserLoaded(true);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ── 2. Load chats ────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      let finalChats: any[] = [];

      if (useSupabase && currentUserId && showroomId) {
        // === SUPABASE MODE ===
        // Showrooms only want to see chats where they are the SELLER (showroom_id)
        const { data, error } = await supabase
          .from('showroom_chats')
          .select('*')
          .eq('showroom_id', showroomId)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          finalChats = await Promise.all(
            data.map(async (chat: any) => {
              const otherId = chat.buyer_id;
              let otherName = 'بەکارهێنەر';
              let otherAvatar = null;
              if (otherId) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url, phone')
                  .eq('id', otherId)
                  .maybeSingle();
                otherName = profile?.full_name || profile?.phone || 'بەکارهێنەر';
                otherAvatar = profile?.avatar_url || null;
              }
              return {
                ...chat,
                otherName,
                otherAvatar,
                otherId,
                myUnread: chat.showroom_unread || 0,
              };
            })
          );
        }
      }

      // === ALWAYS MERGE LOCAL MODE (AsyncStorage) ===
      const saved = await AsyncStorage.getItem(getStorageKey(currentUserId));
      if (saved) {
        const localChats = JSON.parse(saved);
        const existingIds = new Set(finalChats.map((c: any) => c.id));
        for (const lc of localChats) {
          if (!existingIds.has(lc.id)) {
            finalChats.push(lc);
          }
        }
      }

      // Sort combined list by most recent
      finalChats.sort((a, b) => {
        const dateA = new Date(a.last_message_at || a.updated_at || 0).getTime();
        const dateB = new Date(b.last_message_at || b.updated_at || 0).getTime();
        return dateB - dateA;
      });

      setChats(finalChats);
    } catch (err) {
      console.error('fetchChats error:', err);
      const saved = await AsyncStorage.getItem(getStorageKey(currentUserId));
      if (saved) setChats(JSON.parse(saved));
    } finally {
      setLoadingChats(false);
    }
  }, [currentUserId, useSupabase]);

  useEffect(() => {
    if (isUserLoaded && dbChecked && showroomId) {
      fetchChats();
    }
  }, [fetchChats, isUserLoaded, dbChecked, showroomId]);



  // ── 4. Open conversation ─────────────────────────────────────────────
  const openConversation = async (chat: any) => {
    setSelectedChat(chat);
    setIsModalVisible(true);
    setLoadingMessages(true);

    if (useSupabase && !chat.isLocal) {
      // Reset unread count for showroom
      await supabase
        .from('showroom_chats')
        .update({ showroom_unread: 0 })
        .eq('id', chat.id);

      // Load messages
      const { data } = await supabase
        .from('showroom_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      setMessages(data || []);

      // Subscribe to new messages for this showroom chat
      realtimeRef.current = supabase
        .channel(`showroom_chat_${chat.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'showroom_messages', filter: `chat_id=eq.${chat.id}` },
          (payload) => {
            const newMsg = payload.new;
            setMessages((prev) => {
              if (prev.find((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: true }), 100);
          }
        )
        .subscribe();
    } else {
      // Local messages
      setMessages(chat.messages || []);
    }

    setLoadingMessages(false);
    setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: false }), 300);
  };

  const closeConversation = () => {
    setIsModalVisible(false);
    setSelectedChat(null);
    setMessages([]);
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
    fetchChats();
  };

  // ── 5. Send message ──────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !selectedChat) return;
    const text = newMessageText.trim();
    setNewMessageText('');
    setSendingMessage(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      chat_id: selectedChat.id,
      sender_id: currentUserId || 'me',
      text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      if (useSupabase && !selectedChat.isLocal && currentUserId) {
        const { data: savedMsg, error } = await supabase
          .from('messages')
          .insert({ chat_id: selectedChat.id, sender_id: currentUserId, text })
          .select()
          .single();

        if (error) throw error;
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? savedMsg : m)));
      } else {
        // Local save
        const newReal = { ...tempMsg, id: Date.now().toString() };
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? newReal : m)));

        const updatedChat = {
          ...selectedChat,
          messages: [...(selectedChat.messages || []), newReal],
          last_message: text,
          last_message_at: new Date().toISOString(),
        };
        setSelectedChat(updatedChat);

        const saved = await AsyncStorage.getItem(getStorageKey(currentUserId));
        const list: any[] = saved ? JSON.parse(saved) : [];
        const updatedList = list.map((c: any) => c.id === updatedChat.id ? updatedChat : c);
        if (!updatedList.find((c: any) => c.id === updatedChat.id)) updatedList.unshift(updatedChat);
        await AsyncStorage.setItem(getStorageKey(currentUserId), JSON.stringify(updatedList));
        setChats(updatedList);
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteChat = (chatId: string, isLocal: boolean) => {
    Alert.alert(
      "سڕینەوەی گفتوگۆ",
      "ئایا دڵنیایت دەتەوێت ئەم گفتوگۆیە بسڕیتەوە؟",
      [
        { text: "نەخێر", style: "cancel" },
        { 
          text: "بەڵێ، بیسڕەوە", 
          style: "destructive",
          onPress: async () => {
            try {
              if (isLocal) {
                const saved = await AsyncStorage.getItem(getStorageKey(currentUserId));
                if (saved) {
                  const list = JSON.parse(saved);
                  const updatedList = list.filter((c: any) => c.id !== chatId);
                  await AsyncStorage.setItem(getStorageKey(currentUserId), JSON.stringify(updatedList));
                }
              } else {
                await supabase.from('showroom_chats').delete().eq('id', chatId);
              }
              setChats(prev => prev.filter(c => c.id !== chatId));
            } catch (err) {
              console.error('Delete chat error:', err);
              Alert.alert('هەڵە', 'نەتوانرا گفتوگۆکە بسڕدرێتەوە');
            }
          }
        }
      ]
    );
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    if (diffDays === 1) return 'دوێنێ';
    return d.toLocaleDateString('ku-IQ');
  };

  const filteredChats = chats.filter(
    (chat) =>
      (chat.otherName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.car_brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.car_model || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 border-b border-slate-100"
        style={{ paddingTop: STATUSBAR_HEIGHT + 10 }}
      >
        <View className="w-8" />
        <Text className="text-2xl font-black text-slate-800 text-center flex-1">
          گفتوگۆکان
        </Text>
        <View className="w-8" />
      </View>

      {/* Search */}
      <View className="px-5 py-3">
        <View className="bg-slate-100 flex-row-reverse items-center px-4 py-3 rounded-2xl">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="گەڕان لە گفتوگۆ یان سەیارە..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 mr-3 text-base font-bold text-right text-slate-800"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* List */}
      {loadingChats ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC222F" />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center pt-24">
              <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-6">
                <MessageSquare size={44} color="#cbd5e1" />
              </View>
              <Text className="text-slate-700 font-black text-xl mb-2">هیچ گفتوگۆیەک نییە</Text>
              <Text className="text-slate-400 font-bold text-sm text-center px-10 leading-6">
                بچۆ سەر پۆستی سەیارەیەک، کلیک بکە لەسەر ئایکۆنی پەیام و "چاتی ناو ئەپ" هەڵبژێرە
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openConversation(item)}
              onLongPress={() => handleDeleteChat(item.id, item.isLocal)}
              delayLongPress={500}
              className="flex-row-reverse items-center py-4 border-b border-slate-50"
            >
              {/* Avatar */}
              <View className="relative ml-4">
                {item.otherAvatar ? (
                  <Image source={{ uri: item.otherAvatar }} className="w-14 h-14 rounded-full" resizeMode="cover" />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center">
                    <Text className="text-slate-500 font-black text-xl">
                      {(item.otherName || '?')[0]}
                    </Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View className="flex-1 items-end">
                <View className="flex-row justify-between items-center w-full mb-1">
                  <Text className="text-xs text-slate-400 font-bold">
                    {formatTime(item.last_message_at || item.updated_at || '')}
                  </Text>
                  <Text className="text-base font-black text-slate-800">{item.otherName}</Text>
                </View>

                {item.car_brand && (
                  <View className="bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5 mb-1 flex-row items-center gap-1 self-end">
                    <Text className="text-[10px] text-slate-500 font-black">
                      {item.car_brand} {item.car_model} ({item.car_year})
                    </Text>
                    <Car size={10} color="#64748b" />
                  </View>
                )}

                <View className="flex-row-reverse justify-between w-full items-center">
                  <Text
                    numberOfLines={1}
                    className={`text-[13px] flex-1 text-right pl-4 ${
                      (item.myUnread || 0) > 0 ? 'text-slate-900 font-black' : 'text-slate-400 font-bold'
                    }`}
                  >
                    {item.last_message}
                  </Text>
                  {(item.myUnread || 0) > 0 ? (
                    <View className="bg-emerald-500 min-w-[20px] h-5 rounded-full items-center justify-center px-1.5">
                      <Text className="text-white text-[10px] font-black">{item.myUnread}</Text>
                    </View>
                  ) : (
                    <CheckCheck size={15} color="#94a3b8" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Conversation Modal ── */}
      {selectedChat && (
        <Modal visible={isModalVisible} animationType="slide" transparent={false} onRequestClose={closeConversation}>
          <SafeAreaView className="flex-1 bg-slate-50">

            {/* Modal Header */}
            <View className="flex-row-reverse items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
              <View className="flex-row-reverse items-center gap-3">
                <TouchableOpacity onPress={closeConversation} className="p-1">
                  <ChevronLeft size={28} color="#CC222F" />
                </TouchableOpacity>
                <View className="relative">
                  {selectedChat.otherAvatar ? (
                    <Image source={{ uri: selectedChat.otherAvatar }} className="w-11 h-11 rounded-full" />
                  ) : (
                    <View className="w-11 h-11 rounded-full bg-slate-200 items-center justify-center">
                      <Text className="text-slate-600 font-black text-lg">
                        {(selectedChat.otherName || '?')[0]}
                      </Text>
                    </View>
                  )}
                  <View className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </View>
                <View className="items-end">
                  <Text className="text-base font-black text-slate-800">{selectedChat.otherName}</Text>
                  <Text className="text-[10px] text-emerald-500 font-bold">Online</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity 
                  onPress={() => Alert.alert('تێبینی', 'بەمزوانە بەردەست دەبێت')}
                  className="w-9 h-9 bg-slate-50 rounded-full items-center justify-center"
                >
                  <Phone size={17} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => Alert.alert('تێبینی', 'بەمزوانە بەردەست دەبێت')}
                  className="w-9 h-9 items-center justify-center"
                >
                  <MoreVertical size={19} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Car Card */}
            {selectedChat.car_brand && (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  if (selectedChat.car_id) {
                    setSelectedChat(null);
                    router.push(`/car/${selectedChat.car_id}`);
                  }
                }}
                className="bg-white border-b border-slate-100 flex-row-reverse items-center justify-between px-4 py-2.5"
              >
                <View className="flex-row-reverse items-center gap-3">
                  {selectedChat.car_image ? (
                    <Image source={{ uri: selectedChat.car_image }} className="w-14 h-10 rounded-xl" resizeMode="cover" />
                  ) : (
                    <View className="w-14 h-10 bg-slate-100 rounded-xl items-center justify-center">
                      <Car size={18} color="#94a3b8" />
                    </View>
                  )}
                  <View className="items-end">
                    <Text className="text-[12px] font-black text-slate-800">
                      {selectedChat.car_brand} {selectedChat.car_model} {selectedChat.car_year}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-bold">بۆ کڕین</Text>
                  </View>
                </View>
                <Text className="text-[#CC222F] font-black text-base">{selectedChat.car_price}</Text>
              </TouchableOpacity>
            )}

            {/* Messages */}
            {loadingMessages ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#CC222F" />
              </View>
            ) : (
              <ScrollView
                ref={messagesScrollRef}
                className="flex-1 px-4 pt-4"
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((msg: any, idx: number) => {
                  const isMe = msg.sender_id === currentUserId || msg.sender_id === 'me';
                  const timeStr = msg.created_at
                    ? `${new Date(msg.created_at).getHours().toString().padStart(2,'0')}:${new Date(msg.created_at).getMinutes().toString().padStart(2,'0')}`
                    : '';
                  return (
                    <View key={msg.id || idx} className={`flex-row mb-3 ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <View className={`max-w-[78%] rounded-[18px] px-4 py-2.5 ${
                        isMe ? 'bg-emerald-500 rounded-tl-sm' : 'bg-white border border-slate-100 shadow-sm rounded-tr-sm'
                      }`}>
                        <Text className={`text-[14px] font-bold leading-5 ${isMe ? 'text-white' : 'text-slate-800'}`}>
                          {msg.text}
                        </Text>
                        <View className="flex-row items-center justify-end mt-1 gap-1">
                          <Text className={`text-[9px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>{timeStr}</Text>
                          {isMe && <CheckCheck size={10} color="rgba(255,255,255,0.8)" />}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
              <View className="bg-white border-t border-slate-100 px-4 py-3 flex-row-reverse items-end gap-2">
                <View className="flex-1 bg-slate-50 flex-row-reverse items-center px-4 py-2 rounded-3xl border border-slate-200 min-h-[44px]">
                  <TextInput
                    placeholder="پەیامێک بنووسە..."
                    value={newMessageText}
                    onChangeText={setNewMessageText}
                    multiline
                    className="flex-1 mr-2 text-[14px] font-bold text-right text-slate-800 max-h-24"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!newMessageText.trim() || sendingMessage}
                  className={`w-11 h-11 rounded-full items-center justify-center ${
                    newMessageText.trim() && !sendingMessage ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  {sendingMessage ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Send size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
