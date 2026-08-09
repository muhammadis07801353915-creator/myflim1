'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, LogIn, X, Camera, Save } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '../lib/LanguageContext';
import { getUserAccount, UserAccount } from '../lib/userAuth';
import AuthModal from './AuthModal';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
  display_name?: string;
  avatar_url?: string;
}

export default function CommentSection({ movieId }: { movieId: string }) {
  const { t, language } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncUser();
    fetchComments();

    const handleUserUpdate = () => syncUser();
    window.addEventListener('userAccountUpdated', handleUserUpdate);

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments_${movieId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `movie_id=eq.${movieId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      window.removeEventListener('userAccountUpdated', handleUserUpdate);
      supabase.removeChannel(channel);
    };
  }, [movieId]);

  const syncUser = () => {
    const acc = getUserAccount();
    setUserAccount(acc);
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!comments_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback simple query
        const { data: simpleData } = await supabase
          .from('comments')
          .select('*')
          .eq('movie_id', movieId)
          .order('created_at', { ascending: false });
        if (simpleData) setComments(simpleData as any);
      } else if (data) {
        setComments(data as any);
      }
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };

  const handleSendComment = async () => {
    if (!userAccount) {
      setShowAuthModal(true);
      return;
    }
    if (!newComment.trim()) return;

    const commentText = newComment.trim();
    setNewComment('');

    // Ensure profile exists in Supabase
    try {
      await supabase.from('profiles').upsert({
        id: userAccount.id,
        display_name: userAccount.name,
        avatar_url: userAccount.avatar,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn(e);
    }

    const { error } = await supabase.from('comments').insert([
      {
        movie_id: movieId,
        user_id: userAccount.id,
        content: commentText
      }
    ]);

    if (!error) {
      fetchComments();
    } else {
      // Optimistic local add if database fails
      setComments(prev => [
        {
          id: 'temp_' + Date.now(),
          user_id: userAccount.id,
          content: commentText,
          created_at: new Date().toISOString(),
          display_name: userAccount.name,
          avatar_url: userAccount.avatar
        },
        ...prev
      ]);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="mt-10 border-t border-neutral-800 light-mode:border-neutral-200 pt-8 pb-32">
      <div className="flex items-center justify-between mb-8" style={{ direction: language === 'ku' || language === 'ar' ? 'rtl' : 'ltr' }}>
        <h3 className="text-2xl font-bold text-white light-mode:text-black">
          {language === 'ku' ? 'کۆمێنتەکان' : language === 'ar' ? 'التعليقات' : 'Comments'}
        </h3>
        <span className="text-neutral-500 font-medium">{comments.length} {language === 'ku' ? 'کۆمێنت' : 'Comments'}</span>
      </div>

      <div className="space-y-6 mb-10">
        {loading && comments.length === 0 ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="w-10 h-10 bg-neutral-800 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-800 rounded w-1/4" />
                  <div className="h-4 bg-neutral-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 font-medium">
            {language === 'ku' ? 'هیچ کۆمێنتێک بۆ ئەم فیلمە نییە، یەکەم کەس بە کۆمێنت بنووسە!' : 'No comments yet. Be the first to comment!'}
          </div>
        ) : (
          comments.map((comment) => {
            const displayName = comment.profiles?.display_name || comment.display_name || 'Bexawer User';
            const avatarUrl = comment.profiles?.avatar_url || comment.avatar_url;

            return (
              <div key={comment.id} className="flex space-x-4 rtl:space-x-reverse group">
                <div className="w-10 h-10 rounded-full bg-neutral-800 relative overflow-hidden shrink-0 border border-neutral-700">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <User size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                    <span className="font-bold text-sm text-white light-mode:text-black">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <div className="bg-[#1a1d24] light-mode:bg-neutral-100 rounded-2xl rounded-tl-none rtl:rounded-tr-none rtl:rounded-tl-2xl px-4 py-3 border border-white/5 light-mode:border-neutral-200">
                    <p className="text-neutral-300 light-mode:text-neutral-700 text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box - Sticky at bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0f] light-mode:bg-white border-t border-neutral-800 light-mode:border-neutral-200 p-3 sm:p-4 z-50 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center gap-3 rtl:flex-row-reverse">
          <button 
            onClick={() => !userAccount && setShowAuthModal(true)}
            className="w-10 h-10 rounded-2xl bg-neutral-800 light-mode:bg-neutral-200 overflow-hidden relative shrink-0 border border-neutral-700 light-mode:border-neutral-300"
          >
            {userAccount?.avatar ? (
              <Image src={userAccount.avatar} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 light-mode:text-neutral-600">
                <User size={20} />
              </div>
            )}
          </button>
          <div className="flex-1 flex items-center gap-3.5 rtl:flex-row-reverse">
            <input 
              type="text" 
              dir={language === 'ku' || language === 'ar' ? 'rtl' : 'ltr'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder={userAccount ? (language === 'ku' ? 'کۆمێنتێک بنووسە...' : language === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...') : (language === 'ku' ? 'کۆدەکە بنووسە یان چوونە ژوورەوە بکە بۆ نووسینی کۆمێنت...' : 'Log in to write a comment...')}
              onClick={() => !userAccount && setShowAuthModal(true)}
              className="flex-1 bg-[#1a1d24] light-mode:bg-neutral-100 border border-neutral-800 light-mode:border-neutral-300 rounded-2xl px-4 py-3 text-sm text-white light-mode:text-black placeholder-white/40 light-mode:placeholder-neutral-500 outline-none focus:border-[#CC222F] transition ltr:text-left rtl:text-right"
            />
            <button 
              onClick={handleSendComment}
              className="w-11 h-11 rounded-2xl bg-[#CC222F] hover:bg-red-700 flex items-center justify-center text-white shadow-lg shrink-0 transition"
              title={language === 'ku' ? 'ناردن' : 'Send'}
            >
              <Send size={18} className="rtl:rotate-180 text-white" style={{ color: '#ffffff' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Auth / Code Unlock Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => syncUser()}
      />
    </div>
  );
}
