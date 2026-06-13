import * as redis from '../config/redis';
import { Timer, TimerType } from '../types';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const timerService = {
  // Set a timer in Redis
  async setTimer(
    sessionId: string,
    type: TimerType,
    durationSeconds?: number
  ): Promise<void> {
    try {
      const key = `timer:${sessionId}:${type}`;
      const duration = durationSeconds || this.getDefaultDuration(type);
      const timer: Timer = {
        type,
        expires_at: new Date(Date.now() + duration * 1000),
        created_at: new Date(),
      };

      await redis.set(key, JSON.stringify(timer), duration);
      logger.debug(`Timer set for session ${sessionId}: ${type} (${duration}s)`);
    } catch (error) {
      logger.error('Error setting timer', error);
      throw error;
    }
  },

  // Check if timer exists and is expired
  async isTimerExpired(sessionId: string, type: TimerType): Promise<boolean> {
    try {
      const key = `timer:${sessionId}:${type}`;
      const timerData = await redis.get(key);
      return !timerData; // If no data, timer expired or doesn't exist
    } catch (error) {
      logger.error('Error checking timer expiration', error);
      throw error;
    }
  },

  // Get timer data
  async getTimer(sessionId: string, type: TimerType): Promise<Timer | null> {
    try {
      const key = `timer:${sessionId}:${type}`;
      const timerData = await redis.get(key);
      if (!timerData) return null;
      return JSON.parse(timerData);
    } catch (error) {
      logger.error('Error getting timer', error);
      throw error;
    }
  },

  // Get all active timers of a specific type
  async getAllTimersOfType(type: TimerType): Promise<Array<{ sessionId: string; timer: Timer }>> {
    try {
      const pattern = `timer:*:${type}`;
      const keys = await redis.keys(pattern);
      const timers = [];

      for (const key of keys) {
        const timerData = await redis.get(key);
        if (timerData) {
          const sessionId = key.split(':')[1];
          timers.push({
            sessionId,
            timer: JSON.parse(timerData),
          });
        }
      }

      return timers;
    } catch (error) {
      logger.error('Error fetching all timers of type', error);
      throw error;
    }
  },

  // Get all active timers for a session
  async getSessionTimers(sessionId: string): Promise<Record<string, Timer>> {
    try {
      const pattern = `timer:${sessionId}:*`;
      const keys = await redis.keys(pattern);
      const timers: Record<string, Timer> = {};

      for (const key of keys) {
        const timerData = await redis.get(key);
        if (timerData) {
          const type = key.split(':')[2];
          timers[type] = JSON.parse(timerData);
        }
      }

      return timers;
    } catch (error) {
      logger.error('Error fetching session timers', error);
      throw error;
    }
  },

  // Delete a timer
  async deleteTimer(sessionId: string, type: TimerType): Promise<void> {
    try {
      const key = `timer:${sessionId}:${type}`;
      await redis.del(key);
      logger.debug(`Timer deleted: ${sessionId}:${type}`);
    } catch (error) {
      logger.error('Error deleting timer', error);
      throw error;
    }
  },

  // Delete all timers for a session
  async deleteAllSessionTimers(sessionId: string): Promise<void> {
    try {
      const pattern = `timer:${sessionId}:*`;
      const keys = await redis.keys(pattern);
      for (const key of keys) {
        await redis.del(key);
      }
      logger.debug(`All timers deleted for session ${sessionId}`);
    } catch (error) {
      logger.error('Error deleting all session timers', error);
      throw error;
    }
  },

  // Helper: get default duration for timer type
  private getDefaultDuration(type: TimerType): number {
    switch (type) {
      case 'session':
        return env.timers.session_timeout; // 2 hours = 7200 seconds
      case 'away':
        return env.timers.away_timeout; // 20 minutes = 1200 seconds
      case 'prompt':
        return 300; // 5 minutes to respond = 300 seconds
      default:
        return 3600; // 1 hour default
    }
  },
};
