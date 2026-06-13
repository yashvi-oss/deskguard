import cron from 'node-cron';
import { timerService } from '../services/timerService';
import { sessionService } from '../services/sessionService';
import { deskService } from '../services/deskService';
import { notificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

/**
 * BACKGROUND TIMER SWEEP JOB
 * 
 * This is THE MOST CRITICAL COMPONENT of DeskGuard.
 * It runs EVERY 60 SECONDS and:
 * 
 * 1. Checks all expired "session" timers → Sends "Still here?" prompt
 * 2. Checks all expired "prompt" timers → Auto-abandons desk
 * 3. Checks all expired "away" timers → Auto-abandons desk
 * 4. Updates database and broadcasts changes via WebSocket
 * 
 * ⚠️ ALL TIMER LOGIC MUST RUN SERVER-SIDE HERE
 * ⚠️ Frontend timers are for UX ONLY, not authoritative
 */

let isRunning = false;

export const startTimerSweepJob = () => {
  logger.info('⏰ Timer Sweep Job initialized (runs every 60 seconds)');

  // Run every 60 seconds
  cron.schedule('*/60 * * * * *', async () => {
    if (isRunning) {
      logger.warn('Previous sweep still running, skipping this cycle');
      return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
      logger.debug('🔄 Starting timer sweep cycle');

      // STEP 1: Check all expired SESSION timers (2-hour session timeout)
      await handleExpiredSessionTimers();

      // STEP 2: Check all expired PROMPT timers (5-minute response window)
      await handleExpiredPromptTimers();

      // STEP 3: Check all expired AWAY timers (20-minute away limit)
      await handleExpiredAwayTimers();

      const duration = Date.now() - startTime;
      logger.debug(`✅ Timer sweep completed in ${duration}ms`);
    } catch (error) {
      logger.error('❌ Error during timer sweep', error);
    } finally {
      isRunning = false;
    }
  });
};

/**
 * STEP 1: Handle expired session timers
 * When 2-hour timer expires → Send "Still here?" prompt
 */
async function handleExpiredSessionTimers(): Promise<void> {
  try {
    const sessionTimers = await timerService.getAllTimersOfType('session');
    logger.debug(`Checking ${sessionTimers.length} active session timers`);

    for (const { sessionId, timer } of sessionTimers) {
      // Check if timer has expired
      if (new Date() > timer.expires_at) {
        logger.info(`⏱️ Session timer EXPIRED for session ${sessionId}`);

        const session = await sessionService.getSessionById(sessionId);
        if (session && session.status === 'active') {
          // Send "Still here?" prompt
          await notificationService.sendStillHerePrompt(sessionId);
          logger.info(`📢 Sent "Still here?" prompt to session ${sessionId}`);

          // The prompt timer is now active (5 minutes)
          // If no response within 5 minutes, desk will be auto-abandoned
        }
      }
    }
  } catch (error) {
    logger.error('Error handling expired session timers', error);
  }
}

/**
 * STEP 2: Handle expired prompt timers
 * When 5-minute response window expires → Auto-abandon desk
 */
async function handleExpiredPromptTimers(): Promise<void> {
  try {
    const promptTimers = await timerService.getAllTimersOfType('prompt');
    logger.debug(`Checking ${promptTimers.length} active prompt timers`);

    for (const { sessionId, timer } of promptTimers) {
      // Check if timer has expired
      if (new Date() > timer.expires_at) {
        logger.info(`⏱️ Prompt timer EXPIRED for session ${sessionId} (no response)`);

        const session = await sessionService.getSessionById(sessionId);
        if (session) {
          // No response to prompt → Auto-abandon
          await notificationService.autoAbandonDesk(sessionId);
          logger.info(`🚨 Desk ${session.desk_id} AUTO-ABANDONED (student unresponsive)`);
        }
      }
    }
  } catch (error) {
    logger.error('Error handling expired prompt timers', error);
  }
}

/**
 * STEP 3: Handle expired away timers
 * When 20-minute away limit expires → Auto-abandon desk
 */
async function handleExpiredAwayTimers(): Promise<void> {
  try {
    const awayTimers = await timerService.getAllTimersOfType('away');
    logger.debug(`Checking ${awayTimers.length} active away timers`);

    for (const { sessionId, timer } of awayTimers) {
      // Check if timer has expired
      if (new Date() > timer.expires_at) {
        logger.info(`⏱️ Away timer EXPIRED for session ${sessionId}`);

        const session = await sessionService.getSessionById(sessionId);
        if (session && session.status === 'away') {
          // Away timeout → Auto-abandon
          await notificationService.autoAbandonDesk(sessionId);
          logger.info(`🚨 Desk ${session.desk_id} AUTO-ABANDONED (away timeout)`);
        }
      }
    }
  } catch (error) {
    logger.error('Error handling expired away timers', error);
  }
}

/**
 * BROADCASTING UPDATES
 * After making changes, you'd broadcast via WebSocket:
 * 
 * io.emit('desk:updated', {
 *   desk_id: deskId,
 *   status: 'free',
 *   color: 'green',
 *   timestamp: Date.now()
 * });
 * 
 * This notifies all connected students/librarians in real-time
 */
