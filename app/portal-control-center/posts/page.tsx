'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  MessageSquare, Trash2, Search, 
  Calendar, User, Loader2, AlertCircle, Heart, MessageCircle as CommentIcon
} from 'lucide-react';

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

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
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
          setPosts(sanitized.sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      }
    } catch (e) {
      console.error('Error fetching posts:', e);
    }
    setLoading(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm('ئایا دڵنیایت لە سڕینەوەی ئەم پۆستە لە پلاتفۆرمەکە؟')) return;
    
    setDeletingId(id);
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);

    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('key')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (existing) {
        await supabase.from('settings').update({ value: JSON.stringify(updated) }).eq('key', SETTINGS_KEY);
      }
    } catch (e) {
      alert('Error deleting post');
      fetchPosts();
    }
    setDeletingId(null);
  };

  const filteredPosts = posts.filter(post => 
    (post.text && post.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (post.user_name && post.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MessageSquare size={24} className="text-red-500" />
            بەڕێوەبردنی پۆستەکان (Community Posts)
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            بینیین و سڕینەوەی سەرجەم پۆستەکانی بەکارهێنەران لەسەر ئەپەکە و وێب سایت
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text"
            placeholder="گەڕان بۆ پۆست یان یوزەر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:border-red-500 outline-none w-full sm:w-80 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm font-medium">سەرجەم پۆستەکان</p>
          <p className="text-3xl font-black text-red-500 mt-1">{posts.length}</p>
        </div>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
          <p className="text-neutral-400 text-sm font-medium">پۆستەکانی ئەمڕۆ</p>
          <p className="text-3xl font-black text-white mt-1">
            {posts.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
          <p className="text-neutral-400 text-sm font-medium">پۆستی وێنەدار</p>
          <p className="text-3xl font-black text-emerald-500 mt-1">
            {posts.filter(p => !!p.image).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-neutral-800/30 rounded-2xl border border-neutral-800">
          <AlertCircle size={48} className="text-neutral-600 mb-3" />
          <p className="text-white font-bold text-lg">هیچ پۆستێک نەدۆزرایەوە</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700 relative">
                    {post.user_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{post.user_name || 'Anonymous User'}</h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mt-0.5">
                      <Calendar size={12} />
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => deletePost(post.id)}
                  disabled={deletingId === post.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-500/20 hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white rounded-xl transition text-xs font-bold"
                >
                  {deletingId === post.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>سڕینەوەی پۆست</span>
                </button>
              </div>

              {post.text && (
                <div className="bg-neutral-900/60 rounded-xl p-4 border border-neutral-800 mb-3">
                  <p className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
                </div>
              )}

              {post.image && (
                <div className="mb-3 max-w-sm rounded-xl overflow-hidden border border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image} alt="post media" className="w-full max-h-64 object-cover" />
                </div>
              )}

              <div className="flex items-center gap-6 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <Heart size={14} className="text-red-500" />
                  <span>{post.likes ? post.likes.length : 0} بەدڵبوون</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CommentIcon size={14} className="text-blue-400" />
                  <span>{post.comments ? post.comments.length : 0} کۆمێنت</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
