'use client';

import { useState, useCallback, useEffect } from 'react';
import { LocalVideo } from './LocalVideo';
import { RemoteVideo } from './RemoteVideo';
import { ControlBar } from './ControlBar';
import { cn } from '../../lib/utils';

interface VideoContainerProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting?: boolean;
  onSkip?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export function VideoContainer({
  localStream,
  remoteStream,
  isConnected,
  isConnecting = false,
  onSkip,
  onDisconnect,
  className,
}: VideoContainerProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [layout, setLayout] = useState<'split' | 'focused'>('split');

  // Check if local stream has video track
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      setIsVideoEnabled(videoTrack?.enabled ?? false);
    }
  }, [localStream]);

  // Check if local stream has audio track
  useEffect(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      setIsAudioEnabled(audioTrack?.enabled ?? false);
    }
  }, [localStream]);

  // Auto-switch to focused layout when remote stream arrives
  useEffect(() => {
    console.log('[VideoContainer] Remote stream changed:', remoteStream ? 'YES' : 'NO');
    if (remoteStream) {
      console.log('[VideoContainer] Switching to focused layout');
      setLayout('focused');
    } else {
      console.log('[VideoContainer] Switching to split layout');
      setLayout('split');
    }
  }, [remoteStream]);

  const handleToggleVideo = useCallback(() => {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  }, [localStream]);

  const handleToggleAudio = useCallback(() => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  }, [localStream]);

  return (
    <div className={cn('relative w-full h-full flex flex-col', className)}>
      {/* Video Area */}
      <div className="flex-1 relative p-4">
        {layout === 'split' ? (
          // Split layout (both videos side by side, or just local)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Remote video */}
            <div className="relative">
              <RemoteVideo stream={remoteStream} className="w-full h-full" />
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-graphite-900/50 rounded-lg">
                  <p className="text-gray-400 text-sm">Waiting for partner...</p>
                </div>
              )}
            </div>

            {/* Local video */}
            <div className="relative">
              <LocalVideo stream={localStream} className="w-full h-full" />
            </div>
          </div>
        ) : (
          // Focused layout (remote large, local PIP)
          <>
            {/* Remote video (full size) */}
            <div className="absolute inset-4">
              <RemoteVideo stream={remoteStream} className="w-full h-full" />
            </div>

            {/* Local video (PIP) */}
            <div className="absolute bottom-24 right-4 w-48 h-36 md:w-64 md:h-48 shadow-2xl">
              <LocalVideo stream={localStream} className="w-full h-full" />
            </div>
          </>
        )}

        {/* Connection indicator */}
        {isConnecting && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-md rounded-full">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-white">Connecting...</span>
          </div>
        )}

        {/* Disconnected indicator */}
        {!isConnected && !isConnecting && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-500/70 backdrop-blur-md rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm text-white">Disconnected</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center pb-6 px-4">
        <ControlBar
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isConnecting={isConnecting}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
          onSkip={onSkip}
          onDisconnect={onDisconnect}
        />
      </div>
    </div>
  );
}
