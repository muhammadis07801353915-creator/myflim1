'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, ArrowLeft, Search, X, Users, Play, Tv, ChevronLeft, ChevronRight, ExternalLink, Menu, Globe } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { liveCategories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import ReactPlayer from 'react-player';
import HlsPlayer from './HlsPlayer';
import { useLanguage } from '../lib/LanguageContext';
import { useData } from '../lib/DataContext';
import ProSubscriptionModal from './ProSubscriptionModal';
import { getProStatusLocal } from '../lib/pro';
import { getLocalized } from '../lib/translations';

export default function LiveTV() {
  const { t, language } = useLanguage();
  const { channels, categories, banners, countries, loading } = useData();
  const [currentTopBannerIndex, setCurrentTopBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isCountryDrawerOpen, setIsCountryDrawerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewAllCategory, setViewAllCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lock body scroll when country drawer is open on web/mobile browser
  useEffect(() => {
    if (isCountryDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCountryDrawerOpen]);
  
  // Player State
  const [playingChannel, setPlayingChannel] = useState<any | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const handleChannelSelect = (channel: any) => {
    const streamData = (() => {
      try {
        if (channel.stream_url?.startsWith('{')) {
          return JSON.parse(channel.stream_url);
        }
      } catch (e) {}
      return { url: channel.stream_url, profile_link: null };
    })();
    setPlayingChannel({ ...channel, stream_url: streamData.url, profile_link: streamData.profile_link });
  };

  // Apply country filter to channels
  const countryFilteredChannels = selectedCountry
    ? channels.filter(c => c.country === selectedCountry)
    : channels;

  // Group channels by category (country-filtered)
  const channelsByCategory = countryFilteredChannels.reduce((acc, channel) => {
    if (!acc[channel.category]) {
      acc[channel.category] = [];
    }
    acc[channel.category].push(channel);
    return acc;
  }, {} as Record<string, any[]>);

  const categoriesToRender = selectedCategory === 'All' 
    ? categories
    : categories.filter(c => c.name === selectedCategory);

  const searchResults = searchQuery.trim()
    ? countryFilteredChannels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const topBanners = banners.filter(b => b.type === 'top');
  const interspersedBanners = banners.filter(b => b.type === 'interspersed');

  // Helper: localized country name
  const getCountryName = (c: any) => {
    if (language === 'ku') return c.name_ku || c.name_en;
    if (language === 'ar') return c.name_ar || c.name_en;
    return c.name_en;
  };

  useEffect(() => {
    if (topBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTopBannerIndex(prev => (prev + 1) % topBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [topBanners.length]);

  if (loading) {
    return (
      <div className="bg-[#1A1D24] light-mode:bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (playingChannel) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col font-sans">
        <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-[100] pointer-events-none">
          <button 
            onClick={() => setPlayingChannel(null)}
            className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition pointer-events-auto"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-2 bg-red-600/90 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-auto">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-bold tracking-wider">LIVE</span>
          </div>
        </div>

        <div className="w-full bg-black relative aspect-video md:h-[70vh] md:aspect-auto">
          {(() => {
            const isIframeLink = playingChannel.stream_url?.includes('t.me') || 
                                 playingChannel.stream_url?.includes('telegram.me') ||
                                 playingChannel.stream_url?.includes('ok.ru');
            
            const getEmbedUrl = (url: string) => {
              if (!url) return '';
              if (url.includes('t.me') || url.includes('telegram.me')) {
                if (url.includes('embed=1')) return url;
                const separator = url.includes('?') ? '&' : '?';
                return `${url}${separator}embed=1`;
              }
              return url;
            };

            const isM3u8 = playingChannel.stream_url?.toLowerCase().includes('.m3u8');

            return !playingChannel.stream_url ? (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400 absolute inset-0">
                No stream URL available
              </div>
            ) : isIframeLink ? (
              <iframe 
                src={getEmbedUrl(playingChannel.stream_url)} 
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen
              ></iframe>
            ) : isM3u8 ? (
              <HlsPlayer 
                url={playingChannel.stream_url} 
                className="w-full h-full absolute inset-0 object-contain bg-black"
                autoPlay 
                controls 
              />
            ) : (
              (() => {
                const Player = ReactPlayer as any;
                return (
                  <Player 
                    url={playingChannel.stream_url} 
                    width="100%" 
                    height="100%" 
                    controls 
                    playing 
                    className="absolute inset-0"
                  />
                );
              })()
            );
          })()}
        </div>

        <div className="p-5 bg-neutral-900 light-mode:bg-white border-t border-neutral-800 light-mode:border-neutral-200 z-10 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold mb-1 text-white light-mode:text-black">{playingChannel.name}</h1>
              <p className="text-sm text-neutral-400 light-mode:text-neutral-500">{playingChannel.category}</p>
            </div>
            <div className="flex items-center space-x-2">
              {playingChannel.profile_link && (
                <a 
                  href={playingChannel.profile_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-neutral-300 hover:text-white bg-neutral-800 px-3 py-1.5 rounded-lg transition"
                >
                  <ExternalLink size={16} className="text-blue-400" />
                  <span className="font-medium text-sm">Profile</span>
                </a>
              )}
              <div className="flex items-center space-x-1.5 text-neutral-300 light-mode:text-neutral-700 bg-neutral-800 light-mode:bg-neutral-100 px-3 py-1.5 rounded-lg">
                <Users size={16} className="text-red-500" />
                <span className="font-medium text-sm">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewAllCategory) {
    const categoryChannels = channelsByCategory[viewAllCategory] || [];
    return (
      <div className="bg-[#1A1D24] light-mode:bg-gray-50 min-h-screen text-white light-mode:text-black pb-24 font-sans">
        {/* Header for View All */}
        <div className="flex items-center px-4 py-4 bg-[#22252D] light-mode:bg-white sticky top-0 z-40 shadow-md border-b light-mode:border-neutral-200">
          <button 
            onClick={() => setViewAllCategory(null)}
            className="mr-4 rtl:mr-0 rtl:ml-4 hover:text-red-400 transition"
          >
            <ArrowLeft size={24} className="rtl:rotate-180" />
          </button>
          <h1 className="text-xl font-bold">{getLocalized(viewAllCategory, 'name', language)}</h1>
        </div>
        
        {/* Grid of all channels in category */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {categoryChannels.map(channel => (
              <div 
                key={channel.id} 
                onClick={() => handleChannelSelect(channel)}
                className="bg-[#2A2D34] light-mode:bg-white border border-neutral-700/50 light-mode:border-neutral-200 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-[#333740] light-mode:hover:bg-neutral-50 hover:border-neutral-500 transition group relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 z-10 text-white">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span>LIVE</span>
                </div>
                {channel.image ? (
                  <Image 
                    src={channel.image} 
                    alt={channel.name} 
                    fill
                    sizes="(max-width: 768px) 33vw, 15vw"
                    className="object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all p-2"
                    unoptimized={true}
                  />
                ) : (
                  <span className="text-xs text-center text-neutral-400 font-medium">{channel.name}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <Play size={24} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white pb-32 font-sans">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* ☰ Country filter button — always visible */}
          <button
            onClick={() => setIsCountryDrawerOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition text-sm font-bold ${
              selectedCountry
                ? 'bg-[#CC222F]/15 border-[#CC222F]/40 text-[#CC222F]'
                : 'bg-white/7 border-white/8 text-white/70 hover:text-white hover:bg-white/12'
            }`}
          >
            <Menu size={16} />
            {selectedCountry ? (
              <>
                {(() => {
                  const c = countries.find((x: any) => x.name_en === selectedCountry || x.name_ku === selectedCountry);
                  return c?.flag_url ? (
                    <img 
                      src={c.flag_url} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      className="w-5 h-3.5 object-cover rounded-sm" 
                    />
                  ) : null;
                })()}
                <span className="max-w-[80px] truncate">
                  {(() => {
                    const c = countries.find((x: any) => x.name_en === selectedCountry || x.name_ku === selectedCountry);
                    return c ? getCountryName(c) : selectedCountry;
                  })()}
                </span>
                <X size={12} className="shrink-0" onClick={(e) => { e.stopPropagation(); setSelectedCountry(null); }} />
              </>
            ) : (
              <span>{language === 'ku' ? 'وڵات' : language === 'ar' ? 'الدولة' : 'Country'}</span>
            )}
          </button>
          <h1 className="text-xl font-black tracking-tight whitespace-nowrap">
            {language === 'ku' ? 'ڕاستەوخۆ' : language === 'ar' ? 'مباشر' : 'Live'}
          </h1>
        </div>
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="w-10 h-10 rounded-full bg-white/7 border border-white/8 flex items-center justify-center hover:bg-white/12 transition"
        >
          {isSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>
      </div>

      {/* ── COUNTRY DRAWER ── */}
      {isCountryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setIsCountryDrawerOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          {/* Drawer */}
          <div
            className="relative z-10 ml-auto w-full max-w-md h-full bg-[#111118] border-l border-white/10 flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {language === 'ku' ? 'وڵاتەکان' : language === 'ar' ? 'الدول' : 'Countries'}
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  {language === 'ku' ? 'وڵاتێک هەلبژێرە بۆ فلتەرکردنی کەناڵ' : language === 'ar' ? 'اختر دولة لتصفية القنوات' : 'Select a country to filter channels'}
                </p>
              </div>
              <button onClick={() => setIsCountryDrawerOpen(false)} className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-2 overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* All countries option */}
              <button
                onClick={() => { setSelectedCountry(null); setIsCountryDrawerOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl mb-4 transition text-left ${
                  !selectedCountry
                    ? 'bg-[#CC222F]/20 border border-[#CC222F]/50 text-[#CC222F] font-black'
                    : 'bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 hover:text-white font-bold'
                }`}
              >
                <div className="w-14 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <Globe size={22} className="text-white/60" />
                </div>
                <span className="text-[17px] flex-1">{language === 'ku' ? 'هەموو وڵاتەکان' : language === 'ar' ? 'جميع الدول' : 'All Countries'}</span>
                {!selectedCountry && <CheckCircle2 size={20} className="text-[#CC222F] shrink-0" />}
              </button>

              {/* Country items */}
              <div className="grid grid-cols-1 gap-2.5">
                {countries.map((c: any) => {
                  const isSelected = selectedCountry === c.name_en;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCountry(c.name_en); setIsCountryDrawerOpen(false); }}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition border ${
                        isSelected
                          ? 'bg-[#CC222F]/20 border-[#CC222F]/50 text-white font-bold shadow-lg shadow-[#CC222F]/10'
                          : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-14 h-9.5 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/15 flex items-center justify-center shadow-sm relative">
                        {c.flag_url ? (
                          <img 
                            src={c.flag_url} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Globe size={18} className="text-white/40" />
                        )}
                      </div>
                      <span className="text-[17px] font-bold text-right flex-1 tracking-tight" dir={language === 'ku' || language === 'ar' ? 'rtl' : 'ltr'}>
                        {getCountryName(c)}
                      </span>
                      {isSelected && <CheckCircle2 size={20} className="text-[#CC222F] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH BAR ── */}
      {isSearchOpen && (
        <div className="px-4 sm:px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 bg-white/7 border border-white/8 rounded-2xl px-4 h-11">
            <Search size={16} className="text-white/40 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={t.searchChannels}
              className="flex-1 bg-transparent text-white placeholder-white/35 text-[15px] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} className="text-white/40" /></button>}
          </div>
        </div>
      )}

      {/* ── CATEGORY TABS ── */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-4 overflow-x-auto scrollbar-hide">
        {[
          { id: 'All', label: language === 'ku' ? 'هەموو' : language === 'ar' ? 'الكل' : 'All' },
          ...categories.map(c => ({ id: c.name, label: getLocalized(c, 'name', language) || c.name }))
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-[#CC222F] text-white shadow-lg shadow-red-600/25'
                : 'bg-white/7 border border-white/6 text-white/55 hover:text-white hover:bg-white/12'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {searchQuery.trim() ? (
        <div className="px-4 sm:px-6 space-y-1">
          <p className="text-sm text-white/40 font-semibold mb-4">{searchResults.length} channels</p>
          {searchResults.map(channel => (
            <div key={channel.id} onClick={() => handleChannelSelect(channel)}
              className="flex items-center gap-4 py-3 border-b border-white/5 cursor-pointer group">
              <div className="w-14 h-14 relative rounded-xl bg-[#14151c] border border-white/8 overflow-hidden flex items-center justify-center shrink-0">
                {channel.image
                  ? <Image src={channel.image} alt={channel.name} fill sizes="56px" className="object-contain p-1" unoptimized />
                  : <span className="text-white font-bold text-lg">{channel.name[0]}</span>}
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0f]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] truncate group-hover:text-[#CC222F] transition-colors">{channel.name}</p>
                <p className="text-[12px] text-white/40">{channel.category}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#CC222F] flex items-center justify-center shrink-0">
                <Play size={14} className="fill-white text-white ml-0.5" />
              </div>
            </div>
          ))}
          {searchResults.length === 0 && (
            <div className="text-center py-16 text-white/30">No channels found</div>
          )}
        </div>
      ) : (
        <>
          {/* Top Banner */}
          {topBanners.length > 0 && (
            <div className="relative w-full h-44 md:h-56 overflow-hidden bg-neutral-900 group mb-2">
              <AnimatePresence mode="wait">
                <motion.div key={topBanners[currentTopBannerIndex].id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }} className="absolute inset-0 cursor-pointer"
                  onClick={() => topBanners[currentTopBannerIndex].link && window.open(topBanners[currentTopBannerIndex].link, '_blank')}>
                  <Image src={topBanners[currentTopBannerIndex].image} alt="Promo" fill priority sizes="100vw" className="object-cover" unoptimized />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                </motion.div>
              </AnimatePresence>
              {topBanners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {topBanners.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentTopBannerIndex ? 'bg-red-500 w-4' : 'bg-white/30 w-1.5'}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="px-4 sm:px-6 space-y-10">
            {/* Featured Channels */}
            {channels.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-black tracking-tight">
                    {language === 'ku' ? 'زۆرترین بیندراو' : language === 'ar' ? 'الأكثر مشاهدة' : 'Most Watched'}
                  </h2>
                  <span className="text-[#CC222F] text-sm font-bold">See All</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                  {(selectedCategory === 'All' ? channels : channels.filter(c => c.category === selectedCategory)).slice(0, 8).map(channel => (
                      <div key={channel.id} onClick={() => handleChannelSelect(channel)} className="flex-none w-44 cursor-pointer group">
                      <div className="relative w-44 h-28 rounded-2xl bg-[#14151c] border border-white/8 overflow-hidden flex items-center justify-center mb-2 group-hover:border-[#CC222F]/40 transition-colors">
                        {channel.image
                          ? <Image src={channel.image} alt={channel.name} fill sizes="144px" className="object-contain p-3 group-hover:scale-105 transition-transform duration-300" unoptimized />
                          : <span className="text-white font-bold text-sm text-center px-2">{channel.name}</span>}
                        <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          <span className="font-bold">LIVE</span>
                        </div>
                      </div>
                      <p className="text-[12px] font-bold truncate group-hover:text-[#CC222F] transition-colors">{channel.name}</p>
                      <p className="text-[11px] text-white/40">{channel.category}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All Channels by Category */}
            {categoriesToRender.length === 0 ? (
              <div className="text-center text-white/30 py-10">{t.noChannels}</div>
            ) : categoriesToRender.map((catObj) => {
              const category = typeof catObj === 'string' ? catObj : catObj.name;
              const categoryChannels = channelsByCategory[category] || [];
              if (categoryChannels.length === 0) return null;
              return (
                <section key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[18px] font-black tracking-tight">{getLocalized(catObj, 'name', language) || category}</h2>
                    {categoryChannels.length > 6 && (
                      <button onClick={() => setViewAllCategory(category)} className="text-[#CC222F] text-sm font-bold hover:text-red-400 transition">See All</button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {categoryChannels.slice(0, 6).map(channel => (
                      <div key={channel.id} onClick={() => handleChannelSelect(channel)}
                        className="flex items-center gap-4 py-3 border-b border-white/5 cursor-pointer group hover:bg-white/2 rounded-xl px-2 -mx-2 transition">
                        <div className="w-16 h-16 relative rounded-2xl bg-[#14151c] border border-white/8 overflow-hidden flex items-center justify-center shrink-0">
                          {channel.image
                            ? <Image src={channel.image} alt={channel.name} fill sizes="64px" className="object-contain p-1.5" unoptimized />
                            : <span className="text-white font-bold text-lg">{channel.name[0]}</span>}
                          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[16px] truncate group-hover:text-[#CC222F] transition-colors">{channel.name}</p>
                          <p className="text-[13px] text-white/40 mt-0.5">{channel.category}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#CC222F] flex items-center justify-center shrink-0 shadow-lg shadow-red-600/25 group-hover:scale-110 transition-transform">
                          <Play size={16} className="fill-white text-white ml-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {interspersedBanners.filter(b => b.placement_after === category).map(banner => (
                    <div key={banner.id} onClick={() => banner.link && window.open(banner.link, '_blank')}
                      className="relative w-full h-24 md:h-32 cursor-pointer rounded-xl overflow-hidden border border-white/5 mt-4">
                      <Image src={banner.image} alt="Ad" fill sizes="100vw" className="object-cover" unoptimized />
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        </>
      )}
      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161720] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-white border border-white/10">
            <div className="p-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-lg font-bold">{t.category}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}><X size={20} className="text-white/50" /></button>
            </div>
            <div className="overflow-y-auto p-3 space-y-1">
              {[{ id: 'all-item', name: t.all || 'All' }, ...categories].map((cat: any) => (
                <button key={cat.id}
                  onClick={() => { setSelectedCategory(cat.name === (t.all || 'All') ? 'All' : cat.name); setIsCategoryModalOpen(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left ${
                    (cat.name === (t.all || 'All') ? selectedCategory === 'All' : selectedCategory === cat.name)
                      ? 'bg-[#CC222F]/15 text-[#CC222F]' : 'hover:bg-white/5 text-white/70'
                  }`}>
                  <span className="font-semibold">{getLocalized(cat, 'name', language) || cat.name}</span>
                  {(cat.name === (t.all || 'All') ? selectedCategory === 'All' : selectedCategory === cat.name) && <CheckCircle2 size={18} className="text-[#CC222F]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ProSubscriptionModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
