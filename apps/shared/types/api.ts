// Import WebRTC types from global
import type {
  RTCIceServer,
  RTCIceConnectionState,
  RTCSignalingState,
} from './global';

// Health check response
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

// WebRTC config response
export interface WebRTCConfigResponse {
  iceServers: RTCIceServer[];
}

// Features config response
export interface FeaturesConfigResponse {
  maxVideoDuration: number;
  maxMessageLength: number;
  supportedCountries: string[];
  supportedLanguages: string[];
}

// Report submission response
export interface ReportResponse {
  id: string;
  status: string;
  message: string;
}

// API error response
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
