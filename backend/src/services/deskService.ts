import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Desk, DeskStatus, DeskMap, DeskColor } from '../types';
import { logger } from '../utils/logger';

export const deskService = {
  // Get all desks with current status
  async getAllDesks(): Promise<DeskMap[]> {
    try {
      const result = await query(`
        SELECT 
          d.id,
          d.desk_number as "number",
          d.status,
          CASE 
            WHEN d.status = 'free' THEN 'green'
            WHEN d.status = 'occupied' THEN 'red'
            WHEN d.status = 'away' THEN 'yellow'
            ELSE 'gray'
          END as color,
          s.user_id,
          s.checked_in_at
        FROM desks d
        LEFT JOIN sessions s ON d.current_session_id = s.id
        ORDER BY d.desk_number
      `);
      return result.rows as DeskMap[];
    } catch (error) {
      logger.error('Error fetching all desks', error);
      throw error;
    }
  },

  // Get desk by ID
  async getDeskById(deskId: string): Promise<Desk | null> {
    try {
      const result = await query(
        'SELECT * FROM desks WHERE id = $1',
        [deskId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching desk', error);
      throw error;
    }
  },

  // Update desk status
  async updateDeskStatus(
    deskId: string,
    status: DeskStatus,
    sessionId?: string | null
  ): Promise<Desk> {
    try {
      const result = await query(
        `UPDATE desks 
         SET status = $1, current_session_id = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, sessionId || null, deskId]
      );
      if (result.rows.length === 0) {
        throw new Error('Desk not found');
      }
      logger.info(`Desk ${deskId} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating desk status', error);
      throw error;
    }
  },

  // Get free desks
  async getFreDesks(): Promise<Desk[]> {
    try {
      const result = await query(
        'SELECT * FROM desks WHERE status = $1 ORDER BY desk_number',
        ['free']
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching free desks', error);
      throw error;
    }
  },

  // Get abandoned desks
  async getAbandonedDesks(): Promise<any[]> {
    try {
      const result = await query(`
        SELECT 
          d.id,
          d.desk_number,
          d.status,
          s.user_id,
          s.checked_in_at,
          NOW() - s.checked_in_at as "duration_minutes"
        FROM desks d
        LEFT JOIN sessions s ON d.current_session_id = s.id
        WHERE d.status = 'abandoned'
        ORDER BY s.checked_in_at DESC
      `);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching abandoned desks', error);
      throw error;
    }
  },

  // Create desk (for initialization)
  async createDesk(
    deskNumber: number,
    floor: number,
    section: string
  ): Promise<Desk> {
    try {
      const id = uuidv4();
      const result = await query(
        `INSERT INTO desks (id, desk_number, floor, section, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [id, deskNumber, floor, section, 'free']
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating desk', error);
      throw error;
    }
  },

  // Reset desk (manual admin action)
  async resetDesk(deskId: string): Promise<Desk> {
    try {
      const result = await query(
        `UPDATE desks 
         SET status = 'free', current_session_id = NULL, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [deskId]
      );
      logger.info(`Desk ${deskId} manually reset by admin`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error resetting desk', error);
      throw error;
    }
  },
};
