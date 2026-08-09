'use client';

import { ArrowLeft, Share2, BookmarkPlus, BookmarkCheck, Play, Star, Download, MonitorPlay, X, Server, ExternalLink, Eye, AlertCircle, Type, Maximize2, Plus, Send, Facebook, Instagram, Music2, Calendar } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import ReactPlayer from 'react-player';
import PremiumPlayer from './PremiumPlayer';
import { useWatchlist } from '../lib/useWatchlist';
import { useHardwareBack } from '../lib/useHardwareBack';
import { Browser } from '@capacitor/browser';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import ProSubscriptionModal from './ProSubscriptionModal';
import { getProStatusLocal } from '../lib/pro';
import CommentSection from './CommentSection';
import { useLanguage } from '../lib/LanguageContext';
import { getLocalized } from '../lib/translations';

export default function Detail({ item, onBack }: { item: any, onBack: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showServersModal, setShowServersModal] = useState(false);
  const [selectedServerUrl, setSelectedServerUrl] = useState('');
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [viewCount, setViewCount] = useState(item?.views || 0);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [reported, setReported] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { t, language } = useLanguage();
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    // هەرکاتێک بەکارهێنەر دەگەڕێتەوە ناو فیلمەکە، ژمارە تازەکە دەهێنین
    if (item?.id) {
      supabase.from('movies').select('views').eq('id', item.id).single()
        .then(({ data, error }) => {
          if (!error && data) {
            setViewCount(data.views || 0);
          }
        });
    }
  }, [item?.id]);

  useEffect(() => {
    async function fetchSocialLinks() {
      const { data } = await supabase.from('settings').select('*').in('key', ['telegram_link', 'facebook_link', 'instagram_link', 'tiktok_link']);
      if (data) {
        const links = [];
        const telegram = data.find(i => i.key === 'telegram_link')?.value;
        const facebook = data.find(i => i.key === 'facebook_link')?.value;
        const instagram = data.find(i => i.key === 'instagram_link')?.value;
        const tiktok = data.find(i => i.key === 'tiktok_link')?.value;

        if (telegram) links.push({ name: 'تێلیگرام', url: telegram, icon: <Send size={20} fill="currentColor" />, color: 'bg-[#24A1DE]' });
        if (facebook) links.push({ name: 'فەیسبووک', url: facebook, icon: <Facebook size={20} fill="currentColor" />, color: 'bg-[#1877F2]' });
        if (instagram) links.push({ name: 'ئینستاگرام', url: instagram, icon: <Instagram size={20} />, color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' });
        if (tiktok) links.push({ name: 'تیک تۆک', url: tiktok, icon: <Music2 size={20} />, color: 'bg-black' });
        
        setSocialLinks(links);
      }
    }
    fetchSocialLinks();
  }, []);

  useHardwareBack(isPlaying || showServersModal, () => {
    setIsPlaying(false);
    setShowServersModal(false);
  });

  if (!item) return null;

  const isBookmarked = isInWatchlist(item.id);

  const allEpisodes = useMemo(() => {
    if (item.type !== 'Series') return [];
    try {
      if (item.video_url && item.video_url.startsWith('[')) {
        const parsed = JSON.parse(item.video_url);
        if (parsed.length > 0 && parsed[0].servers) return parsed;
      } else if (item.video_url && item.video_url.startsWith('{')) {
        const parsed = JSON.parse(item.video_url);
        if (parsed.episodes) return parsed.episodes;
      }
    } catch (e) {
      console.error("Error parsing episodes", e);
    }
    return [];
  }, [item.type, item.video_url]);

  const tmdbId = useMemo(() => {
    try {
      if (item.video_url && item.video_url.startsWith('{')) {
        return JSON.parse(item.video_url).tmdb_id;
      }
    } catch (e) {}
    return null;
  }, [item.video_url]);

  const seasons = useMemo(() => {
    const s = new Set<number>();
    allEpisodes.forEach((ep: any) => s.add(ep.season || 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [allEpisodes]);

  const episodes = useMemo(() => {
    return allEpisodes.filter((ep: any) => (ep.season || 1) === selectedSeason);
  }, [allEpisodes, selectedSeason]);

  useEffect(() => {
    if (seasons.length > 0 && !seasons.includes(selectedSeason)) {
      setSelectedSeason(seasons[0]);
    }
  }, [seasons]);

  const { servers, subtitles } = useMemo(() => {
    let parsedServers = [{ name: 'Default Server', url: item.video_url || '', quality: 'Auto' }];
    let parsedSubtitles = [];

    try {
      if (item.video_url && item.video_url.startsWith('{')) {
        const parsed = JSON.parse(item.video_url);
        parsedServers = parsed.servers || parsedServers;
        parsedSubtitles = parsed.subtitles || [];
      } else if (item.video_url && item.video_url.startsWith('[')) {
        const parsed = JSON.parse(item.video_url);
        if (parsed.length > 0 && !parsed[0].servers) {
          parsedServers = parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing servers/subtitles", e);
    }

    if (tmdbId) {
      const vidsrcUrl = item.type === 'Series' 
        ? `vidsrc://tv/${tmdbId}/${selectedSeason}/${(episodes[currentEpisodeIndex]?.number || 1)}`
        : `vidsrc://movie/${tmdbId}`;
      
      const serverName = 'Server 1';
      
      if (item.type !== 'Series') {
        if (!parsedServers.find((s: any) => s.name === serverName || s.name === 'Server MBox')) {
          parsedServers = [
            { name: serverName, url: vidsrcUrl, quality: 'Multi' },
            ...parsedServers
          ];
        }
      }
    }

    if (item.type === 'Series' && episodes.length > 0) {
      const ep = episodes[currentEpisodeIndex];
      let epServers = ep?.servers || [];
      
      if (tmdbId) {
        const serverName = 'Server 1';
        if (!epServers.find((s: any) => s.name === serverName || s.name === 'Server MBox')) {
          const vidsrcUrl = `vidsrc://tv/${tmdbId}/${ep?.season || selectedSeason}/${ep?.number || 1}`;
          epServers = [{ name: serverName, url: vidsrcUrl, quality: 'Multi' }, ...epServers];
        }
      }
      
      const filteredEpServers = epServers.filter((s: any) => s.url && s.url.trim() !== '');
      return { servers: filteredEpServers, subtitles: ep?.subtitles || [] };
    }

    const filteredServers = parsedServers.filter((s: any) => s.url && s.url.trim() !== '');
    return { servers: filteredServers, subtitles: parsedSubtitles };
  }, [item.type, item.video_url, episodes, currentEpisodeIndex, tmdbId, selectedSeason]);

  const videoTracks = useMemo(() => {
    return (subtitles || []).map((sub: any) => ({
      kind: 'subtitles',
      src: sub.url,
      srcLang: sub.lang || 'en',
      label: sub.label || 'Unknown',
      default: sub.lang === 'ku'
    }));
  }, [subtitles]);

  const incrementViews = async () => {
    if (viewIncremented || !item.id) return;
    try {
      setViewCount(prev => prev + 1);
      setViewIncremented(true);
      
      const { data, error } = await supabase.from('movies').select('views').eq('id', item.id).single();
      if (!error && data) {
        await supabase.from('movies').update({ views: (data.views || 0) + 1 }).eq('id', item.id);
      } else {
        await supabase.from('movies').update({ views: 1 }).eq('id', item.id);
      }
    } catch (e) {
      console.error("Error incrementing views", e);
    }
  };

  const handleReportBroken = async () => {
    if (reported || !item.id) return;
    try {
      const { error } = await supabase.from('reports').insert([
        { 
          movie_id: item.id, 
          movie_title: item.title,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);
      
      await supabase.from('movies').update({ is_broken: true }).eq('id', item.id);
      
      if (!error) {
        setReported(true);
        alert('سوپاس، ڕاپۆرتەکەت گەیشت، بەم زووانە چاکی دەکەین');
      }
    } catch (e) {
      console.error("Error reporting broken link", e);
    }
  };

  const handleWatchProgress = (currentTime: number, duration: number) => {
    if (!item || !item.id) return;
    try {
      const history = JSON.parse(localStorage.getItem('myfilm_history') || '{}');
      history[String(item.id)] = {
        item,
        timestamp: currentTime || 0,
        duration: duration || 0,
        updatedAt: Date.now()
      };
      localStorage.setItem('myfilm_history', JSON.stringify(history));
      window.dispatchEvent(new Event('historyUpdated'));
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePlayClick = () => {
    if (item.status === 'Coming Soon') {
      return;
    }
    if (item.is_pro && !getProStatusLocal()) {
       setShowProModal(true);
       return;
    }
    if (!isPlaying) {
      incrementViews();
      handleWatchProgress(0, 0);
    }
    const currentServers = servers;
    if (currentServers.length > 1) {
      setShowServersModal(true);
    } else {
      setSelectedServerUrl(currentServers[0]?.url || '');
      setIsPlaying(true);
      handleWatchProgress(0, 0);
    }
  };

  const handleEpisodeSelect = (index: number) => {
    if (item.is_pro && !getProStatusLocal()) {
       setShowProModal(true);
       return;
    }
    setCurrentEpisodeIndex(index);
    if (isPlaying) {
      const firstServer = episodes[index]?.servers[0];
      if (firstServer) setSelectedServerUrl(firstServer.url);
    }
    handleWatchProgress(0, 0);
  };

  const handleServerSelect = (url: string) => {
    setSelectedServerUrl(url);
    setShowServersModal(false);
    setIsPlaying(true);
    handleWatchProgress(0, 0);
  };

  const isEmbedUrl = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase().split('?')[0];
    const isDirect = lowerUrl.endsWith('.mp4') || lowerUrl.includes('.m3u8');
    return !isDirect;
  };

  const isIframeLink = isEmbedUrl(selectedServerUrl);
  
  const handleFullScreen = () => {
    const playerElement = document.getElementById('player-container');
    if (playerElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        if (playerElement.requestFullscreen) playerElement.requestFullscreen();
        else if ((playerElement as any).webkitRequestFullscreen) (playerElement as any).webkitRequestFullscreen();
        else if ((playerElement as any).msRequestFullscreen) (playerElement as any).msRequestFullscreen();
      }
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    let finalUrl = url.trim();
    finalUrl = finalUrl.replace(/^\/+/, ''); 
    
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('vidsrc://')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (finalUrl.startsWith('vidsrc://')) {
      const parts = finalUrl.replace('vidsrc://', '').split('/');
      const type = parts[0];
      const id = parts[1];
      if (type === 'movie') {
        return `https://vidsrc.pm/embed/movie/${id}`;
      } else {
        const season = parts[2] || '1';
        const ep = parts[3] || '1';
        return `https://vidsrc.pm/embed/tv/${id}/${season}/${ep}`;
      }
    }

    if (finalUrl.includes('drive.google.com') || finalUrl.includes('docs.google.com')) {
      if (finalUrl.includes('/view')) return finalUrl.replace('/view', '/preview');
      if (finalUrl.includes('/edit')) return finalUrl.replace('/edit', '/preview');
      if (!finalUrl.endsWith('/preview')) {
        const parts = finalUrl.split('?')[0].split('/');
        const id = parts[parts.indexOf('d') + 1];
        if (id) return `https://drive.google.com/file/d/${id}/preview`;
      }
      return finalUrl;
    }

    if (finalUrl.includes('t.me') || finalUrl.includes('telegram.me')) {
      if (finalUrl.includes('embed=1')) return finalUrl;
      const separator = finalUrl.includes('?') ? '&' : '?';
      return `${finalUrl}${separator}embed=1`;
    }
    if (finalUrl.includes('ok.ru/video/')) {
      return finalUrl.replace('ok.ru/video/', 'ok.ru/videoembed/');
    }
    if (finalUrl.includes('dailymotion.com/video/')) {
      return finalUrl.replace('dailymotion.com/video/', 'dailymotion.com/embed/video/');
    }
    if (finalUrl.includes('vk.com/video')) {
      return finalUrl; 
    }
    return finalUrl;
  };

  const handleDownload = () => {
    alert(language === 'ku' ? 'بەشی داوڵۆند بەمزووانە کارا دەبێت' : 'Download feature will be available soon');
    return;
  };

  const openInBrowser = async (url: string) => {
    try {
      await Browser.open({ url });
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-neutral-950 light-mode:bg-white min-h-screen text-white light-mode:text-black pb-24" style={{ direction: 'ltr', textAlign: 'left' }}>
      {/* Tall Header Container matching App height (320px on mobile, 400px+ on desktop) */}
      <div id="player-container" className="relative w-full bg-black h-[320px] sm:h-[400px] md:h-[480px] overflow-hidden">
        {isPlaying ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            {/* Top Back Button during playback */}
            <button 
              onClick={() => setIsPlaying(false)} 
              className="absolute top-4 left-4 z-[120] w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 text-white transition active:scale-90"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            
            {(() => {
              return !selectedServerUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400 absolute inset-0">
                  No video source available
                </div>
              ) : isIframeLink ? (
                <div className="w-full h-full relative bg-black flex items-center justify-center">
                  <iframe 
                    src={getEmbedUrl(selectedServerUrl)} 
                    className="w-full h-full border-0 absolute inset-0 z-50"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write"
                    referrerPolicy="no-referrer"
                  ></iframe>
                </div>
              ) : (
                <PremiumPlayer 
                  url={selectedServerUrl} 
                  title={getLocalized(item, 'title', language)}
                  onBack={() => setIsPlaying(false)}
                  onError={handleReportBroken}
                  onProgress={handleWatchProgress}
                  tracks={videoTracks}
                />
              );
            })()}
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-black/40 z-10" />
            <Image 
              src={item.backdrop || item.image || ''} 
              alt={item.title} 
              fill 
              className="object-cover opacity-80" 
              priority 
              unoptimized={true}
            />
            
            <div className="absolute top-0 left-0 w-full p-4 pt-6 z-[100] flex justify-between items-center pointer-events-none">
              <button 
                onClick={onBack} 
                className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition pointer-events-auto active:scale-90 border border-white/10"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
            </div>

            {/* Overlaid Floating Poster Thumbnail Card (as in Image 2) */}
            <div className="absolute left-5 bottom-5 z-30 w-[110px] sm:w-[130px] h-[160px] sm:h-[185px] rounded-2xl overflow-hidden border-2 border-[#CC222F] shadow-[0_12px_30px_rgba(0,0,0,0.9)]">
              <Image 
                src={item.image || item.backdrop || ''} 
                alt={item.title} 
                fill 
                className="object-cover" 
                unoptimized={true}
              />
            </div>
          </>
        )}
      </div>

      <div className="px-5 pt-6 relative z-30 max-w-4xl mx-auto" style={{ direction: 'ltr', textAlign: 'left' }}>
        <h1 
          className="text-2xl sm:text-3xl font-black mb-2 text-white light-mode:text-black tracking-tight"
          style={{ textAlign: 'left' }}
        >
          {item.title || getLocalized(item, 'title', language)}
        </h1>

        <div className="flex items-center space-x-4 text-xs sm:text-sm mb-6 text-neutral-300 light-mode:text-neutral-600 font-bold justify-start" style={{ direction: 'ltr' }}>
          <span className="flex items-center text-neutral-400 light-mode:text-neutral-600 gap-1.5">
            <Calendar size={14} className="text-neutral-400 light-mode:text-neutral-600" />
            <span>{item.year}</span>
          </span>
          <span className="flex items-center text-amber-400 gap-1.5 font-black">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>{item.rating}</span>
          </span>
          <span className="flex items-center text-neutral-400 light-mode:text-neutral-600 gap-1.5">
            <Eye size={14} className="text-neutral-400 light-mode:text-neutral-600" />
            <span>{viewCount.toLocaleString()}</span>
          </span>
        </div>

        {/* Primary Action Buttons Row (Matching Image 2!) */}
        {item.status === 'Coming Soon' ? (
          <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 py-3.5 rounded-2xl flex items-center justify-center space-x-2 font-bold mb-8">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span>{language === 'ku' ? 'بەمزوانە بەردەست دەبێت' : language === 'ar' ? 'سيتوفر قريباً' : 'Coming Soon'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-8" style={{ direction: 'ltr' }}>
            <button 
              onClick={handlePlayClick}
              className="btn-watch-now flex-1 py-3.5 px-6 bg-[#CC222F] hover:bg-red-700 !text-white text-white font-black rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg active:scale-95"
              style={{ color: '#ffffff', backgroundColor: '#CC222F' }}
            >
              <Play size={18} className="fill-white !text-white text-white" style={{ color: '#ffffff', fill: '#ffffff' }} />
              <span className="text-base font-black !text-white text-white" style={{ color: '#ffffff' }}>
                {language === 'ku' ? 'ئێستا ببینە' : 'Watch Now'}
              </span>
            </button>

            <button 
              onClick={() => toggleWatchlist(item)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition border active:scale-95 shrink-0 ${
                isBookmarked 
                  ? 'bg-[#CC222F] border-[#CC222F] text-white shadow-lg shadow-red-600/30' 
                  : 'action-btn-secondary bg-[#181924] border-white/10 text-white hover:bg-[#222432]'
              }`}
              title={language === 'ku' ? 'سەیڤکردن' : 'Bookmark'}
            >
              {isBookmarked ? <BookmarkCheck size={20} className="text-white" /> : <BookmarkPlus size={20} />}
            </button>

            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: item.title, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert(language === 'ku' ? 'لینکی فیلمەکە کۆپی کرا' : 'Link copied to clipboard');
                }
              }}
              className="action-btn-secondary w-12 h-12 rounded-2xl bg-[#181924] border border-white/10 text-white hover:bg-[#222432] flex items-center justify-center transition active:scale-95 shrink-0"
              title={language === 'ku' ? 'بەشکردن' : 'Share'}
            >
              <Share2 size={20} />
            </button>
          </div>
        )}

        <div className="mb-8" style={{ textAlign: 'left' }}>
          <h3 className="text-xl font-bold mb-2 text-white light-mode:text-black text-left" style={{ textAlign: 'left' }}>
            Storyline
          </h3>
          <p className="text-neutral-400 light-mode:text-neutral-600 text-sm leading-relaxed text-left" style={{ textAlign: 'left' }}>
            {getLocalized(item, 'description', language) || item.description}
          </p>
        </div>

        {/* Episodes Section - App 2-column Grid Style matching Image 2 */}
        {item.type === 'Series' && allEpisodes.length > 0 && (
          <div className="mb-8" style={{ textAlign: 'left' }}>
             <div className="flex justify-between items-center mb-4" style={{ direction: 'ltr' }}>
                <h3 className="text-xl font-bold text-white light-mode:text-black text-left">Episodes</h3>
                <span className="text-red-500 text-sm font-bold">{episodes.length} Episodes</span>
             </div>

             {seasons.length > 1 && (
               <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide mb-4" style={{ direction: 'ltr' }}>
                  {seasons.map((season) => (
                     <button 
                        key={season}
                        onClick={() => setSelectedSeason(season)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold border transition ${
                          selectedSeason === season 
                            ? 'bg-red-600 border-red-500 text-white' 
                            : 'bg-[#14151C] light-mode:bg-neutral-100 border-white/10 light-mode:border-neutral-300 text-neutral-400 light-mode:text-neutral-700 hover:text-white'
                        }`}
                     >
                        Season {season}
                     </button>
                  ))}
               </div>
             )}

             <div className="grid grid-cols-2 gap-3" style={{ direction: 'ltr' }}>
                {episodes.map((episode: any, index: number) => {
                   const isSelected = currentEpisodeIndex === index;
                   return (
                     <button 
                        key={index}
                        onClick={() => handleEpisodeSelect(index)}
                        className={`p-3.5 rounded-2xl border transition flex items-center gap-3 text-left active:scale-95 ${
                          isSelected 
                            ? 'bg-[#CC222F]/15 border-2 border-[#CC222F] text-white shadow-lg shadow-red-600/20' 
                            : 'bg-[#14151C] light-mode:bg-neutral-100 border border-white/8 light-mode:border-neutral-200 hover:border-white/20'
                        }`}
                     >
                        <div className="w-10 h-10 rounded-xl bg-white/5 light-mode:bg-neutral-200 flex items-center justify-center shrink-0">
                          <Play size={18} className={isSelected ? 'fill-[#CC222F] text-[#CC222F]' : 'text-neutral-400 light-mode:text-neutral-600'} />
                        </div>
                        <div className="flex-1 min-w-0" style={{ textAlign: 'left' }}>
                           <p className={`text-sm font-bold truncate text-left ${isSelected ? 'text-[#CC222F]' : 'text-white light-mode:text-black'}`}>
                              Ep {episode.number || index + 1}
                           </p>
                           <p className="text-xs text-neutral-400 light-mode:text-neutral-500 truncate text-left">
                              Episode {episode.number || index + 1}
                           </p>
                        </div>
                     </button>
                   );
                })}
             </div>
          </div>
        )}

        <div className="flex justify-around border-y border-white/10 light-mode:border-neutral-200 py-4 mb-8" style={{ direction: 'ltr' }}>
          <button onClick={handleDownload} className="flex flex-col items-center gap-1.5 text-neutral-400 light-mode:text-neutral-600 hover:text-white light-mode:hover:text-black transition">
            <div className="w-10 h-10 rounded-xl bg-[#14151C] light-mode:bg-neutral-100 border border-transparent light-mode:border-neutral-300 flex items-center justify-center text-neutral-300 light-mode:text-neutral-700">
              <Download size={18} />
            </div>
            <span className="text-[11px] font-bold">Download</span>
          </button>

          <button onClick={handleFullScreen} className="flex flex-col items-center gap-1.5 text-neutral-400 light-mode:text-neutral-600 hover:text-white light-mode:hover:text-black transition">
            <div className="w-10 h-10 rounded-xl bg-[#14151C] light-mode:bg-neutral-100 border border-transparent light-mode:border-neutral-300 flex items-center justify-center text-neutral-300 light-mode:text-neutral-700">
              <Maximize2 size={18} />
            </div>
            <span className="text-[11px] font-bold">{language === 'ku' ? 'گەورەکردن' : 'Full Screen'}</span>
          </button>

          <button onClick={handleReportBroken} className="flex flex-col items-center gap-1.5 text-neutral-400 light-mode:text-neutral-600 hover:text-white light-mode:hover:text-black transition">
            <div className="w-10 h-10 rounded-xl bg-[#14151C] light-mode:bg-neutral-100 border border-transparent light-mode:border-neutral-300 flex items-center justify-center text-neutral-300 light-mode:text-neutral-700">
              <AlertCircle size={18} />
            </div>
            <span className="text-[11px] font-bold">{reported ? 'Reported' : 'Report Issue'}</span>
          </button>
        </div>

        <CommentSection movieId={item.id} />
      </div>

      {/* Servers Modal */}
      {showServersModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-[#1a1d24] light-mode:!bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[80vh] border border-neutral-800 light-mode:!border-slate-200 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="p-5 border-b border-neutral-800 light-mode:!border-slate-200 flex justify-between items-center bg-[#22252D] light-mode:!bg-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-white light-mode:!text-slate-900">
                  {language === 'ku' ? 'سێرڤەر هەڵبژێرە' : language === 'ar' ? 'اختر السيرفر' : 'Choose Server'}
                </h3>
                <p className="text-sm text-neutral-400 light-mode:!text-slate-600 font-bold mt-1">
                  {servers.length} {language === 'ku' ? 'سێرڤەر بەردەستە' : language === 'ar' ? 'سيرفر متاح' : 'servers available'}
                </p>
              </div>
              <button 
                onClick={() => setShowServersModal(false)}
                className="w-8 h-8 bg-neutral-800 light-mode:!bg-slate-200 hover:bg-neutral-700 light-mode:hover:!bg-slate-300 rounded-full flex items-center justify-center text-neutral-400 light-mode:!text-slate-700 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 bg-[#1a1d24] light-mode:!bg-[#f8fafc]">
              {servers.map((server: any, index: number) => {
                const displayName = (() => {
                  let n = server?.name || '';
                  if (n === 'Server MBox' || n === 'MBox' || n === 'Default Server' || (index === 0 && (!n || n === 'Default Server'))) return 'Server 1';
                  if (n === 'Server My flim' || n === 'Server My film' || n === 'My flim' || n === 'Myfilm' || (index === 1 && !n)) return 'Server 2';
                  if (n === 'ok') return 'OK.ru';
                  if (n === 'VK') return 'VK.com';
                  if (n === 'telegram') return 'Telegram';
                  if (n === 'google') return 'Google Drive';
                  if (n === 'embed') return 'Embed Server';
                  if (n === 'm3u8') return 'HLS Stream';
                  if (n === 'mp4') return 'Direct MP4';
                  if (n === 'youtube') return 'YouTube';
                  return n || `Server ${index + 1}`;
                })();

                return (
                  <button
                    key={index}
                    onClick={() => handleServerSelect(server.url)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-900 light-mode:!bg-white hover:bg-neutral-800 light-mode:hover:!bg-slate-100 border border-neutral-800 light-mode:!border-slate-200 hover:border-red-500/50 light-mode:hover:!border-red-500/50 shadow-sm transition group"
                  >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 light-mode:!bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition shrink-0">
                        <Server size={20} />
                      </div>
                      <div className="text-left rtl:text-right">
                        <p className="font-bold text-base text-white light-mode:!text-slate-900">
                          {displayName}
                        </p>
                        <p className="text-xs text-neutral-400 light-mode:!text-slate-600 mt-0.5 font-medium">
                          {server.url?.includes('youtube') ? 'YouTube' : 
                           server.url?.includes('drive.google.com') ? 'Google Drive' : 
                           server.url?.includes('t.me') ? 'Telegram' : 
                           server.url?.includes('ok.ru') ? 'OK.ru' : 
                           'Direct Stream'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-neutral-800 light-mode:!bg-red-100 group-hover:bg-neutral-700 light-mode:group-hover:!bg-red-200 px-3 py-1 rounded-full text-xs font-bold text-neutral-300 light-mode:!text-red-700 border border-transparent light-mode:!border-red-300 transition">
                      {server.quality || 'Auto'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-neutral-800 light-mode:!border-slate-200 bg-[#22252D] light-mode:!bg-slate-100">
              <button 
                onClick={() => setShowServersModal(false)}
                className="w-full py-3.5 bg-neutral-800 light-mode:!bg-slate-200 text-white light-mode:!text-slate-900 hover:bg-neutral-700 light-mode:hover:!bg-slate-300 rounded-xl font-bold transition border border-transparent light-mode:!border-slate-300"
              >
                {language === 'ku' ? 'داخستن' : language === 'ar' ? 'إلغاء' : 'Cancel'}
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
