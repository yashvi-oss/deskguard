import { Request, Response } from 'express';
import { deskService } from '../services/deskService';
import { logger } from '../utils/logger';

export const deskController = {
  // Get live desk map
  async getDesksMap(req: Request, res: Response): Promise<void> {
    try {
      const desks = await deskService.getAllDesks();

      res.status(200).json({
        success: true,
        data: {
          desks,
          total: desks.length,
          available: desks.filter((d) => d.status === 'free').length,
          occupied: desks.filter((d) => d.status === 'occupied').length,
          away: desks.filter((d) => d.status === 'away').length,
          abandoned: desks.filter((d) => d.status === 'abandoned').length,
        },
      });
    } catch (error) {
      logger.error('Get desks map error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Get desk details
  async getDeskDetails(req: Request, res: Response): Promise<void> {
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

      res.status(200).json({
        success: true,
        data: desk,
      });
    } catch (error) {
      logger.error('Get desk details error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },

  // Get free desks
  async getFreDesks(req: Request, res: Response): Promise<void> {
    try {
      const desks = await deskService.getFreDesks();

      res.status(200).json({
        success: true,
        data: {
          desks,
          total: desks.length,
        },
      });
    } catch (error) {
      logger.error('Get free desks error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  },
};
