'use client';

import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface MatchingLoaderProps {
  queuePosition?: number;
  onlineCount?: number;
  isSearching?: boolean;
  onCancel?: () => void;
}

export function MatchingLoader({
  queuePosition = 0,
  onlineCount = 0,
  isSearching = true,
  onCancel,
}: MatchingLoaderProps) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setPulse((prev) => (prev + 1) % 3);
    }, 1500);

    return () => clearInterval(interval);
  }, [isSearching]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Animated Loader */}
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-graphite-800" />

        {/* Spinning arcs */}
        <div className="absolute inset-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'absolute inset-0 rounded-full border-2 border-transparent border-t-accent',
                'transition-all duration-500',
                i === pulse ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
              )}
              style={{
                animation: `spin ${1.5 + i * 0.2}s linear infinite`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn('transition-transform duration-300', pulse === 1 && 'scale-110')}>
            <svg
              className="w-16 h-16 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Size */}
        <div className="w-32 h-32" />
      </div>

      {/* Status Text */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-white mb-2">
          {isSearching ? 'Finding someone to chat with...' : 'Connection established!'}
        </h2>
        {isSearching && (
          <p className="text-gray-400">
            This may take a few moments
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-8">
        {queuePosition > 0 && (
          <div className="glass rounded-xl px-6 py-3">
            <div className="text-2xl font-bold text-accent">{queuePosition}</div>
            <div className="text-xs text-gray-400">Ahead of you</div>
          </div>
        )}
        {onlineCount > 0 && (
          <div className="glass rounded-xl px-6 py-3">
            <div className="text-2xl font-bold text-green-500">{onlineCount}</div>
            <div className="text-xs text-gray-400">Online now</div>
          </div>
        )}
      </div>

      {/* Tips */}
      {isSearching && (
        <div className="glass rounded-xl px-6 py-4 max-w-md">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-300">
              Tip: Broaden your filters to find matches faster.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className={cn(
            'mt-8 px-8 py-3 rounded-xl font-medium transition-all',
            'glass text-gray-300 hover:text-white',
            'hover:bg-white/10',
            'active:scale-95'
          )}
        >
          Cancel Search
        </button>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
