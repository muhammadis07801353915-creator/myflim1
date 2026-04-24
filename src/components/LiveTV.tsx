import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, ArrowLeft, Search, X, Users, Play, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const { channels, categories, banners, loading } = useData();
  const [currentTopBannerIndex, setCurrentTopBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewAllCategory, setViewAllCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Player State
  const [playingChannel, setPlayingChannel] = useState<any | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const handleChannelSelect = (channel: any) => {
    if (channel.is_pro && !getProStatusLocal()) {
      setShowProModal(true);
      return;
    }
    setPlayingChannel(channel);
  };

  // Group channels by category
  const channelsByCategory = channels.reduce((acc, channel) => {
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
    ? channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const topBanners = banners.filter(b => b.type === 'top');
  const interspersedBanners = banners.filter(b => b.type === 'interspersed');

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
            <div className="flex items-center space-x-1.5 text-neutral-300 light-mode:text-neutral-700 bg-neutral-800 light-mode:bg-neutral-100 px-3 py-1.5 rounded-lg">
              <Users size={16} className="text-red-500" />
              <span className="font-medium text-sm">LIVE</span>
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
          <h1 className="text-xl font-bold">{viewAllCategory}</h1>
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
    <div className="bg-[#1A1D24] light-mode:bg-gray-50 min-h-screen text-white light-mode:text-black pb-24 font-sans">
      {/* Header */}
      {isSearchOpen ? (
        <div className="flex items-center w-full px-4 py-3 bg-[#22252D] light-mode:bg-white sticky top-0 z-40 shadow-md space-x-3 rtl:space-x-reverse border-b light-mode:border-neutral-200">
          <Search size={20} className="text-neutral-400" />
          <input 
            type="text" 
            autoFocus
            placeholder={t.searchChannels} 
            className="flex-1 bg-transparent text-white light-mode:text-black outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
            <X size={20} className="text-neutral-400 hover:text-white light-mode:hover:text-black" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 bg-[#22252D] light-mode:bg-white sticky top-0 z-40 shadow-md border-b light-mode:border-neutral-200">
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center space-x-1 rtl:space-x-reverse text-sm font-medium hover:text-red-400 transition text-white light-mode:text-black"
            >
              <ChevronDown size={16} />
              <span>{t.category}</span>
            </button>
          </div>
          
          {/* Logo in the middle */}
          <div className="flex-1 flex justify-center">
             <div className="flex items-center space-x-1.5 leading-none">
                <span className="text-xl font-black text-white light-mode:text-black tracking-tighter">MY</span>
                <span className="text-xl font-medium text-white light-mode:text-black relative">
                  Film
                  <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                </span>
             </div>
          </div>

          <div className="flex-1 flex justify-end">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-1 text-sm font-medium hover:text-red-400 transition text-white light-mode:text-black"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {searchQuery.trim() ? (
        <div className="p-4 md:p-8">
          <h2 className="text-xl font-bold mb-6">{t.searchResults}</h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {searchResults.map(channel => (
                <div 
                  key={channel.id} 
                  onClick={() => handleChannelSelect(channel)}
                  className="bg-[#2A2D34] border border-neutral-700/50 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-[#333740] hover:border-neutral-500 transition group relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 rtl:space-x-reverse z-10">
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
          ) : (
            <div className="text-center text-neutral-500 py-10">
              No channels found for "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Main Top Slider Banner */}
          {topBanners.length > 0 && (
            <div className="relative w-full h-48 md:h-64 overflow-hidden bg-neutral-900 group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={topBanners[currentTopBannerIndex].id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => topBanners[currentTopBannerIndex].link && window.open(topBanners[currentTopBannerIndex].link, '_blank')}
                >
                  <Image 
                    src={topBanners[currentTopBannerIndex].image} 
                    alt="Promo" 
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                    unoptimized={true}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                </motion.div>
              </AnimatePresence>

              {topBanners.length > 1 && (
                <>
                  {/* Slider Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {topBanners.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentTopBannerIndex ? 'bg-red-500 w-4' : 'bg-white/40'}`} 
                      />
                    ))}
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentTopBannerIndex(prev => (prev - 1 + topBanners.length) % topBanners.length); }}
                      className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md text-white transition pointer-events-auto"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentTopBannerIndex(prev => (prev + 1) % topBanners.length); }}
                      className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md text-white transition pointer-events-auto"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="p-4 md:p-8 space-y-10">
          {/* Check for "Start" Banners */}
          {interspersedBanners.filter(b => !b.placement_after || b.placement_after === '').map(banner => (
            <div 
              key={banner.id}
              onClick={() => banner.link && window.open(banner.link, '_blank')}
              className="relative w-full h-24 md:h-32 cursor-pointer hover:opacity-95 transition rounded-xl overflow-hidden border border-white/5 shadow-2xl"
            >
              <Image 
                src={banner.image} 
                className="object-cover" 
                alt="Ad"
                fill
                sizes="100vw"
                unoptimized={true}
              />
            </div>
          ))}
        {categoriesToRender.length === 0 ? (
            <div className="text-center text-neutral-500 py-10">
              {t.noChannels}
            </div>
        ) : categoriesToRender.map((catObj, index) => {
          const category = typeof catObj === 'string' ? catObj : catObj.name;
          const categoryChannels = channelsByCategory[category] || [];
          if (categoryChannels.length === 0) return null;
 
          return (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                  {getLocalized(catObj, 'name', language) || category}
                </h2>
                <button 
                  onClick={() => setViewAllCategory(category)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-2"
                >
                  <span>+ {t.viewAll}</span>
                </button>
              </div>
 
              {/* Channel Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {categoryChannels.slice(0, 6).map(channel => (
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

              {/* Dynamic Interspersed Banners */}
              {interspersedBanners.filter(b => b.placement_after === category).map(banner => (
                <div 
                  key={banner.id}
                  onClick={() => banner.link && window.open(banner.link, '_blank')}
                  className="pt-4 relative w-full h-28 md:h-36 cursor-pointer hover:opacity-95 transition rounded-xl overflow-hidden"
                >
                  <Image 
                    src={banner.image} 
                    className="object-cover border border-white/5 shadow-2xl rounded-xl" 
                    alt="Ad"
                    fill
                    sizes="100vw"
                    unoptimized={true}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
        </>
      )}
      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#22252D] light-mode:bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-white light-mode:text-black border border-transparent light-mode:border-neutral-200">
            <div className="p-4 border-b border-neutral-800 light-mode:border-neutral-100">
              <h3 className="text-lg font-semibold">{t.category}</h3>
            </div>
            <div className="overflow-y-auto p-2">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setIsCategoryModalOpen(false);
                }}
                className="w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl hover:bg-[#2A2D34] transition text-left rtl:text-right"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedCategory === 'All' ? 'border-red-500' : 'border-neutral-500'}`}>
                  {selectedCategory === 'All' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                </div>
                <span className={selectedCategory === 'All' ? 'text-white font-medium' : 'text-neutral-400'}>
                  {language === 'ku' ? 'هەمووی' : language === 'ar' ? 'الكل' : 'All'}
                </span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setIsCategoryModalOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl hover:bg-[#2A2D34] light-mode:hover:bg-neutral-100 transition text-left rtl:text-right"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedCategory === cat.name ? 'border-red-500' : 'border-neutral-500'}`}>
                    {selectedCategory === cat.name && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                  </div>
                  <span className={selectedCategory === cat.name ? 'text-white light-mode:text-red-500 font-medium' : 'text-neutral-400 light-mode:text-neutral-600'}>
                    {getLocalized(cat, 'name', language) || cat.name}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-800 light-mode:border-neutral-100">
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-full py-3 bg-neutral-800 light-mode:bg-neutral-200 text-white light-mode:text-black hover:bg-neutral-700 light-mode:hover:bg-neutral-300 rounded-xl font-medium transition"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Modal */}
      <ProSubscriptionModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
