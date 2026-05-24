// WebRTC global type definitions for shared package

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface RTCSessionDescriptionInit {
  type: RTCSdpType;
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string;
}

export type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';

export type RTCIceConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed';

export type RTCSignalingState =
  | 'stable'
  | 'have-local-offer'
  | 'have-remote-offer'
  | 'have-local-pranswer'
  | 'have-remote-pranswer'
  | 'closed';
