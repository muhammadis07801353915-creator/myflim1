'use client';

import { Search as SearchIcon, X, Mic, TrendingUp, Clock, Film, Tv2, Smile, Zap, Heart, Ghost } from 'lucide-react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/LanguageContext';
import { useData } from '../lib/DataContext';
import { getLocalized } from '../lib/translations';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Genre config ───────────────────────────────────────────────────────────
const GENRES = [
  { id: 'Action',      label: 'ئەکشن',       labelEn: 'Action',      icon: Zap,    bg: '#E53935' },
  { id: 'Drama',       label: 'دراما',        labelEn: 'Drama',       icon: Heart,  bg: '#8E24AA' },
  { id: 'Comedy',      label: 'کۆمیدی',       labelEn: 'Comedy',      icon: Smile,  bg: '#F4511E' },
  { id: 'Horror',      label: 'ترسناک',       labelEn: 'Horror',      icon: Ghost,  bg: '#546E7A' },
  { id: 'Animation',   label: 'ئەنیمەیشن',   labelEn: 'Animation',   icon: Film,   bg: '#0288D1' },
  { id: 'Documentary', label: 'دۆکیومێنتەری', labelEn: 'Documentary', icon: Tv2,    bg: '#2E7D32' },
];

export default function Search({ onSelect }: { onSelect: (item: any) => void }) {
  const { t, language } = useLanguage();
  const { movies } = useData();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Vikings', 'Interstellar', 'The Godfather'
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = query.trim().length > 0;

  // ── Trending (top-rated) ──────────────────────────────────────────────────
  const trending = [...movies]
    .filter((m) => m.rating)
    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
    .slice(0, 5);

  // ── Search results ────────────────────────────────────────────────────────
  const results = isSearching
    ? movies.filter((m) => {
        const q = query.toLowerCase();
        return (
          (m.title || '').toLowerCase().includes(q) ||
          (m.title_ar || '').toLowerCase().includes(q) ||
          (m.title_ku || '').toLowerCase().includes(q) ||
          (m.title_en || '').toLowerCase().includes(q)
        );
      })
    : [];

  const addRecent = (term: string) => {
    setRecentSearches((prev) => [term, ...prev.filter((r) => r !== term)].slice(0, 6));
  };

  const handleSelect = (item: any) => {
    addRecent(getLocalized(item, 'title', language) || item.title);
    onSelect(item);
  };

  const handleGenre = (genre: typeof GENRES[0]) => {
    const filtered = movies.filter((m) => m.genre?.includes(genre.id) || m.type === genre.id);
    // Navigate to list view for this genre using the same onSelect pattern
    // by passing a virtual list trigger; actual nav handled in parent
    if (filtered.length > 0) onSelect({ __genre: genre.id, __items: filtered, __title: language === 'ku' ? genre.label : genre.labelEn });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-32">

      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="flex-1 relative flex items-center bg-white/7 border border-white/8 rounded-2xl px-4 h-12 gap-3 focus-within:border-[#CC222F]/50 transition-colors">
            <SearchIcon size={18} className="text-white/40 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={
                language === 'ku' ? 'گەران بۆ فیلم، زنجیرە...'
                : language === 'ar' ? 'ابحث عن أفلام...'
                : 'Search for movies, series...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && query.trim() && addRecent(query.trim())}
              className="flex-1 bg-transparent text-white placeholder-white/35 text-[15px] font-medium outline-none"
            />
            {isSearching ? (
              <button onClick={() => setQuery('')} className="text-white/50 hover:text-white transition">
                <X size={16} />
              </button>
            ) : (
              <Mic size={16} className="text-white/40 shrink-0" />
            )}
          </div>
          {isSearching && (
            <button
              onClick={() => setQuery('')}
              className="text-[#CC222F] font-bold text-sm whitespace-nowrap hover:text-red-400 transition"
            >
              {language === 'ku' ? 'داخستن' : language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {isSearching ? (
            /* ── RESULTS ─────────────────────────────────────────── */
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-white/40 font-semibold mb-4">
                {results.length} {language === 'ku' ? 'ئەنجام' : language === 'ar' ? 'نتيجة' : 'results'}
              </p>
              {results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.map((movie) => (
                    <motion.div
                      key={movie.id}
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => handleSelect(movie)}
                      className="cursor-pointer group"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#14151c] border border-white/8 mb-2">
                        <Image src={movie.image} alt={movie.title} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      </div>
                      <p className="text-[13px] font-bold text-white truncate group-hover:text-[#CC222F] transition-colors">
                        {getLocalized(movie, 'title', language)}
                      </p>
                      {movie.year ? <p className="text-[11px] text-white/40 mt-0.5">{movie.year}</p> : null}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <SearchIcon size={52} className="text-white/10" />
                  <p className="text-white/35 font-semibold">
                    {language === 'ku' ? 'ئەنجامێک نەدۆزرایەوە' : language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            /* ── DISCOVERY ────────────────────────────────────────── */
            <motion.div key="discovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[17px] font-black tracking-tight">
                      {language === 'ku' ? 'گەرانە نوێیەکان' : language === 'ar' ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                    </h2>
                    <button
                      onClick={() => setRecentSearches([])}
                      className="text-[#CC222F] text-xs font-bold hover:text-red-400 transition"
                    >
                      {language === 'ku' ? 'پاک بکەوە' : language === 'ar' ? 'مسح الكل' : 'Clear All'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setQuery(r); inputRef.current?.focus(); }}
                        className="flex items-center gap-1.5 bg-white/7 border border-white/6 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white/75 hover:bg-white/12 hover:text-white transition"
                      >
                        <Clock size={11} className="text-white/40" />
                        {r}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Popular Genres */}
              <section>
                <h2 className="text-[17px] font-black tracking-tight mb-3">
                  {language === 'ku' ? 'جۆرەکان' : language === 'ar' ? 'الأنواع الشائعة' : 'Popular Genres'}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {GENRES.map((g) => {
                    const Icon = g.icon;
                    return (
                      <button
                        key={g.id}
                        onClick={() => handleGenre(g)}
                        style={{ backgroundColor: g.bg + '18', borderColor: g.bg + '40' }}
                        className="flex flex-col items-center gap-2 rounded-2xl border py-4 hover:scale-105 transition-transform duration-200"
                      >
                        <div
                          style={{ backgroundColor: g.bg + '30' }}
                          className="w-11 h-11 rounded-xl flex items-center justify-center"
                        >
                          <Icon size={22} style={{ color: g.bg }} />
                        </div>
                        <span className="text-[12px] font-bold text-white text-center">
                          {language === 'ku' ? g.label : g.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Trending Searches */}
              {trending.length > 0 && (
                <section>
                  <h2 className="text-[17px] font-black tracking-tight mb-3">
                    {language === 'ku' ? 'ناودارەکان' : language === 'ar' ? 'الأكثر بحثاً' : 'Trending Searches'}
                  </h2>
                  <div className="space-y-1">
                    {trending.map((movie, idx) => (
                      <motion.div
                        key={movie.id}
                        whileHover={{ x: -4 }}
                        onClick={() => handleSelect(movie)}
                        className="flex items-center gap-3 py-3 border-b border-white/5 cursor-pointer group"
                      >
                        <span className="text-[16px] font-black text-white/20 w-5 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-11 h-[60px] relative rounded-lg overflow-hidden bg-[#14151c] shrink-0">
                          <Image src={movie.image} alt={movie.title} fill sizes="44px" className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-white truncate group-hover:text-[#CC222F] transition-colors">
                            {getLocalized(movie, 'title', language)}
                          </p>
                          <p className="text-[12px] text-white/40 mt-0.5">
                            {movie.type} · {movie.year}
                          </p>
                        </div>
                        <TrendingUp size={15} className="text-[#CC222F] shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
