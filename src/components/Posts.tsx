'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Heart,
  MessageCircle,
  Share2,
  ImagePlus,
  Send,
  X,
  MoreHorizontal,
  Smile,
  Globe,
  Loader2,
  ChevronDown,
  User,
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
  likes: string[]; // array of user_ids who liked
  comments: PostComment[];
  created_at: string;
}

const SETTINGS_KEY = 'taban_community_posts';

async function fetchAllPosts(): Promise<Post[]> {
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
    console.warn(e);
  }
  return [];
}

async function saveAllPosts(posts: Post[]) {
  const { data: existing } = await supabase
    .from('settings')
    .select('key')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('settings')
      .update({ value: JSON.stringify(posts) })
      .eq('key', SETTINGS_KEY);
  } else {
    await supabase
      .from('settings')
      .insert({ key: SETTINGS_KEY, value: JSON.stringify(posts) });
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userAccount = getUserAccount();

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    const data = await fetchAllPosts();
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
      const allPosts = await fetchAllPosts();
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
      await saveAllPosts([newPost, ...allPosts]);
      setNewPostText('');
      setNewPostImage(null);
      loadPosts();
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userAccount) { setShowAuthModal(true); return; }
    const allPosts = await fetchAllPosts();
    const updated = allPosts.map((p) => {
      if (p.id !== postId) return p;
      const hasLiked = p.likes.includes(userAccount.id);
      return {
        ...p,
        likes: hasLiked
          ? p.likes.filter((id) => id !== userAccount.id)
          : [...p.likes, userAccount.id],
      };
    });
    await saveAllPosts(updated);
    loadPosts();
  };

  const handleComment = async (postId: string) => {
    if (!userAccount) { setShowAuthModal(true); return; }
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const allPosts = await fetchAllPosts();
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
    await saveAllPosts(updated);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    loadPosts();
  };

  const handleDeletePost = async (postId: string) => {
    if (!userAccount) return;
    const allPosts = await fetchAllPosts();
    const post = allPosts.find((p) => p.id === postId);
    if (!post || post.user_id !== userAccount.id) return;
    await saveAllPosts(allPosts.filter((p) => p.id !== postId));
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] light-mode:bg-[#f0f2f5] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0F0F13]/95 light-mode:bg-white/95 backdrop-blur-lg border-b border-white/8 light-mode:border-neutral-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-black text-white light-mode:text-black">
          {language === 'ku' ? 'پۆستەکان' : language === 'ar' ? 'المنشورات' : 'Posts'}
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#CC222F]/20 flex items-center justify-center">
            <Globe size={16} className="text-[#CC222F]" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 pt-4 space-y-4">
        {/* ── CREATE POST BOX ── */}
        <div className="bg-[#14151c] light-mode:bg-white rounded-2xl border border-white/8 light-mode:border-neutral-200 shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border-2 border-[#CC222F]/40">
                {userAccount ? (
                  <Image
                    src={userAccount.avatar || DEFAULT_AVATARS[0]}
                    alt={userAccount.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                    <User size={18} className="text-neutral-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => { if (!userAccount) setShowAuthModal(true); }}
                className="flex-1 text-right rtl:text-right ltr:text-left"
              >
                <textarea
                  rows={newPostText ? 3 : 1}
                  value={newPostText}
                  onChange={(e) => {
                    if (!userAccount) { setShowAuthModal(true); return; }
                    setNewPostText(e.target.value);
                  }}
                  placeholder={
                    userAccount
                      ? (language === 'ku' ? `${userAccount.name}، چیت لە مێشکتدایە؟` : language === 'ar' ? 'ما الذي تفكر به؟' : "What's on your mind?")
                      : (language === 'ku' ? 'بچۆ ژوورەوە بۆ نووسینی پۆست...' : 'Login to post...')
                  }
                  className="w-full bg-transparent text-white light-mode:text-black placeholder:text-white/40 light-mode:placeholder:text-neutral-400 text-sm font-medium resize-none outline-none"
                />
              </button>
            </div>

            {newPostImage && (
              <div className="relative mb-3 rounded-xl overflow-hidden">
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

          <div className="px-4 pb-3 flex items-center justify-between border-t border-white/6 light-mode:border-neutral-100 pt-3">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button
                onClick={() => {
                  if (!userAccount) { setShowAuthModal(true); return; }
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 light-mode:bg-neutral-100 hover:bg-white/10 transition text-[#4ade80] text-xs font-semibold"
              >
                <ImagePlus size={15} />
                <span>{language === 'ku' ? 'وێنە' : language === 'ar' ? 'صورة' : 'Photo'}</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 light-mode:bg-neutral-100 hover:bg-white/10 transition text-amber-400 text-xs font-semibold"
              >
                <Smile size={15} />
                <span>{language === 'ku' ? 'هەستیار' : language === 'ar' ? 'شعور' : 'Feeling'}</span>
              </button>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing || (!newPostText.trim() && !newPostImage)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#CC222F] text-white text-xs font-black disabled:opacity-40 hover:bg-red-600 transition active:scale-95"
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
            <p className="text-white/50 light-mode:text-neutral-400 font-semibold text-sm">
              {language === 'ku' ? 'هیچ پۆستێک نییە. یەکەم کەس بە!' : language === 'ar' ? 'لا منشورات بعد. كن أول من ينشر!' : 'No posts yet. Be the first!'}
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
              setCommentInput={(val) => setCommentInputs((prev) => ({ ...prev, [post.id]: val }))}
              showComments={expandedComments[post.id] || false}
              toggleComments={() =>
                setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
              }
              onAuthRequired={() => setShowAuthModal(true)}
            />
          ))
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function PostCard({
  post,
  userAccount,
  language,
  onLike,
  onComment,
  onDelete,
  commentInput,
  setCommentInput,
  showComments,
  toggleComments,
  onAuthRequired,
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
    <div className="bg-[#14151c] light-mode:bg-white rounded-2xl border border-white/8 light-mode:border-neutral-200 shadow-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden relative border-2 border-[#CC222F]/30 shrink-0">
            <Image
              src={post.user_avatar || DEFAULT_AVATARS[0]}
              alt={post.user_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <p className="font-black text-sm text-white light-mode:text-black leading-none">
              {post.user_name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Globe size={11} className="text-white/40 light-mode:text-neutral-400" />
              <span className="text-[11px] text-white/40 light-mode:text-neutral-400">
                {timeAgo(post.created_at, language)}
              </span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => {
              if (confirm(language === 'ku' ? 'ئایا دڵنیایت لە سڕینەوەی پۆستەکە؟' : 'Delete this post?')) {
                onDelete(post.id);
              }
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/5 transition"
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>

      {/* Post Text */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-sm text-white/90 light-mode:text-neutral-800 leading-relaxed whitespace-pre-wrap">
            {post.text}
          </p>
        </div>
      )}

      {/* Post Image */}
      {post.image && (
        <div className="relative w-full">
          <img src={post.image} alt="post" className="w-full max-h-80 object-cover" />
        </div>
      )}

      {/* Likes & Comments Count Row */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-white/6 light-mode:border-neutral-100">
        <div className="flex items-center gap-1">
          {post.likes.length > 0 && (
            <>
              <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <Heart size={10} className="text-white fill-white" />
              </span>
              <span className="text-xs text-white/50 light-mode:text-neutral-500 font-semibold">
                {post.likes.length}
              </span>
            </>
          )}
        </div>
        {post.comments.length > 0 && (
          <button onClick={toggleComments} className="flex items-center gap-1 text-xs text-white/40 light-mode:text-neutral-400 hover:text-white/70 transition">
            <span>
              {post.comments.length} {language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'comment'}
              {post.comments.length > 1 && language === 'en' ? 's' : ''}
            </span>
            <ChevronDown size={13} className={`transition-transform ${showComments ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-2 pb-2 flex items-center gap-1 border-t border-white/6 light-mode:border-neutral-100 pt-1">
        <button
          onClick={() => {
            if (!userAccount) { onAuthRequired(); return; }
            onLike(post.id);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition font-bold text-sm ${
            isLiked
              ? 'text-red-500 bg-red-500/10'
              : 'text-white/50 light-mode:text-neutral-500 hover:bg-white/5 light-mode:hover:bg-neutral-100'
          }`}
        >
          <Heart size={17} className={isLiked ? 'fill-red-500' : ''} />
          <span>{language === 'ku' ? 'بەدڵبوون' : language === 'ar' ? 'إعجاب' : 'Like'}</span>
        </button>
        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/50 light-mode:text-neutral-500 hover:bg-white/5 light-mode:hover:bg-neutral-100 transition font-bold text-sm"
        >
          <MessageCircle size={17} />
          <span>{language === 'ku' ? 'کۆمێنت' : language === 'ar' ? 'تعليق' : 'Comment'}</span>
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ text: post.text, url: window.location.href });
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/50 light-mode:text-neutral-500 hover:bg-white/5 light-mode:hover:bg-neutral-100 transition font-bold text-sm"
        >
          <Share2 size={17} />
          <span>{language === 'ku' ? 'بەشکردن' : language === 'ar' ? 'مشاركة' : 'Share'}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-white/6 light-mode:border-neutral-100 bg-[#111219] light-mode:bg-neutral-50">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 px-4 py-3 border-b border-white/4 last:border-b-0">
              <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-white/10">
                <Image
                  src={c.user_avatar || DEFAULT_AVATARS[0]}
                  alt={c.user_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-block bg-[#1a1b27] light-mode:bg-white rounded-2xl rounded-tl-none px-3 py-2 max-w-full">
                  <p className="text-xs font-black text-[#CC222F] mb-0.5">{c.user_name}</p>
                  <p className="text-xs text-white/80 light-mode:text-neutral-700 leading-relaxed break-words">{c.text}</p>
                </div>
                <p className="text-[10px] text-white/30 light-mode:text-neutral-400 mt-1 px-1">
                  {timeAgo(c.created_at, language)}
                </p>
              </div>
            </div>
          ))}

          {/* Comment Input */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-white/10">
              {userAccount ? (
                <Image
                  src={userAccount.avatar || DEFAULT_AVATARS[0]}
                  alt={userAccount.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                  <User size={14} className="text-neutral-400" />
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center gap-2 bg-[#1a1b27] light-mode:bg-white rounded-full px-3 py-1.5 border border-white/8 light-mode:border-neutral-200">
              <input
                value={commentInput}
                onChange={(e) => {
                  if (!userAccount) { onAuthRequired(); return; }
                  setCommentInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onComment(post.id);
                  }
                }}
                placeholder={
                  userAccount
                    ? (language === 'ku' ? 'کۆمێنتێک بنووسە...' : language === 'ar' ? 'اكتب تعليقًا...' : 'Write a comment...')
                    : (language === 'ku' ? 'بچۆ ژوورەوە...' : 'Login to comment...')
                }
                className="flex-1 bg-transparent text-xs text-white light-mode:text-black placeholder:text-white/30 outline-none"
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
