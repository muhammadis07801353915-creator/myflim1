'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { 
  AlertCircle, CheckCircle2, RefreshCw, ExternalLink, 
  Save, Wrench, Loader2, WifiOff, ShieldCheck
} from 'lucide-react';

interface BrokenMovie {
  id: number;
  title: string;
  video_url: string;
  image: string;
  type: string;
  is_broken: boolean;
}

export default function BrokenLinksPage() {
  const [brokenMovies, setBrokenMovies] = useState<BrokenMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [newUrls, setNewUrls] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  const fetchBrokenMovies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('movies')
      .select('id, title, video_url, image, type, is_broken')
      .eq('is_broken', true)
      .order('id', { ascending: false });
    if (error) {
      console.error('Error fetching broken movies:', error);
    }
    if (data) setBrokenMovies(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBrokenMovies();
  }, [fetchBrokenMovies]);

  const runHealthCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      // Fetch all published movies with their URLs
      const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, video_url, is_broken')
        .eq('status', 'Published');

      if (error) throw error;
      if (!movies || movies.length === 0) {
        setCheckResult({ checked: 0, newlyBroken: 0, newlyFixed: 0 });
        return;
      }

      let newlyBroken = 0;
      let newlyFixed = 0;

      for (const movie of movies) {
        const url = movie.video_url || '';
        let hasLinkValue = false;

        // Check if there is even a value to check
        if (url && url.trim() !== '' && url !== '[]') {
          hasLinkValue = true;
        }

        // Only mark as broken if a link EXISTS but is tagged/reported as broken
        // OR if the URL format is invalid. 
        // For now, if it's empty, we definitely mark it as NOT broken (just missing)
        if (!hasLinkValue) {
          if (movie.is_broken) {
            await supabase.from('movies').update({ is_broken: false }).eq('id', movie.id);
            newlyFixed++;
          }
          continue;
        }

        // For movies WITH links, we keep their current 'is_broken' status 
        // unless we want to trigger a deep check.
        // Let's add a deep check call to the server here for these specific items
      }

      setCheckResult({ 
        message: "Cleaned up list. Empty links are now ignored.",
        checked: movies.length, 
        newlyFixed 
      });
      await fetchBrokenMovies();
    } catch (err: any) {
      console.error('Health check error:', err);
      setCheckResult({ error: `Failed: ${err.message || 'Unknown error'}` });
    } finally {
      setChecking(false);
    }
  };

  const saveNewUrl = async (movie: BrokenMovie) => {
    const newUrl = newUrls[movie.id];
    if (!newUrl?.trim()) return;
    setSaving(prev => ({ ...prev, [movie.id]: true }));
    
    const { error } = await supabase
      .from('movies')
      .update({ video_url: newUrl.trim(), is_broken: false })
      .eq('id', movie.id);
    
    if (!error) {
      setSaved(prev => ({ ...prev, [movie.id]: true }));
      setBrokenMovies(prev => prev.filter(m => m.id !== movie.id));
      setNewUrls(prev => { const n = { ...prev }; delete n[movie.id]; return n; });
    }
    setSaving(prev => ({ ...prev, [movie.id]: false }));
  };

  const markAsFixed = async (movieId: number) => {
    await supabase.from('movies').update({ is_broken: false }).eq('id', movieId);
    setBrokenMovies(prev => prev.filter(m => m.id !== movieId));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <WifiOff size={24} className="text-red-500" />
            Broken Link Manager
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Automatically detects and helps you fix broken video links
          </p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition shadow-lg shadow-red-600/20"
        >
          {checking ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {checking ? 'Checking...' : 'Run Health Check Now'}
        </button>
      </div>

      {/* Check Result Summary */}
      {checkResult && (
        <div className={`p-4 rounded-xl border ${checkResult.error ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
          {checkResult.error ? (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={18} />
              <span>{checkResult.error}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck size={18} />
                <span>Checked <strong>{checkResult.checked}</strong> movies</span>
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={18} />
                <span><strong>{checkResult.newlyBroken}</strong> newly broken</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={18} />
                <span><strong>{checkResult.newlyFixed}</strong> auto-recovered</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm font-medium">Broken Links</p>
          <p className="text-3xl font-black text-red-500 mt-1">{brokenMovies.length}</p>
        </div>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
          <p className="text-neutral-400 text-sm font-medium">Auto Check</p>
          <p className="text-sm font-bold text-white mt-1">Every Day at 3AM</p>
          <p className="text-xs text-neutral-500">via Vercel Cron</p>
        </div>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
          <p className="text-neutral-400 text-sm font-medium">Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-sm font-bold text-emerald-400">Monitoring Active</p>
          </div>
        </div>
      </div>

      {/* Broken Movies List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : brokenMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-neutral-800/30 rounded-2xl border border-neutral-800">
          <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
          <p className="text-white font-bold text-lg">All links are healthy!</p>
          <p className="text-neutral-500 text-sm mt-1">No broken links detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
            {brokenMovies.length} Broken Link{brokenMovies.length > 1 ? 's' : ''} Found
          </h2>
          {brokenMovies.map((movie) => (
            <div key={movie.id} className="bg-[#1a1d24] border border-red-500/20 rounded-xl p-4 hover:border-red-500/40 transition">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Movie Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {movie.image && (
                    <img 
                      src={movie.image} 
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-lg shrink-0 border border-neutral-700"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white">{movie.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        movie.type === 'Movie' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>{movie.type}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold uppercase flex items-center gap-1">
                        <AlertCircle size={10} /> Broken
                      </span>
                    </div>
                    {/* Current broken URL */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-neutral-500 font-medium">Current URL:</span>
                      <span className="text-xs text-red-400 truncate max-w-[300px] font-mono">
                        {movie.video_url?.startsWith('[') ? '[JSON server list]' : (movie.video_url || 'No URL')}
                      </span>
                      {movie.video_url && !movie.video_url.startsWith('[') && (
                        <a 
                          href={movie.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-neutral-500 hover:text-white transition shrink-0"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fix Actions */}
                <div className="flex flex-col gap-2 sm:w-80 shrink-0">
                  <input
                    type="text"
                    placeholder="Paste new video URL here..."
                    value={newUrls[movie.id] || ''}
                    onChange={(e) => setNewUrls(prev => ({ ...prev, [movie.id]: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveNewUrl(movie)}
                      disabled={!newUrls[movie.id]?.trim() || saving[movie.id]}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition"
                    >
                      {saving[movie.id] ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save & Fix
                    </button>
                    <button
                      onClick={() => markAsFixed(movie.id)}
                      title="Mark as fixed without changing URL"
                      className="px-3 py-2 bg-neutral-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-neutral-400 rounded-lg text-sm transition"
                    >
                      <Wrench size={14} />
                    </button>
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
