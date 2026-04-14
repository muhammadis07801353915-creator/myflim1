import { Plus, Star, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { useHardwareBack } from '../lib/useHardwareBack';
import { useData } from '../lib/DataContext';

export default function Home({ onSelect }: { onSelect: (item: any) => void }) {
  const { t } = useLanguage();
  const { movies, movieLists, loading } = useData();
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [viewingList, setViewingList] = useState<{ title: string, items: any[] } | null>(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      setDisplayLimit(window.innerWidth < 768 ? 3 : 10);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useHardwareBack(!!viewingList, () => setViewingList(null));



  const featuredMovies = movies.filter(m => m.is_featured);
  
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
    const interval = setInterval(nextFeatured, 5000);
    return () => clearInterval(interval);
  }, [featuredMovies.length, nextFeatured]);

  const currentFeatured = featuredMovies.length > 0 ? featuredMovies[currentFeaturedIndex] : movies[0];
  const topContents = movies.filter(m => m.top_rank).sort((a, b) => (a.top_rank || 99) - (b.top_rank || 99));

  if (loading) {
    return <div className="flex items-center justify-center h-[65vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>;
  }

  if (movies.length === 0) {
    return <div className="flex items-center justify-center h-[65vh] text-neutral-400">No content available</div>;
  }

  if (viewingList) {
    return (
      <div className="pb-24 pt-6 px-4 bg-neutral-950 light-mode:bg-white min-h-screen text-white light-mode:text-black">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setViewingList(null)}
            className="w-10 h-10 bg-neutral-900 light-mode:bg-neutral-100 hover:bg-neutral-800 light-mode:hover:bg-neutral-200 rounded-full flex items-center justify-center mr-4 rtl:mr-0 rtl:ml-4 transition"
          >
            <ChevronLeft size={20} className="rtl:rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">{viewingList.title}</h1>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
          {viewingList.items.map((movie) => (
            <div key={movie.id} className="cursor-pointer group flex flex-col" onClick={() => onSelect(movie)}>
              <div className="relative overflow-hidden rounded-xl shadow-lg aspect-[2/3] border border-white/5 bg-neutral-900">
                <Image 
                  src={movie.image} 
                  alt={movie.title} 
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                  unoptimized={true}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <Play size={20} className="text-white fill-white" />
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold truncate text-neutral-200 light-mode:text-black group-hover:text-red-500 transition-colors uppercase tracking-tight">{movie.title}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Featured Hero Slider - New Image Style */}
      <div className="relative pt-8 pb-4 overflow-hidden">
        <div 
          className="flex px-6 space-x-5 overflow-x-auto scrollbar-hide snap-x"
          onScroll={(e) => {
            const target = e.currentTarget;
            const scrollLeft = target.scrollLeft;
            const firstChild = target.firstChild as HTMLElement;
            const itemWidth = firstChild ? firstChild.offsetWidth + 20 : target.offsetWidth * 0.85; // 20 is the space-x-5 gap
            const index = Math.round(scrollLeft / itemWidth);
            if (index !== currentFeaturedIndex && index >= 0 && index < featuredMovies.length) {
              setCurrentFeaturedIndex(index);
            }
          }}
        >
          {featuredMovies.length > 0 ? (
            featuredMovies.map((movie, idx) => (
              <motion.div 
                key={movie.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex-none w-[85vw] md:w-[450px] aspect-[1/1.4] relative rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 snap-center cursor-pointer group"
                onClick={() => onSelect(movie)}
              >
                <Image 
                  src={movie.image} 
                  alt={movie.title} 
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 768px) 85vw, 450px"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  unoptimized={true}
                />
                
                {/* Overlay with Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-8">
                  <div className="space-y-1">
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-1">
                      {movie.title}
                    </h2>
                    <div className="flex items-center space-x-3 text-white/80 text-lg font-medium">
                      <span>{movie.year}</span>
                    </div>
                  </div>

                  {/* My Film Branding Style */}
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center space-x-2">
                       <div className="flex items-center">
                          {/* Styled Logo Icon mimicking the image */}
                          <div className="relative flex items-center mr-3">
                            <div className="w-9 h-7 bg-white rounded-md flex items-center justify-center relative">
                               <span className="text-black font-black text-lg -mt-1">m</span>
                               {/* Camera lens triangle */}
                               <div className="absolute -right-2 top-1.5 w-0 h-0 border-t-[8px] border-t-transparent border-l-[10px] border-l-red-600 border-b-[8px] border-b-transparent"></div>
                               {/* Red dot on top of m */}
                               <div className="absolute -top-1.5 right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-black"></div>
                            </div>
                          </div>
                          <div className="flex items-baseline leading-none">
                            <span className="text-2xl font-black text-white tracking-tighter">MY</span>
                            <span className="text-2xl font-medium text-white ml-1.5 relative">
                              Film
                              <span className="absolute -top-1 right-5 w-2 h-2 bg-red-600 rounded-full"></span>
                            </span>
                          </div>
                       </div>
                    </div>
                    {movie.genre && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        {movie.genre.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional: Add the specific text from image if it's a fixed part of the design */}
                <div className="absolute bottom-16 right-8 text-right opacity-60">
                   <p className="text-[10px] text-white/30 font-medium">کوالێت و تەکنیک : هانا گەلووکی</p>
                </div>
              </motion.div>
            ))
          ) : (
             <div className="w-full h-64 flex items-center justify-center text-neutral-500">
               No featured content
             </div>
          )}
        </div>

        {/* Pagination Dashes - Blue Style */}
        <div className="mt-8 px-6 flex items-center space-x-2">
          {featuredMovies.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentFeaturedIndex 
                  ? 'w-10 bg-blue-600' 
                  : idx < 3 ? 'w-4 bg-blue-900/40' : 'hidden'
              }`}
            />
          ))}
          {featuredMovies.length > 3 && (
             <div className="w-2 h-1.5 rounded-full bg-blue-900/20" />
          )}
        </div>
      </div>


      {/* Top Contents Section - Video Style */}
      {topContents.length > 0 && (
        <div className="mt-6 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white light-mode:text-black">Top Contents</h2>
            <button onClick={() => setViewingList({ title: 'Top Contents', items: topContents })} className="text-red-500 text-sm font-medium">{t.all}</button>
          </div>
          <div className="flex space-x-4 md:space-x-8 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4">
            {topContents.slice(0, displayLimit).map((movie, index) => (
              <div key={movie.id} className="flex-none w-44 md:w-64 relative cursor-pointer group" onClick={() => onSelect(movie)}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg aspect-[2/3] border border-white/5 bg-neutral-900">
                  <Image 
                    src={movie.image} 
                    alt={movie.title} 
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    unoptimized={true}
                  />
                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 bg-red-600 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-black text-white shadow-lg uppercase tracking-wider z-20">
                    {movie.type}
                  </div>
                  
                  {/* Large Outline Number */}
                  <div className="absolute -bottom-6 -right-4 z-10 select-none pointer-events-none transition-transform group-hover:scale-110 duration-500">
                    <span className="text-[140px] md:text-[200px] font-black text-white leading-none tracking-tighter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] opacity-95 italic">
                      {index + 1}
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 text-sm md:text-lg font-bold truncate text-neutral-200 light-mode:text-black group-hover:text-red-500 transition-colors uppercase tracking-tight">{movie.title}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Movie Lists */}
      {movieLists.map((list) => {
        const listMovies = movies.filter(m => m.list_name === list.name);
        if (listMovies.length === 0) return null;

        return (
          <div key={list.id} className="mt-8 px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white light-mode:text-black">{list.name}</h2>
              <button onClick={() => setViewingList({ title: list.name, items: listMovies })} className="text-red-500 text-sm font-medium">{t.all}</button>
            </div>
            <div className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {listMovies.slice(0, displayLimit).map((movie) => (
                <div key={movie.id} className="flex-none w-32 md:w-48 cursor-pointer group" onClick={() => onSelect(movie)}>
                  <div className="relative overflow-hidden rounded-xl shadow-lg aspect-[2/3] bg-neutral-900">
                    <Image 
                      src={movie.image} 
                      alt={movie.title} 
                      fill
                      sizes="(max-width: 768px) 33vw, 20vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      unoptimized={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <Play size={18} className="text-white fill-white" />
                    </div>
                  </div>
                  <h3 className="mt-3 text-xs md:text-sm font-bold truncate text-neutral-300 light-mode:text-slate-700 group-hover:text-red-600 transition-colors uppercase tracking-tight">{movie.title}</h3>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Default Movies Section (if not in any list) */}
      <div className="mt-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white light-mode:text-black">{t.movies}</h2>
          <button onClick={() => setViewingList({ title: t.movies, items: movies.filter(m => !m.list_name || m.list_name === '') })} className="text-red-500 text-sm font-medium">{t.all}</button>
        </div>
        <div className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {movies.filter(m => !m.list_name || m.list_name === '').slice(0, displayLimit).map((movie) => (
            <div key={movie.id} className="flex-none w-32 md:w-48 cursor-pointer group" onClick={() => onSelect(movie)}>
              <div className="relative overflow-hidden rounded-xl shadow-lg aspect-[2/3] bg-neutral-900 border border-white/5">
                <Image 
                  src={movie.image} 
                  alt={movie.title} 
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                  unoptimized={true}
                />
              </div>
              <h3 className="mt-3 text-xs md:text-sm font-bold truncate text-neutral-300 light-mode:text-slate-700 uppercase tracking-tight">{movie.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
