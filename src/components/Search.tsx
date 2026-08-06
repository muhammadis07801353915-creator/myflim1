'use client';

import { Search as SearchIcon, Star, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/LanguageContext';
import { useData } from '../lib/DataContext';
import { getLocalized } from '../lib/translations';

export default function Search({ onSelect }: { onSelect: (item: any) => void }) {
  const { t, language } = useLanguage();
  const { movies, channels, loading } = useData();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeYear, setActiveYear] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'popular'>('newest');

  const typeOptions = [
    { id: 'All', label: language === 'ku' ? 'هەمووی' : language === 'ar' ? 'الكل' : 'All' },
    { id: 'Movie', label: language === 'ku' ? 'فیلمەکان' : language === 'ar' ? 'أفلام' : 'Movies' },
    { id: 'Series', label: language === 'ku' ? 'زنجیرەکان' : language === 'ar' ? 'مسلسلات' : 'Series' },
    { id: 'Anime', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'ar' ? 'أنيمي' : 'Anime' },
    { id: 'LiveTV', label: language === 'ku' ? 'ڕاستەوخۆ' : language === 'ar' ? 'بث مباشر' : 'Live TV' },
  ];

  const yearsList = [
    { id: 'All', label: language === 'ku' ? 'هەموو ساڵەکان' : language === 'ar' ? 'جميع السنوات' : 'All Years' },
    { id: '2026', label: '2026' },
    { id: '2025', label: '2025' },
    { id: '2024', label: '2024' },
    { id: '2023', label: '2023' },
    { id: '2022', label: '2022' },
    { id: '2021', label: '2021' },
    { id: '2020', label: '2020' },
    { id: '2019', label: '2019' },
    { id: '2018', label: '2018' },
    { id: '2015', label: '2015' },
    { id: '2010', label: '2010' },
    { id: '2000s', label: language === 'ku' ? 'ساڵانی 2000' : '2000s' },
    { id: '1990s', label: language === 'ku' ? 'ساڵانی 1990' : '1990s' },
  ];

  const genresList = [
    { id: 'All', label: language === 'ku' ? 'هەموو جۆرەکان' : language === 'ar' ? 'جميع الأنواع' : 'All Genres' },
    { id: 'Action', label: language === 'ku' ? 'ئەکشن' : language === 'ar' ? 'أكشن' : 'Action' },
    { id: 'Comedy', label: language === 'ku' ? 'کۆمیدی' : language === 'ar' ? 'كوميدي' : 'Comedy' },
    { id: 'Drama', label: language === 'ku' ? 'دراما' : language === 'ar' ? 'دراما' : 'Drama' },
    { id: 'Horror', label: language === 'ku' ? 'ترسناک' : language === 'ar' ? 'رعب' : 'Horror' },
    { id: 'Romance', label: language === 'ku' ? 'رۆمانسی' : language === 'ar' ? 'رومانسي' : 'Romance' },
    { id: 'Sci-Fi', label: language === 'ku' ? 'زانستی' : language === 'ar' ? 'خيال علمي' : 'Sci-Fi' },
    { id: 'Crime', label: language === 'ku' ? 'تاوان کاری' : language === 'ar' ? 'جريمة' : 'Crime' },
    { id: 'Animation', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'ar' ? 'رسوم متحركة' : 'Animation' },
    { id: 'زنجیرەی کوردی دۆبلاژ', label: language === 'ku' ? 'کوردی دۆبلاژ' : language === 'ar' ? 'مدبلج كودي' : 'Kurdish Dubbed' },
  ];

  const isAnimeItem = (m: any) => {
    return (
      m.type === 'Anime' ||
      (m.genre && /animation|anime|cartoon|کارتۆن|ئەنیمەیشن/i.test(m.genre)) ||
      (m.list_name && /کارتۆن|ئەنیمەیشن|ئەنیمی|anime|cartoon/i.test(m.list_name)) ||
      (m.category && /کارتۆن|ئەنیمەیشن|anime|cartoon/i.test(m.category))
    );
  };

  const matchesGenreOrList = (m: any, genreId: string) => {
    if (genreId === 'All') return true;
    const genreStr = (m.genre || '').toLowerCase();
    const listStr = (m.list_name || '').toLowerCase();
    const catStr = (m.category || '').toLowerCase();
    const titleStr = (m.title || m.name || '').toLowerCase();

    if (genreId === 'زنجیرەی کوردی دۆبلاژ' || genreId === 'کوردی دۆبلاژ') {
      return (
        listStr.includes('دۆبلاژ') || 
        genreStr.includes('دۆبلاژ') || 
        genreStr.includes('کوردی') || 
        titleStr.includes('دۆبلاژ')
      );
    }

    if (genreId === 'Action') return /action|ئەکشن/i.test(genreStr);
    if (genreId === 'Comedy') return /comedy|کۆمیدی/i.test(genreStr);
    if (genreId === 'Drama') return /drama|دراما/i.test(genreStr);
    if (genreId === 'Horror') return /horror|ترسناک/i.test(genreStr);
    if (genreId === 'Romance') return /romance|رۆمانسی/i.test(genreStr);
    if (genreId === 'Sci-Fi') return /science|sci-fi|زانستی/i.test(genreStr);
    if (genreId === 'Crime') return /crime|تاوان/i.test(genreStr);
    if (genreId === 'Animation') return isAnimeItem(m);

    return (
      genreStr.includes(genreId.toLowerCase()) || 
      listStr.includes(genreId.toLowerCase()) || 
      catStr.includes(genreId.toLowerCase())
    );
  };

  const filteredItems = useMemo(() => {
    let pool: any[] = [];
    if (activeType === 'All') {
      pool = [
        ...movies, 
        ...(channels || []).map(c => ({ ...c, type: 'LiveTV', title: c.name, rating: '8.5' }))
      ];
    } else if (activeType === 'Movie') {
      pool = movies.filter(m => m.type === 'Movie' || !m.type);
    } else if (activeType === 'Series') {
      pool = movies.filter(s => s.type === 'Series' || s.list_name?.includes('زنجیرە'));
    } else if (activeType === 'Anime') {
      pool = movies.filter(isAnimeItem);
    } else if (activeType === 'LiveTV') {
      pool = (channels || []).map(c => ({ ...c, type: 'LiveTV', title: c.name, rating: '8.5' }));
    }

    let filtered = Array.from(new Map(pool.map(item => [item.id, item])).values());

    // 1. Text Search Filter across 3 languages & description
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        const titleKu = (item.title_ku || item.name_ku || '').toLowerCase();
        const titleAr = (item.title_ar || item.name_ar || '').toLowerCase();
        const titleEn = (item.title_en || item.name_en || '').toLowerCase();
        const genre = (item.genre || item.category || '').toLowerCase();
        const year = String(item.year || '');

        return title.includes(q) || titleKu.includes(q) || titleAr.includes(q) || 
               titleEn.includes(q) || genre.includes(q) || year.includes(q);
      });
    }

    // 2. Genre & List Filter
    if (activeGenre !== 'All') {
      filtered = filtered.filter(item => matchesGenreOrList(item, activeGenre));
    }

    // 3. Year Filter
    if (activeYear !== 'All') {
      filtered = filtered.filter(item => {
        const itemYear = Number(item.year);
        if (!itemYear) return false;
        if (activeYear === '2000s') return itemYear >= 2000 && itemYear < 2010;
        if (activeYear === '1990s') return itemYear >= 1990 && itemYear < 2000;
        return String(item.year) === activeYear;
      });
    }

    // 4. Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      if (sortBy === 'popular') {
        return (Number(b.views) || 0) - (Number(a.views) || 0);
      }
      return (Number(b.year || b.id) || 0) - (Number(a.year || a.id) || 0);
    });

    return filtered;
  }, [query, activeType, activeGenre, activeYear, sortBy, movies, channels]);

  return (
    <div className="p-4 sm:p-6 pt-6 pb-28 max-w-7xl mx-auto font-sans" dir={language === 'ku' || language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ── SEARCH INPUT BAR ── */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input
          type="text"
          placeholder={language === 'ku' ? 'گەڕان بۆ فیلم، زنجیرە، لایڤ تەلەڤیزیۆن...' : language === 'ar' ? 'البحث عن فيلم، مسلسل، بث مباشر...' : 'Search movies, series, live TV...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/7 border border-white/10 text-white placeholder-white/40 rounded-2xl py-4 pl-12 pr-10 rtl:pl-10 rtl:pr-12 focus:outline-none focus:border-[#CC222F]/60 transition-colors shadow-lg text-base"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── CONTENT TYPE PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
        {typeOptions.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeType === t.id 
                ? 'bg-[#CC222F] text-white shadow-lg shadow-red-600/25' 
                : 'bg-white/7 border border-white/8 text-white/60 hover:text-white hover:bg-white/12'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GENRE PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
        {genresList.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGenre(g.id)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeGenre === g.id 
                ? 'bg-[#CC222F]/20 border-[#CC222F]/60 text-[#CC222F]' 
                : 'bg-white/4 border-white/6 text-white/45 hover:text-white hover:bg-white/10'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* ── YEAR PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {yearsList.map(y => (
          <button
            key={y.id}
            onClick={() => setActiveYear(y.id)}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
              activeYear === y.id 
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400' 
                : 'bg-white/4 border-white/6 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            {y.label}
          </button>
        ))}
      </div>

      {/* ── HEADER ROW (Result count & Sort selector) ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white tracking-tight">
          {query || activeType !== 'All' || activeGenre !== 'All'
            ? `${language === 'ku' ? 'ئەنجامەکان' : language === 'ar' ? 'النتائج' : 'Results'} (${filteredItems.length})`
            : (language === 'ku' ? 'ناو بەرز و دیارەکان' : language === 'ar' ? 'الرائج الآن' : 'Trending Now')}
        </h2>

        {/* Sort Button */}
        <button
          onClick={() => setSortBy(prev => prev === 'newest' ? 'rating' : prev === 'rating' ? 'popular' : 'newest')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/7 border border-white/8 text-xs font-bold text-white/70 hover:text-white transition"
        >
          <ArrowUpDown size={14} className="text-[#CC222F]" />
          <span>
            {sortBy === 'newest'
              ? (language === 'ku' ? 'نوێترین' : language === 'ar' ? 'الأحدث' : 'Newest')
              : sortBy === 'rating'
              ? (language === 'ku' ? 'هەڵسەنگاندن' : language === 'ar' ? 'الأعلى تقييماً' : 'Rating')
              : (language === 'ku' ? 'ناودارتر' : language === 'ar' ? 'الأكثر شعبية' : 'Popular')}
          </span>
        </button>
      </div>

      {/* ── RESULTS LIST / GRID ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#CC222F]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="bg-neutral-900 border border-white/8 hover:border-[#CC222F]/50 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] flex flex-col" 
              onClick={() => onSelect(item)}
            >
              <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.title || item.name} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-white/40 font-bold">{item.title || item.name}</div>
                )}
                {item.rating ? (
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-amber-400 text-xs font-bold">{item.rating}</span>
                  </div>
                ) : null}
                {item.type && (
                  <div className="absolute top-2 left-2 bg-[#CC222F]/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                    {item.type}
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-[#CC222F] transition-colors">{getLocalized(item, 'title', language) || item.title || item.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{item.genre || item.category || item.year}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-20 text-white/30 text-sm">
              {language === 'ku' ? 'هیچ ئەنجامێک نەدۆزرایەوە' : language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
