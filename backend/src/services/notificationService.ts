import { sessionService } from './sessionService';
import { deskService } from './deskService';
import { timerService } from './timerService';
import { logger } from '../utils/logger';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const notificationService = {
  // Log an event to the database
  async logEvent(
    deskId: string,
    sessionId: string,
    eventType: string
  ): Promise<void> {
    try {
      const id = uuidv4();
      await query(
        `INSERT INTO events (id, desk_id, session_id, event_type, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, deskId, sessionId, eventType]
      );
    } catch (error) {
      logger.error('Error logging event', error);
    }
  },

  // Send "Still here?" prompt
  async sendStillHerePrompt(sessionId: string): Promise<void> {
    try {
      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        logger.warn(`Session ${sessionId} not found for prompt`);
        return;
      }

      // Mark as not responding
      await query(
        `UPDATE sessions SET is_responding = false WHERE id = $1`,
        [sessionId]
      );

      // Set prompt timer (5 minutes to respond)
      await timerService.setTimer(sessionId, 'prompt', 300);

      logger.info(`"Still here?" prompt sent to session ${sessionId}`);
      // In a real app, you'd send this via WebSocket to the frontend
    } catch (error) {
      logger.error('Error sending still here prompt', error);
    }
  },

  // Auto-abandon desk (no response to prompt)
  async autoAbandonDesk(sessionId: string): Promise<void> {
    try {
      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        logger.warn(`Session ${sessionId} not found for abandonment`);
        return;
      }

      // Mark session as abandoned
      await sessionService.updateSessionStatus(sessionId, 'abandoned');

      // Mark desk as abandoned
      await deskService.updateDeskStatus(session.desk_id, 'abandoned');

      // Clean up timers
      await timerService.deleteAllSessionTimers(sessionId);

      // Log event
      await this.logEvent(session.desk_id, sessionId, 'abandoned');

      logger.info(`Desk ${session.desk_id} auto-abandoned (no response to prompt)`);
    } catch (error) {
      logger.error('Error auto-abandoning desk', error);
    }
  },

  // Handle away timeout (20 minutes away without check-back)
  async handleAwayTimeout(sessionId: string): Promise<void> {
    try {
      const session = await sessionService.getSessionById(sessionId);
      if (!session || session.status !== 'away') {
        return;
      }

      // Auto-abandon if away too long
      await this.autoAbandonDesk(sessionId);
      logger.info(`Desk ${session.desk_id} auto-abandoned (away timeout)`);
    } catch (error) {
      logger.error('Error handling away timeout', error);
    }
  },
};
