import React, { useState, useEffect } from 'react';
import { SESSION_TIMEOUT, AWAY_TIMEOUT } from '../constants/config';

interface SessionTimerProps {
  expiresAt: Date | string;
  type: 'session' | 'away';
  onExpired?: () => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ expiresAt, type, onExpired }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const expireTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expireTime - now);

      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpired?.();
      }

      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired, isExpired]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getProgressPercentage = (): number => {
    const total = type === 'session' ? SESSION_TIMEOUT * 1000 : AWAY_TIMEOUT * 1000;
    return (timeRemaining / total) * 100;
  };

  const isWarning = timeRemaining < 300000; // Less than 5 minutes

  return (
    <div className="session-timer">
      <div className="timer-display">
        <h3>{type === 'session' ? '⏱️ Study Time' : '☕ Away Time'}</h3>
        <p className={`timer-text ${isWarning ? 'warning' : ''}`}>
          {isExpired ? 'Expired' : formatTime(timeRemaining)}
        </p>
      </div>
      <div className="timer-progress">
        <div
          className={`progress-bar ${isWarning ? 'warning' : ''}`}
          style={{
            width: `${getProgressPercentage()}%`,
          }}
        />
      </div>
    </div>
  );
};
