import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { env } from './config/env';
import { connect as connectDB, disconnect as disconnectDB } from './config/database';
import { initRedis, disconnect as disconnectRedis } from './config/redis';
import { logger } from './utils/logger';
import { initWebSocket } from './websocket';
import { startTimerSweepJob } from './jobs/timerSweepJob';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Import routes
import sessionsRouter from './routes/sessions';
import desksRouter from './routes/desks';
import adminRouter from './routes/admin';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: env.cors_origin }));
app.use(express.json());

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.node_env,
  });
});

// API Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/desks', desksRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// Error handler
app.use(errorHandler);

// Initialize WebSocket
initWebSocket(httpServer);

// Startup function
const startup = async () => {
  try {
    logger.info('🚀 DeskGuard Backend Starting...');

    // Connect to PostgreSQL
    await connectDB();

    // Connect to Redis
    await initRedis();

    // Start background timer sweep job
    startTimerSweepJob();
    logger.info('⏰ Timer sweep job started');

    // Start HTTP/WebSocket server
    httpServer.listen(env.port, () => {
      logger.info(`✅ Server running on http://localhost:${env.port}`);
      logger.info(`📡 WebSocket available on ws://localhost:${env.port}`);
      logger.info(`🌍 CORS origin: ${env.cors_origin}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('🛑 Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  await disconnectDB();
  await disconnectRedis();
  logger.info('✅ Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startup();
