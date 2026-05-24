import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '@hamster/shared';
import { logger } from '../utils/logger';
import * as matchingHandler from './handlers/matching';
import * as signalingHandler from './handlers/signaling';

export let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, SocketData>;

export function initializeSocket(httpServer: HttpServer): void {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, SocketData>(httpServer, {
    cors: {
      origin: config.nodeEnv === 'production' ? config.cors.origin : ['http://localhost:3000', 'http://localhost:3001', /^http:\/\/localhost:\d+$/],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    allowUpgrades: true,
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      logger.debug('Socket.IO connection attempt', { origin, url: req.url });
      callback(null, true); // Allow all requests in development
    },
  });

  io.on('connection', (socket) => {
    const socketId = socket.id;
    logger.info('Client connected', { socketId });

    // Attach user data to socket
    (socket as any).data.userId = socketId;
    (socket as any).data.joinedAt = Date.now();
    (socket as any).data.ip = socket.handshake.address;

    // === Matchmaking Events ===

    socket.on('join-queue', async (filters) => {
      logger.info('[Socket] Received join-queue event', { socketId, filters });
      await matchingHandler.handleJoinQueue(socket, io, filters);
    });

    socket.on('leave-queue', async () => {
      await matchingHandler.handleLeaveQueue(socket);
    });

    // === WebRTC Signaling Events ===

    socket.on('offer', async (data) => {
      await signalingHandler.handleOffer(socket as any, io, data);
    });

    socket.on('answer', async (data) => {
      await signalingHandler.handleAnswer(socket as any, io, data);
    });

    socket.on('ice-candidate', async (data) => {
      await signalingHandler.handleIceCandidate(socket as any, io, data);
    });

    // === Session Events ===

    socket.on('skip-partner', async (sessionId) => {
      await signalingHandler.handleSkip(socket as any, io, sessionId);
    });

    socket.on('disconnect-session', async (sessionId) => {
      await signalingHandler.handleDisconnect(socket as any, io, sessionId);
    });

    // === Text Chat Events ===
    // TODO: Implement in Phase 4

    // === Report Events ===
    // TODO: Implement in Phase 6

    // === Disconnect Handler ===

    socket.on('disconnect', async (reason) => {
      logger.info('Client disconnected', { socketId, reason });

      // Remove from queue if queued
      await matchingHandler.handleLeaveQueue(socket as any);

      // Clean up user session mapping
      matchingHandler.clearUserSession(socketId);
    });

    // === Error Handler ===

    socket.on('error', (error) => {
      logger.error('Socket error', { socketId, error });
    });
  });

  // Periodic cleanup of expired sessions (every hour)
  setInterval(() => {
    signalingHandler.cleanupExpiredSessions();
  }, 60 * 60 * 1000);

  logger.info('Socket.IO server initialized');
}

// Export for testing
export { signalingHandler, matchingHandler };
