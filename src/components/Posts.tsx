'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Heart, MessageCircle, Share2, ImagePlus, Send,
  X, MoreHorizontal, Smile, Globe, Loader2,
  ChevronDown, User,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserAccount, DEFAULT_AVATARS } from '../lib/userAuth';
import AuthModal from './AuthModal';
import { useLanguage } from '../lib/LanguageContext';

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

// ─── Loading skeleton shown while client mounts ─────────────
function PostsSkeleton() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F0F13' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'rgba(15,15,19,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>پۆستەکان</span>
      </div>
      <div style={{ maxWidth: 576, margin: '0 auto', padding: '16px 12px' }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#14151c', border: '1px solid rgba(255,255,255,0.07)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#2a2b35' }} />
            <div style={{ flex: 1, height: 32, borderRadius: 8, backgroundColor: '#1a1b25' }} />
          </div>
        </div>
        {[1, 2].map(i => (
          <div key={i} style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#14151c', border: '1px solid rgba(255,255,255,0.07)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#2a2b35' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '40%', height: 12, borderRadius: 6, backgroundColor: '#2a2b35', marginBottom: 6 }} />
                <div style={{ width: '25%', height: 10, borderRadius: 6, backgroundColor: '#1e1f28' }} />
              </div>
            </div>
            <div style={{ width: '90%', height: 12, borderRadius: 6, backgroundColor: '#1e1f28', marginBottom: 6 }} />
            <div style={{ width: '70%', height: 12, borderRadius: 6, backgroundColor: '#1e1f28' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Posts() {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [userAccount, setUserAccount] = useState<ReturnType<typeof getUserAccount>>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setUserAccount(getUserAccount());
    const handleUserUpdate = () => setUserAccount(getUserAccount());
    window.addEventListener('userAccountUpdated', handleUserUpdate);
    return () => window.removeEventListener('userAccountUpdated', handleUserUpdate);
  }, []);

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    const data = await fetchAllPostsFromDB();
    setPosts(data);
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setNewPostImage(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!userAccount) { setShowAuthModal(true); return; }
    if (!newPostText.trim() && !newPostImage) return;
    setPublishing(true);
    try {
      const allPosts = await fetchAllPostsFromDB();
      const newPost: Post = {
        id: `post_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user_id: userAccount.id,
        user_name: userAccount.name,
        user_avatar: userAccount.avatar,
        text: newPostText.trim(),
        image: newPostImage || undefined,
        likes: [],
        comments: [],
        created_at: new Date().toISOString(),
      };
      await saveAllPostsToDB([newPost, ...allPosts]);
      setNewPostText('');
      setNewPostImage(null);
      loadPosts();
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userAccount) { setShowAuthModal(true); return; }
    const allPosts = await fetchAllPostsFromDB();
    const updated = allPosts.map((p) => {
      if (p.id !== postId) return p;
      const hasLiked = p.likes.includes(userAccount.id);
      return { ...p, likes: hasLiked ? p.likes.filter(id => id !== userAccount.id) : [...p.likes, userAccount.id] };
    });
    await saveAllPostsToDB(updated);
    loadPosts();
  };

  const handleComment = async (postId: string) => {
    if (!userAccount) { setShowAuthModal(true); return; }
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const allPosts = await fetchAllPostsFromDB();
    const updated = allPosts.map((p) => {
      if (p.id !== postId) return p;
      const comment: PostComment = {
        id: `cmt_${Date.now()}`,
        user_id: userAccount.id,
        user_name: userAccount.name,
        user_avatar: userAccount.avatar,
        text,
        created_at: new Date().toISOString(),
      };
      return { ...p, comments: [...p.comments, comment] };
    });
    await saveAllPostsToDB(updated);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    loadPosts();
  };

  const handleDeletePost = async (postId: string) => {
    if (!userAccount) return;
    const allPosts = await fetchAllPostsFromDB();
    const post = allPosts.find(p => p.id === postId);
    if (!post || post.user_id !== userAccount.id) return;
    await saveAllPostsToDB(allPosts.filter(p => p.id !== postId));
    loadPosts();
  };

  // Show skeleton (dark bg) while client loads — never show blank white
  if (!mounted) return <PostsSkeleton />;

  const avatar0 = userAccount?.avatar || DEFAULT_AVATARS[0];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F0F13', paddingBottom: 112 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40, padding: '12px 16px',
        backgroundColor: 'rgba(15,15,19,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>
          {language === 'ku' ? 'پۆستەکان' : language === 'ar' ? 'المنشورات' : 'Community Posts'}
        </h1>
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(204,34,47,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={16} color="#CC222F" />
        </div>
      </div>

      <div style={{ maxWidth: 576, margin: '0 auto', padding: '16px 12px' }}>

        {/* ── CREATE POST BOX ── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#14151c', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              {/* Avatar */}
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(204,34,47,0.4)', flexShrink: 0, backgroundColor: '#2a2b35', position: 'relative' }}>
                {userAccount ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar0} alt={userAccount.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} color="#888" />
                  </div>
                )}
              </div>
              {/* Textarea */}
              <textarea
                rows={newPostText ? 3 : 2}
                value={newPostText}
                onClick={() => { if (!userAccount) setShowAuthModal(true); }}
                onChange={(e) => {
                  if (!userAccount) { setShowAuthModal(true); return; }
                  setNewPostText(e.target.value);
                }}
                placeholder={
                  userAccount
                    ? (language === 'ku' ? `${userAccount.name}، چیت لە مێشکتدایە؟` : language === 'ar' ? 'ما الذي تفكر به؟' : "What's on your mind?")
                    : (language === 'ku' ? 'بچۆ ژوورەوە بۆ نووسینی پۆست...' : language === 'ar' ? 'سجل الدخول للنشر...' : 'Login to post...')
                }
                style={{
                  flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none',
                  color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500,
                  resize: 'none', caretColor: '#CC222F',
                  fontFamily: 'inherit', lineHeight: 1.6,
                }}
              />
            </div>

            {/* Image preview */}
            {newPostImage && (
              <div style={{ position: 'relative', marginBottom: 12, borderRadius: 12, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newPostImage} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12 }} />
                <button
                  onClick={() => setNewPostImage(null)}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} color="#fff" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom action row */}
          <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              <button
                onClick={() => { if (!userAccount) { setShowAuthModal(true); return; } fileInputRef.current?.click(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: '#4ade80', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
              >
                <ImagePlus size={15} />
                <span>{language === 'ku' ? 'وێنە' : language === 'ar' ? 'صورة' : 'Photo'}</span>
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: '#fbbf24', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
              >
                <Smile size={15} />
                <span>{language === 'ku' ? 'هەستیار' : language === 'ar' ? 'شعور' : 'Feeling'}</span>
              </button>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing || (!newPostText.trim() && !newPostImage)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 10, border: 'none', cursor: publishing || (!newPostText.trim() && !newPostImage) ? 'not-allowed' : 'pointer',
                backgroundColor: publishing || (!newPostText.trim() && !newPostImage) ? 'rgba(204,34,47,0.4)' : '#CC222F',
                color: '#fff', fontSize: 12, fontWeight: 900, fontFamily: 'inherit',
                opacity: publishing || (!newPostText.trim() && !newPostImage) ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {publishing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              <span>{language === 'ku' ? 'بڵاوکردنەوە' : language === 'ar' ? 'نشر' : 'Post'}</span>
            </button>
          </div>
        </div>

        {/* ── POSTS FEED ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64, paddingBottom: 64 }}>
            <Loader2 size={32} color="#CC222F" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(204,34,47,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MessageCircle size={28} color="#CC222F" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, margin: 0 }}>
              {language === 'ku' ? 'هیچ پۆستێک نییە. یەکەم کەس بە!' : language === 'ar' ? 'لا منشورات. كن أول من ينشر!' : 'No posts yet. Be the first!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userAccount={userAccount}
                language={language}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDeletePost}
                commentInput={commentInputs[post.id] || ''}
                setCommentInput={(val) => setCommentInputs(prev => ({ ...prev, [post.id]: val }))}
                showComments={expandedComments[post.id] || false}
                toggleComments={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                onAuthRequired={() => setShowAuthModal(true)}
              />
            ))}
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// POST CARD — fully inline styles, no Tailwind
// ─────────────────────────────────────────────
function PostCard({
  post, userAccount, language,
  onLike, onComment, onDelete,
  commentInput, setCommentInput,
  showComments, toggleComments, onAuthRequired,
}: {
  post: Post;
  userAccount: ReturnType<typeof getUserAccount>;
  language: string;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onDelete: (id: string) => void;
  commentInput: string;
  setCommentInput: (val: string) => void;
  showComments: boolean;
  toggleComments: () => void;
  onAuthRequired: () => void;
}) {
  const isLiked = userAccount ? post.likes.includes(userAccount.id) : false;
  const isOwner = userAccount?.id === post.user_id;
  const postAvatar = post.user_avatar || DEFAULT_AVATARS[0];

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#14151c', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(204,34,47,0.3)', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={postAvatar} alt={post.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: '#fff', lineHeight: 1 }}>{post.user_name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Globe size={11} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{timeAgo(post.created_at, language)}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => { if (confirm(language === 'ku' ? 'ئایا دڵنیایت لە سڕینەوەی پۆستەکە؟' : 'Delete this post?')) onDelete(post.id); }}
            style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)' }}
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>

      {/* Text */}
      {post.text && (
        <div style={{ padding: '0 16px 14px' }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.text}</p>
        </div>
      )}

      {/* Image */}
      {post.image && (
        <div style={{ width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt="post" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Like/comment counts */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {post.likes.length > 0 && (
            <>
              <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={10} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{post.likes.length}</span>
            </>
          )}
        </div>
        {post.comments.length > 0 && (
          <button onClick={toggleComments} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.35)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span>{post.comments.length} {language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'comment'}</span>
            <ChevronDown size={13} style={{ transform: showComments ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ padding: '4px 8px 10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 4 }}>
        {[
          { label: language === 'ku' ? 'بەدڵبوون' : language === 'ar' ? 'إعجاب' : 'Like', icon: <Heart size={17} color={isLiked ? '#ef4444' : 'rgba(255,255,255,0.4)'} fill={isLiked ? '#ef4444' : 'none'} />, active: isLiked, action: () => { if (!userAccount) { onAuthRequired(); return; } onLike(post.id); } },
          { label: language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'Comment', icon: <MessageCircle size={17} color="rgba(255,255,255,0.4)" />, active: false, action: toggleComments },
          { label: language === 'ku' ? 'بەشکردن' : language === 'ar' ? 'مشاركة' : 'Share', icon: <Share2 size={17} color="rgba(255,255,255,0.4)" />, active: false, action: () => { if (navigator.share) navigator.share({ text: post.text, url: window.location.href }); } },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: btn.active ? 'rgba(239,68,68,0.1)' : 'transparent',
              color: btn.active ? '#ef4444' : 'rgba(255,255,255,0.4)',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {btn.icon}
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#111219' }}>
          {post.comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.user_avatar || DEFAULT_AVATARS[0]} alt={c.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-block', borderRadius: '0 12px 12px 12px', padding: '8px 12px', backgroundColor: '#1a1b27', maxWidth: '100%' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 900, color: '#CC222F' }}>{c.user_name}</p>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.8)', wordBreak: 'break-word' }}>{c.text}</p>
                </div>
                <p style={{ margin: '4px 0 0 4px', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{timeAgo(c.created_at, language)}</p>
              </div>
            </div>
          ))}
          {/* Comment input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              {userAccount ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userAccount.avatar || DEFAULT_AVATARS[0]} alt={userAccount.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2b35' }}>
                  <User size={14} color="#888" />
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 20, padding: '6px 12px', backgroundColor: '#1a1b27', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                value={commentInput}
                onChange={(e) => { if (!userAccount) { onAuthRequired(); return; } setCommentInput(e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onComment(post.id); } }}
                onClick={() => { if (!userAccount) onAuthRequired(); }}
                placeholder={
                  userAccount
                    ? (language === 'ku' ? 'کۆمێنتێک بنووسە...' : language === 'ar' ? 'اكتب تعليقًا...' : 'Write a comment...')
                    : (language === 'ku' ? 'بچۆ ژوورەوە...' : 'Login to comment...')
                }
                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'rgba(255,255,255,0.85)', caretColor: '#CC222F', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => onComment(post.id)}
                disabled={!commentInput.trim()}
                style={{ backgroundColor: 'transparent', border: 'none', cursor: commentInput.trim() ? 'pointer' : 'default', opacity: commentInput.trim() ? 1 : 0.3, color: '#CC222F', display: 'flex', alignItems: 'center' }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
