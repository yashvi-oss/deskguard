import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';
import { deskService } from '../services/deskService';
import { timerService } from '../services/timerService';
import { notificationService } from '../services/notificationService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const sessionController = {
  // Check-in endpoint (student scans QR code)
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const { desk_id } = req.body;
      const userId = (req as any).userId; // From auth middleware

      if (!desk_id) {
        res.status(400).json({
          success: false,
          error: 'desk_id is required',
          code: 'MISSING_DESK_ID',
        });
        return;
      }

      // Check if desk exists
      const desk = await deskService.getDeskById(desk_id);
      if (!desk) {
        res.status(404).json({
          success: false,
          error: 'Desk not found',
          code: 'DESK_NOT_FOUND',
        });
        return;
      }

      // Check if desk is free
      if (desk.status !== 'free') {
        res.status(400).json({
          success: false,
          error: `Desk is currently ${desk.status}`,
          code: 'DESK_NOT_AVAILABLE',
        });
        return;
      }

      // Create session
      const session = await sessionService.createSession(userId, desk_id);

      // Set timer for 2-hour session
      await timerService.setTimer(session.id, 'session', 7200);

      // Update desk status to occupied
      await deskService.updateDeskStatus(desk_id, 'occupied', session.id);

      // Log event
      await notificationService.logEvent(desk_id, session.id, 'checked_in');

      logger.info(`Student ${userId} checked in at desk ${desk_id}`);

      res.status(200).json({
        success: true,
        data: {
          session_id: session.id,
          desk_id: desk_id,
          desk_status: 'occupied',
          expires_at: new Date(Date.now() + 7200 * 1000),
          message: 'Successfully checked in',
        },
      });
    } catch (error) {
      logger.error('Check-in error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Away endpoint (student takes a break, max 20 minutes)
  async goAway(req: Request, res: Response): Promise<void> {
    try {
      const { session_id } = req.params;
      const userId = (req as any).userId;

      // Get session
      const session = await sessionService.getSessionById(session_id);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        });
        return;
      }

      // Verify session belongs to user
      if (session.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Update session to away
      await sessionService.setSessionAway(session_id);

      // Delete session timer, add away timer (20 minutes)
      await timerService.deleteTimer(session_id, 'session');
      await timerService.setTimer(session_id, 'away', 1200); // 20 minutes

      // Update desk status to away
      await deskService.updateDeskStatus(session.desk_id, 'away', session_id);

      // Log event
      await notificationService.logEvent(session.desk_id, session_id, 'away');

      logger.info(`Session ${session_id} marked as away`);

      res.status(200).json({
        success: true,
        data: {
          status: 'away',
          expires_at: new Date(Date.now() + 1200 * 1000),
          message: 'You have 20 minutes before desk is freed',
        },
      });
    } catch (error) {
      logger.error('Away error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Back from away endpoint
  async comeBack(req: Request, res: Response): Promise<void> {
    try {
      const { session_id } = req.params;
      const userId = (req as any).userId;

      // Get session
      const session = await sessionService.getSessionById(session_id);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        });
        return;
      }

      // Verify session belongs to user
      if (session.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Update session back to active
      await sessionService.updateSessionStatus(session_id, 'active');

      // Delete away timer, set new session timer
      await timerService.deleteTimer(session_id, 'away');
      await timerService.setTimer(session_id, 'session', 7200); // 2 hours

      // Update desk status back to occupied
      await deskService.updateDeskStatus(session.desk_id, 'occupied', session_id);

      // Log event
      await notificationService.logEvent(session.desk_id, session_id, 'back');

      logger.info(`Session ${session_id} back from away`);

      res.status(200).json({
        success: true,
        data: {
          status: 'active',
          expires_at: new Date(Date.now() + 7200 * 1000),
          message: 'Welcome back! Session timer reset',
        },
      });
    } catch (error) {
      logger.error('Come back error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Check-out endpoint (student leaves desk)
  async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const { session_id } = req.params;
      const userId = (req as any).userId;

      // Get session
      const session = await sessionService.getSessionById(session_id);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        });
        return;
      }

      // Verify session belongs to user
      if (session.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Update session to checked out
      await sessionService.checkOutSession(session_id);

      // Delete all timers
      await timerService.deleteAllSessionTimers(session_id);

      // Free up desk
      await deskService.updateDeskStatus(session.desk_id, 'free', null);

      // Log event
      await notificationService.logEvent(session.desk_id, session_id, 'checked_out');

      logger.info(`Session ${session_id} checked out from desk ${session.desk_id}`);

      res.status(200).json({
        success: true,
        data: {
          status: 'success',
          message: 'Successfully checked out',
        },
      });
    } catch (error) {
      logger.error('Check-out error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Respond to "Still here?" prompt
  async respondToPrompt(req: Request, res: Response): Promise<void> {
    try {
      const { session_id } = req.params;
      const userId = (req as any).userId;

      // Get session
      const session = await sessionService.getSessionById(session_id);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        });
        return;
      }

      // Verify session belongs to user
      if (session.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Mark as responding
      await sessionService.markAsResponding(session_id);

      // Delete prompt timer, reset session timer
      await timerService.deleteTimer(session_id, 'prompt');
      await timerService.setTimer(session_id, 'session', 7200);

      // Log event
      await notificationService.logEvent(session.desk_id, session_id, 'prompt_responded');

      logger.info(`Session ${session_id} responded to prompt`);

      res.status(200).json({
        success: true,
        data: {
          message: 'Thank you! You can continue studying',
          next_prompt_at: new Date(Date.now() + 7200 * 1000),
        },
      });
    } catch (error) {
      logger.error('Prompt response error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Get current session info
  async getCurrentSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      const session = await sessionService.getActiveSessionByUserId(userId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'No active session',
          code: 'NO_ACTIVE_SESSION',
        });
        return;
      }

      // Get timers
      const timers = await timerService.getSessionTimers(session.id);

      res.status(200).json({
        success: true,
        data: {
          session_id: session.id,
          desk_id: session.desk_id,
          status: session.status,
          checked_in_at: session.checked_in_at,
          timers,
        },
      });
    } catch (error) {
      logger.error('Get current session error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },
};
