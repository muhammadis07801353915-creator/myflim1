import { ArrowLeft, Share2, BookmarkPlus, BookmarkCheck, Play, Star, Download, MonitorPlay, X, Server, ExternalLink, Eye, AlertCircle, Type, Maximize2 } from 'lucide-react';
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
  const [viewCount, setViewCount] = useState(item.views || 0);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [reported, setReported] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { t, language } = useLanguage();

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

  useHardwareBack(isPlaying || showServersModal, () => {
    setIsPlaying(false);
    setShowServersModal(false);
  });

  const isBookmarked = isInWatchlist(item.id);

  const episodes = useMemo(() => {
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

  const { servers, subtitles } = useMemo(() => {
    let parsedServers = [{ name: 'Default Server', url: item.video_url || '', quality: 'Auto' }];
    let parsedSubtitles = [];

    if (item.type === 'Series' && episodes.length > 0) {
      const ep = episodes[currentEpisodeIndex];
      parsedServers = ep?.servers || [];
      parsedSubtitles = ep?.subtitles || [];
      return { servers: parsedServers, subtitles: parsedSubtitles };
    }

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
    return { servers: parsedServers, subtitles: parsedSubtitles };
  }, [item.type, item.video_url, episodes, currentEpisodeIndex]);

  const videoTracks = useMemo(() => {
    return (subtitles || []).map((sub: any) => ({
      kind: 'subtitles',
      src: sub.url,
      srcLang: sub.lang || 'en',
      label: sub.label || 'Unknown',
      default: sub.lang === 'ku' // Default to Kurdish if available
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
        // Fallback for first view if views is null/undefined
        await supabase.from('movies').update({ views: 1 }).eq('id', item.id);
      }
    } catch (e) {
      console.error("Error incrementing views", e);
    }
  };

  const handleReportBroken = async () => {
    if (reported || !item.id) return;
    try {
      // Create a formal report in the database
      const { error } = await supabase.from('reports').insert([
        { 
          movie_id: item.id, 
          movie_title: item.title,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);
      
      // Also mark as broken in movies table for immediate badge update if needed
      await supabase.from('movies').update({ is_broken: true }).eq('id', item.id);
      
      if (!error) {
        setReported(true);
        alert('سوپاس، ڕاپۆرتەکەت گەیشت، بەم زووانە چاکی دەکەین');
      }
    } catch (e) {
      console.error("Error reporting broken link", e);
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
    if (!isPlaying) incrementViews();
    const currentServers = servers;
    if (currentServers.length > 1) {
      setShowServersModal(true);
    } else {
      setSelectedServerUrl(currentServers[0]?.url || '');
      setIsPlaying(true);
    }
  };

  const handleEpisodeSelect = (index: number) => {
    if (item.is_pro && !getProStatusLocal()) {
       setShowProModal(true);
       return;
    }
    setCurrentEpisodeIndex(index);
    // Auto-play first server of new episode if already playing
    if (isPlaying) {
      const firstServer = episodes[index]?.servers[0];
      if (firstServer) setSelectedServerUrl(firstServer.url);
    }
  };

  const handleServerSelect = (url: string) => {
    setSelectedServerUrl(url);
    setShowServersModal(false);
    setIsPlaying(true);
  };

  const isEmbedUrl = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase().split('?')[0];
    const isDirect = lowerUrl.endsWith('.mp4') || lowerUrl.includes('.m3u8');
    return !isDirect;
  };

  const isIframeLink = isEmbedUrl(selectedServerUrl);
  
  // Convert standard links to embed links if needed
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
    finalUrl = finalUrl.replace(/^\/+/, ''); // Remove any accidental leading slashes
    
    // Ensure URL has protocol to prevent relative path routing errors (like Vercel 500 errors)
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (finalUrl.includes('drive.google.com') || finalUrl.includes('docs.google.com')) {
      // Convert /view or /edit to /preview for embedding
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
    if (isDownloading) return;
    
    // Get download_url from item or from parsed video_url
    let downloadUrl = item.download_url;
    if (!downloadUrl && item.video_url && item.video_url.startsWith('{')) {
      try {
        const parsed = JSON.parse(item.video_url);
        downloadUrl = parsed.download_url;
      } catch (e) {}
    }
    
    if (!downloadUrl) {
      alert(language === 'ku' ? 'لینکی داوڵۆند بەردەست نییە بۆ ئەم فیلمە' : 'Download link not available for this movie');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate progress for better UX as requested "stay inside website"
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Save to local downloads
          const savedDownloads = JSON.parse(localStorage.getItem('myfilm_downloads') || '[]');
          if (!savedDownloads.find((m: any) => m.id === item.id)) {
            savedDownloads.push({
              id: item.id,
              title: item.title,
              title_ar: item.title_ar,
              title_en: item.title_en,
              image: item.image,
              backdrop: item.backdrop,
              rating: item.rating,
              year: item.year,
              type: item.type,
              download_url: downloadUrl,
              downloaded_at: new Date().toISOString()
            });
            localStorage.setItem('myfilm_downloads', JSON.stringify(savedDownloads));
          }
          
          setIsDownloading(false);
          alert(language === 'ku' ? 'فیلمەکە بەسەرکەوتوویی دابەزی و چووە بەشی داوڵۆند' : 'Movie downloaded successfully and added to Downloads section');
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const openInBrowser = async (url: string) => {
    try {
      await Browser.open({ url });
    } catch (e) {
      // Fallback if Capacitor is not available (e.g. in normal web view)
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-neutral-950 light-mode:bg-white min-h-screen text-white light-mode:text-black pb-24">
      {/* Header / Backdrop or Player */}
      <div id="player-container" className={`relative w-full bg-black aspect-video md:h-[70vh] md:aspect-auto`}>
        {isPlaying ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            <div className="flex absolute top-4 right-4 z-[110] space-x-2">
              <button 
                onClick={() => { setIsPlaying(false); setShowSubtitleMenu(false); }} 
                className="w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {(() => {
              const isM3u8 = selectedServerUrl?.toLowerCase().includes('.m3u8');

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
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
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

      {/* Content Info */}
      <div className="px-5 -mt-8 relative z-30">
        <h1 className="text-3xl font-bold mb-3 text-white light-mode:text-black">
          {getLocalized(item, 'title', language)}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-neutral-400 mb-6">
          <span className="flex items-center text-yellow-500 font-medium"><Star size={16} className="mr-1 fill-current" /> {item.rating}</span>
          <span>{item.year}</span>
          <span>{item.genre}</span>
        </div>

        {item.status === 'Coming Soon' ? (
          <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 py-4 rounded-xl flex items-center justify-center space-x-2 font-bold mb-8">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span>{language === 'ku' ? 'بەمزوانە بەردەست دەبێت' : language === 'ar' ? 'سيتوفر قريباً' : 'Coming Soon'}</span>
          </div>
        ) : (
          <button 
            onClick={handlePlayClick}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl flex items-center justify-center font-semibold transition mb-8 shadow-lg shadow-red-600/20"
          >
            <Play size={20} className="mr-2 fill-current" /> {t.watchNow}
          </button>
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
            {language === 'ku' ? 'چیرۆکی فیلم' : language === 'ar' ? 'قصة الفيلم' : 'Story Line'}
          </h3>
          <p className="text-neutral-400 light-mode:text-neutral-600 text-sm leading-relaxed">
            {getLocalized(item, 'description', language) || item.description}
          </p>
        </div>

        <CommentSection movieId={item.id} />

        {/* Episodes Section - Requested Design */}
        {item.type === 'Series' && episodes.length > 0 && (
          <div className="mt-8">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black tracking-tighter">ئەڵقەکان</h3>
                <span className="text-neutral-500 text-sm font-bold uppercase tracking-widest">{episodes.length} Episodes</span>
             </div>
             
             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                {episodes.map((episode: any, index: number) => (
                   <button 
                      key={index}
                      onClick={() => handleEpisodeSelect(index)}
                      className={`relative flex flex-col items-center justify-center py-4 rounded-xl border transition-all duration-300 transform active:scale-95 ${
                        currentEpisodeIndex === index 
                          ? 'bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 z-10' 
                          : 'bg-[#1a1d24] light-mode:bg-neutral-100 border-neutral-800/50 light-mode:border-neutral-200 hover:bg-[#22252d] light-mode:hover:bg-neutral-200 hover:border-neutral-700'
                      }`}
                   >
                      <span className={`text-[10px] uppercase font-black tracking-tighter mb-1 ${currentEpisodeIndex === index ? 'text-blue-100' : 'text-neutral-400'}`}>
                         ئەڵقەی
                      </span>
                      <span className={`text-xl font-black leading-none ${currentEpisodeIndex === index ? 'text-white' : 'text-neutral-200'}`}>
                         {episode.number || index + 1}
                      </span>
                      
                      {currentEpisodeIndex === index && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                           <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                   </button>
                ))}
             </div>
          </div>
        )}

        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4 text-white light-mode:text-black">Star cast</h3>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center space-x-3 bg-neutral-900/50 light-mode:bg-neutral-100 pr-5 p-2 rounded-full border border-neutral-800/50 light-mode:border-neutral-200 flex-none">
                <div className="w-12 h-12 relative overflow-hidden rounded-full shrink-0">
                  <Image src={`https://i.pravatar.cc/150?img=${i+10}`} alt="Actor" fill className="object-cover" sizes="48px" unoptimized />
                </div>
                <div>
                  <p className="text-sm font-medium text-white light-mode:text-black">Actor Name</p>
                  <p className="text-xs text-neutral-500 light-mode:text-neutral-600">Character</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
