import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Pressable, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Send, User, MessageSquare, Save, ChevronRight, Pencil } from 'lucide-react-native';
import { supabase } from '../api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Comment {
  id: string; user_id: string; content: string; created_at: string;
  profiles: { display_name: string; avatar_url: string } | null;
}
interface Props { movieId: string | number; }

const formatTime = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const COLORS: Record<string, string> = {
  A:'#E53935',B:'#8E24AA',C:'#1E88E5',D:'#00897B',E:'#F4511E',
  F:'#6D4C41',G:'#3949AB',H:'#00ACC1',I:'#43A047',J:'#FB8C00',
};
const avatarColor = (name: string) => COLORS[(name?.[0] || 'A').toUpperCase()] || '#E53935';

export default function CommentSection({ movieId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Login modal
  const [showLogin, setShowLogin] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState('');

  // Edit name modal
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    checkUser();
    fetchComments();
    const ch = supabase.channel(`comments_${movieId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `movie_id=eq.${movieId}` },
        () => fetchComments())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [movieId]);

  const checkUser = async () => {
    // Restore saved session
    const savedUid = await AsyncStorage.getItem('anon_uid');
    const savedName = await AsyncStorage.getItem('anon_name');
    if (savedUid && savedName) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === savedUid) { setUser(user); setDisplayName(savedName); return; }
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const saved = await AsyncStorage.getItem('anon_name');
      setDisplayName(saved || 'User');
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select(`id,content,created_at,user_id,
        profiles!comments_user_id_fkey(display_name,avatar_url)`)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });
    setComments((data as any) || []);
    setLoading(false);
  };

  /**
   * Anonymous login — no email, no code.
   * User just picks a display name, instantly gets a Supabase session.
   */
  const handleLogin = async () => {
    const name = nameInput.trim();
    if (!name) { setAuthMsg('Please enter a name.'); return; }
    if (name.length < 2) { setAuthMsg('Name must be at least 2 characters.'); return; }

    setAuthLoading(true); setAuthMsg('');
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) { setAuthMsg(error?.message || 'Login failed.'); return; }

      const uid = data.user.id;
      await supabase.from('profiles').upsert({
        id: uid, display_name: name,
        avatar_url: '', updated_at: new Date().toISOString(),
      });
      await AsyncStorage.setItem('anon_uid', uid);
      await AsyncStorage.setItem('anon_name', name);

      setUser(data.user);
      setDisplayName(name);
      setShowLogin(false);
      setNameInput('');
    } catch (e: any) {
      setAuthMsg(e?.message || 'Something went wrong.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove(['anon_uid', 'anon_name']);
    setUser(null); setDisplayName('');
  };

  const handleSaveName = async () => {
    if (!editName.trim() || !user) return;
    await supabase.from('profiles').upsert({
      id: user.id, display_name: editName.trim(),
      updated_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem('anon_name', editName.trim());
    setDisplayName(editName.trim());
    setShowEdit(false);
  };

  const handleSendComment = async () => {
    if (!user) { setShowLogin(true); return; }
    if (!newComment.trim()) return;
    setSending(true);
    await supabase.from('comments').insert([{
      movie_id: String(movieId), user_id: user.id, content: newComment.trim(),
    }]);
    setNewComment(''); fetchComments();
    setSending(false);
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const name = item.profiles?.display_name || 'Anonymous';
    return (
      <View style={styles.commentItem}>
        <View style={[styles.avatarCircle, { backgroundColor: avatarColor(name) }]}>
          <Text style={styles.avatarLetter}>{name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentMeta}>
            <Text style={styles.commentAuthor}>{name}</Text>
            <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
          </View>
          <View style={styles.commentBubble}>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageSquare size={20} color="#E53935" />
          <Text style={styles.headerTitle}>Comments</Text>
        </View>
        <Text style={styles.commentCount}>{comments.length}</Text>
      </View>

      {/* List */}
      {loading
        ? <View style={styles.center}><ActivityIndicator color="#E53935" /></View>
        : comments.length === 0
          ? <View style={styles.empty}>
              <MessageSquare size={36} color="#2a2a35" />
              <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
            </View>
          : <FlatList data={comments} renderItem={renderComment}
              keyExtractor={i => i.id} scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }} />}

      <View style={styles.divider} />

      {/* User bar */}
      {user && (
        <View style={styles.userBar}>
          <TouchableOpacity style={styles.userLeft}
            onPress={() => { setEditName(displayName); setShowEdit(true); }}>
            <View style={[styles.userAvatar, { backgroundColor: avatarColor(displayName) }]}>
              <Text style={styles.userAvatarLetter}>{displayName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.userBarName}>{displayName}</Text>
            <Pencil size={13} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOut}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={[styles.inputAvatar, { backgroundColor: user ? avatarColor(displayName) : '#2a2a35' }]}
            onPress={() => !user && setShowLogin(true)}>
            {user
              ? <Text style={styles.avatarLetter}>{displayName[0]?.toUpperCase()}</Text>
              : <User size={16} color="#666" />}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={newComment} onChangeText={setNewComment}
            placeholder={user ? 'Write a comment...' : 'Pick a name to comment...'}
            placeholderTextColor="#555"
            onFocus={() => { if (!user) setShowLogin(true); }}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newComment.trim() || sending) && { opacity: 0.35 }]}
            onPress={handleSendComment} disabled={sending || !newComment.trim()}>
            {sending ? <ActivityIndicator size="small" color="white" /> : <Send size={15} color="white" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ══ LOGIN MODAL ══ */}
      <Modal visible={showLogin} transparent animationType="slide"
        onRequestClose={() => setShowLogin(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowLogin(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            {/* Big avatar preview */}
            <View style={[styles.bigAvatar, { backgroundColor: nameInput ? avatarColor(nameInput) : '#2a2a35' }]}>
              <Text style={styles.bigAvatarLetter}>
                {nameInput ? nameInput[0].toUpperCase() : '?'}
              </Text>
            </View>

            <Text style={styles.sheetTitle}>Choose your Name</Text>
            <Text style={styles.sheetSub}>This name will appear next to your comments.</Text>

            <TextInput
              style={styles.nameInput}
              value={nameInput} onChangeText={setNameInput}
              placeholder="e.g. Kurd Cinema"
              placeholderTextColor="#555"
              maxLength={24}
              autoFocus
            />

            {authMsg ? <Text style={styles.errMsg}>{authMsg}</Text> : null}

            <TouchableOpacity
              style={[styles.loginBtn, authLoading && { opacity: 0.7 }]}
              onPress={handleLogin} disabled={authLoading}>
              {authLoading
                ? <ActivityIndicator color="white" />
                : <>
                    <Text style={styles.loginBtnTxt}>Start Commenting</Text>
                    <ChevronRight size={18} color="white" />
                  </>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelTouchable}
              onPress={() => { setShowLogin(false); setAuthMsg(''); }}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══ EDIT NAME MODAL ══ */}
      <Modal visible={showEdit} transparent animationType="slide"
        onRequestClose={() => setShowEdit(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowEdit(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Change Name</Text>
            <TextInput
              style={styles.nameInput}
              value={editName} onChangeText={setEditName}
              placeholder="New name..."
              placeholderTextColor="#555"
              autoFocus maxLength={24}
            />
            <TouchableOpacity style={styles.loginBtn} onPress={handleSaveName}>
              <Save size={18} color="white" />
              <Text style={[styles.loginBtnTxt, { marginLeft: 8 }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelTouchable} onPress={() => setShowEdit(false)}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  commentCount: { color: '#666', fontSize: 14, fontWeight: '700', backgroundColor: '#1a1d24', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  center: { paddingVertical: 30, alignItems: 'center' },
  empty:  { paddingVertical: 40, alignItems: 'center', gap: 10 },
  emptyText: { color: '#555', textAlign: 'center', fontSize: 14 },
  commentItem: { flexDirection: 'row', marginBottom: 18, gap: 10 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarLetter: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  commentAuthor: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  commentTime: { color: '#555', fontSize: 11 },
  commentBubble: { backgroundColor: '#1a1d24', borderRadius: 14, borderTopLeftRadius: 3, paddingHorizontal: 13, paddingVertical: 9 },
  commentText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
  userBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  userLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  userAvatarLetter: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  userBarName: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  signOut: { color: '#E53935', fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingBottom: 16 },
  inputAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1d24', color: 'white', borderRadius: 22, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#2a2a35' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#13131a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2a2a35', alignSelf: 'center', marginBottom: 28 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  bigAvatarLetter: { color: 'white', fontSize: 34, fontWeight: 'bold' },
  sheetTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  sheetSub:   { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  nameInput:  { backgroundColor: '#0d0d12', color: 'white', borderWidth: 1, borderColor: '#2a2a35', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 18, marginBottom: 20, textAlign: 'center' },
  errMsg: { color: '#E53935', textAlign: 'center', marginBottom: 10, fontSize: 13 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E53935', borderRadius: 16, paddingVertical: 16, marginBottom: 12, gap: 8 },
  loginBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelTouchable: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { color: '#555', fontSize: 14 },
});
