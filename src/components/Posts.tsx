'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  // Avoid SSR mismatch – run client-only code after mount
  useEffect(() => {
    setMounted(true);
    setUserAccount(getUserAccount());

    const handleUserUpdate = () => setUserAccount(getUserAccount());
    window.addEventListener('userAccountUpdated', handleUserUpdate);
    return () => window.removeEventListener('userAccountUpdated', handleUserUpdate);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadPosts();
    const interval = setInterval(loadPosts, 10000);
    return () => clearInterval(interval);
  }, [mounted]);

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

  // Show nothing until client hydration complete
  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#0F0F13' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(15,15,19,0.95)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}
      >
        <h1 className="text-xl font-black text-white">
          {language === 'ku' ? 'پۆستەکان' : language === 'ar' ? 'المنشورات' : 'Community Posts'}
        </h1>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(204,34,47,0.15)' }}>
          <Globe size={16} className="text-[#CC222F]" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 pt-4 space-y-4">
        {/* ── CREATE POST BOX ── */}
        <div
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{ backgroundColor: '#14151c', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border-2"
                style={{ borderColor: 'rgba(204,34,47,0.4)' }}
              >
                {userAccount ? (
                  <Image src={userAccount.avatar || DEFAULT_AVATARS[0]} alt={userAccount.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#2a2b35' }}>
                    <User size={18} className="text-neutral-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
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
                  className="w-full resize-none outline-none text-sm font-medium"
                  style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.9)', caretColor: '#CC222F' }}
                />
              </div>
            </div>

            {newPostImage && (
              <div className="relative mb-3 rounded-xl overflow-hidden">
                <img src={newPostImage} alt="preview" className="w-full max-h-60 object-cover rounded-xl" />
                <button
                  onClick={() => setNewPostImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
          </div>

          <div
            className="px-4 pb-3 flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button
                onClick={() => { if (!userAccount) { setShowAuthModal(true); return; } fileInputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#4ade80' }}
              >
                <ImagePlus size={15} />
                <span>{language === 'ku' ? 'وێنە' : language === 'ar' ? 'صورة' : 'Photo'}</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fbbf24' }}
              >
                <Smile size={15} />
                <span>{language === 'ku' ? 'هەستیار' : language === 'ar' ? 'شعور' : 'Feeling'}</span>
              </button>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing || (!newPostText.trim() && !newPostImage)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white transition"
              style={{ backgroundColor: publishing || (!newPostText.trim() && !newPostImage) ? 'rgba(204,34,47,0.4)' : '#CC222F' }}
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
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(204,34,47,0.1)' }}>
              <MessageCircle size={28} className="text-[#CC222F]" />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {language === 'ku' ? 'هیچ پۆستێک نییە. یەکەم کەس بە!' : language === 'ar' ? 'لا منشورات. كن أول من ينشر!' : 'No posts yet. Be the first!'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
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
          ))
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
  const isLiked = userAccount ? post.likes.includes(userAccount.id) : false;
  const isOwner = userAccount?.id === post.user_id;

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: '#14151c', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border-2" style={{ borderColor: 'rgba(204,34,47,0.3)' }}>
            <Image src={post.user_avatar || DEFAULT_AVATARS[0]} alt={post.user_name} fill className="object-cover" unoptimized />
          </div>
          <div>
            <p className="font-black text-sm text-white leading-none">{post.user_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Globe size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{timeAgo(post.created_at, language)}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => { if (confirm(language === 'ku' ? 'ئایا دڵنیایت لە سڕینەوەی پۆستەکە؟' : 'Delete this post?')) onDelete(post.id); }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>

      {/* Text */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.88)' }}>{post.text}</p>
        </div>
      )}

      {/* Image */}
      {post.image && (
        <div className="w-full">
          <img src={post.image} alt="post" className="w-full max-h-80 object-cover" />
        </div>
      )}

      {/* Likes/comments count */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1">
          {post.likes.length > 0 && (
            <>
              <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <Heart size={10} className="text-white fill-white" />
              </span>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{post.likes.length}</span>
            </>
          )}
        </div>
        {post.comments.length > 0 && (
          <button onClick={toggleComments} className="flex items-center gap-1 text-xs transition" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span>{post.comments.length} {language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'comment'}{post.comments.length > 1 && language === 'en' ? 's' : ''}</span>
            <ChevronDown size={13} className={`transition-transform ${showComments ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-2 pb-2 flex items-center gap-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          {
            label: language === 'ku' ? 'بەدڵبوون' : language === 'ar' ? 'إعجاب' : 'Like',
            icon: <Heart size={17} className={isLiked ? 'fill-red-500 text-red-500' : ''} />,
            active: isLiked,
            action: () => { if (!userAccount) { onAuthRequired(); return; } onLike(post.id); },
          },
          {
            label: language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'Comment',
            icon: <MessageCircle size={17} />,
            active: false,
            action: toggleComments,
          },
          {
            label: language === 'ku' ? 'بەشکردن' : language === 'ar' ? 'مشاركة' : 'Share',
            icon: <Share2 size={17} />,
            active: false,
            action: () => { if (navigator.share) navigator.share({ text: post.text, url: window.location.href }); },
          },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition font-bold text-sm"
            style={{ color: btn.active ? '#ef4444' : 'rgba(255,255,255,0.4)', backgroundColor: btn.active ? 'rgba(239,68,68,0.1)' : 'transparent' }}
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
            <div key={c.id} className="flex gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <Image src={c.user_avatar || DEFAULT_AVATARS[0]} alt={c.user_name} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-block rounded-2xl rounded-tl-none px-3 py-2 max-w-full" style={{ backgroundColor: '#1a1b27' }}>
                  <p className="text-xs font-black text-[#CC222F] mb-0.5">{c.user_name}</p>
                  <p className="text-xs leading-relaxed break-words" style={{ color: 'rgba(255,255,255,0.8)' }}>{c.text}</p>
                </div>
                <p className="text-[10px] mt-1 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo(c.created_at, language)}</p>
              </div>
            </div>
          ))}
          {/* Comment input */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {userAccount ? (
                <Image src={userAccount.avatar || DEFAULT_AVATARS[0]} alt={userAccount.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#2a2b35' }}>
                  <User size={14} className="text-neutral-400" />
                </div>
              )}
            </div>
            <div
              className="flex-1 flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ backgroundColor: '#1a1b27', border: '1px solid rgba(255,255,255,0.08)' }}
            >
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
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: 'rgba(255,255,255,0.85)', caretColor: '#CC222F' }}
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
