import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from './utils/logger';
import { env } from './config/env';

let io: Server;

export const initWebSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: env.cors_origin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Client joins a room (e.g., "desk:123" for desk updates)
    socket.on('join-desk', (deskId: string) => {
      socket.join(`desk:${deskId}`);
      logger.debug(`Socket ${socket.id} joined desk:${deskId}`);
    });

    socket.on('leave-desk', (deskId: string) => {
      socket.leave(`desk:${deskId}`);
      logger.debug(`Socket ${socket.id} left desk:${deskId}`);
    });

    // Watch all desks (librarian dashboard)
    socket.on('watch-all-desks', () => {
      socket.join('all-desks');
      logger.debug(`Socket ${socket.id} watching all desks`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getWebSocketServer = (): Server => {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
};

// Emit desk update to specific desk room
export const broadcastDeskUpdate = (deskId: string, data: any) => {
  io.to(`desk:${deskId}`).emit('desk:updated', data);
  io.to('all-desks').emit('desk:updated', data);
};

// Emit to all connected clients
export const broadcastToAll = (event: string, data: any) => {
  io.emit(event, data);
};

// Emit prompt to specific user session
export const sendPromptToUser = (userId: string, prompt: any) => {
  io.to(`user:${userId}`).emit('prompt:still-here', prompt);
};
