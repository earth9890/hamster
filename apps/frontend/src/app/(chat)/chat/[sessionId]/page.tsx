'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoContainer } from '@/components/chat';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const {
    localStream,
    remoteStream,
    sessionState,
    mediaError,
    skip,
    disconnect,
    startMedia,
  } = useWebRTC({
    sessionId,
    onRemoteStream: (stream) => {
      console.log('[Chat] Remote stream received', stream);
    },
    onSessionEnd: (reason) => {
      console.log('[Chat] Session ended:', reason);
      // Redirect back to matching after a delay
      setTimeout(() => {
        router.push('/matching');
      }, 2000);
    },
    onPartnerDisconnect: () => {
      console.log('[Chat] Partner disconnected');
    },
  });

  // Start media on mount
  useEffect(() => {
    startMedia();

    return () => {
      // Cleanup is handled by useWebRTC hook
    };
  }, [startMedia]);

  // Handle permission denied
  if (mediaError) {
    return (
      <div className="h-screen flex items-center justify-center bg-graphite-950 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-semibold mb-2">Camera Access Required</h2>
          <p className="text-gray-400 mb-6">
            Please allow camera and microphone access to use video chat.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/matching')}
            className="btn-secondary ml-3"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-graphite-950">
      {/* Connection status banner */}
      {(sessionState.iceConnectionState === 'new' ||
        sessionState.iceConnectionState === 'checking') && (
        <div className="bg-accent/10 border-b border-accent/20 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent">Connecting to partner...</span>
          </div>
        </div>
      )}

      {sessionState.iceConnectionState === 'failed' && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400">Connection failed. Please try skipping.</span>
          </div>
        </div>
      )}

      {/* Video Container */}
      <VideoContainer
        localStream={localStream}
        remoteStream={remoteStream}
        isConnected={sessionState.isConnected}
        isConnecting={
          sessionState.iceConnectionState === 'new' ||
          sessionState.iceConnectionState === 'checking'
        }
        onSkip={skip}
        onDisconnect={disconnect}
      />

      {/* Session info (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-24 left-4 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-gray-500 font-mono">
          <div>Session: {sessionId?.slice(0, 8)}...</div>
          <div>ICE: {sessionState.iceConnectionState}</div>
          <div>Signaling: {sessionState.signalingState}</div>
          <div>Connected: {sessionState.isConnected ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}
