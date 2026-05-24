'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { SessionState } from '@hamster/shared';
import type { RTCSessionDescriptionInit, RTCIceCandidateInit } from '@hamster/shared/types/global';
import { useSocket } from './useSocket';
import { useMediaStream } from './useMediaStream';

/**
 * WebRTC Hook - Perfect Negotiation Pattern
 *
 * Implements the W3C WebRTC "perfect negotiation" pattern to prevent
 * signaling race conditions when both peers initiate offers simultaneously.
 *
 * Reference: https://www.w3.org/TR/webrtc/#perfect-negotiation-example
 */

interface UseWebRTCOptions {
  sessionId: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onSessionEnd?: (reason: string) => void;
  onPartnerDisconnect?: () => void;
}

interface SignalingState {
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const RTC_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
};

export function useWebRTC({ sessionId, onRemoteStream, onSessionEnd, onPartnerDisconnect }: UseWebRTCOptions) {
  const { socket } = useSocket();
  const { stream: localStream, error: mediaError, start: startMedia, stop: stopMedia } = useMediaStream();

  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef(sessionId);
  const stopMediaRef = useRef(stopMedia);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep refs updated
  useEffect(() => {
    sessionIdRef.current = sessionId;
    stopMediaRef.current = stopMedia;
    localStreamRef.current = localStream;
  }, [sessionId, stopMedia, localStream]);

  // Perfect negotiation state
  const [signalingState, setSignalingState] = useState<SignalingState>({
    makingOffer: false,
    ignoreOffer: false,
    isSettingRemoteAnswerPending: false,
  });

  // Session state
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>({
    sessionId,
    isConnected: false,
    iceConnectionState: 'new',
    signalingState: 'stable',
  });

  /**
   * Create RTCPeerConnection
   */
  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          sessionId: sessionIdRef.current,
          candidate: event.candidate.toJSON() as RTCIceCandidateInit,
        });
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      setSessionState((prev) => ({
        ...prev,
        iceConnectionState: pc.iceConnectionState,
      }));

      // Log for debugging
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);

      // Handle connection failure
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        // Try to restart ICE
        pc.restartIce();
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      setSessionState((prev) => ({
        ...prev,
        signalingState: pc.signalingState,
      }));
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);

      if (pc.connectionState === 'connected') {
        setSessionState((prev) => ({ ...prev, isConnected: true }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setSessionState((prev) => ({ ...prev, isConnected: false }));
      }
    };

    // Handle incoming tracks (remote stream)
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);

      if (event.streams.length > 0) {
        const stream = event.streams[0];
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
        onRemoteStream?.(stream);
      }
    };

    return pc;
  }, [socket, onRemoteStream]);

  /**
   * Initialize WebRTC connection with local media
   */
  const initialize = useCallback(async () => {
    // Get current localStream from the hook closure
    const currentStream = localStreamRef.current;
    if (!currentStream || !socket) {
      console.warn('[WebRTC] Cannot initialize: missing local stream or socket');
      return;
    }

    if (peerConnectionRef.current) {
      console.warn('[WebRTC] Peer connection already exists');
      return;
    }

    try {
      // Create peer connection
      const pc = await createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentStream);
      });

      console.log('[WebRTC] Initialized with session:', sessionIdRef.current);
    } catch (error) {
      console.error('[WebRTC] Failed to initialize:', error);
    }
  }, [socket, createPeerConnection]);

  /**
   * Handle incoming offer (perfect negotiation)
   */
  const handleOffer = useCallback(
    async ({ offer, senderId: _senderId }: { offer: RTCSessionDescriptionInit; senderId: string }) => {
      const pc = peerConnectionRef.current;
      if (!pc || !localStreamRef.current) return;

      // If we're making an offer and receive one, check collision
      if (signalingState.makingOffer) {
        setSignalingState((prev) => ({ ...prev, ignoreOffer: true }));
        return;
      }

      // If we're setting remote answer, ignore offer
      if (signalingState.isSettingRemoteAnswerPending) {
        setSignalingState((prev) => ({ ...prev, ignoreOffer: true }));
        return;
      }

      // If we previously ignored an offer, this one is polite
      if (signalingState.ignoreOffer) {
        return;
      }

      try {
        // Set remote description (offer)
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer to peer
        socket?.emit('answer', {
          sessionId: sessionIdRef.current,
          answer: { type: answer.type, sdp: answer.sdp } as RTCSessionDescriptionInit,
        });

        setSessionState((prev) => ({ ...prev, signalingState: pc.signalingState }));
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
      }
    },
    [signalingState, socket]
  );

  /**
   * Handle incoming answer
   */
  const handleAnswer = useCallback(
    async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        // If we ignored the last offer, ignore this answer
        if (signalingState.ignoreOffer) {
          setSignalingState((prev) => ({ ...prev, ignoreOffer: false }));
          return;
        }

        // Set remote description (answer)
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setSignalingState((prev) => ({ ...prev, isSettingRemoteAnswerPending: false }));
        setSessionState((prev) => ({ ...prev, signalingState: pc.signalingState }));
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
      }
    },
    [signalingState]
  );

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(
    async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('[WebRTC] Error adding ICE candidate:', error);
      }
    },
    []
  );

  /**
   * Create and send offer (polite peer)
   */
  const createOffer = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !socket) return;

    try {
      setSignalingState((prev) => ({ ...prev, makingOffer: true }));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('offer', {
        sessionId: sessionIdRef.current,
        offer: { type: offer.type, sdp: offer.sdp } as RTCSessionDescriptionInit,
      });

      setSessionState((prev) => ({ ...prev, signalingState: pc.signalingState }));
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
    } finally {
      // Don't reset makingOffer immediately - wait for negotiation to complete
      setTimeout(() => {
        setSignalingState((prev) => ({ ...prev, makingOffer: false }));
      }, 100);
    }
  }, [socket]);

  /**
   * Poll for connection establishment
   * If no ICE connection after 5 seconds, create an offer
   */
  const startConnectionPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
    }

    let attempts = 0;
    const maxAttempts = 5;

    pollingTimeoutRef.current = setInterval(() => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      // Check if we're connected
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        if (pollingTimeoutRef.current) {
          clearInterval(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
        return;
      }

      // If not connected after some time, try creating an offer
      attempts++;
      if (attempts >= maxAttempts && pc.signalingState === 'stable') {
        console.log('[WebRTC] No connection after polling, creating offer');
        createOffer();
        if (pollingTimeoutRef.current) {
          clearInterval(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      }
    }, 1000);
  }, [createOffer]);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    // Clear polling timeout
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote stream
    remoteStreamRef.current = null;
    setRemoteStream(null);

    // Reset session state (using functional update to avoid sessionId dependency)
    setSessionState((prev) => ({
      ...prev,
      isConnected: false,
      iceConnectionState: 'new',
      signalingState: 'stable',
    }));

    // Reset signaling state
    setSignalingState({
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
    });
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Listen for incoming offers
    socket.on('offer', handleOffer);

    // Listen for incoming answers
    socket.on('answer', handleAnswer);

    // Listen for ICE candidates
    socket.on('ice-candidate', handleIceCandidate);

    // Listen for partner disconnect
    socket.on('partner-disconnected', () => {
      console.log('[WebRTC] Partner disconnected');
      onPartnerDisconnect?.();
      cleanup();
    });

    // Listen for partner skip
    socket.on('partner-skipped', () => {
      console.log('[WebRTC] Partner skipped');
      onSessionEnd?.('partner_skipped');
      cleanup();
    });

    // Listen for session end
    socket.on('session-ended', ({ reason }) => {
      console.log('[WebRTC] Session ended:', reason);
      onSessionEnd?.(reason);
      cleanup();
    });

    // Cleanup listeners
    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('partner-disconnected');
      socket.off('partner-skipped');
      socket.off('session-ended');
    };
  }, [socket, sessionId, handleOffer, handleAnswer, handleIceCandidate, cleanup, onPartnerDisconnect, onSessionEnd]);

  // Initialize when local stream is ready
  useEffect(() => {
    if (localStream) {
      initialize();
    }
  }, [localStream, initialize]);

  // Start connection polling after initialization
  useEffect(() => {
    if (peerConnectionRef.current && localStream) {
      startConnectionPolling();
    }
  }, [localStream, startConnectionPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      stopMediaRef.current?.();
    };
  }, [cleanup]);

  const skip = useCallback(() => {
    socket?.emit('skip-partner', sessionIdRef.current);
  }, [socket]);

  const disconnect = useCallback(() => {
    socket?.emit('disconnect-session', sessionIdRef.current);
    cleanup();
  }, [socket, cleanup]);

  return {
    localStream,
    remoteStream,
    sessionState,
    mediaError,
    skip,
    disconnect,
    startMedia,
    stopMedia,
  };
}
