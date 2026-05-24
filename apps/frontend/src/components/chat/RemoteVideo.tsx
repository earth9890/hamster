'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface RemoteVideoProps {
  stream: MediaStream | null;
  className?: string;
  label?: string;
}

export function RemoteVideo({ stream, className, label = 'Partner' }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);

    if (stream) {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        setIsLoading(false);
      };
    } else {
      video.srcObject = null;
      setIsLoading(false);
    }

    return () => {
      video.onloadedmetadata = null;
    };
  }, [stream]);

  return (
    <div className={cn('relative rounded-lg overflow-hidden bg-graphite-900', className)}>
      {/* Loading state */}
      {isLoading && stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* No stream / waiting for partner indicator */}
      {!stream && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
          <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Waiting for partner...</p>
        </div>
      )}

      {/* Partner label */}
      {stream && (
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-md text-xs font-medium text-white">
          {label}
        </div>
      )}

      {/* Connection quality indicator */}
      {stream && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-md">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-white">Live</span>
        </div>
      )}
    </div>
  );
}
