import { Request, Response } from 'express';
import { deskService } from '../services/deskService';
import { notificationService } from '../services/notificationService';
import { timerService } from '../services/timerService';
import { sessionService } from '../services/sessionService';
import { logger } from '../utils/logger';

export const adminController = {
  // Get all abandoned desks
  async getAbandonedDesks(req: Request, res: Response): Promise<void> {
    try {
      const desks = await deskService.getAbandonedDesks();

      res.status(200).json({
        success: true,
        data: {
          desks,
          total: desks.length,
        },
      });
    } catch (error) {
      logger.error('Get abandoned desks error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Manually reset a desk
  async resetDesk(req: Request, res: Response): Promise<void> {
    try {
      const { desk_id } = req.params;

      const desk = await deskService.getDeskById(desk_id);
      if (!desk) {
        res.status(404).json({
          success: false,
          error: 'Desk not found',
          code: 'DESK_NOT_FOUND',
        });
        return;
      }

      // Reset desk
      await deskService.resetDesk(desk_id);

      // If there's a current session, clean up
      if (desk.current_session_id) {
        await timerService.deleteAllSessionTimers(desk.current_session_id);
        await sessionService.updateSessionStatus(desk.current_session_id, 'abandoned');
      }

      logger.info(`Desk ${desk_id} manually reset by admin`);

      res.status(200).json({
        success: true,
        data: {
          desk_id,
          status: 'free',
          message: 'Desk successfully reset',
        },
      });
    } catch (error) {
      logger.error('Reset desk error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Get dashboard stats
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const desks = await deskService.getAllDesks();
      const activeSessions = await sessionService.getAllActiveSessions();

      const stats = {
        total_desks: desks.length,
        free_desks: desks.filter((d) => d.status === 'free').length,
        occupied_desks: desks.filter((d) => d.status === 'occupied').length,
        away_desks: desks.filter((d) => d.status === 'away').length,
        abandoned_desks: desks.filter((d) => d.status === 'abandoned').length,
        active_sessions: activeSessions.length,
        occupancy_rate: (
          ((desks.filter((d) => d.status === 'occupied').length +
            desks.filter((d) => d.status === 'away').length) /
            desks.length) *
          100
        ).toFixed(2),
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get dashboard stats error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },
};
