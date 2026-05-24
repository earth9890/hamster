import type { DefaultEventsMap } from 'socket.io';
import type { RTCSessionDescriptionInit, RTCIceCandidateInit } from './global';

// Matchmaking filters
export interface MatchFilters {
  country?: string;
  language?: string;
  gender?: 'male' | 'female' | 'everyone';
}

// Matched partner info
export interface MatchedPartner {
  sessionId: string;
  socketId: string;
  country?: string;
  language?: string;
}

// Chat message
export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

// Report data
export interface ReportData {
  sessionId: string;
  reason: 'inappropriate' | 'spam' | 'harassment' | 'other';
  description?: string;
}

// Error response
export interface ErrorResponse {
  code: string;
  message: string;
}

// Client -> Server events
export interface ClientToServerEvents extends DefaultEventsMap {
  // Matchmaking
  'join-queue': (filters: MatchFilters) => void;
  'leave-queue': () => void;

  // WebRTC signaling
  'offer': (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { sessionId: string; answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { sessionId: string; candidate: RTCIceCandidateInit }) => void;

  // Chat
  'send-message': (data: { sessionId: string; message: string }) => void;

  // Session
  'skip-partner': (sessionId: string) => void;
  'disconnect-session': (sessionId: string) => void;

  // Reports
  'report-user': (data: ReportData) => void;
}

// Server -> Client events
export interface ServerToClientEvents extends DefaultEventsMap {
  // Matchmaking
  'match-found': (partner: MatchedPartner) => void;
  'queue-position': (position: number) => void;
  'online-count': (count: number) => void;

  // WebRTC signaling
  'offer': (data: { offer: RTCSessionDescriptionInit; senderId: string }) => void;
  'answer': (data: { answer: RTCSessionDescriptionInit; senderId: string }) => void;
  'ice-candidate': (data: { candidate: RTCIceCandidateInit; senderId: string }) => void;

  // Chat
  'new-message': (message: ChatMessage) => void;

  // Session
  'partner-disconnected': () => void;
  'partner-skipped': () => void;
  'session-ended': (data: { reason: string }) => void;

  // Errors
  'error': (error: ErrorResponse) => void;
}

// Socket data (attached to each socket)
export interface SocketData {
  sessionId?: string;
  userId: string;
  joinedAt: number;
  ip: string;
}
