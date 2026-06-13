import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionStatus } from '../types';
import { logger } from '../utils/logger';

export const sessionService = {
  // Create a new session (student checks in)
  async createSession(userId: string, deskId: string): Promise<Session> {
    try {
      const id = uuidv4();
      const result = await query(
        `INSERT INTO sessions (id, user_id, desk_id, status, checked_in_at, is_responding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), true, NOW(), NOW())
         RETURNING *`,
        [id, userId, deskId, 'active']
      );
      logger.info(`Session created for user ${userId} at desk ${deskId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating session', error);
      throw error;
    }
  },

  // Get session by ID
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      const result = await query(
        'SELECT * FROM sessions WHERE id = $1',
        [sessionId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching session', error);
      throw error;
    }
  },

  // Get active session for user
  async getActiveSessionByUserId(userId: string): Promise<Session | null> {
    try {
      const result = await query(
        `SELECT * FROM sessions 
         WHERE user_id = $1 AND status != 'checked_out'
         ORDER BY checked_in_at DESC LIMIT 1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching active session', error);
      throw error;
    }
  },

  // Update session status
  async updateSessionStatus(
    sessionId: string,
    status: SessionStatus
  ): Promise<Session> {
    try {
      const result = await query(
        `UPDATE sessions 
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, sessionId]
      );
      if (result.rows.length === 0) {
        throw new Error('Session not found');
      }
      logger.info(`Session ${sessionId} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating session status', error);
      throw error;
    }
  },

  // Mark session as away
  async setSessionAway(sessionId: string): Promise<Session> {
    try {
      const result = await query(
        `UPDATE sessions 
         SET status = 'away', away_started_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [sessionId]
      );
      logger.info(`Session ${sessionId} marked as away`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error setting session away', error);
      throw error;
    }
  },

  // Mark student as responding
  async markAsResponding(sessionId: string): Promise<Session> {
    try {
      const result = await query(
        `UPDATE sessions 
         SET is_responding = true, status = 'active', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [sessionId]
      );
      logger.info(`Session ${sessionId} marked as responding`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error marking session as responding', error);
      throw error;
    }
  },

  // Get all non-responding sessions (for expired prompts)
  async getNonRespondingSessions(): Promise<Session[]> {
    try {
      const result = await query(
        `SELECT * FROM sessions 
         WHERE is_responding = false AND status = 'active'
         ORDER BY updated_at DESC`
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching non-responding sessions', error);
      throw error;
    }
  },

  // Check out session
  async checkOutSession(sessionId: string): Promise<Session> {
    try {
      const result = await query(
        `UPDATE sessions 
         SET status = 'checked_out', checked_out_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [sessionId]
      );
      logger.info(`Session ${sessionId} checked out`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error checking out session', error);
      throw error;
    }
  },

  // Get all active sessions
  async getAllActiveSessions(): Promise<Session[]> {
    try {
      const result = await query(
        `SELECT * FROM sessions 
         WHERE status IN ('active', 'away')
         ORDER BY checked_in_at DESC`
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching all active sessions', error);
      throw error;
    }
  },
};
