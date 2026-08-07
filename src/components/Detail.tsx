'use client';

import { ArrowLeft, Share2, BookmarkPlus, BookmarkCheck, Play, Star, Download, MonitorPlay, X, Server, ExternalLink, Eye, AlertCircle, Type, Maximize2, Plus, Send, Facebook, Instagram, Music2 } from 'lucide-react';
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
      
      const serverName = 'Server MBox';
      
      if (item.type !== 'Series') {
        if (!parsedServers.find((s: any) => s.name === serverName)) {
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
        const serverName = 'Server MBox';
        if (!epServers.find((s: any) => s.name === serverName)) {
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
    <div className="bg-neutral-950 light-mode:bg-white min-h-screen text-white light-mode:text-black pb-24">
      <div id="player-container" className={`relative w-full bg-black aspect-video md:h-[70vh] md:aspect-auto`}>
        {isPlaying ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            <div className="flex absolute top-4 right-4 z-[110] space-x-2">
            </div>
            
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
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 light-mode:from-white via-neutral-950/20 to-transparent z-10" />
            <Image 
              src={item.backdrop || item.image || ''} 
              alt={item.title} 
              fill 
              className="object-cover opacity-70" 
              priority 
              unoptimized={true}
            />
            
            <div className="absolute top-0 left-0 w-full p-4 pt-6 z-[100] flex justify-between items-center pointer-events-none">
              <button 
                onClick={onBack} 
                className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition pointer-events-auto active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex space-x-3 pointer-events-auto">
                <button 
                  onClick={() => toggleWatchlist(item)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition ${isBookmarked ? 'bg-red-600 text-white' : 'bg-black/40 hover:bg-black/60'}`}
                >
                  {isBookmarked ? <BookmarkCheck size={20} /> : <BookmarkPlus size={20} />}
                </button>
                <button className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <button 
                onClick={handlePlayClick}
                className="w-16 h-16 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center pl-1 backdrop-blur-sm shadow-[0_0_30px_rgba(220,38,38,0.5)] transition hover:scale-105"
              >
                <Play size={28} className="fill-white" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="px-5 -mt-8 relative z-30">
        <h1 className="text-3xl font-bold mb-3 text-white light-mode:text-black">
          {getLocalized(item, 'title', language)}
        </h1>
        <div className="flex items-center space-x-4 text-sm mb-6">
          <span className="flex items-center text-amber-500 font-extrabold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            <Star size={16} className="mr-1 fill-amber-500 text-amber-500" />
            <span className="text-amber-500 font-extrabold">{item.rating}</span>
          </span>
          <span className="text-neutral-300 light-mode:text-slate-700 font-bold">{item.year}</span>
          <span className="text-neutral-300 light-mode:text-slate-700 font-bold">{item.genre}</span>
        </div>

        {item.status === 'Coming Soon' ? (
          <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 py-4 rounded-xl flex items-center justify-center space-x-2 font-bold mb-8">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span>{language === 'ku' ? 'بەمزوانە بەردەست دەبێت' : language === 'ar' ? 'سيتوفر قريباً' : 'Coming Soon'}</span>
          </div>
        ) : (
          <div className="mb-8">
            <button 
              onClick={handlePlayClick}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition flex items-center justify-center space-x-3 shadow-xl shadow-red-600/30 group active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                <Plus size={20} className="rotate-45 text-white" />
              </div>
              <span className="text-xl uppercase tracking-widest text-white !text-white font-black" style={{ color: '#ffffff' }}>
                {language === 'ku' ? 'ئێستا ببینە' : 'Watch Now'}
              </span>
            </button>
          </div>
        )}

        <div className="flex justify-around border-y border-neutral-800/60 light-mode:border-neutral-200 py-5 mb-8">
          <button className="flex flex-col items-center text-neutral-400 light-mode:text-neutral-600 hover:text-white transition group cursor-default">
            <div className="w-12 h-12 rounded-full bg-neutral-900 light-mode:bg-neutral-100 flex items-center justify-center mb-2 transition text-red-500">
              <Eye size={20} />
            </div>
            <span className="text-xs font-medium">{viewCount.toLocaleString()} {language === 'ku' ? 'بینین' : language === 'ar' ? 'مشاهدة' : 'Views'}</span>
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex flex-col items-center transition group ${isDownloading ? 'text-red-500' : 'text-neutral-400 light-mode:text-neutral-600 hover:text-white'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition relative overflow-hidden ${isDownloading ? 'bg-red-500/10' : 'bg-neutral-900 light-mode:bg-neutral-100 group-hover:bg-neutral-800 light-mode:group-hover:bg-neutral-200'}`}>
              {isDownloading ? (
                <>
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-red-600 transition-all duration-300" 
                    style={{ height: `${downloadProgress}%`, opacity: 0.3 }}
                  />
                  <span className="text-[10px] font-bold z-10">{downloadProgress}%</span>
                </>
              ) : (
                <Download size={20} />
              )}
            </div>
            <span className="text-xs font-medium">{isDownloading ? (language === 'ku' ? 'دادەبەزێت...' : 'Downloading...') : 'Download'}</span>
          </button>
          <button 
            onClick={handleFullScreen}
            className="flex flex-col items-center text-neutral-400 light-mode:text-neutral-600 hover:text-white transition group"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-900 light-mode:bg-neutral-100 group-hover:bg-neutral-800 light-mode:group-hover:bg-neutral-200 flex items-center justify-center mb-2 transition">
              <Maximize2 size={20} />
            </div>
            <span className="text-xs font-medium">{language === 'ku' ? 'گەورەکردن' : 'Full Screen'}</span>
          </button>
          <button className="flex flex-col items-center text-neutral-400 light-mode:text-neutral-600 hover:text-white transition group">
            <div className="w-12 h-12 rounded-full bg-neutral-900 light-mode:bg-neutral-100 group-hover:bg-neutral-800 light-mode:group-hover:bg-neutral-200 flex items-center justify-center mb-2 transition">
              <MonitorPlay size={20} />
            </div>
            <span className="text-xs font-medium">Trailer</span>
          </button>
          <button 
            onClick={handleReportBroken}
            disabled={reported}
            className={`flex flex-col items-center transition group ${reported ? 'text-red-500' : 'text-neutral-400 light-mode:text-neutral-600 hover:text-white'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition ${reported ? 'bg-red-500/20' : 'bg-neutral-900 light-mode:bg-neutral-100 group-hover:bg-neutral-800 light-mode:group-hover:bg-neutral-200'}`}>
              <AlertCircle size={20} />
            </div>
            <span className="text-xs font-medium">{reported ? 'Reported' : 'Report Issue'}</span>
          </button>
          <button className="flex flex-col items-center text-neutral-400 light-mode:text-neutral-600 hover:text-white transition group">
            <div className="w-12 h-12 rounded-full bg-neutral-900 light-mode:bg-neutral-100 group-hover:bg-neutral-800 light-mode:group-hover:bg-neutral-200 flex items-center justify-center mb-2 transition">
              <Share2 size={20} />
            </div>
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-white light-mode:text-black">
            {t.storyLine}
          </h3>
          <p className="text-neutral-400 light-mode:text-neutral-600 text-sm leading-relaxed">
            {getLocalized(item, 'description', language) || item.description}
          </p>
        </div>

        <CommentSection movieId={item.id} />

        {/* Episodes Section - Requested Design */}
        {item.type === 'Series' && allEpisodes.length > 0 && (
          <div className="mt-8">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black tracking-tighter text-white light-mode:text-slate-900">{t.seasons}</h3>
                <span className="text-neutral-500 light-mode:text-slate-500 text-sm font-bold uppercase tracking-widest">{seasons.length} {t.seasons}</span>
             </div>
             
             <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5 mb-6">
                {seasons.map((season) => (
                   <button 
                      key={season}
                      onClick={() => setSelectedSeason(season)}
                      className={`px-6 py-2.5 rounded-full border font-bold transition-all duration-300 flex-none ${
                        selectedSeason === season 
                          ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30' 
                          : 'bg-neutral-900 light-mode:bg-slate-100 border-neutral-800 light-mode:border-slate-300 text-neutral-400 light-mode:text-slate-700 hover:text-white light-mode:hover:text-black'
                      }`}
                   >
                      Season {season}
                   </button>
                ))}
             </div>

             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black tracking-tighter text-white light-mode:text-slate-900">{t.episodesTitle}</h3>
                <span className="text-neutral-500 light-mode:text-slate-500 text-sm font-bold uppercase tracking-widest">{episodes.length} {t.episodesTitle}</span>
             </div>
             
             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                {episodes.map((episode: any, index: number) => {
                   const isSelected = currentEpisodeIndex === index;
                   return (
                     <button 
                        key={index}
                        onClick={() => handleEpisodeSelect(index)}
                        className={`relative flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 transform active:scale-95 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 scale-105 z-10' 
                            : 'bg-[#14151c] light-mode:bg-white border-white/8 light-mode:border-slate-300 hover:bg-[#1a1b24] light-mode:hover:bg-slate-100 shadow-sm'
                        }`}
                     >
                        <span className={`text-[10px] uppercase font-black tracking-tighter mb-1 ${
                          isSelected ? 'text-white' : 'text-neutral-400 light-mode:text-slate-500 font-bold'
                        }`}>
                           {t.episode}
                        </span>
                        <span className={`text-xl font-black leading-none ${
                          isSelected ? 'text-white' : 'text-white light-mode:text-slate-900 font-extrabold'
                        }`}>
                           {episode.number || index + 1}
                        </span>
                        
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-md">
                             <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                     </button>
                   );
                })}
             </div>
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4 text-white light-mode:text-black">
              {t.socialMedia}
            </h3>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
              {socialLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-3 bg-neutral-900/50 light-mode:bg-neutral-100 pr-5 p-2 rounded-full border border-neutral-800/50 light-mode:border-neutral-200 flex-none hover:bg-neutral-800 transition active:scale-95"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${link.color} shrink-0 shadow-lg`}>
                    {link.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white light-mode:text-black">{link.name}</p>
                    <p className="text-[10px] text-neutral-500 light-mode:text-neutral-600 uppercase tracking-widest font-bold">Follow us</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Servers Modal */}
      {showServersModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1d24] light-mode:bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[80vh] border border-neutral-800 light-mode:border-neutral-200 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="p-5 border-b border-neutral-800 light-mode:border-neutral-100 flex justify-between items-center bg-[#22252D] light-mode:bg-neutral-50">
              <div>
                <h3 className="text-xl font-bold text-white light-mode:text-black">
                  {language === 'ku' ? 'سێرڤەر هەڵبژێرە' : language === 'ar' ? 'اختر السيرفر' : 'Choose Server'}
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  {servers.length} {language === 'ku' ? 'سێرڤەر بەردەستە' : language === 'ar' ? 'سيرفر متاح' : 'servers available'}
                </p>
              </div>
              <button 
                onClick={() => setShowServersModal(false)}
                className="w-8 h-8 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {servers.map((server: any, index: number) => (
                <button
                  key={index}
                  onClick={() => handleServerSelect(server.url)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-900 light-mode:bg-neutral-50 hover:bg-neutral-800 light-mode:hover:bg-neutral-100 border border-neutral-800 light-mode:border-neutral-200 hover:border-red-500/50 transition group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition">
                      <Server size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white light-mode:text-black">
                        {server.name === 'ok' ? 'OK.ru' : 
                         server.name === 'VK' ? 'VK.com' : 
                         server.name === 'telegram' ? 'Telegram' : 
                         server.name === 'google' ? 'Google Drive' : 
                         server.name === 'embed' ? 'Embed Server' : 
                         server.name === 'm3u8' ? 'HLS Stream' : 
                         server.name === 'mp4' ? 'Direct MP4' : 
                         server.name === 'youtube' ? 'YouTube' : 
                         server.name}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {server.url.includes('youtube') ? 'YouTube' : 
                         server.url.includes('drive.google.com') ? 'Google Drive' : 
                         server.url.includes('t.me') ? 'Telegram' : 
                         server.url.includes('ok.ru') ? 'OK.ru' : 
                         'Direct Stream'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-neutral-800 group-hover:bg-neutral-700 px-3 py-1 rounded-full text-xs font-medium text-neutral-300 transition">
                    {server.quality}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-800 light-mode:border-neutral-100 bg-[#22252D] light-mode:bg-neutral-50">
              <button 
                onClick={() => setShowServersModal(false)}
                className="w-full py-3.5 bg-neutral-800 light-mode:bg-neutral-200 text-white light-mode:text-black hover:bg-neutral-700 light-mode:hover:bg-neutral-300 rounded-xl font-semibold transition"
              >
                Cancel
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
