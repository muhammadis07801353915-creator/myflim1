'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Play, Plus, Star, ChevronLeft, Bell, Search, 
  ChevronRight, Bookmark, Check, Info, Sparkles, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getLocalized } from '../lib/translations';
import { useData } from '../lib/DataContext';
import { FloatingSocialButton } from './SocialLinks';

export default function Home({ 
  onSelect, 
  onChangeTab 
}: { 
  onSelect: (item: any) => void; 
  onChangeTab?: (tab: string) => void; 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const { movies, movieLists, loading } = useData();

  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [filterType, setFilterType] = useState<'all' | 'Movie' | 'Series'>('all');
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);

  // Derive viewingList from URL
  const listName = searchParams ? searchParams.get('list') : null;
  const viewingList = useMemo(() => {
    if (!listName) return null;
    let items: any[] = [];
    let displayTitle = listName ? getLocalized(listName, 'name', language) : '';

    if (listName === 'Top Contents' || listName === 'Trending Now') {
      items = movies.filter(m => m.top_rank).sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99));
      displayTitle = t.popular || 'Trending Now';
    } else if (listName === 'Animation') {
      items = movies.filter(m =>
        m.genre?.includes('Anime') ||
        m.genre?.includes('Animation') ||
        m.type === 'Anime'
      );
      displayTitle = language === 'ku' ? 'ئەنیمەیشنەکان' : language === 'ar' ? 'الأنيمي' : 'Animation';
    } else {
      items = movies.filter(m => m.list_name === listName);
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const list = movieLists.find(l => l.name === listName);
      if (list) displayTitle = getLocalized(list, 'name', language) || list.name;
    }

    return items.length > 0 ? { title: displayTitle, rawName: listName, items } : null;
  }, [listName, movies, movieLists, t.popular, language]);

  const setViewingList = (list: { rawName: string } | null) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (list) params.set('list', list.rawName);
    else params.delete('list');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const handleResize = () => {
      setDisplayLimit(window.innerWidth < 768 ? 4 : 12);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setFilterType('all');
  }, [listName]);

  const featuredMovies = useMemo(() => {
    return movies.filter(m => m.is_featured);
  }, [movies]);

  const nextFeatured = useCallback(() => {
    if (featuredMovies.length === 0) return;
    setCurrentFeaturedIndex((prev) => (prev + 1) % featuredMovies.length);
  }, [featuredMovies.length]);

  const prevFeatured = useCallback(() => {
    if (featuredMovies.length === 0) return;
    setCurrentFeaturedIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  }, [featuredMovies.length]);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(nextFeatured, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies.length, nextFeatured]);

  const currentFeatured = useMemo(() => {
    if (featuredMovies.length > 0) {
      return featuredMovies[currentFeaturedIndex % featuredMovies.length] || featuredMovies[0];
    }
    return movies.length > 0 ? movies[0] : null;
  }, [featuredMovies, currentFeaturedIndex, movies]);
  const topContents = useMemo(() => {
    return movies.filter(m => m.top_rank).sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99));
  }, [movies]);

  const animeItems = useMemo(() => {
    return movies.filter(m =>
      m.genre?.includes('Anime') ||
      m.genre?.includes('Animation') ||
      m.type === 'Anime'
    );
  }, [movies]);

  // Demo "Continue Watching" items derived from movies for UI showcase
  const continueWatchingItems = useMemo(() => {
    if (movies.length === 0) return [];
    return movies.slice(0, 4).map((m, idx) => ({
      ...m,
      progress: idx === 0 ? 65 : idx === 1 ? 40 : idx === 2 ? 80 : 25,
      timeLeft: idx === 0 ? '1h 22m left' : idx === 1 ? '45m left' : idx === 2 ? '52m left' : '15m left',
    }));
  }, [movies]);

  const toggleWatchlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlistIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-14 h-14 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-neutral-400 text-sm font-semibold tracking-wider animate-pulse">
          Loading Taban Play...
        </p>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neutral-400">
        No content available
      </div>
    );
  }

  // Full category view when "See All >" is clicked
  if (viewingList) {
    return (
      <div className="pb-28 pt-6 px-4 md:px-8 bg-[#0a0a0f] min-h-screen text-white">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button 
              onClick={() => setViewingList(null)}
              className="w-10 h-10 bg-[#161720] hover:bg-neutral-800 border border-white/10 rounded-full flex items-center justify-center transition shadow-lg"
            >
              <ChevronLeft size={20} className="rtl:rotate-180 text-white" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{viewingList.title}</h1>
              <p className="text-xs text-neutral-400 mt-0.5">{viewingList.items.length} items</p>
            </div>
          </div>
        </div>
        
        {/* Type Filter Bar */}
        {(() => {
          const hasMovies = viewingList.items.some(m => m.type === 'Movie');
          const hasSeries = viewingList.items.some(m => m.type === 'Series');
          if (!hasMovies || !hasSeries) return null;

          return (
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'all', label: language === 'ku' ? 'گشتی' : t.all },
                { id: 'Movie', label: language === 'ku' ? 'فیلم' : t.movies },
                { id: 'Series', label: language === 'ku' ? 'زنجیرە' : t.series }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                    filterType === f.id 
                      ? 'bg-[#CC222F] text-white shadow-lg shadow-red-600/30' 
                      : 'bg-[#14151c] text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {viewingList.items
            .filter(m => filterType === 'all' ? true : m.type === filterType)
            .map((movie) => (
            <motion.div 
              key={movie.id} 
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer group flex flex-col" 
              onClick={() => onSelect(movie)}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-xl aspect-[2/3] border border-white/10 bg-[#14151c]">
                <Image 
                  src={movie.image} 
                  alt={movie.title} 
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  unoptimized={true}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                  <div className="w-12 h-12 rounded-full bg-[#CC222F] flex items-center justify-center text-white shadow-lg shadow-red-600/40 transform group-hover:scale-110 transition">
                    <Play size={22} className="fill-white ml-0.5" />
                  </div>
                </div>
                {movie.rating && (
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[11px] font-bold text-yellow-400 flex items-center space-x-1">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span>{movie.rating}</span>
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-sm font-bold truncate text-white group-hover:text-[#CC222F] transition-colors tracking-tight">
                {getLocalized(movie, 'title', language)}
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">{movie.year}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white pb-32">

      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 light-mode:border-neutral-200 bg-[#0a0a0f]/90 light-mode:bg-white/90 backdrop-blur-xl sticky top-0 z-40">
        {/* Brand Logo - LTR Fixed */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          dir="ltr" 
          onClick={() => router.push('/')}
        >
          <Image 
            src="/app-logo-new.png" 
            alt="Taban Play" 
            width={36} 
            height={36} 
            className="object-contain group-hover:scale-105 transition" 
            unoptimized 
          />
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-black text-white light-mode:text-black tracking-tight">Taban</span>
            <span className="text-xl font-black text-[#CC222F] tracking-tight">Play</span>
          </div>
        </div>

        {/* Header Right Tools */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="relative">
            <button className="p-2.5 rounded-full bg-[#14151c] light-mode:bg-neutral-100 hover:bg-neutral-800 light-mode:hover:bg-neutral-200 text-neutral-300 light-mode:text-neutral-700 hover:text-white light-mode:hover:text-black border border-white/10 light-mode:border-neutral-200 transition">
              <Bell size={18} />
            </button>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#CC222F] rounded-full light-mode:hidden"></span>
          </div>
        </div>
      </header>


      {/* 1. FULL-WIDTH EDGE-TO-EDGE BILLBOARD HERO */}
      {currentFeatured && (() => {
        // Swipe gesture tracking refs (inline via data attributes handled in JSX)
        return (
          <div
            className="relative w-full overflow-hidden cursor-pointer select-none"
            onClick={() => onSelect(currentFeatured)}
            onTouchStart={(e) => {
              const t = e.touches[0];
              (e.currentTarget as HTMLElement).dataset.touchX = String(t.clientX);
              (e.currentTarget as HTMLElement).dataset.touchY = String(t.clientY);
            }}
            onTouchEnd={(e) => {
              const startX = Number((e.currentTarget as HTMLElement).dataset.touchX || 0);
              const startY = Number((e.currentTarget as HTMLElement).dataset.touchY || 0);
              const dx = e.changedTouches[0].clientX - startX;
              const dy = e.changedTouches[0].clientY - startY;
              if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
                e.preventDefault();
                e.stopPropagation();
                if (dx < 0) nextFeatured();
                else prevFeatured();
              }
            }}
          >
            {/* Full-width background image */}
            {currentFeatured.image && (
              <Image
                src={currentFeatured.image}
                alt={currentFeatured.title || ''}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center scale-105 hover:scale-110 transition-transform duration-[3000ms] ease-out pointer-events-none"
                unoptimized={true}
              />
            )}

            {/* Content overlay */}
            <div className="relative z-10 aspect-[16/10] sm:aspect-[21/9] md:aspect-[3/1] flex flex-col justify-end px-5 pt-5 pb-8 sm:px-8 sm:pb-10 md:px-10">

              {/* Movie Title */}
              <h1 className="text-base sm:text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-2xl line-clamp-2 max-w-md mb-2">
                {getLocalized(currentFeatured, 'title', language)}
              </h1>

              {/* Meta Badges Row — below title */}
              <div className="flex items-center flex-wrap gap-1.5 mb-4">
                {typeof currentFeatured.genre === 'string' && currentFeatured.genre.trim() && (
                  <span className="px-2.5 py-0.5 rounded-md bg-white/15 backdrop-blur-md text-neutral-200 font-semibold text-[10px]">
                    {currentFeatured.genre.split(',')[0]}
                  </span>
                )}
                {currentFeatured.year && (
                  <span className="px-2.5 py-0.5 rounded-md bg-white/15 backdrop-blur-md text-neutral-200 font-semibold text-[10px]">
                    {currentFeatured.year}
                  </span>
                )}
                {currentFeatured.rating && (
                  <span className="px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-yellow-400 font-bold text-[10px] flex items-center space-x-1">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span>{currentFeatured.rating}</span>
                  </span>
                )}
                {currentFeatured.type && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#CC222F] text-white shadow-md">
                    {currentFeatured.type}
                  </span>
                )}
              </div>

              {/* Dot Slide Indicators — bottom centre */}
              {featuredMovies.length > 1 && (
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {featuredMovies.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        const diff = i - currentFeaturedIndex;
                        if (diff > 0) for (let j = 0; j < diff; j++) nextFeatured();
                        else if (diff < 0) for (let j = 0; j < Math.abs(diff); j++) prevFeatured();
                      }}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: i === currentFeaturedIndex ? '20px' : '6px',
                        height: '6px',
                        backgroundColor: i === currentFeaturedIndex ? '#CC222F' : 'rgba(255,255,255,0.4)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}


      <div className="px-4 md:px-8 space-y-10 pt-4">



        {/* 3. "TRENDING NOW" / TOP CONTENTS ROW (Portrait 2:3 cards) */}
        {topContents.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                <Flame size={20} className="text-[#CC222F]" />
                <span>Trending Now</span>
              </h2>
              <button 
                onClick={() => setViewingList({ rawName: 'Top Contents' })}
                className="text-xs md:text-sm font-bold text-[#CC222F] hover:text-red-400 transition flex items-center space-x-1"
              >
                <span>See All</span>
                <ChevronRight size={14} className="rtl:rotate-180" />
              </button>
            </div>

            <div className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {topContents.slice(0, displayLimit).map((movie, idx) => (
                <motion.div 
                  key={movie.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelect(movie)}
                  className="flex-none w-36 sm:w-44 md:w-52 cursor-pointer group flex flex-col"
                >
                  {/* 2:3 Portrait Card */}
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#14151c] border border-white/10 shadow-xl group-hover:border-[#CC222F]/40 transition-colors">
                    <Image 
                      src={movie.image} 
                      alt={movie.title} 
                      fill
                      sizes="(max-width: 768px) 40vw, 220px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized={true}
                    />

                    {/* Dark Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="w-10 h-10 rounded-full bg-[#CC222F] text-white flex items-center justify-center shadow-lg shadow-red-600/40">
                        <Play size={18} className="fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Top Rank Badge or Rating */}
                    {movie.rating ? (
                      <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[11px] font-bold text-yellow-400 flex items-center space-x-1">
                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                        <span>{movie.rating}</span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 left-2.5 bg-[#CC222F] px-2 py-0.5 rounded-md text-[10px] font-black text-white uppercase tracking-wider">
                        #{idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Title & Year */}
                  <h3 className="mt-3 text-sm font-bold text-white truncate group-hover:text-[#CC222F] transition-colors">
                    {getLocalized(movie, 'title', language)}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">{movie.year}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* 3b. ANIMATION / ANIME SECTION */}
        {animeItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {language === 'ku' ? 'ئەنیمەیشنەکان' : language === 'ar' ? 'الأنيمي' : 'Animation'}
              </h2>
              <button
                onClick={() => setViewingList({ rawName: 'Animation' })}
                className="text-xs md:text-sm font-bold text-[#CC222F] hover:text-red-400 transition flex items-center space-x-1"
              >
                <span>See All</span>
                <ChevronRight size={14} className="rtl:rotate-180" />
              </button>
            </div>
            <div className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {animeItems.slice(0, displayLimit).map((movie) => (
                <motion.div
                  key={movie.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelect(movie)}
                  className="flex-none w-36 sm:w-44 md:w-52 cursor-pointer group flex flex-col"
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#14151c] border border-white/10 shadow-xl group-hover:border-[#CC222F]/40 transition-colors">
                    <Image
                      src={movie.image}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 768px) 40vw, 220px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized={true}
                    />
                    {movie.rating ? (
                      <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[11px] font-bold text-yellow-400 flex items-center space-x-1">
                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                        <span>{movie.rating}</span>
                      </div>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white truncate group-hover:text-[#CC222F] transition-colors">
                    {getLocalized(movie, 'title', language)}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">{movie.year}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* 4. DYNAMIC MOVIE LISTS (e.g. Kurdish Dubbed Series, Action, Cartoons) */}
        {movieLists.map((list) => {
          const listMovies = movies.filter(m => m.list_name === list.name);
          if (listMovies.length === 0) return null;

          const listTitle = getLocalized(list, 'name', language) || list.name;

          return (
            <section key={list.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {listTitle}
                </h2>
                <button 
                  onClick={() => setViewingList({ rawName: list.name })}
                  className="text-xs md:text-sm font-bold text-[#CC222F] hover:text-red-400 transition flex items-center space-x-1"
                >
                  <span>See All</span>
                  <ChevronRight size={14} className="rtl:rotate-180" />
                </button>
              </div>

              <div className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {listMovies.slice(0, displayLimit).map((movie) => (
                  <motion.div 
                    key={movie.id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onSelect(movie)}
                    className="flex-none w-36 sm:w-44 md:w-52 cursor-pointer group flex flex-col"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#14151c] border border-white/10 shadow-xl group-hover:border-[#CC222F]/40 transition-colors">
                      <Image 
                        src={movie.image} 
                        alt={movie.title} 
                        fill
                        sizes="(max-width: 768px) 40vw, 220px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-10 h-10 rounded-full bg-[#CC222F] text-white flex items-center justify-center shadow-lg shadow-red-600/40">
                          <Play size={18} className="fill-white ml-0.5" />
                        </div>
                      </div>
                      {movie.type && (
                        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-neutral-300 border border-white/10">
                          {movie.type}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-white truncate group-hover:text-[#CC222F] transition-colors">
                      {getLocalized(movie, 'title', language)}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">{movie.year}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}

      </div>

      <FloatingSocialButton />
    </div>
  );
}
