import { createServer } from 'http';
import express from 'express';
import { config } from './config';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFound } from './middleware/error';
import { initializeSocket } from './socket';
import apiRoutes from './routes';
import { logger } from './utils/logger';
import { connectRedis, disconnectRedis } from './config/redis';
import { closePool, testConnection as testDbConnection } from './config/database';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testDbConnection();
    if (dbConnected) {
      logger.info('Database connected successfully');
    } else {
      logger.warn('Database connection failed, continuing anyway...');
    }

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await disconnectRedis();
  await closePool();

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();
