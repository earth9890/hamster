
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import type { MatchFilters, MatchedPartner } from '@hamster/shared';

/**
 * Matchmaking Hook
 *
 * Handles joining/leaving the matchmaking queue, receiving match notifications,
 * and tracking queue position.
 */

interface UseMatchingOptions {
  onMatchFound?: (partner: MatchedPartner) => void;
  onQueuePosition?: (position: number) => void;
  onOnlineCount?: (count: number) => void;
  onError?: (error: { code: string; message: string }) => void;
}

interface MatchingState {
  isInQueue: boolean;
  queuePosition: number;
  onlineCount: number;
  isSearching: boolean;
}

const INITIAL_STATE: MatchingState = {
  isInQueue: false,
  queuePosition: 0,
  onlineCount: 0,
  isSearching: false,
};

export function useMatching({
  onMatchFound,
  onQueuePosition,
  onOnlineCount,
  onError,
}: UseMatchingOptions = {}) {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<MatchingState>(INITIAL_STATE);
  const [currentFilters, setCurrentFilters] = useState<MatchFilters>({});

  // Use refs to track actual current state (avoid closure issues in cleanup)
  const isInQueueRef = useRef(false);
  const matchedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isInQueueRef.current = state.isInQueue;
  }, [state.isInQueue]);

  /**
   * Join the matchmaking queue
   */
  const joinQueue = useCallback(
    (filters: MatchFilters = {}) => {
      if (!socket || !isConnected) {
        console.warn('[Matching] Cannot join queue: socket not connected');
        return;
      }

      if (state.isInQueue) {
        console.warn('[Matching] Already in queue');
        return;
      }

      matchedRef.current = false;
      console.log('[Matching] Joining queue with filters:', filters);
      socket.emit('join-queue', filters);
      setCurrentFilters(filters);
      setState((prev) => ({ ...prev, isInQueue: true, isSearching: true, queuePosition: 0 }));
    },
    [socket, isConnected, state.isInQueue]
  );

  /**
   * Leave the matchmaking queue
   */
  const leaveQueue = useCallback(() => {
    if (!socket || !state.isInQueue) {
      return;
    }

    matchedRef.current = false;
    console.log('[Matching] Leaving queue');
    socket.emit('leave-queue');
    setState(INITIAL_STATE);
    setCurrentFilters({});
  }, [socket, state.isInQueue]);

  /**
   * Update queue position (internal)
   */
  const updateQueuePosition = useCallback((position: number) => {
    setState((prev) => ({ ...prev, queuePosition: position }));
    onQueuePosition?.(position);
  }, [onQueuePosition]);

  /**
   * Update online count (internal)
   */
  const updateOnlineCount = useCallback((count: number) => {
    setState((prev) => ({ ...prev, onlineCount: count }));
    onOnlineCount?.(count);
  }, [onOnlineCount]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for match found
    socket.on('match-found', (partner: MatchedPartner) => {
      console.log('[Matching] Match found:', partner);
      matchedRef.current = true;
      setState((prev) => ({
        ...prev,
        isInQueue: false,
        queuePosition: 0,
        isSearching: false,
      }));
      onMatchFound?.(partner);
    });

    // Listen for queue position updates
    socket.on('queue-position', (position: number) => {
      updateQueuePosition(position);
    });

    // Listen for online count updates
    socket.on('online-count', (count: number) => {
      updateOnlineCount(count);
    });

    // Listen for errors
    socket.on('error', (error: { code: string; message: string }) => {
      console.error('[Matching] Error:', error);
      onError?.(error);
      // If we get a queue-related error, reset state
      if (error.code.includes('QUEUE')) {
        setState(INITIAL_STATE);
      }
    });

    // Cleanup listeners
    return () => {
      socket.off('match-found');
      socket.off('queue-position');
      socket.off('online-count');
      socket.off('error');
    };
  }, [socket, updateQueuePosition, updateOnlineCount, onMatchFound, onError]);

  // Leave queue on disconnect
  useEffect(() => {
    if (!isConnected && state.isInQueue) {
      matchedRef.current = false;
      console.log('[Matching] Disconnected, leaving queue');
      setState(INITIAL_STATE);
      setCurrentFilters({});
    }
  }, [isConnected, state.isInQueue]);

  // Cleanup on unmount - only leave queue if we weren't matched
  useEffect(() => {
    return () => {
      // Use ref to check actual current state (avoid closure issues)
      // Only emit leave-queue if we're still in queue and NOT matched
      // (matched means navigation happened, no need to leave queue)
      if (!matchedRef.current && isInQueueRef.current && socket) {
        console.log('[Matching] Cleanup: leaving queue');
        socket.emit('leave-queue');
      }
    };
  }, [socket]);

  return {
    state,
    filters: currentFilters,
    joinQueue,
    leaveQueue,
  };
}
