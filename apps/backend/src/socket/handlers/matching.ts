import type { Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@hamster/shared';
import type { MatchFilters, QueuedUser } from '../../services/matchmaking';
import * as signaling from './signaling';
import { getMatchmakingService } from '../../services/matchmaking';
import { logger } from '../../utils/logger';

/**
 * Matchmaking Event Handlers
 *
 * Handles queue joining, match finding, and session management
 */

const matchmakingService = getMatchmakingService();
const userSessions = new Map<string, string>(); // socketId -> sessionId
const queuedUsers = new Map<string, QueuedUser>(); // socketId -> user data

/**
 * Handle join-queue event
 */
export async function handleJoinQueue(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  io: any,
  filters: MatchFilters
): Promise<void> {
  const socketId = socket.id;
  logger.info('[handleJoinQueue] START', { socketId, filters });

  try {
    // Remove from existing queue if any
    await handleLeaveQueue(socket);

    // Get IP address from request
    const ip = (socket as any).request?.socket?.remoteAddress || 'unknown';

    // Create new user
    const sessionId = crypto.randomUUID();
    const user: QueuedUser = {
      socketId,
      filters,
      joinedAt: Date.now(),
      sessionId,
      ip,
    };

    logger.info('[handleJoinQueue] Created user', { socketId, sessionId, filters });

    // Store user data
    queuedUsers.set(socketId, user);
    userSessions.set(socketId, sessionId);

    // Join queue
    await matchmakingService.joinQueue(user);
    logger.info('[handleJoinQueue] User added to Redis queue', { socketId });

    // Try to find a match immediately
    logger.info('[handleJoinQueue] Calling tryFindMatch', { socketId });
    await tryFindMatch(socket, io, user);
    logger.info('[handleJoinQueue] tryFindMatch completed', { socketId });
  } catch (error) {
    logger.error('[handleJoinQueue] Failed', { socketId, error });
    socket.emit('error', {
      code: 'QUEUE_JOIN_FAILED',
      message: 'Failed to join matchmaking queue',
    });
  }
}

/**
 * Try to find a match for a user
 */
async function tryFindMatch(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  io: any,
  user: QueuedUser
): Promise<void> {
  const { socketId, filters } = user;

  try {
    // Find match
    const matchedSocketId = await matchmakingService.findMatch(socketId, filters);

    if (!matchedSocketId) {
      // No match found, user stays in queue waiting
      logger.info('No match found, user waiting in queue', { socketId });
      return;
    }

    // Check if matched user is still queued
    const matchedUser = queuedUsers.get(matchedSocketId);
    if (!matchedUser) {
      logger.info('Matched user no longer in queue, retrying', { socketId, matchedSocketId });
      // Try again
      await tryFindMatch(socket, io, user);
      return;
    }

    // Create session
    const newSessionId = await signaling.createSession(io, socketId, matchedSocketId);

    // Get matched socket
    const roomSockets = await io.in(matchedSocketId).fetchSockets();
    const matchedSocket = roomSockets.find((s: any) => s.id === matchedSocketId);

    if (!matchedSocket) {
      logger.error('Matched socket not found', { matchedSocketId });
      // Put user back in queue
      await matchmakingService.joinQueue(user);
      return;
    }

    // Clean up queue state for both users
    queuedUsers.delete(socketId);
    queuedUsers.delete(matchedSocketId);

    // Update session mappings
    userSessions.set(socketId, newSessionId);
    userSessions.set(matchedSocketId, newSessionId);

    // Notify both users
    socket.emit('match-found', {
      sessionId: newSessionId,
      socketId: matchedSocketId,
    });

    matchedSocket.emit('match-found', {
      sessionId: newSessionId,
      socketId: socketId,
    });

    logger.info('Match found', {
      session: newSessionId,
      user1: socketId,
      user2: matchedSocketId,
    });
  } catch (error) {
    logger.error('Error finding match', { socketId, error });
  }
}

/**
 * Handle leave-queue event
 */
export async function handleLeaveQueue(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>
): Promise<void> {
  const socketId = socket.id;

  try {
    await matchmakingService.removeFromAllQueues(socketId);
    queuedUsers.delete(socketId);
    userSessions.delete(socketId);

    logger.info('User left queue', { socketId });
  } catch (error) {
    logger.error('Failed to leave queue', { socketId, error });
  }
}

/**
 * Get user's current session ID
 */
export function getUserSessionId(socketId: string): string | undefined {
  return userSessions.get(socketId);
}

/**
 * Clear user session mapping
 */
export function clearUserSession(socketId: string): void {
  userSessions.delete(socketId);
  queuedUsers.delete(socketId);
}
