'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@hamster/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001';

// Singleton socket instance that persists across navigation
let globalSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let globalRefCount = 0;
let globalIsConnected = false;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Increment ref count
    globalRefCount++;

    // Create socket if it doesn't exist
    if (!globalSocket) {
      console.log('[Socket] Creating singleton socket connection');
      globalSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      }) as Socket<ServerToClientEvents, ClientToServerEvents>;

      globalSocket.on('connect', () => {
        console.log('Connected to signaling server');
        globalIsConnected = true;
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('Disconnected from signaling server:', reason);
        globalIsConnected = false;
      });

      globalSocket.on('connect_error', (err) => {
        console.error('Connection error:', err);
      });
    }

    // Sync local state with global state
    const updateConnectionState = () => {
      setIsConnected(globalIsConnected);
    };

    if (!isSubscribedRef.current) {
      globalSocket.on('connect', updateConnectionState);
      globalSocket.on('disconnect', updateConnectionState);
      isSubscribedRef.current = true;
    }

    // Set initial state
    setIsConnected(globalIsConnected);

    return () => {
      // Decrement ref count
      globalRefCount--;

      // Never disconnect - keep socket alive for the entire session
      // The socket will be cleaned up when the browser tab closes
      console.log('[Socket] Component unmounted, ref count now:', globalRefCount);

      // Remove our state listeners
      if (globalSocket && isSubscribedRef.current) {
        globalSocket.off('connect', updateConnectionState);
        globalSocket.off('disconnect', updateConnectionState);
      }
    };
  }, []);

  return { socket: globalSocket, isConnected };
}
