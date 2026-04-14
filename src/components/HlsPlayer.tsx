import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HlsPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

export default function HlsPlayer({ url, className = '', autoPlay = true, controls = true }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(e => console.log("Auto-play prevented", e));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("fatal network error encountered, try to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("fatal media error encountered, try to recover");
              hls.recoverMediaError();
              break;
            default:
              console.error("fatal error, cannot recover");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) {
          video.play().catch(e => console.log("Auto-play prevented", e));
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url, autoPlay]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      playsInline
    />
  );
}
