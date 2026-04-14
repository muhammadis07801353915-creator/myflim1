import { ArrowLeft, Share2, BookmarkPlus, BookmarkCheck, Play, Star, Download, MonitorPlay, X, Server, ExternalLink, Eye } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import ReactPlayer from 'react-player';
import HlsPlayer from './HlsPlayer';
import { useWatchlist } from '../lib/useWatchlist';
import { useHardwareBack } from '../lib/useHardwareBack';
import { Browser } from '@capacitor/browser';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

export default function Detail({ item, onBack }: { item: any, onBack: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showServersModal, setShowServersModal] = useState(false);
  const [selectedServerUrl, setSelectedServerUrl] = useState('');
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [viewCount, setViewCount] = useState(item.views || 0);
  const [viewIncremented, setViewIncremented] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

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
        // Only return if it looks like episode format
        if (parsed.length > 0 && parsed[0].servers) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing episodes", e);
    }
    return [];
  }, [item.type, item.video_url]);

  const servers = useMemo(() => {
    if (item.type === 'Series' && episodes.length > 0) {
      return episodes[currentEpisodeIndex]?.servers || [];
    }

    try {
      if (item.video_url && item.video_url.startsWith('[')) {
        const parsed = JSON.parse(item.video_url);
        if (parsed.length > 0 && !parsed[0].servers) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing servers", e);
    }
    return [{ name: 'Default Server', url: item.video_url || '', quality: 'Auto' }];
  }, [item.type, item.video_url, episodes, currentEpisodeIndex]);

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

  const handlePlayClick = () => {
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

  const isIframeLink = selectedServerUrl?.includes('t.me') || 
                       selectedServerUrl?.includes('telegram.me') || 
                       selectedServerUrl?.includes('ok.ru') ||
                       selectedServerUrl?.includes('vk.com') ||
                       servers.find(s => s.url === selectedServerUrl)?.name === 'ok' ||
                       servers.find(s => s.url === selectedServerUrl)?.name === 'VK' ||
                       servers.find(s => s.url === selectedServerUrl)?.name === 'embed' ||
                       servers.find(s => s.url === selectedServerUrl)?.name === 'telegram';
  
  // Convert standard links to embed links if needed
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    let finalUrl = url.trim();
    finalUrl = finalUrl.replace(/^\/+/, ''); // Remove any accidental leading slashes
    
    // Ensure URL has protocol to prevent relative path routing errors (like Vercel 500 errors)
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (finalUrl.includes('t.me') || finalUrl.includes('telegram.me')) {
      if (finalUrl.includes('embed=1')) return finalUrl;
      const separator = finalUrl.includes('?') ? '&' : '?';
      return `${finalUrl}${separator}embed=1`;
    }
    if (finalUrl.includes('ok.ru/video/')) {
      return finalUrl.replace('ok.ru/video/', 'ok.ru/videoembed/');
    }
    if (finalUrl.includes('vk.com/video')) {
      // Basic conversion for VK, though usually users should provide the iframe src directly
      // Example: https://vk.com/video_ext.php?oid=...&id=...&hash=...
      return finalUrl; 
    }
    return finalUrl;
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
    <div className="bg-neutral-950 min-h-screen text-white pb-24">
      {/* Header / Backdrop or Player */}
      <div className="relative w-full bg-black aspect-video md:h-[70vh] md:aspect-auto">
        {isPlaying ? (
          <div className="w-full h-full relative">
            <button 
              onClick={() => setIsPlaying(false)} 
              className="absolute top-4 right-4 z-[100] w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition"
            >
              <X size={20} />
            </button>
            
            {(() => {
              const isM3u8 = selectedServerUrl?.toLowerCase().includes('.m3u8');

              return !selectedServerUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400 absolute inset-0">
                  No video source available
                </div>
              ) : isIframeLink ? (
                <div className="w-full h-full relative bg-black">
                  <iframe 
                    src={getEmbedUrl(selectedServerUrl)} 
                    className="w-full h-full border-0 absolute inset-0 z-10"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
                    referrerPolicy="origin"
                  ></iframe>
                  

                </div>
              ) : isM3u8 ? (
                <HlsPlayer 
                  url={selectedServerUrl} 
                  className="w-full h-full absolute inset-0 object-contain bg-black"
                  autoPlay 
                  controls 
                />
              ) : (
                (() => {
                  const Player = ReactPlayer as any;
                  return (
                    <Player 
                      url={selectedServerUrl} 
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
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent z-10" />
            <Image src={item.backdrop || item.image || ''} alt={item.title} fill className="object-cover opacity-70" priority />
            
            <div className="absolute top-0 left-0 w-full p-4 pt-6 z-[100] flex justify-between items-center pointer-events-none">
              <button onClick={onBack} className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition pointer-events-auto">
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
        <h1 className="text-3xl font-bold mb-3">{item.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-neutral-400 mb-6">
          <span className="flex items-center text-yellow-500 font-medium"><Star size={16} className="mr-1 fill-current" /> {item.rating}</span>
          <span>{item.year}</span>
          <span>{item.genre}</span>
        </div>

        <button 
          onClick={handlePlayClick}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl flex items-center justify-center font-semibold transition mb-8 shadow-lg shadow-red-600/20"
        >
          <Play size={20} className="mr-2 fill-current" /> Watch Now
        </button>

        <div className="flex justify-around border-y border-neutral-800/60 py-5 mb-8">
          <button className="flex flex-col items-center text-neutral-400 hover:text-white transition group cursor-default">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mb-2 transition text-red-500">
              <Eye size={20} />
            </div>
            <span className="text-xs font-medium">{viewCount.toLocaleString()} Views</span>
          </button>
          <button className="flex flex-col items-center text-neutral-400 hover:text-white transition group">
            <div className="w-12 h-12 rounded-full bg-neutral-900 group-hover:bg-neutral-800 flex items-center justify-center mb-2 transition">
              <Download size={20} />
            </div>
            <span className="text-xs font-medium">Download</span>
          </button>
          <button className="flex flex-col items-center text-neutral-400 hover:text-white transition group">
            <div className="w-12 h-12 rounded-full bg-neutral-900 group-hover:bg-neutral-800 flex items-center justify-center mb-2 transition">
              <MonitorPlay size={20} />
            </div>
            <span className="text-xs font-medium">Trailer</span>
          </button>
          <button className="flex flex-col items-center text-neutral-400 hover:text-white transition group">
            <div className="w-12 h-12 rounded-full bg-neutral-900 group-hover:bg-neutral-800 flex items-center justify-center mb-2 transition">
              <Share2 size={20} />
            </div>
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Story Line</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {item.description}
          </p>
        </div>

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
                          : 'bg-[#1a1d24] border-neutral-800/50 hover:bg-[#22252d] hover:border-neutral-700'
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
          <h3 className="text-xl font-semibold mb-4">Star cast</h3>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center space-x-3 bg-neutral-900/50 pr-5 p-2 rounded-full border border-neutral-800/50 flex-none">
                <div className="w-12 h-12 relative overflow-hidden rounded-full shrink-0">
                  <Image src={`https://i.pravatar.cc/150?img=${i+10}`} alt="Actor" fill className="object-cover" sizes="48px" />
                </div>
                <div>
                  <p className="text-sm font-medium">Actor Name</p>
                  <p className="text-xs text-neutral-500">Character</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Servers Modal */}
      {showServersModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1d24] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[80vh] border border-neutral-800 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-[#22252D]">
              <div>
                <h3 className="text-xl font-bold text-white">Choose Server</h3>
                <p className="text-sm text-neutral-400 mt-1">{servers.length} servers available</p>
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
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/50 transition group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition">
                      <Server size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">
                        {server.name === 'ok' ? 'OK.ru' : 
                         server.name === 'VK' ? 'VK.com' : 
                         server.name === 'telegram' ? 'Telegram' : 
                         server.name === 'embed' ? 'Embed Server' : 
                         server.name === 'm3u8' ? 'HLS Stream' : 
                         server.name === 'mp4' ? 'Direct MP4' : 
                         server.name === 'youtube' ? 'YouTube' : 
                         server.name}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{server.url.includes('youtube') ? 'YouTube' : server.url.includes('t.me') ? 'Telegram' : server.url.includes('ok.ru') ? 'OK.ru' : 'Direct Stream'}</p>
                    </div>
                  </div>
                  <div className="bg-neutral-800 group-hover:bg-neutral-700 px-3 py-1 rounded-full text-xs font-medium text-neutral-300 transition">
                    {server.quality}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-800 bg-[#22252D]">
              <button 
                onClick={() => setShowServersModal(false)}
                className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
