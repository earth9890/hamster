'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseMediaStreamOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export function useMediaStream(options: UseMediaStreamOptions = {}) {
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: options.video !== false ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
        } : false,
        audio: options.audio !== false ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      setError(err as Error);
      console.error('Error accessing media devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    stream,
    error,
    isLoading,
    start,
    stop,
  };
}
