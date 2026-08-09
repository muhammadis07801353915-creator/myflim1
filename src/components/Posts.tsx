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
        const sanitized = parsed.map((p: any) => ({
          ...p,
          likes: Array.isArray(p.likes) ? Array.from(new Set(p.likes)) : [],
          comments: Array.isArray(p.comments) ? p.comments : [],
        }));
        return sanitized.sort(
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
    <div className="min-h-screen bg-[#0F0F13] light-mode:bg-[#f8fafc]">
      <div className="sticky top-0 z-40 bg-[#0F0F13]/95 light-mode:bg-white/95 border-b border-white/7 light-mode:border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-black text-white light-mode:text-slate-900">پۆستەکان</span>
      </div>
      <div className="max-w-xl mx-auto px-3 pt-4 space-y-3">
        <div className="rounded-2xl bg-[#14151c] light-mode:bg-white border border-white/7 light-mode:border-slate-200 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-800 light-mode:bg-slate-200" />
            <div className="flex-1 h-8 rounded-xl bg-neutral-800 light-mode:bg-slate-100" />
          </div>
        </div>
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl bg-[#14151c] light-mode:bg-white border border-white/7 light-mode:border-slate-200 p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 light-mode:bg-slate-200" />
              <div className="space-y-1.5 flex-1">
                <div className="w-1/3 h-3 rounded bg-neutral-800 light-mode:bg-slate-200" />
                <div className="w-1/4 h-2.5 rounded bg-neutral-800/60 light-mode:bg-slate-100" />
              </div>
            </div>
            <div className="w-full h-3 rounded bg-neutral-800/80 light-mode:bg-slate-200" />
            <div className="w-3/4 h-3 rounded bg-neutral-800/80 light-mode:bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
function checkIsLiked(likes: string[], userAcc: ReturnType<typeof getUserAccount>): boolean {
  if (!userAcc || !Array.isArray(likes)) return false;
  const targetId = userAcc.id.toLowerCase();
  const targetName = userAcc.name.toLowerCase();
  const targetKey = `usr_${targetName}`;
  return likes.some(l => {
    const lower = String(l).toLowerCase();
    return lower === targetId || lower === targetName || lower === targetKey;
  });
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

    // 1. Instant Optimistic UI Update (0ms delay)
    setPosts(prev => [newPost, ...prev]);
    setNewPostText('');
    setNewPostImage(null);

    try {
      const allPosts = await fetchAllPostsFromDB();
      await saveAllPostsToDB([newPost, ...allPosts]);
    } catch (e) {
      console.error("Publish error:", e);
      loadPosts();
    } finally {
      setPublishing(false);
    }
  };



  const handleLike = async (postId: string) => {
    if (!userAccount) { setShowAuthModal(true); return; }

    const userKey = `usr_${userAccount.name.trim().toLowerCase()}`;

    const updateLikesArray = (existingLikes: string[]) => {
      const arr = Array.isArray(existingLikes) ? existingLikes : [];
      const hasLiked = checkIsLiked(arr, userAccount);
      if (hasLiked) {
        const targetId = userAccount.id.toLowerCase();
        const targetName = userAccount.name.toLowerCase();
        const targetKey = `usr_${targetName}`;
        return arr.filter(l => {
          const lower = String(l).toLowerCase();
          return lower !== targetId && lower !== targetName && lower !== targetKey;
        });
      } else {
        return Array.from(new Set([...arr, userKey]));
      }
    };

    // 1. INSTANT OPTIMISTIC UI UPDATE (0ms delay!)
    setPosts(prevPosts =>
      prevPosts.map(p => p.id === postId ? { ...p, likes: updateLikesArray(p.likes) } : p)
    );

    // 2. Persist to DB asynchronously in background
    try {
      const allPosts = await fetchAllPostsFromDB();
      const updated = allPosts.map(p => p.id === postId ? { ...p, likes: updateLikesArray(p.likes) } : p);
      await saveAllPostsToDB(updated);
      setPosts(updated);
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleComment = async (postId: string) => {
    if (!userAccount) { setShowAuthModal(true); return; }
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: PostComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      user_id: userAccount.id,
      user_name: userAccount.name,
      user_avatar: userAccount.avatar,
      text,
      created_at: new Date().toISOString(),
    };

    // 1. INSTANT OPTIMISTIC COMMENT UPDATE (0ms delay!)
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id !== postId) return p;
        return { ...p, comments: [...p.comments, newComment] };
      })
    );
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    // 2. Persist to DB asynchronously in background
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

  const handleDeletePost = async (postId: string) => {
    if (!userAccount) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      const allPosts = await fetchAllPostsFromDB();
      const post = allPosts.find(p => p.id === postId);
      if (!post || post.user_id !== userAccount.id) return;
      await saveAllPostsToDB(allPosts.filter(p => p.id !== postId));
    } catch (e) {
      console.error('Delete post error:', e);
      loadPosts();
    }
  };

  if (!mounted) return <PostsSkeleton />;

  const avatar0 = userAccount?.avatar || DEFAULT_AVATARS[0];

  return (
    <div className="min-h-screen bg-[#0F0F13] light-mode:bg-[#f8fafc] pb-28 text-white light-mode:text-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0F0F13]/95 light-mode:bg-white/95 backdrop-blur-md border-b border-white/7 light-mode:border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-black text-white light-mode:text-slate-900">
          {language === 'ku' ? 'پۆستەکان' : language === 'ar' ? 'المنشورات' : 'Community Posts'}
        </h1>
        <div className="w-8 h-8 rounded-full bg-[#CC222F]/15 flex items-center justify-center">
          <Globe size={16} className="text-[#CC222F]" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 pt-4 space-y-4">
        {/* ── CREATE POST BOX ── */}
        <div className="bg-[#14151c] light-mode:bg-white rounded-2xl border border-white/8 light-mode:border-slate-200/80 shadow-md light-mode:shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border-2 border-[#CC222F]/40 bg-neutral-800 light-mode:bg-slate-200">
                {userAccount ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar0} alt={userAccount.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={18} className="text-neutral-400 light-mode:text-slate-500" />
                  </div>
                )}
              </div>

              {/* Textarea container */}
              <div className="flex-1 bg-[#1a1b27] light-mode:bg-slate-100 rounded-xl p-3 border border-white/6 light-mode:border-slate-200 transition focus-within:border-[#CC222F] light-mode:focus-within:border-[#CC222F]">
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
                  className="w-full bg-transparent text-white light-mode:text-slate-900 placeholder:text-white/40 light-mode:placeholder:text-slate-400 text-sm font-medium resize-none outline-none border-none p-0 focus:ring-0"
                />
              </div>
            </div>

            {/* Image preview */}
            {newPostImage && (
              <div className="relative mb-3 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newPostImage} alt="preview" className="w-full max-h-60 object-cover rounded-xl" />
                <button
                  onClick={() => setNewPostImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom action row */}
          <div className="px-4 pb-3 pt-3 flex items-center justify-between border-t border-white/6 light-mode:border-slate-100">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button
                onClick={() => { if (!userAccount) { setShowAuthModal(true); return; } fileInputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 light-mode:bg-slate-100 hover:bg-white/10 light-mode:hover:bg-slate-200 transition text-[#4ade80] text-xs font-semibold"
              >
                <ImagePlus size={15} />
                <span>{language === 'ku' ? 'وێنە' : language === 'ar' ? 'صورة' : 'Photo'}</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 light-mode:bg-slate-100 hover:bg-white/10 light-mode:hover:bg-slate-200 transition text-amber-400 text-xs font-semibold"
              >
                <Smile size={15} />
                <span>{language === 'ku' ? 'هەستیار' : language === 'ar' ? 'شعور' : 'Feeling'}</span>
              </button>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing || (!newPostText.trim() && !newPostImage)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#CC222F] hover:bg-red-700 text-white text-xs font-black disabled:opacity-40 transition shadow-md shadow-red-600/20"
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{language === 'ku' ? 'بڵاوکردنەوە' : language === 'ar' ? 'نشر' : 'Post'}</span>
            </button>
          </div>
        </div>

        {/* ── POSTS FEED ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="text-[#CC222F] animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#CC222F]/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={28} className="text-[#CC222F]" />
            </div>
            <p className="text-sm font-semibold text-white/40 light-mode:text-slate-400">
              {language === 'ku' ? 'هیچ پۆستێک نییە. یەکەم کەس بە!' : language === 'ar' ? 'لا منشورات. كن أول من ينشر!' : 'No posts yet. Be the first!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
    </div>
  );
}

// ─────────────────────────────────────────────
// POST CARD
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
  const isLiked = checkIsLiked(post.likes, userAccount);
  const isOwner = userAccount?.id === post.user_id;
  const postAvatar = post.user_avatar || DEFAULT_AVATARS[0];

  return (
    <div className="bg-[#14151c] light-mode:bg-white rounded-2xl border border-white/8 light-mode:border-slate-200/80 shadow-md light-mode:shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border-2 border-[#CC222F]/30 bg-neutral-800 light-mode:bg-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={postAvatar} alt={post.user_name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-black text-sm text-white light-mode:text-slate-900 leading-none">{post.user_name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Globe size={11} className="text-white/30 light-mode:text-slate-400" />
              <span className="text-[11px] text-white/35 light-mode:text-slate-400">{timeAgo(post.created_at, language)}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => { if (confirm(language === 'ku' ? 'ئایا دڵنیایت لە سڕینەوەی پۆستەکە؟' : 'Delete this post?')) onDelete(post.id); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 light-mode:text-slate-400 hover:text-red-500 transition"
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>

      {/* Text */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-sm text-white/90 light-mode:text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{post.text}</p>
        </div>
      )}

      {/* Image */}
      {post.image && (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt="post" className="w-full max-h-96 object-cover block" />
        </div>
      )}

      {/* Like/comment counts */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-white/5 light-mode:border-slate-100">
        <div className="flex items-center gap-1.5">
          {post.likes.length > 0 && (
            <>
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <Heart size={10} className="text-white fill-white" />
              </div>
              <span className="text-xs font-semibold text-white/45 light-mode:text-slate-500">{post.likes.length}</span>
            </>
          )}
        </div>
        {post.comments.length > 0 && (
          <button onClick={toggleComments} className="flex items-center gap-1 text-xs text-white/35 light-mode:text-slate-500 hover:text-white/70 light-mode:hover:text-slate-800 transition">
            <span>{post.comments.length} {language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'comment'}</span>
            <ChevronDown size={13} className={`transition-transform ${showComments ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-2 py-1.5 border-t border-white/5 light-mode:border-slate-100 flex items-center gap-1">
        <button
          onClick={() => { if (!userAccount) { onAuthRequired(); return; } onLike(post.id); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition font-bold text-sm ${
            isLiked
              ? 'text-red-500 bg-red-500/10'
              : 'text-white/50 light-mode:text-slate-500 hover:bg-white/5 light-mode:hover:bg-slate-100'
          }`}
        >
          <Heart size={17} className={isLiked ? 'fill-red-500' : ''} />
          <span>{language === 'ku' ? 'بەدڵبوون' : language === 'ar' ? 'إعجاب' : 'Like'}</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/50 light-mode:text-slate-500 hover:bg-white/5 light-mode:hover:bg-slate-100 transition font-bold text-sm"
        >
          <MessageCircle size={17} />
          <span>{language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'Comment'}</span>
        </button>

        <button
          onClick={() => { if (navigator.share) navigator.share({ text: post.text, url: window.location.href }); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/50 light-mode:text-slate-500 hover:bg-white/5 light-mode:hover:bg-slate-100 transition font-bold text-sm"
        >
          <Share2 size={17} />
          <span>{language === 'ku' ? 'بەشکردن' : language === 'ar' ? 'مشاركة' : 'Share'}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-white/6 light-mode:border-slate-200 bg-[#111219] light-mode:bg-slate-50/80">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 px-4 py-3 border-b border-white/4 light-mode:border-slate-200/60 last:border-b-0">
              <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-white/10 light-mode:border-slate-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.user_avatar || DEFAULT_AVATARS[0]} alt={c.user_name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-block rounded-2xl rounded-tl-none px-3.5 py-2 max-w-full bg-[#1a1b27] light-mode:bg-white border border-transparent light-mode:border-slate-200/80 shadow-sm">
                  <p className="text-xs font-black text-[#CC222F] mb-0.5">{c.user_name}</p>
                  <p className="text-xs text-white/80 light-mode:text-slate-800 leading-relaxed break-words">{c.text}</p>
                </div>
                <p className="text-[10px] text-white/25 light-mode:text-slate-400 mt-1 px-1">{timeAgo(c.created_at, language)}</p>
              </div>
            </div>
          ))}

          {/* Comment input */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-white/10 light-mode:border-slate-300 bg-neutral-800 light-mode:bg-slate-200">
              {userAccount ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userAccount.avatar || DEFAULT_AVATARS[0]} alt={userAccount.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={14} className="text-neutral-400 light-mode:text-slate-500" />
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center gap-2 rounded-full px-3.5 py-1.5 bg-[#1a1b27] light-mode:bg-white border border-white/8 light-mode:border-slate-300 shadow-sm">
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
                className="flex-1 bg-transparent text-xs text-white light-mode:text-slate-900 placeholder:text-white/30 light-mode:placeholder:text-slate-400 outline-none border-none focus:ring-0"
              />
              <button
                onClick={() => onComment(post.id)}
                disabled={!commentInput.trim()}
                className="text-[#CC222F] disabled:opacity-30 transition"
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
