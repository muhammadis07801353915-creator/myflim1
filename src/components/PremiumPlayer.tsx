import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, Volume2, VolumeX, Type, ArrowLeft, Settings } from 'lucide-react';

interface PremiumPlayerProps {
  url: string;
  title?: string;
  onBack?: () => void;
  onError?: () => void;
  tracks?: Array<{
    kind: string;
    src: string;
    srcLang: string;
    label: string;
    default?: boolean;
  }>;
}

export default function PremiumPlayer({ url, title, onBack, onError, tracks }: PremiumPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    const isM3u8 = url.toLowerCase().includes('.m3u8');

    if (isM3u8 && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal && onError) onError();
      });
    } else {
      video.src = url;
      video.oncanplay = () => video.play().catch(() => {});
      video.onerror = () => { if (onError) onError(); };
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [url, onError]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const currentProgress = (video.currentTime / video.duration) * 100;
    setProgress(currentProgress);
    setCurrentTime(formatTime(video.currentTime));
    setDuration(formatTime(video.duration || 0));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = (parseFloat(e.target.value) / 100) * video.duration;
    video.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
      className="relative w-full h-full bg-black flex items-center justify-center group overflow-hidden select-none"
    >
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain"
        playsInline
      >
        {(tracks || []).map((track, i) => (
          <track key={i} {...track} />
        ))}
      </video>

      {/* Custom Controls Overlay */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex flex-col justify-between z-50 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top Bar */}
        <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-sm md:text-lg font-medium truncate max-w-[200px] md:max-w-md">{title}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-white/10 rounded-full transition"><Settings size={20} /></button>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center justify-center space-x-8 md:space-x-16 rtl:space-x-reverse">
          <button onClick={() => skip(-10)} className="p-3 hover:bg-white/10 rounded-full transition active:scale-90">
            <RotateCcw size={32} className="md:w-12 md:h-12" />
            <span className="absolute text-[10px] font-bold mt-[-22px] ml-[10px] md:mt-[-34px] md:ml-[16px]">10</span>
          </button>
          
          <button onClick={togglePlay} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition transform hover:scale-110 active:scale-95 border border-white/20 backdrop-blur-md">
            {isPlaying ? <Pause size={48} className="md:w-16 md:h-16" fill="currentColor" /> : <Play size={48} className="md:w-16 md:h-16 ml-1" fill="currentColor" />}
          </button>

          <button onClick={() => skip(10)} className="p-3 hover:bg-white/10 rounded-full transition active:scale-90">
            <RotateCw size={32} className="md:w-12 md:h-12" />
            <span className="absolute text-[10px] font-bold mt-[-22px] ml-[10px] md:mt-[-34px] md:ml-[16px]">10</span>
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="p-4 pt-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex flex-col space-y-4">
            {/* Progress Slider */}
            <div className="relative w-full h-1.5 group/progress flex items-center">
              <div className="absolute w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress} 
                onChange={handleSeek}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="absolute w-3 h-3 bg-red-600 rounded-full shadow-lg pointer-events-none transform -translate-y-0.5 group-hover/progress:scale-125 transition-transform" style={{ left: `${progress}%`, marginLeft: '-6px' }} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <span className="text-xs md:text-sm font-mono">{currentTime} / {duration}</span>
                <div className="flex items-center group/volume space-x-2">
                   <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:bg-white/10 rounded-full transition">
                     {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                   </button>
                   <input 
                    type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} 
                    onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); if(videoRef.current) videoRef.current.volume = parseFloat(e.target.value); }}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 accent-white"
                   />
                </div>
              </div>

              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button className="p-2 hover:bg-white/10 rounded-full transition">
                  <Type size={20} />
                </button>
                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition">
                  {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
