// Import WebRTC types from global
import type {
  RTCIceServer,
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
  RTCIceConnectionState,
  RTCSignalingState,
} from './global';

// WebRTC configuration
export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

// ICE server configuration
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

// Session state
export interface SessionState {
  sessionId: string;
  isConnected: boolean;
  iceConnectionState: RTCIceConnectionState;
  signalingState: RTCSignalingState;
}

// Media constraints
export interface MediaConstraints {
  video?: {
    width?: { ideal?: number; max?: number };
    height?: { ideal?: number; max?: number };
    frameRate?: { ideal?: number; max?: number };
    facingMode?: 'user' | 'environment';
  };
  audio?: {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  };
}

// Stream info
export interface StreamInfo {
  id: string;
  kind: 'audio' | 'video';
  enabled: boolean;
  muted: boolean;
}

// Re-export WebRTC types
export type {
  RTCIceServer,
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
  RTCIceConnectionState,
  RTCSignalingState,
} from './global';
