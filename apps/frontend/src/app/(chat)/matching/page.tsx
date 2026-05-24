'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMatching } from '@/hooks/useMatching';
import { FilterSelector, MatchingLoader } from '@/components/matching';
import { GlassCard } from '@/components/shared';
import type { MatchFilters } from '@hamster/shared';

export default function MatchingPage() {
  const router = useRouter();
  const { state, joinQueue, leaveQueue } = useMatching({
    onMatchFound: (partner) => {
      // Navigate to chat when match is found
      router.push(`/chat/${partner.sessionId}`);
    },
  });

  const [localFilters, setLocalFilters] = useState<MatchFilters>({ gender: 'everyone' });

  const handleStartMatching = () => {
    joinQueue(localFilters);
  };

  const handleCancelSearch = () => {
    leaveQueue();
  };

  const handleFiltersChange = (newFilters: MatchFilters) => {
    setLocalFilters(newFilters);
    // If already in queue, re-join with new filters
    if (state.isInQueue) {
      leaveQueue();
      joinQueue(newFilters);
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gradient mb-2">
            Find Your Match
          </h1>
          <p className="text-gray-400">
            Meet new people from around the world
          </p>
        </div>

        {/* Filter Selector */}
        <div className="mb-6">
          <FilterSelector
            filters={localFilters}
            onChange={handleFiltersChange}
            disabled={state.isSearching}
          />
        </div>

        {/* Main Content */}
        <GlassCard className="p-8">
          {!state.isInQueue ? (
            // Not in queue - show start button
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-accent"
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
              <h3 className="text-xl font-semibold mb-2">Ready to chat?</h3>
              <p className="text-gray-400 mb-6">
                Click the button below to start matching with people
              </p>
              <button onClick={handleStartMatching} className="btn-primary text-lg px-8 py-4">
                Start Matching
              </button>
            </div>
          ) : (
            // In queue - show loader
            <MatchingLoader
              queuePosition={state.queuePosition}
              onlineCount={state.onlineCount}
              isSearching={state.isSearching}
              onCancel={handleCancelSearch}
            />
          )}
        </GlassCard>

        {/* Online indicator */}
        {state.onlineCount > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{state.onlineCount} people online</span>
          </div>
        )}
      </div>
    </div>
  );
}
