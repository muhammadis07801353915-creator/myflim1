'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, LogIn, X, Mail, Camera, Save } from 'lucide-react';
import Image from 'next/image';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

export default function CommentSection({ movieId }: { movieId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    name: '',
    avatar: ''
  });

  useEffect(() => {
    checkUser();
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `movie_id=eq.${movieId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [movieId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      fetchProfile(user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfileData({
        name: data.display_name || '',
        avatar: data.avatar_url || ''
      });
    } else {
      // Create profile if it doesn't exist
      const { data: { user } } = await supabase.auth.getUser();
      const defaultName = user?.email?.split('@')[0] || 'User';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          display_name: defaultName,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!insertError && newProfile) {
        setProfileData({
          name: newProfile.display_name || '',
          avatar: newProfile.avatar_url || ''
        });
      }
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: profileData.name,
      avatar_url: profileData.avatar,
      updated_at: new Date().toISOString()
    });

    if (!error) {
      setShowProfileModal(false);
      fetchComments();
    } else {
      alert('Error saving profile');
    }
  };

  const fetchComments = async () => {
    setLoading(true);
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
      console.error('Error fetching comments:', error);
    } else {
      setComments(data as any);
    }
    setLoading(false);
  };

  const handleSendComment = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!newComment.trim()) return;

    const { error } = await supabase.from('comments').insert([
      {
        movie_id: movieId,
        user_id: user.id,
        content: newComment.trim()
      }
    ]);

    if (!error) {
      setNewComment('');
      fetchComments();
    }
  };

  const [authMsg, setAuthMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      setAuthMsg(error.message);
      setAuthLoading(false);
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
    <div className="mt-10 border-t border-neutral-800 pt-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-white light-mode:text-black">Comments</h3>
        <span className="text-neutral-500 font-medium">{comments.length} Comments</span>
      </div>

      <div className="space-y-8 mb-10">
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
          <div className="text-center py-10 text-neutral-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4 group">
              <div className="w-10 h-10 rounded-full bg-neutral-800 relative overflow-hidden shrink-0">
                {comment.profiles?.avatar_url ? (
                  <Image src={comment.profiles.avatar_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    <User size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-sm text-white light-mode:text-black">
                    {comment.profiles?.display_name || 'Anonymous User'}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <div className="bg-[#1a1d24] light-mode:bg-neutral-100 rounded-2xl rounded-tl-none px-4 py-3">
                    <p className="text-neutral-300 light-mode:text-neutral-700 text-sm leading-relaxed">
                    {comment.content}
                    </p>
                </div>
                <div className="flex items-center space-x-4 mt-2 ml-2">
                    <button className="text-[11px] font-bold text-neutral-500 hover:text-white transition">Like</button>
                    <button className="text-[11px] font-bold text-neutral-500 hover:text-white transition">Reply</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Box - Sticky at bottom of mobile */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a] light-mode:bg-white border-t border-neutral-800 light-mode:border-neutral-200 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <button 
            onClick={() => user ? setShowProfileModal(true) : setShowLoginModal(true)}
            className="w-10 h-10 rounded-full bg-neutral-800 relative overflow-hidden shrink-0"
          >
            {profileData.avatar ? (
              <Image src={profileData.avatar} alt="" fill className="object-cover" />
            ) : user?.user_metadata?.avatar_url ? (
              <Image src={user.user_metadata.avatar_url} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                <User size={20} />
              </div>
            )}
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder={user ? "Write a comment..." : "Login to comment..."}
              onClick={() => !user && setShowLoginModal(true)}
              className="w-full bg-[#1a1d24] light-mode:bg-neutral-100 border border-neutral-800 light-mode:border-neutral-200 rounded-full px-5 py-3 text-sm text-white light-mode:text-black outline-none focus:border-red-500 transition"
            />
            <button 
                onClick={handleSendComment}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1d24] light-mode:bg-white w-full max-w-sm rounded-3xl border border-neutral-800 light-mode:border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Login Required</h3>
              <p className="text-neutral-400 text-sm mb-6">Login to join the conversation and post comments.</p>
              
              <div className="space-y-6">
                <button 
                  onClick={signInWithGoogle}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center space-x-3 bg-white text-black py-4 rounded-2xl font-bold hover:bg-neutral-200 transition shadow-lg active:scale-95 duration-75"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail size={20} />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              {authMsg && (
                <div className="mt-4 p-3 rounded-xl text-xs font-medium border bg-red-500/10 border-red-500/20 text-red-500">
                  {authMsg}
                </div>
              )}
              
              <button 
                onClick={() => setShowLoginModal(false)}
                className="w-full mt-6 py-2 text-neutral-500 hover:text-white transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1d24] light-mode:bg-white w-full max-w-sm rounded-3xl border border-neutral-800 light-mode:border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-6 text-center">Edit Profile</h3>
              
              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-neutral-800 overflow-hidden border-2 border-red-600">
                    {profileData.avatar ? (
                      <Image src={profileData.avatar} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-red-600 p-2 rounded-full text-white shadow-lg">
                    <Camera size={16} />
                  </button>
                </div>
                <input 
                  type="text" 
                  value={profileData.avatar}
                  onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                  placeholder="Paste image URL here..."
                  className="w-full bg-neutral-900 light-mode:bg-neutral-100 border border-neutral-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-bold uppercase">Display Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="e.g. Kurd Cinema"
                    className="w-full bg-neutral-900 light-mode:bg-neutral-100 border border-neutral-800 px-4 py-3 rounded-xl text-sm outline-none focus:border-red-500"
                  />
                </div>
                
                <button 
                  onClick={saveProfile}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition"
                >
                  <Save size={20} />
                  <span>Save Profile</span>
                </button>
                
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="w-full py-2 text-neutral-500 hover:text-white transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
