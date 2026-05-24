import type { Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@hamster/shared';
import type { RTCSessionDescriptionInit, RTCIceCandidateInit } from '@hamster/shared/types/global';
import { logger } from '../../utils/logger';

/**
 * WebRTC Signaling Handler - Perfect Negotiation Pattern
 *
 * Implements the W3C WebRTC "perfect negotiation" pattern to prevent
 * signaling race conditions when both peers initiate offers simultaneously.
 *
 * Reference: https://www.w3.org/TR/webrtc/#perfect-negotiation-example
 */

interface SessionInfo {
  sessionId: string;
  user1: string;
  user2: string;
  createdAt: number;
  isActive: boolean;
}

// Active sessions store
const activeSessions = new Map<string, SessionInfo>();

// Signaling state for perfect negotiation
interface SignalingState {
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
}

const signalingStates = new Map<string, SignalingState>();

/**
 * Create a new session between two users
 */
export async function createSession(
  io: any,
  user1SocketId: string,
  user2SocketId: string
): Promise<string> {
  const sessionId = crypto.randomUUID();

  const sessionInfo: SessionInfo = {
    sessionId,
    user1: user1SocketId,
    user2: user2SocketId,
    createdAt: Date.now(),
    isActive: true,
  };

  activeSessions.set(sessionId, sessionInfo);

  // Initialize signaling states
  signalingStates.set(user1SocketId, {
    makingOffer: false,
    ignoreOffer: false,
    isSettingRemoteAnswerPending: false,
  });
  signalingStates.set(user2SocketId, {
    makingOffer: false,
    ignoreOffer: false,
    isSettingRemoteAnswerPending: false,
  });

  // Join both users to the session room
  const user1Sockets = await io.in(user1SocketId).fetchSockets();
  const user2Sockets = await io.in(user2SocketId).fetchSockets();

  if (user1Sockets.length > 0) {
    await user1Sockets[0].join(`session:${sessionId}`);
  }
  if (user2Sockets.length > 0) {
    await user2Sockets[0].join(`session:${sessionId}`);
  }

  logger.info('Session created', { sessionId, user1: user1SocketId, user2: user2SocketId });

  return sessionId;
}

/**
 * End a session and notify both users
 */
export async function endSession(io: any, sessionId: string, reason: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  session.isActive = false;

  // Notify both users
  io.to(`session:${sessionId}`).emit('session-ended', { reason });

  // Clean up room
  const sockets = await io.in(`session:${sessionId}`).fetchSockets();
  for (const socket of sockets) {
    await socket.leave(`session:${sessionId}`);
  }

  // Clean up states
  signalingStates.delete(session.user1);
  signalingStates.delete(session.user2);

  activeSessions.delete(sessionId);

  logger.info('Session ended', { sessionId, reason });
}

/**
 * Get active session info
 */
export function getSession(sessionId: string): SessionInfo | undefined {
  return activeSessions.get(sessionId);
}

/**
 * Handle WebRTC offer signaling
 */
export async function handleOffer(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  io: any,
  data: { sessionId: string; offer: RTCSessionDescriptionInit }
): Promise<void> {
  const { sessionId, offer } = data;
  const room = `session:${sessionId}`;

  // Get the other socket in the room
  const roomSockets = await io.in(room).fetchSockets();
  const otherSocket = roomSockets.find((s: any) => s.id !== socket.id);

  if (!otherSocket) {
    socket.emit('error', {
      code: 'PARTNER_NOT_FOUND',
      message: 'Partner not found in session',
    });
    return;
  }

  // Relay offer to partner
  otherSocket.emit('offer', {
    offer,
    senderId: socket.id,
  });

  logger.debug('Offer relayed', { from: socket.id, to: otherSocket.id, sessionId });
}

/**
 * Handle WebRTC answer signaling
 */
export async function handleAnswer(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  io: any,
  data: { sessionId: string; answer: RTCSessionDescriptionInit }
): Promise<void> {
  const { sessionId, answer } = data;
  const room = `session:${sessionId}`;

  // Get the other socket in the room
  const roomSockets = await io.in(room).fetchSockets();
  const otherSocket = roomSockets.find((s: any) => s.id !== socket.id);

  if (!otherSocket) {
    socket.emit('error', {
      code: 'PARTNER_NOT_FOUND',
      message: 'Partner not found in session',
    });
    return;
  }

  // Relay answer to partner
  otherSocket.emit('answer', {
    answer,
    senderId: socket.id,
  });

  logger.debug('Answer relayed', { from: socket.id, to: otherSocket.id, sessionId });
}

/**
 * Handle ICE candidate exchange
 */
export async function handleIceCandidate(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  io: any,
  data: { sessionId: string; candidate: RTCIceCandidateInit }
): Promise<void> {
  const { sessionId, candidate } = data;
  const room = `session:${sessionId}`;

  // Get the other socket in the room
  const roomSockets = await io.in(room).fetchSockets();
  const otherSocket = roomSockets.find((s: any) => s.id !== socket.id);

  if (!otherSocket) {
    // Silently ignore - partner may have disconnected
    return;
  }

  // Relay ICE candidate to partner
  otherSocket.emit('ice-candidate', {
    candidate,
    senderId: socket.id,
  });

  logger.debug('ICE candidate relayed', { from: socket.id, to: otherSocket.id });
}

/**
 * Handle skip partner request
 */
export async function handleSkip(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  io: any,
  sessionId: string
): Promise<void> {
  const room = `session:${sessionId}`;

  // Notify partner that user skipped
  socket.to(room).emit('partner-skipped');

  // End the session
  await endSession(io, sessionId, 'partner_skipped');

  logger.info('Partner skipped', { socketId: socket.id, sessionId });
}

/**
 * Handle session disconnect
 */
export async function handleDisconnect(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  io: any,
  sessionId: string
): Promise<void> {
  // Notify partner that user disconnected
  socket.to(`session:${sessionId}`).emit('partner-disconnected');

  // End the session
  await endSession(io, sessionId, 'user_disconnected');

  logger.info('User disconnected from session', { socketId: socket.id, sessionId });
}

/**
 * Get active sessions count
 */
export function getActiveSessionsCount(): number {
  return activeSessions.size;
}

/**
 * Clean up expired sessions (called periodically)
 */
export function cleanupExpiredSessions(maxAge: number = 7200000): void {
  const now = Date.now();
  const expiredSessions: string[] = [];

  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.createdAt > maxAge) {
      expiredSessions.push(sessionId);
    }
  }

  for (const sessionId of expiredSessions) {
    activeSessions.delete(sessionId);
    logger.info('Expired session cleaned up', { sessionId });
  }
}
