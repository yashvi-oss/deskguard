import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import '../styles/notifications.css';

interface NotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          role="alert"
        >
          <div className="notification-content">
            <p>{notification.message}</p>
          </div>
          <button
            className="notification-close"
            onClick={() => onDismiss(notification.id)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
