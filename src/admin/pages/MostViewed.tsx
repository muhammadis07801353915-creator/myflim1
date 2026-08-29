'use client';

import { useState, useEffect } from 'react';
import { supabase, fetchAllRows } from '../../lib/supabase';
import { Eye, Search, Flame, Trophy, Film, Tv, Star, Download, RefreshCw, ArrowUpDown } from 'lucide-react';

interface MovieItem {
  id: number;
  title: string;
  type: 'Movie' | 'Series';
  image: string;
  banner?: string;
  year?: string;
  genre?: string;
  imdb_rating?: number;
  views?: number;
  created_at?: string;
}

export default function MostViewedAdmin() {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Movie' | 'Series'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetchMostViewed();
  }, []);

  const fetchMostViewed = async () => {
    setLoading(true);
    try {
      const data = await fetchAllRows(supabase, 'movies', 'views');
      if (data && Array.isArray(data)) {
        // Sort descending by views
        const sorted = data.map((m: any) => ({
          ...m,
          views: Number(m.views) || 0
        })).sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        setMovies(sorted);
      }
    } catch (e) {
      console.error('Error fetching most viewed:', e);
    }
    setLoading(false);
  };

  const filteredMovies = movies
    .filter(m => {
      const matchSearch = !searchQuery || 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.genre && m.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.year && m.year.toString().includes(searchQuery));
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      const vA = a.views || 0;
      const vB = b.views || 0;
      return sortOrder === 'desc' ? vB - vA : vA - vB;
    });

  const totalViewsAll = movies.reduce((sum, m) => sum + (m.views || 0), 0);
  const top1Movie = movies[0];

  const exportCSV = () => {
    if (movies.length === 0) return;
    let csv = 'Rank,Title,Type,Views,Year,Genre,Rating\n';
    filteredMovies.forEach((m, idx) => {
      csv += `"${idx + 1}","${m.title.replace(/"/g, '""')}","${m.type}","${m.views || 0}","${m.year || ''}","${m.genre || ''}","${m.imdb_rating || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Most_Viewed_Movies_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Flame size={26} className="text-red-500" />
            فیلم و زنجیرە پڕبینەرەکان (Most Viewed Content)
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            لیستی سەرجەم فیلم و زنجیرەکان بەپێی ڕیزبەندی بینەران لە زۆرترینەوە بۆ کەمترین
          </p>
        </div>
        <button
          onClick={fetchMostViewed}
          className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition text-sm font-bold"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-red-500' : ''} />
          <span>نوێکردنەوە</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1a1d24] border border-red-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <Trophy size={28} className="text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">ژمارە ۱ ی پڕبینەرترین</p>
            <h3 className="font-bold text-white text-base truncate">{top1Movie?.title || 'نادیار'}</h3>
            <p className="text-xs text-red-400 font-black mt-0.5">👁 {(top1Movie?.views || 0).toLocaleString()} بینەر</p>
          </div>
        </div>

        <div className="bg-[#1a1d24] border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Eye size={28} className="text-blue-400" />
          </div>
          <div>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">کۆی بینەری سەرجەم فیلمەکان</p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">{totalViewsAll.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-[#1a1d24] border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Film size={28} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">کۆی فیلم و زنجیرە تۆمارکراوەکان</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{movies.length.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="گەڕان بە ناوی فیلم یان ژانەر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:border-red-500 outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-xl px-4 py-2 outline-none w-full sm:w-auto"
          >
            <option value="all">سەرجەم ناوەڕۆکەکان</option>
            <option value="Movie">تەنها فیلمەکان (Movie)</option>
            <option value="Series">تەنها زنجیرەکان (Series)</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition w-full sm:w-auto justify-center"
          >
            <ArrowUpDown size={14} />
            <span>{sortOrder === 'desc' ? 'لە زۆرترین بۆ کەمترین' : 'لە کەمترین بۆ زۆرترین'}</span>
          </button>
        </div>

        <button
          onClick={exportCSV}
          disabled={movies.length === 0}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs disabled:opacity-40 justify-center"
        >
          <Download size={16} />
          <span>داگرتنی ڕاپۆرت (CSV)</span>
        </button>
      </div>

      {/* Main Most Viewed Table */}
      <div className="bg-[#1a1d24] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <Film size={40} className="mx-auto opacity-30" />
            <p className="font-bold">هیچ فیلمێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-bold text-center">ڕیزبەندی (Rank)</th>
                  <th className="px-6 py-4 font-bold">فیلم / زنجیرە</th>
                  <th className="px-6 py-4 font-bold text-center">جۆر (Type)</th>
                  <th className="px-6 py-4 font-bold text-center">ژمارەی بینەران (Views)</th>
                  <th className="px-6 py-4 font-bold text-center">ساڵ</th>
                  <th className="px-6 py-4 font-bold text-center">IMDB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredMovies.map((movie, idx) => {
                  const rank = idx + 1;
                  let rankBadge = null;
                  if (rank === 1) {
                    rankBadge = <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1">👑 #1</span>;
                  } else if (rank === 2) {
                    rankBadge = <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-300/20 text-slate-300 border border-slate-300/30 flex items-center justify-center gap-1">🥇 #2</span>;
                  } else if (rank === 3) {
                    rankBadge = <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-700/20 text-amber-600 border border-amber-700/30 flex items-center justify-center gap-1">🥉 #3</span>;
                  } else {
                    rankBadge = <span className="font-mono text-neutral-400 font-bold text-sm">#{rank}</span>;
                  }

                  return (
                    <tr key={movie.id} className="hover:bg-neutral-800/40 transition">
                      <td className="px-6 py-4 text-center">
                        {rankBadge}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 rounded-lg bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700 relative">
                            {movie.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={movie.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                <Film size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-base truncate max-w-xs">{movie.title}</h3>
                            <p className="text-xs text-neutral-400 mt-0.5">{movie.genre || 'نادیار'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {movie.type === 'Series' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Tv size={12} />
                            <span>زنجیرە</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Film size={12} />
                            <span>فیلم</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-base">
                          <Eye size={16} />
                          <span>{(movie.views || 0).toLocaleString()} بینەر</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-neutral-300 font-medium">
                        {movie.year || '-'}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {movie.imdb_rating ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                            <Star size={12} className="fill-amber-400" />
                            <span>{movie.imdb_rating}</span>
                          </span>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
