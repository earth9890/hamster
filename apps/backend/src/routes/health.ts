import { Router, Request, Response } from 'express';
import { testConnection as testDbConnection } from '../config/database';
import { testConnection as testRedisConnection } from '../config/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const uptime = process.uptime();

  const [dbConnected, redisConnected] = await Promise.all([
    testDbConnection().catch(() => false),
    testRedisConnection().catch(() => false),
  ]);

  const health = {
    status: dbConnected && redisConnected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
    },
  };

  const statusCode = health.status === 'ok' ? 200 : 503;

  res.status(statusCode).json(health);
});

export default router;
