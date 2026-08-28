'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Play, Plus, Star, ChevronLeft, Bell, Search, 
  ChevronRight, Bookmark, Check, Info, Sparkles, Flame, X
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
  const [displayLimit, setDisplayLimit] = useState(12);
  const [filterType, setFilterType] = useState<'all' | 'Movie' | 'Series'>('all');
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [showWebNotifModal, setShowWebNotifModal] = useState(false);
  const [webNotifications, setWebNotifications] = useState<any[]>([]);
  const [unreadWebNotifCount, setUnreadWebNotifCount] = useState(0);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('');

  const fetchWebNotifications = useCallback(async () => {
    try {
      let fetched: any[] = [];
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (!error && data) fetched = data;

      const { data: sData } = await supabase.from('settings').select('value').eq('key', 'app_notifications_list').maybeSingle();
      if (sData?.value) {
        try {
          const sList = JSON.parse(sData.value);
          fetched = Array.from(new Map([...fetched, ...sList].map((i: any) => [i.id || i.created_at, i])).values());
          fetched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch {}
      }

      const lastRead = localStorage.getItem('web_last_read_notif_time');
      const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
      const unread = fetched.filter(n => new Date(n.created_at).getTime() > lastReadTime).length;

      setWebNotifications(fetched);
      setUnreadWebNotifCount(unread);
    } catch (e) {
      console.warn('Error fetching web notifications:', e);
    }
  }, []);

  useEffect(() => {
    fetchWebNotifications();
  }, [fetchWebNotifications]);

  const handleOpenWebNotifs = () => {
    setShowWebNotifModal(true);
    setUnreadWebNotifCount(0);
    const futureTimeIso = new Date(Date.now() + 10000).toISOString();
    localStorage.setItem('web_last_read_notif_time', futureTimeIso);
  };

  const handleCloseWebNotifs = () => {
    setShowWebNotifModal(false);
    setUnreadWebNotifCount(0);
    const futureTimeIso = new Date(Date.now() + 10000).toISOString();
    localStorage.setItem('web_last_read_notif_time', futureTimeIso);
  };

  // Derive viewingList from URL
  const listName = searchParams ? searchParams.get('list') : null;
  const viewingList = useMemo(() => {
    if (!listName) return null;
    let items: any[] = [];
    let displayTitle = listName ? getLocalized(listName, 'name', language) : '';

    if (listName === 'Top Contents' || listName === 'Trending Now') {
      items = movies.filter(m => m.top_rank).sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99));
      displayTitle = t.popular || 'Trending Now';
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
      setDisplayLimit(window.innerWidth < 768 ? 8 : 18);
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

  const filteredByDesktopSearch = useMemo(() => {
    if (!desktopSearchQuery.trim()) return null;
    const q = desktopSearchQuery.trim().toLowerCase();
    return movies.filter(m => 
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.title_ku && m.title_ku.toLowerCase().includes(q)) ||
      (m.title_ar && m.title_ar.toLowerCase().includes(q)) ||
      (m.genre && String(m.genre).toLowerCase().includes(q))
    );
  }, [desktopSearchQuery, movies]);

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
      <div className="pb-28 pt-6 px-4 md:px-8 lg:px-12 bg-[#0a0a0f] min-h-screen text-white">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {viewingList.items
            .filter(m => filterType === 'all' ? true : m.type === filterType)
            .map((movie) => (
            <motion.div 
              key={movie.id} 
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer group flex flex-col" 
              onClick={() => onSelect(movie)}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-2xl aspect-[2/3] border border-white/10 bg-[#14151c] group-hover:border-[#CC222F]/60 transition-colors">
                <Image 
                  src={movie.image} 
                  alt={movie.title} 
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  unoptimized={true}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                  <div className="w-12 h-12 rounded-full bg-[#CC222F] flex items-center justify-center text-white shadow-xl shadow-red-600/50 transform group-hover:scale-110 transition">
                    <Play size={22} className="fill-white ml-0.5" />
                  </div>
                </div>
                {movie.rating && (
                  <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[11px] font-bold text-yellow-400 flex items-center space-x-1">
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

      {/* Modern Header Bar (Original Mobile layout on mobile, Glassmorphic Desktop header on PC) */}
      <header className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl sticky top-0 z-40">
        
        {/* Left: Brand Logo & Desktop Category Quick Links */}
        <div className="flex items-center space-x-8 rtl:space-x-reverse">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            dir="ltr" 
            onClick={() => router.push('/')}
          >
            <Image 
              src="/app-logo-new.png" 
              alt="Taban Play" 
              width={38} 
              height={38} 
              className="object-contain group-hover:scale-105 transition" 
              unoptimized 
            />
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black text-white tracking-tight">Taban</span>
              <span className="text-xl font-black text-[#CC222F] tracking-tight">Play</span>
            </div>
          </div>

          {/* Desktop Filter Pills */}
          <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
            {[
              { id: 'all', label: t.all },
              { id: 'Movie', label: t.movies },
              { id: 'Series', label: t.series }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  filterType === f.id
                    ? 'bg-[#CC222F] text-white shadow-lg shadow-red-600/30'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Desktop Search Bar & Notification Bell */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-64 focus-within:w-80 focus-within:border-[#CC222F] transition-all duration-300">
            <Search size={16} className="text-neutral-400 shrink-0" />
            <input 
              type="text"
              value={desktopSearchQuery}
              onChange={e => setDesktopSearchQuery(e.target.value)}
              placeholder={language === 'ku' ? 'گەڕان بۆ فیلم...' : 'Search movies...'}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-neutral-500 pl-2 w-full"
            />
            {desktopSearchQuery && (
              <button onClick={() => setDesktopSearchQuery('')} className="text-neutral-400 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          <button 
            onClick={handleOpenWebNotifs}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition relative"
          >
            <Bell size={18} />
            {unreadWebNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#CC222F] rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* Desktop Search Results View */}
      {filteredByDesktopSearch ? (
        <div className="px-4 md:px-10 py-8">
          <h2 className="text-xl font-bold mb-6 text-white">
            {language === 'ku' ? 'ئەنجامەکانی گەڕان' : 'Search Results'} ({filteredByDesktopSearch.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredByDesktopSearch.map((movie) => (
              <motion.div 
                key={movie.id}
                whileHover={{ y: -6, scale: 1.03 }}
                onClick={() => onSelect(movie)}
                className="cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#14151c] border border-white/10 shadow-xl group-hover:border-[#CC222F]/60">
                  <Image src={movie.image} alt={movie.title} fill className="object-cover group-hover:scale-105 transition duration-500" unoptimized />
                </div>
                <h3 className="mt-3 text-sm font-bold text-white truncate group-hover:text-[#CC222F]">{getLocalized(movie, 'title', language)}</h3>
                <p className="text-xs text-neutral-400">{movie.year}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 1. HERO BANNER (Original Mobile Layout on Mobile, Widescreen Cinema Banner on Desktop) */}
          {currentFeatured && (() => {
            const bgImg = currentFeatured.backdrop || currentFeatured.image;
            const genresText = Array.isArray(currentFeatured.genre)
              ? currentFeatured.genre.slice(0, 3).join(', ')
              : typeof currentFeatured.genre === 'string'
              ? currentFeatured.genre.split(',').slice(0, 3).join(', ')
              : '';

            return (
              <div className="relative w-full px-0 md:px-8 md:pt-6">
                <div
                  className="relative w-full overflow-hidden cursor-pointer select-none group bg-[#0f0f13] mb-6 sm:mb-8 md:mb-10 md:rounded-3xl border-0 md:border md:border-white/10 shadow-2xl"
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
                  <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] md:aspect-[3.6/1] lg:aspect-[4.2/1] md:max-h-[300px] lg:max-h-[340px]">
                    {bgImg && (
                      <Image
                        src={bgImg}
                        alt={currentFeatured.title || ''}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                        unoptimized={true}
                      />
                    )}

                    {/* Gradient Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/35 to-transparent pointer-events-none" />
                    <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent pointer-events-none" />

                    {/* Top-Right Rating Badge */}
                    {currentFeatured.rating && (
                      <div className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 z-20">
                        <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-xs font-black text-white flex items-center space-x-1.5 shadow-lg rtl:space-x-reverse">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{currentFeatured.rating}</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Row Content: Floating Thumbnail + Title Stack */}
                    <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-6 sm:right-6 z-20 flex items-end gap-3.5 sm:gap-5 rtl:flex-row-reverse">
                      
                      {/* Compact Vertical Poster Thumbnail on PC */}
                      <div className="relative w-20 sm:w-24 md:w-28 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[#CC222F] shadow-2xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <Image
                          src={currentFeatured.image}
                          alt={currentFeatured.title || ''}
                          fill
                          sizes="(max-width: 768px) 80px, 120px"
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>

                      {/* Info Stack */}
                      <div className="flex-1 min-w-0 flex flex-col justify-end space-y-1 ltr:pl-1 rtl:pr-1">
                        <h1 className="text-base sm:text-2xl md:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md truncate">
                          {getLocalized(currentFeatured, 'title', language)}
                        </h1>

                        <div className="flex items-center gap-2 text-[11px] sm:text-sm text-neutral-300 font-medium truncate">
                          {genresText ? <span>{genresText}</span> : null}
                          {currentFeatured.year ? (
                            <>
                              <span className="text-neutral-400">•</span>
                              <span>{currentFeatured.year}</span>
                            </>
                          ) : null}
                        </div>

                        {/* Carousel Dots */}
                        {featuredMovies.length > 1 && (
                          <div
                            className="flex items-center gap-1.5 pt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {featuredMovies.map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentFeaturedIndex(i);
                                }}
                                className="transition-all duration-300 rounded-full"
                                style={{
                                  width: i === currentFeaturedIndex ? '20px' : '6px',
                                  height: '5px',
                                  backgroundColor: i === currentFeaturedIndex ? '#CC222F' : 'rgba(255,255,255,0.35)',
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            );
          })()}


          {/* CONTENT ROWS (Original Horizontal Swipe Rows on Mobile, Multi-column Grid on Desktop) */}
          <div className="px-4 md:px-8 lg:px-10 space-y-10 pt-2">

            {/* TOP CONTENTS / TRENDING NOW */}
            {topContents.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                    <Flame size={22} className="text-[#CC222F]" />
                    <span>{t.popular}</span>
                  </h2>
                  <button 
                    onClick={() => setViewingList({ rawName: 'Top Contents' })}
                    className="text-xs md:text-sm font-bold text-[#CC222F] hover:text-red-400 transition flex items-center space-x-1"
                  >
                    <span>{t.seeAll}</span>
                    <ChevronRight size={16} className="rtl:rotate-180" />
                  </button>
                </div>

                {/* Mobile: Horizontal Swipe Row (-mx-4 px-4 overflow-x-auto) | Desktop: Multi-column Grid (md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6) */}
                <div className="flex space-x-4 md:space-x-0 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-6">
                  {topContents
                    .filter(m => filterType === 'all' ? true : m.type === filterType)
                    .slice(0, displayLimit)
                    .map((movie, idx) => (
                    <motion.div 
                      key={movie.id}
                      whileHover={{ y: -6, scale: 1.03 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onSelect(movie)}
                      className="flex-none w-36 sm:w-44 md:w-auto cursor-pointer group flex flex-col"
                    >
                      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#14151c] border border-white/10 shadow-xl group-hover:border-[#CC222F]/60 transition-colors">
                        <Image 
                          src={movie.image} 
                          alt={movie.title} 
                          fill
                          sizes="(max-width: 768px) 40vw, 220px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized={true}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <div className="w-10 h-10 rounded-full bg-[#CC222F] text-white flex items-center justify-center shadow-lg shadow-red-600/40">
                            <Play size={18} className="fill-white ml-0.5" />
                          </div>
                        </div>

                        {movie.rating ? (
                          <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[11px] font-bold text-yellow-400 flex items-center space-x-1">
                            <Star size={11} className="fill-yellow-400 text-yellow-400" />
                            <span>{movie.rating}</span>
                          </div>
                        ) : (
                          <div className="absolute top-2.5 left-2.5 bg-[#CC222F] px-2 py-0.5 rounded-md text-[10px] font-black text-white uppercase">
                            #{idx + 1}
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
            )}

            {/* DYNAMIC MOVIE LISTS */}
            {movieLists.map((list) => {
              const listMovies = movies
                .filter(m => m.list_name === list.name)
                .filter(m => filterType === 'all' ? true : m.type === filterType);
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
                      <span>{t.seeAll}</span>
                      <ChevronRight size={16} className="rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Mobile: Horizontal Swipe Row | Desktop: Multi-column Grid */}
                  <div className="flex space-x-4 md:space-x-0 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-6">
                    {listMovies.slice(0, displayLimit).map((movie) => (
                      <motion.div 
                        key={movie.id}
                        whileHover={{ y: -6, scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onSelect(movie)}
                        className="flex-none w-36 sm:w-44 md:w-auto cursor-pointer group flex flex-col"
                      >
                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#14151c] border border-white/10 shadow-xl group-hover:border-[#CC222F]/60 transition-colors">
                          <Image 
                            src={movie.image} 
                            alt={movie.title} 
                            fill
                            sizes="(max-width: 768px) 40vw, 220px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized={true}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <div className="w-10 h-10 rounded-full bg-[#CC222F] text-white flex items-center justify-center shadow-lg shadow-red-600/40">
                              <Play size={18} className="fill-white ml-0.5" />
                            </div>
                          </div>
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
        </>
      )}

      <FloatingSocialButton />

      {/* WEB NOTIFICATIONS MODAL */}
      <AnimatePresence>
        {showWebNotifModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCloseWebNotifs}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#14151c] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2.5 rounded-2xl bg-red-600/10 text-[#CC222F]">
                    <Bell size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t.notifications}</h3>
                </div>
                <button onClick={handleCloseWebNotifs} className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[440px] overflow-y-auto space-y-3">
                {webNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3 text-neutral-500">
                    <Bell size={44} className="opacity-30" />
                    <p className="text-sm font-medium">{t.noNotifications}</p>
                  </div>
                ) : (
                  webNotifications.map((item: any) => (
                    <div key={item.id || item.created_at} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white">
                      <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-neutral-300 leading-relaxed">{item.body}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
