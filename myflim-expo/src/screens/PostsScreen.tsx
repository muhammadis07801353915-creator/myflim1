import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../api/supabase';
import { useAppStore } from '../store/useAppStore';
import { getColors, SPACING, SIZES, COLORS } from '../theme/theme';
import { translations } from '../utils/translations';
import {
  Heart,
  MessageCircle,
  ImagePlus,
  Send,
  X,
  Globe,
  ChevronDown,
  Check,
  Link as LinkIcon,
  FileImage
} from 'lucide-react-native';

interface PostComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  image?: string;
  likes: string[];
  comments: PostComment[];
  created_at: string;
}

const SETTINGS_KEY = 'taban_community_posts';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
];

const PRESET_POST_IMAGES = [
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop', // Jeep
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop', // Porsche
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop', // Cinema
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', // Action
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop', // Anime
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop', // Gaming
];

async function fetchAllPostsFromDB(): Promise<Post[]> {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed)) {
        return parsed.sort(
          (a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    }
  } catch (e) {
    console.warn('fetchPosts error:', e);
  }
  return [];
}

async function saveAllPostsToDB(posts: Post[]) {
  try {
    const { data: existing } = await supabase
      .from('settings')
      .select('key')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (existing) {
      await supabase.from('settings').update({ value: JSON.stringify(posts) }).eq('key', SETTINGS_KEY);
    } else {
      await supabase.from('settings').insert({ key: SETTINGS_KEY, value: JSON.stringify(posts) });
    }
  } catch (e) {
    console.warn('savePosts error:', e);
  }
}

function timeAgo(dateStr: string, language: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return language === 'ku' ? 'ئێستا' : language === 'ar' ? 'الآن' : 'Just now';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return language === 'ku' ? `${m} خولەک` : language === 'ar' ? `${m} دقيقة` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return language === 'ku' ? `${h} کاتژمێر` : language === 'ar' ? `${h} ساعة` : `${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return language === 'ku' ? `${d} ڕۆژ` : language === 'ar' ? `${d} يوم` : `${d}d ago`;
}

export default function PostsScreen() {
  const { theme, language, user } = useAppStore();
  const themeColors = getColors(theme);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const [showImageModal, setShowImageModal] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    const data = await fetchAllPostsFromDB();
    setPosts(data);
    setLoading(false);
  };

  // Launch device photo gallery directly
  const handlePickImageFromGallery = async () => {
    setShowImageModal(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          language === 'ku' ? 'مۆڵەت' : 'Permission Required',
          language === 'ku' ? 'پێویستە مڵەت بدەیت بۆ گەیشتن بە گەلەریی مۆبایلەکەت.' : 'Gallery access permission is required.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setNewPostImage(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setNewPostImage(asset.uri);
        }
      }
    } catch (e) {
      console.warn('ImagePicker error:', e);
    }
  };

  const handlePublish = async () => {
    if (!newPostText.trim() && !newPostImage) return;
    setPublishing(true);

    const userId = user?.name || 'app_user';
    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      user_id: userId,
      user_name: user?.name || 'User',
      user_avatar: user?.image || DEFAULT_AVATARS[0],
      text: newPostText.trim(),
      image: newPostImage || undefined,
      likes: [],
      comments: [],
      created_at: new Date().toISOString(),
    };

    // Optimistic UI
    setPosts(prev => [newPost, ...prev]);
    setNewPostText('');
    setNewPostImage(null);

    try {
      const allPosts = await fetchAllPostsFromDB();
      await saveAllPostsToDB([newPost, ...allPosts]);
    } catch (e) {
      console.error('Publish error:', e);
      loadPosts();
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: string) => {
    const userId = user?.name || 'app_user';

    // 0ms Optimistic Update
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id !== postId) return p;
        const hasLiked = p.likes.includes(userId);
        const newLikes = hasLiked
          ? p.likes.filter(id => id !== userId)
          : [...p.likes, userId];
        return { ...p, likes: newLikes };
      })
    );

    try {
      const allPosts = await fetchAllPostsFromDB();
      const updated = allPosts.map(p => {
        if (p.id !== postId) return p;
        const hasLiked = p.likes.includes(userId);
        return {
          ...p,
          likes: hasLiked
            ? p.likes.filter(id => id !== userId)
            : [...p.likes, userId]
        };
      });
      await saveAllPostsToDB(updated);
    } catch (e) {
      console.error('Like error:', e);
      loadPosts();
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const userId = user?.name || 'app_user';
    const newComment: PostComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      user_id: userId,
      user_name: user?.name || 'User',
      user_avatar: user?.image || DEFAULT_AVATARS[0],
      text,
      created_at: new Date().toISOString(),
    };

    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id !== postId) return p;
        return { ...p, comments: [...p.comments, newComment] };
      })
    );
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      const allPosts = await fetchAllPostsFromDB();
      const updated = allPosts.map(p => {
        if (p.id !== postId) return p;
        return { ...p, comments: [...p.comments, newComment] };
      });
      await saveAllPostsToDB(updated);
    } catch (e) {
      console.error('Comment error:', e);
      loadPosts();
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const userId = user?.name || 'app_user';
    const isLiked = item.likes.includes(userId);
    const showComments = expandedComments[item.id] || false;
    const commentInput = commentInputs[item.id] || '';

    return (
      <View style={[styles.postCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image source={{ uri: item.user_avatar || DEFAULT_AVATARS[0] }} style={styles.avatar} />
          <View style={styles.postHeaderInfo}>
            <Text style={[styles.authorName, { color: themeColors.text }]}>{item.user_name}</Text>
            <View style={styles.timeRow}>
              <Globe color={themeColors.textSecondary} size={12} />
              <Text style={[styles.timeText, { color: themeColors.textSecondary }]}>{timeAgo(item.created_at, language)}</Text>
            </View>
          </View>
        </View>

        {/* Post Text */}
        {!!item.text && (
          <Text style={[styles.postText, { color: themeColors.text }]}>{item.text}</Text>
        )}

        {/* Post Image */}
        {!!item.image && (
          <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
        )}

        {/* Counts */}
        <View style={[styles.countsRow, { borderTopColor: themeColors.border }]}>
          <View style={styles.likesCountRow}>
            {item.likes.length > 0 && (
              <>
                <View style={styles.heartBadge}>
                  <Heart color="#fff" size={10} fill="#fff" />
                </View>
                <Text style={[styles.countText, { color: themeColors.textSecondary }]}>{item.likes.length}</Text>
              </>
            )}
          </View>
          {item.comments.length > 0 && (
            <TouchableOpacity onPress={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))} style={styles.commentsCountRow}>
              <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
                {item.comments.length} {language === 'ku' ? 'کۆمێنت' : 'comments'}
              </Text>
              <ChevronDown color={themeColors.textSecondary} size={14} style={{ transform: [{ rotate: showComments ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Bar */}
        <View style={[styles.actionsRow, { borderTopColor: themeColors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, isLiked && styles.likedActionBtn]}
            onPress={() => handleLike(item.id)}
          >
            <Heart color={isLiked ? '#ef4444' : themeColors.textSecondary} size={18} fill={isLiked ? '#ef4444' : 'transparent'} />
            <Text style={[styles.actionBtnText, { color: isLiked ? '#ef4444' : themeColors.textSecondary }]}>
              {language === 'ku' ? 'بەدڵبوون' : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
          >
            <MessageCircle color={themeColors.textSecondary} size={18} />
            <Text style={[styles.actionBtnText, { color: themeColors.textSecondary }]}>
              {language === 'ku' ? 'کۆمێنت' : 'Comment'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {showComments && (
          <View style={[styles.commentsContainer, { backgroundColor: themeColors.surfaceLight, borderTopColor: themeColors.border }]}>
            {item.comments.map(cmt => (
              <View key={cmt.id} style={styles.commentItem}>
                <Image source={{ uri: cmt.user_avatar || DEFAULT_AVATARS[0] }} style={styles.smallAvatar} />
                <View style={[styles.commentBubble, { backgroundColor: themeColors.surface }]}>
                  <Text style={styles.commentAuthor}>{cmt.user_name}</Text>
                  <Text style={[styles.commentText, { color: themeColors.text }]}>{cmt.text}</Text>
                </View>
              </View>
            ))}

            {/* Comment Input */}
            <View style={styles.commentInputRow}>
              <Image source={{ uri: user?.image || DEFAULT_AVATARS[0] }} style={styles.smallAvatar} />
              <View style={[styles.commentInputContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <TextInput
                  style={[styles.commentInput, { color: themeColors.text }]}
                  placeholder={language === 'ku' ? 'کۆمێنتێک بنووسە...' : 'Write a comment...'}
                  placeholderTextColor={themeColors.textSecondary}
                  value={commentInput}
                  onChangeText={val => setCommentInputs(prev => ({ ...prev, [item.id]: val }))}
                  onSubmitEditing={() => handleComment(item.id)}
                />
                <TouchableOpacity onPress={() => handleComment(item.id)} disabled={!commentInput.trim()}>
                  <Send color={commentInput.trim() ? COLORS.primary : themeColors.textSecondary} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {language === 'ku' ? 'پۆستەکان' : language === 'ar' ? 'المنشورات' : 'Community Posts'}
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Create Post Input Card */}
          <View style={[styles.createCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.createTopRow}>
              <Image
                source={{ uri: user?.image || DEFAULT_AVATARS[0] }}
                style={styles.avatar}
              />
              <TextInput
                style={[styles.createInput, { color: themeColors.text }]}
                multiline
                placeholder={language === 'ku' ? `${user?.name || ''}، چیت لە مێشکتدایە؟` : language === 'ar' ? 'ما الذي تفكر به؟' : "What's on your mind?"}
                placeholderTextColor={themeColors.textSecondary}
                value={newPostText}
                onChangeText={setNewPostText}
              />
            </View>

            {newPostImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: newPostImage }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setNewPostImage(null)}>
                  <X color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={[styles.createActionRow, { borderTopColor: themeColors.border }]}>
              {/* Photo Button: Direct Gallery Pick */}
              <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: themeColors.surfaceLight }]} onPress={handlePickImageFromGallery}>
                <ImagePlus color="#4ade80" size={18} />
                <Text style={[styles.mediaBtnText, { color: '#4ade80' }]}>{language === 'ku' ? 'وێنە' : 'Photo'}</Text>
              </TouchableOpacity>

              {/* Extra options modal trigger */}
              <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: themeColors.surfaceLight, marginLeft: 8 }]} onPress={() => setShowImageModal(true)}>
                <FileImage color="#60a5fa" size={18} />
                <Text style={[styles.mediaBtnText, { color: '#60a5fa' }]}>{language === 'ku' ? 'نموونەکان' : 'Presets'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.publishBtn, (!newPostText.trim() && !newPostImage) && styles.publishBtnDisabled]}
                onPress={handlePublish}
                disabled={publishing || (!newPostText.trim() && !newPostImage)}
              >
                {publishing ? <ActivityIndicator size="small" color="#fff" /> : <Send color="#fff" size={16} />}
                <Text style={styles.publishBtnText}>{language === 'ku' ? 'بڵاوکردنەوە' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Posts Feed */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            posts.map(item => (
              <React.Fragment key={item.id}>
                {renderPostItem({ item })}
              </React.Fragment>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── IMAGE SELECTION MODAL (Gallery + Presets + Link) ──────────────── */}
      <Modal visible={showImageModal} transparent animationType="slide" onRequestClose={() => setShowImageModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowImageModal(false)}>
          <View style={[styles.imageModalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.imageModalHeader}>
              <Text style={[styles.imageModalTitle, { color: themeColors.text }]}>
                {language === 'ku' ? 'هەڵبژاردنی وێنە' : 'Choose Photo'}
              </Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <X color={themeColors.text} size={20} />
              </TouchableOpacity>
            </View>

            {/* Direct Gallery Pick Button inside Modal */}
            <TouchableOpacity style={styles.galleryPickBtn} onPress={handlePickImageFromGallery}>
              <ImagePlus color="#fff" size={20} />
              <Text style={styles.galleryPickBtnText}>
                {language === 'ku' ? 'کردنەوەی گەلەریی مۆبایل 📱' : 'Open Phone Gallery 📱'}
              </Text>
            </TouchableOpacity>

            {/* Custom Image URL Input */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: 'bold', marginVertical: 8 }}>
              {language === 'ku' ? 'یان لینکی وێنە بنووسە:' : 'Or enter Image URL:'}
            </Text>
            <View style={[styles.urlInputRow, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]}>
              <LinkIcon size={16} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.urlInput, { color: themeColors.text }]}
                placeholder="https://..."
                placeholderTextColor={themeColors.textMuted}
                value={customImageUrl}
                onChangeText={setCustomImageUrl}
              />
              {customImageUrl.trim() ? (
                <TouchableOpacity
                  style={styles.urlSubmitBtn}
                  onPress={() => {
                    setNewPostImage(customImageUrl.trim());
                    setCustomImageUrl('');
                    setShowImageModal(false);
                  }}
                >
                  <Check size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Preset Images Grid */}
            <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: 'bold', marginVertical: 10 }}>
              {language === 'ku' ? 'وێنەی پێشنیارکراو:' : 'Sample Photos:'}
            </Text>
            <View style={styles.presetGrid}>
              {PRESET_POST_IMAGES.map((imgUrl, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.presetCard}
                  onPress={() => {
                    setNewPostImage(imgUrl);
                    setShowImageModal(false);
                  }}
                >
                  <Image source={{ uri: imgUrl }} style={styles.presetImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: themeColors.surfaceLight }]} onPress={() => setShowImageModal(false)}>
              <Text style={{ color: themeColors.text, fontWeight: 'bold' }}>{language === 'ku' ? 'داخستن' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  loadingContainer: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 110,
  },
  createCard: {
    borderRadius: SIZES.radius,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  createTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  createInput: {
    flex: 1,
    minHeight: 50,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  previewContainer: {
    position: 'relative',
    marginTop: SPACING.sm,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: SIZES.radius,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  mediaBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  postCard: {
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  postHeaderInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 250,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  likesCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heartBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  likedActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  commentsContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  commentBubble: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: 12,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageModalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  galleryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  galleryPickBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    fontSize: 13,
  },
  urlSubmitBtn: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  closeModalBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
