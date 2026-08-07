'use client';

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HlsPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  startTime?: number;
  onError?: () => void;
  tracks?: Array<{
    kind: string;
    src: string;
    srcLang: string;
    label: string;
    default?: boolean;
  }>;
}

export default function HlsPlayer({ url, className = '', autoPlay = true, controls = false, startTime = 0, onError, tracks }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    const enforcePlayAndSeek = () => {
      if (startTime && startTime > 0 && Math.abs(video.currentTime - startTime) > 5) {
        try { video.currentTime = startTime; } catch(e){}
      }
      if (autoPlay) {
        video.play().catch(e => console.log("Auto-play prevented", e));
      }
    };

    // Auto-resume if user attempts to pause live stream
    const handlePause = () => {
      if (autoPlay) {
        setTimeout(() => {
          video.play().catch(() => {});
        }, 100);
      }
    };

    video.addEventListener('pause', handlePause);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        enforcePlayAndSeek();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (onError) onError();
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      video.src = url;
      video.onerror = () => {
        if (onError) onError();
      };
      video.addEventListener('loadedmetadata', () => {
        enforcePlayAndSeek();
      });
    }

    return () => {
      video.removeEventListener('pause', handlePause);
      if (hls) {
        hls.destroy();
      }
    };
  }, [url, autoPlay, startTime, onError]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      playsInline
    >
      {(tracks || []).map((track, i) => (
        <track 
          key={i}
          kind={track.kind}
          src={track.src}
          srcLang={track.srcLang}
          label={track.label}
          default={track.default}
        />
      ))}
    </video>
  );
}
