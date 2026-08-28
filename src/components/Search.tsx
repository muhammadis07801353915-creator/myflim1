'use client';

import { Search as SearchIcon, Star, X, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/LanguageContext';
import { useData } from '../lib/DataContext';
import { getLocalized } from '../lib/translations';

export default function Search({ onSelect }: { onSelect: (item: any) => void }) {
  const { language } = useLanguage();
  const { movies, channels, loading } = useData();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeYear, setActiveYear] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'popular'>('newest');

  const typeOptions = [
    { id: 'All', label: language === 'ku' ? 'هەمووی' : language === 'badini' ? 'هەمی' : language === 'ar' ? 'الكل' : 'All' },
    { id: 'Movie', label: language === 'ku' ? 'فیلمەکان' : language === 'badini' ? 'فیلم' : language === 'ar' ? 'أفلام' : 'Movies' },
    { id: 'Series', label: language === 'ku' ? 'زنجیرەکان' : language === 'badini' ? 'زنجیرە' : language === 'ar' ? 'مسلسلات' : 'Series' },
    { id: 'Anime', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'badini' ? 'ئەنیمەیشن' : language === 'ar' ? 'أنيمي' : 'Anime' },
    { id: 'LiveTV', label: language === 'ku' ? 'ڕاستەوخۆ' : language === 'badini' ? 'ڕاستەوخۆ' : language === 'ar' ? 'بث مباشر' : 'Live TV' },
  ];

  const yearsList = [
    { id: 'All', label: language === 'ku' ? 'هەموو ساڵەکان' : language === 'badini' ? 'تەڤایا ساڵان' : language === 'ar' ? 'جميع السنوات' : 'All Years' },
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
    { id: '2000s', label: language === 'ku' ? 'ساڵانی 2000' : language === 'badini' ? 'ساڵێن 2000' : language === 'ar' ? 'عقد 2000' : '2000s' },
    { id: '1990s', label: language === 'ku' ? 'ساڵانی 1990' : language === 'badini' ? 'ساڵێن 1990' : language === 'ar' ? 'عقد 1990' : '1990s' },
  ];

  const genresList = [
    { id: 'All', label: language === 'ku' ? 'هەموو جۆرەکان' : language === 'badini' ? 'تەڤایا جۆران' : language === 'ar' ? 'جميع الأنواع' : 'All Genres' },
    { id: 'Action', label: language === 'ku' ? 'ئەکشن' : language === 'badini' ? 'ئەکشن' : language === 'ar' ? 'أكشن' : 'Action' },
    { id: 'Comedy', label: language === 'ku' ? 'کۆمیدی' : language === 'badini' ? 'کۆمیدی' : language === 'ar' ? 'كوميدي' : 'Comedy' },
    { id: 'Drama', label: language === 'ku' ? 'دراما' : language === 'badini' ? 'دراما' : language === 'ar' ? 'دراما' : 'Drama' },
    { id: 'Horror', label: language === 'ku' ? 'ترسناک' : language === 'badini' ? 'ترسناک' : language === 'ar' ? 'رعب' : 'Horror' },
    { id: 'Romance', label: language === 'ku' ? 'رۆمانسی' : language === 'badini' ? 'رۆمانسی' : language === 'ar' ? 'رومانسي' : 'Romance' },
    { id: 'Sci-Fi', label: language === 'ku' ? 'زانستی' : language === 'badini' ? 'زانستی' : language === 'ar' ? 'خيال علمي' : 'Sci-Fi' },
    { id: 'Crime', label: language === 'ku' ? 'تاوان کاری' : language === 'badini' ? 'تاوان کاری' : language === 'ar' ? 'جريمة' : 'Crime' },
    { id: 'Animation', label: language === 'ku' ? 'ئەنیمەیشن' : language === 'badini' ? 'ئەنیمەیشن' : language === 'ar' ? 'رسوم متحركة' : 'Animation' },
    { id: 'زنجیرەی کوردی دۆبلاژ', label: language === 'ku' ? 'کوردی دۆبلاژ' : language === 'badini' ? 'دۆبلاژکری یێن کوردی' : language === 'ar' ? 'مدبلج كوردي' : 'Kurdish Dubbed' },
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
      pool = [...movies, ...channels];
    } else if (activeType === 'LiveTV') {
      pool = channels;
    } else if (activeType === 'Anime') {
      pool = movies.filter(isAnimeItem);
    } else {
      pool = movies.filter(m => m.type === activeType && !isAnimeItem(m));
    }

    let filtered = pool.filter(item => {
      const title = (getLocalized(item, 'title', language) || item.title || item.name || '').toLowerCase();
      const genre = (item.genre || item.category || '').toLowerCase();
      const cast = (item.cast || '').toLowerCase();
      const director = (item.director || '').toLowerCase();
      const q = query.toLowerCase().trim();

      const matchesQuery = !q || title.includes(q) || genre.includes(q) || cast.includes(q) || director.includes(q);
      const matchesGenre = matchesGenreOrList(item, activeGenre);
      
      let matchesYear = true;
      if (activeYear !== 'All') {
        const itemYear = parseInt(item.year);
        if (activeYear === '2000s') matchesYear = itemYear >= 2000 && itemYear <= 2009;
        else if (activeYear === '1990s') matchesYear = itemYear >= 1990 && itemYear <= 1999;
        else matchesYear = item.year === activeYear;
      }

      return matchesQuery && matchesGenre && matchesYear;
    });

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
  }, [query, activeType, activeGenre, activeYear, sortBy, movies, channels, language]);

  return (
    <div className="p-4 sm:p-6 pt-6 pb-28 max-w-7xl mx-auto font-sans" dir={language === 'ku' || language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ── SEARCH INPUT BAR ── */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-white/40 light-mode:text-neutral-500" size={20} />
        <input
          type="text"
          placeholder={language === 'ku' ? 'گەڕان بۆ فیلم، زنجیرە، لایڤ تەلەڤیزیۆن...' : language === 'badini' ? 'لێگەڕیان بۆ فیلم، زنجیرە، لایڤ تەلەڤیزیۆن...' : language === 'ar' ? 'البحث عن فيلم، مسلسل، بث مباشر...' : 'Search movies, series, live TV...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/7 light-mode:bg-white border border-white/10 light-mode:border-neutral-300 text-white light-mode:text-black placeholder-white/40 light-mode:placeholder-neutral-400 rounded-2xl py-4 pl-12 pr-10 rtl:pl-10 rtl:pr-12 focus:outline-none focus:border-[#CC222F]/60 transition-colors shadow-lg text-base"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-white/40 light-mode:text-neutral-500 hover:text-white light-mode:hover:text-black"
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
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeType === t.id ? 'filter-pill-active' : 'filter-pill'
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
            className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeGenre === g.id ? 'filter-pill-active' : 'filter-pill'
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeYear === y.id ? 'filter-pill-active' : 'filter-pill'
            }`}
          >
            {y.label}
          </button>
        ))}
      </div>

      {/* ── HEADER ROW (Result count & Sort selector) ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white light-mode:text-black tracking-tight">
          {query || activeType !== 'All' || activeGenre !== 'All' || activeYear !== 'All'
            ? `${language === 'ku' ? 'ئەنجامەکان' : language === 'badini' ? 'ئەنجام' : language === 'ar' ? 'النتائج' : 'Results'} (${filteredItems.length})`
            : `${language === 'ku' ? 'هەمووی' : language === 'badini' ? 'هەمی' : language === 'ar' ? 'الكل' : 'All'} (${filteredItems.length})`}
        </h2>

        <button
          onClick={() => setSortBy(prev => prev === 'newest' ? 'rating' : prev === 'rating' ? 'popular' : 'newest')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition filter-pill"
        >
          <ArrowUpDown size={14} className="text-[#CC222F]" />
          <span>
            {sortBy === 'newest'
              ? (language === 'ku' ? 'نوێترین' : language === 'badini' ? 'نوی‌ترین' : language === 'ar' ? 'الأحدث' : 'Newest')
              : sortBy === 'rating'
              ? (language === 'ku' ? 'هەڵسەنگاندن' : language === 'badini' ? 'هەلسەنگاندن' : language === 'ar' ? 'الأعلى تقييماً' : 'Rating')
              : (language === 'ku' ? 'ناودارتر' : language === 'badini' ? 'دیارترین' : language === 'ar' ? 'الأكثر شعبية' : 'Popular')}
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
              className="bg-neutral-900 light-mode:bg-white border border-white/8 light-mode:border-neutral-200 hover:border-[#CC222F]/50 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] flex flex-col shadow-sm" 
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
                  <h3 className="font-bold text-sm text-white light-mode:text-black truncate group-hover:text-[#CC222F] transition-colors">{getLocalized(item, 'title', language) || item.title || item.name}</h3>
                  <p className="text-xs text-white/40 light-mode:text-neutral-500 mt-0.5 truncate">{item.genre || item.category || item.year}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
