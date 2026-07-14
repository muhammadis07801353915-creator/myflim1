import React, { useState, useEffect, useRef } from 'react';
import { 
  View,
  Text as RNText,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
 } from 'react-native';
import { Text } from '../src/components/Common/CustomText';
import {
  ChevronLeft,
  Send,
  CheckCheck,
  Headset,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useLanguage } from '../src/i18n/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playMessageSound } from '../src/lib/useMessageSound';

const STATUSBAR_HEIGHT =
  Platform.OS === 'ios'
    ? 44
    : Platform.OS === 'android'
    ? StatusBar.currentHeight || 0
    : 20;

export default function SupportChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chatId = params.chatId as string;
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesScrollRef = useRef<ScrollView>(null);
  const realtimeRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.back();
        return;
      }
      setCurrentUserId(data.user.id);
      loadMessages();
    };

    if (chatId) {
      init();
    } else {
      router.back();
    }

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
      }
    };
  }, [chatId]);

  const loadMessages = async () => {
    setLoadingMessages(true);
    
    // Mark as read
    await supabase.from('support_chats').update({ user_unread: 0 }).eq('id', chatId);

    // Fetch messages
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
    
    // Subscribe to new messages
    realtimeRef.current = supabase
      .channel(`support_msgs:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `chat_id=eq.${chatId}` },
        (payload: any) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          
          // Mark as read if admin sends message & play sound
          if (payload.new.sender_type === 'admin') {
            supabase.from('support_chats').update({ user_unread: 0 }).eq('id', chatId);
            playMessageSound();
          }
          
          setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    setLoadingMessages(false);
    setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: false }), 300);
  };

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !currentUserId) return;
    const text = newMessageText.trim();
    setNewMessageText('');
    setSendingMessage(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: currentUserId,
      sender_type: 'user',
      text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { data: savedMsg, error } = await supabase
        .from('support_messages')
        .insert({ chat_id: chatId, sender_id: currentUserId, sender_type: 'user', text })
        .select()
        .single();

      if (error) throw error;
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? savedMsg : m)));
    } catch (err) {
      console.error('Send error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View 
        className="flex-row-reverse items-center justify-between px-4 pb-3 bg-white border-b border-slate-100"
        style={{ paddingTop: STATUSBAR_HEIGHT + 10 }}
      >
        <View className="flex-row-reverse items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <ChevronLeft size={28} color="#CC222F" />
          </TouchableOpacity>
          <View className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 items-center justify-center">
            <Headset size={20} color="#CC222F" />
          </View>
          <View className="items-end">
            <Text className="text-base font-black text-slate-800">{t('support.teamName')}</Text>
            <Text className="text-[10px] text-emerald-500 font-bold">{t('support.online')}</Text>
          </View>
        </View>
      </View>

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
            const isMe = msg.sender_type === 'user';
            const timeStr = msg.created_at
              ? `${new Date(msg.created_at).getHours().toString().padStart(2,'0')}:${new Date(msg.created_at).getMinutes().toString().padStart(2,'0')}`
              : '';
            return (
              <View key={msg.id || idx} className={`flex-row mb-3 ${isMe ? 'justify-start' : 'justify-end'}`}>
                <View className={`max-w-[78%] rounded-[18px] px-4 py-2.5 ${
                  isMe ? 'bg-emerald-500 rounded-tl-sm' : 'bg-white border border-slate-100 shadow-sm rounded-tr-sm'
                }`}>
                  <Text className={`text-[14px] font-bold leading-5 ${isMe ? 'text-white' : 'text-slate-800'} text-right`}>
                    {msg.text}
                  </Text>
                  <View className={`flex-row items-center mt-1 gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View 
          className="bg-white border-t border-slate-100 px-4 flex-row-reverse items-end gap-2"
          style={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 8, paddingTop: 12 }}
        >
          <View className="flex-1 bg-slate-50 flex-row-reverse items-center px-4 py-2 rounded-3xl border border-slate-200 min-h-[44px]">
            <TextInput
              placeholder={t('support.messagePlaceholder')}
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
    </View>
  );
}
