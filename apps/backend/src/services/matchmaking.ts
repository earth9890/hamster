import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Redis Matchmaking Service
 *
 * Implements BLPOP-based blocking queues for efficient user matching.
 * Supports filtered matching by country and language.
 *
 * Queue Strategy:
 * - Global queue (matchmaking:global)
 * - Country-specific queues (matchmaking:country:{code})
 * - Language-specific queues (matchmaking:language:{code})
 *
 * Priority matching:
 * 1. Country + Language match
 * 2. Country only match
 * 3. Language only match
 * 4. Global match (anyone)
 */

export interface MatchFilters {
  country?: string;
  language?: string;
  gender?: 'male' | 'female' | 'everyone';
}

export interface QueuedUser {
  socketId: string;
  filters: MatchFilters;
  joinedAt: number;
  sessionId: string;
  ip: string;
}

export class MatchmakingService {
  private redis!: any; // RedisClientType with modules compatibility
  private readonly queueExpiry = 60; // 60s user data expiry

  constructor() {
    this.redis = redisClient;
  }

  /**
   * Add user to appropriate matchmaking queue(s)
   */
  async joinQueue(user: QueuedUser): Promise<void> {
    const { socketId, filters, joinedAt, sessionId } = user;

    try {
      // Store user data
      await this.redis.hSet(`user:${socketId}`, {
        socketId,
        sessionId,
        filters: JSON.stringify(filters),
        joinedAt: joinedAt.toString(),
        ip: user.ip,
      });

      // Set expiry for user data
      await this.redis.expire(`user:${socketId}`, this.queueExpiry);

      // Always add to global queue
      await this.redis.lPush('matchmaking:global', socketId);

      // Add to filtered queues if specified
      if (filters.country) {
        await this.redis.lPush(`matchmaking:country:${filters.country}`, socketId);
      }

      if (filters.language) {
        await this.redis.lPush(`matchmaking:language:${filters.language}`, socketId);
      }

      // Update online count
      await this.redis.incr('online:count');

      logger.info('User joined queue', { socketId, filters });
    } catch (error) {
      logger.error('Failed to join queue', { socketId, error });
      throw error;
    }
  }

  /**
   * Find a match using priority queue strategy
   */
  async findMatch(socketId: string, filters: MatchFilters): Promise<string | null> {
    let matchedSocketId: string | null = null;
    logger.info('[findMatch] Starting search', { socketId, filters });

    try {
      // Priority 1: Try country + language match
      if (filters.country && filters.language) {
        matchedSocketId = await this.findIntersectionMatch(
          `matchmaking:country:${filters.country}`,
          `matchmaking:language:${filters.language}`,
          socketId
        );

        if (matchedSocketId) {
          logger.info('Match found: country+language', { socketId, matched: matchedSocketId });
          return matchedSocketId;
        }
      }

      // Priority 2: Try country match only
      if (filters.country && !matchedSocketId) {
        matchedSocketId = await this.findInQueue(
          `matchmaking:country:${filters.country}`,
          socketId
        );

        if (matchedSocketId) {
          logger.info('Match found: country only', { socketId, matched: matchedSocketId });
          return matchedSocketId;
        }
      }

      // Priority 3: Try language match only
      if (filters.language && !matchedSocketId) {
        matchedSocketId = await this.findInQueue(
          `matchmaking:language:${filters.language}`,
          socketId
        );

        if (matchedSocketId) {
          logger.info('Match found: language only', { socketId, matched: matchedSocketId });
          return matchedSocketId;
        }
      }

      // Priority 4: Global queue (anyone)
      if (!matchedSocketId) {
        logger.info('[findMatch] Trying global queue', { socketId });
        matchedSocketId = await this.findInQueue('matchmaking:global', socketId);
        logger.info('[findMatch] Global queue result', { socketId, matchedSocketId });

        if (matchedSocketId) {
          logger.info('Match found: global', { socketId, matched: matchedSocketId });
        }
      }

      return matchedSocketId;
    } catch (error) {
      logger.error('Failed to find match', { socketId, error });
      return null;
    }
  }

  /**
   * Find match in specific queue with BLPOP (blocking)
   */
  private async findInQueue(
    queueKey: string,
    excludeSocketId: string
  ): Promise<string | null> {
    try {
      // Check queue length first - if only 1 person (you), no match possible
      const queueLength = await this.redis.lLen(queueKey);
      if (queueLength <= 1) {
        logger.info('[findInQueue] Queue empty or only self', { queueKey, queueLength, excludeSocketId });
        return null;
      }

      logger.info('[findInQueue] Calling BRPOP', { queueKey, excludeSocketId, queueLength });
      // Use BRPOP for blocking read with 2s timeout
      const result = await this.redis.brPop(queueKey, 2);
      logger.info('[findInQueue] BRPOP result', { queueKey, excludeSocketId, result: result?.element });

      if (!result) return null;

      const matchedSocketId = result.element;

      // Don't match with self
      if (matchedSocketId === excludeSocketId) {
        // Put back and try ONCE more
        await this.redis.lPush(queueKey, matchedSocketId);

        // Check if there are others after putting back
        const newLength = await this.redis.lLen(queueKey);
        if (newLength <= 1) {
          logger.info('[findInQueue] Only self in queue after re-add', { queueKey, excludeSocketId });
          return null;
        }

        // Pop again to get next person
        const secondResult = await this.redis.brPop(queueKey, 1);
        if (!secondResult) return null;

        const secondSocketId = secondResult.element;
        if (secondSocketId === excludeSocketId) {
          // Still got ourselves, put back and give up
          await this.redis.lPush(queueKey, secondSocketId);
          return null;
        }

        // Verify user still exists (not expired)
        const exists = await this.redis.exists(`user:${secondSocketId}`);
        if (!exists) {
          // User expired, try again recursively
          return await this.findInQueue(queueKey, excludeSocketId);
        }

        // Remove user from all queues
        await this.removeFromAllQueues(secondSocketId);

        return secondSocketId;
      }

      // Verify user still exists (not expired)
      const exists = await this.redis.exists(`user:${matchedSocketId}`);
      if (!exists) {
        // User expired, try again
        return await this.findInQueue(queueKey, excludeSocketId);
      }

      // Remove user from all queues
      await this.removeFromAllQueues(matchedSocketId);

      return matchedSocketId;
    } catch (error) {
      logger.error('Error in findInQueue', { queueKey, error });
      return null;
    }
  }

  /**
   * Find intersection of two queues (country + language match)
   */
  private async findIntersectionMatch(
    queue1: string,
    queue2: string,
    excludeSocketId: string
  ): Promise<string | null> {
    try {
      // Get users from both queues
      const users1 = await this.redis.lRange(queue1, 0, 100);
      const users2 = await this.redis.lRange(queue2, 0, 100);

      if (!users1.length || !users2.length) return null;

      const users2Set = new Set(users2);

      // Find intersection
      for (const userId of users1) {
        if (userId !== excludeSocketId && users2Set.has(userId)) {
          // Verify user exists
          const exists = await this.redis.exists(`user:${userId}`);
          if (exists) {
            // Remove from both queues
            await this.redis.lRem(queue1, 1, userId);
            await this.redis.lRem(queue2, 1, userId);

            // Remove from all other queues
            await this.removeFromAllQueues(userId);

            return userId;
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Error in findIntersectionMatch', { queue1, queue2, error });
      return null;
    }
  }

  /**
   * Remove user from all matchmaking queues
   */
  async removeFromAllQueues(socketId: string): Promise<void> {
    try {
      // Remove from global queue
      await this.redis.lRem('matchmaking:global', 0, socketId);

      // Get user's filters to remove from specific queues
      const userData = await this.redis.hGetAll(`user:${socketId}`);
      if (userData.filters) {
        const filters = JSON.parse(userData.filters) as MatchFilters;

        if (filters.country) {
          await this.redis.lRem(`matchmaking:country:${filters.country}`, 0, socketId);
        }

        if (filters.language) {
          await this.redis.lRem(`matchmaking:language:${filters.language}`, 0, socketId);
        }
      }

      // Delete user data
      await this.redis.del(`user:${socketId}`);

      // Update online count
      await this.redis.decr('online:count');

      logger.debug('User removed from all queues', { socketId });
    } catch (error) {
      logger.error('Failed to remove from queues', { socketId, error });
    }
  }

  /**
   * Get user's current position in queue
   */
  async getQueuePosition(socketId: string): Promise<number> {
    try {
      const position = await this.redis.lPos('matchmaking:global', socketId);
      return position !== null ? position + 1 : 0;
    } catch (error) {
      logger.error('Failed to get queue position', { socketId, error });
      return 0;
    }
  }

  /**
   * Get current online users count
   */
  async getOnlineCount(): Promise<number> {
    try {
      const count = await this.redis.get('online:count');
      return parseInt(count || '0', 10);
    } catch (error) {
      logger.error('Failed to get online count', { error });
      return 0;
    }
  }

  /**
   * Clean up expired users from queues
   */
  async cleanupExpiredUsers(): Promise<void> {
    try {
      // Scan for expired users and remove from queues
      const globalQueue = await this.redis.lRange('matchmaking:global', 0, -1);

      for (const socketId of globalQueue) {
        const exists = await this.redis.exists(`user:${socketId}`);
        if (!exists) {
          await this.redis.lRem('matchmaking:global', 1, socketId);
        }
      }

      logger.debug('Expired users cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup expired users', { error });
    }
  }
}

// Singleton instance
let matchmakingService: MatchmakingService | null = null;

export function getMatchmakingService(): MatchmakingService {
  if (!matchmakingService) {
    matchmakingService = new MatchmakingService();

    // Start cleanup interval (every 5 minutes)
    setInterval(() => {
      matchmakingService?.cleanupExpiredUsers();
    }, 5 * 60 * 1000);
  }

  return matchmakingService;
}
