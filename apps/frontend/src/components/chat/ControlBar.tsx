'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';

interface ControlBarProps {
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
  isConnecting?: boolean;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  onSkip?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export function ControlBar({
  isVideoEnabled = true,
  isAudioEnabled = true,
  isConnecting = false,
  onToggleVideo,
  onToggleAudio,
  onSkip,
  onDisconnect,
  className,
}: ControlBarProps) {
  const [isSkipHovered, setIsSkipHovered] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 px-4 py-3',
        'bg-black/70 backdrop-blur-md',
        'border border-white/10',
        'rounded-full',
        className
      )}
    >
      {/* Toggle Video */}
      {onToggleVideo && (
        <button
          onClick={onToggleVideo}
          disabled={isConnecting}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full transition-all',
            'hover:scale-110 active:scale-95',
            isVideoEnabled
              ? 'bg-graphite-800 text-white hover:bg-graphite-700'
              : 'bg-red-500/20 text-red-500 hover:bg-red-500/30',
            isConnecting && 'opacity-50 cursor-not-allowed'
          )}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>
      )}

      {/* Toggle Audio */}
      {onToggleAudio && (
        <button
          onClick={onToggleAudio}
          disabled={isConnecting}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full transition-all',
            'hover:scale-110 active:scale-95',
            isAudioEnabled
              ? 'bg-graphite-800 text-white hover:bg-graphite-700'
              : 'bg-red-500/20 text-red-500 hover:bg-red-500/30',
            isConnecting && 'opacity-50 cursor-not-allowed'
          )}
          title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isAudioEnabled ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      )}

      {/* Skip / Next */}
      {onSkip && (
        <button
          onClick={onSkip}
          disabled={isConnecting}
          onMouseEnter={() => setIsSkipHovered(true)}
          onMouseLeave={() => setIsSkipHovered(false)}
          className={cn(
            'flex items-center justify-center gap-2 px-5 h-12 rounded-full transition-all',
            'hover:scale-105 active:scale-95',
            'bg-accent text-white hover:bg-accent-hover',
            'font-medium text-sm',
            isConnecting && 'opacity-50 cursor-not-allowed',
            'shadow-lg shadow-accent/20'
          )}
          title="Skip to next person"
        >
          <svg
            className={cn('w-5 h-5 transition-transform', isSkipHovered && 'translate-x-0.5')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Skip
        </button>
      )}

      {/* Disconnect */}
      {onDisconnect && (
        <button
          onClick={onDisconnect}
          disabled={isConnecting}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full transition-all',
            'hover:scale-110 active:scale-95',
            'bg-graphite-800 text-white hover:bg-red-500/20 hover:text-red-500',
            isConnecting && 'opacity-50 cursor-not-allowed'
          )}
          title="End call"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      )}
    </div>
  );
}
