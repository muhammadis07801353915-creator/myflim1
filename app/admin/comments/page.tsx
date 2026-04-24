'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  MessageSquare, Trash2, ExternalLink, Search, 
  Calendar, User, Film, Loader2, AlertCircle
} from 'lucide-react';

interface CommentWithMovie {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  movie_id: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
  movies: {
    title: string;
    image: string;
  };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentWithMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        movie_id,
        profiles!comments_user_id_fkey (
          display_name,
          avatar_url
        ),
        movies (
          title,
          image
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data as any);
    }
    setLoading(false);
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setDeletingId(id);
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (!error) {
      setComments(comments.filter(c => c.id !== id));
    } else {
      alert('Error deleting comment');
    }
    setDeletingId(null);
  };

  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.movies?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MessageSquare size={24} className="text-blue-500" />
            Comments Management
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Monitor and manage user comments across all movies
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text"
            placeholder="Search comments, movies or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:border-blue-500 outline-none w-full sm:w-80 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400 text-sm font-medium">Total Comments</p>
          <p className="text-3xl font-black text-blue-500 mt-1">{comments.length}</p>
        </div>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
          <p className="text-neutral-400 text-sm font-medium">New Today</p>
          <p className="text-3xl font-black text-white mt-1">
            {comments.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
          <p className="text-neutral-400 text-sm font-medium">Awaiting Review</p>
          <p className="text-3xl font-black text-emerald-500 mt-1">0</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-neutral-800/30 rounded-2xl border border-neutral-800">
          <AlertCircle size={48} className="text-neutral-600 mb-3" />
          <p className="text-white font-bold text-lg">No comments found</p>
          <p className="text-neutral-500 text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredComments.map((comment) => (
            <div key={comment.id} className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition group">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 relative overflow-hidden shrink-0">
                        {comment.profiles?.avatar_url && (
                          <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        )}
                        {!comment.profiles?.avatar_url && (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {comment.profiles?.display_name || 'Anonymous User'}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium">
                          <Calendar size={10} />
                          {formatDate(comment.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                      className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                    >
                      {deletingId === comment.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                  
                  <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>

                <div className="md:w-64 shrink-0 flex flex-col justify-center">
                  <div className="bg-neutral-800/30 rounded-xl p-3 border border-neutral-800/50 flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg bg-neutral-800 relative overflow-hidden shrink-0 border border-neutral-700">
                      {comment.movies?.image && (
                        <img src={comment.movies.image} alt="" className="w-full h-full object-cover" />
                      )}
                      {!comment.movies?.image && (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <Film size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Commented On</p>
                      <h4 className="text-xs font-bold text-white truncate mb-2">{comment.movies?.title || 'Unknown Movie'}</h4>
                      <a 
                        href={`/movie/${comment.movie_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-500 hover:text-blue-400 transition"
                      >
                        <ExternalLink size={10} />
                        View Movie
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
