import { createClient, RedisClientType } from 'redis';
import { config } from './index';

const client = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection failed');
      }
      return retries * 100; // Exponential backoff
    },
  },
});

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis Client Connected'));
client.on('reconnecting', () => console.log('Redis Client Reconnecting...'));

export async function connectRedis(): Promise<void> {
  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  await client.quit();
  console.log('Redis client disconnected');
}

export async function testConnection(): Promise<boolean> {
  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

export { client as redisClient };
export type { RedisClientType };
