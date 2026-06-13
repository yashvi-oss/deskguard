import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { LibraryMap } from '../components/LibraryMap';
import { SessionTimer } from '../components/SessionTimer';
import { Notifications } from '../components/Notifications';
import { Desk, Session, Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';
import '../styles/student-portal.css';

export const StudentPortal: React.FC = () => {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { request } = useApi();
  const { emit, on, isConnected } = useWebSocket();

  // Load desks on mount
  useEffect(() => {
    loadDesks();
  }, []);

  // Load current session
  useEffect(() => {
    loadCurrentSession();
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    if (isConnected && currentSession) {
      emit('join-desk', currentSession.desk_id);
    }

    on('desk:updated', (data) => {
      console.log('📡 Desk updated:', data);
      setDesks((prev) =>
        prev.map((d) => (d.id === data.desk_id ? { ...d, ...data } : d))
      );
    });

    on('prompt:still-here', (data) => {
      addNotification({
        id: uuidv4(),
        type: 'warning',
        message: '❓ Still here? Click to continue studying',
        duration: 300, // 5 minutes
      });
    });
  }, [isConnected, currentSession]);

  const loadDesks = async () => {
    const deskData = await request<{ desks: Desk[] }>
      ('get', '/desks/map', undefined, {
        onError: () => addNotification({
          id: uuidv4(),
          type: 'error',
          message: 'Failed to load desk map',
        }),
      });

    if (deskData) {
      setDesks(deskData.desks);
    }
  };

  const loadCurrentSession = async () => {
    const session = await request<Session>('get', '/sessions/me/current');
    setCurrentSession(session);
  };

  const handleCheckIn = async (deskId: string) => {
    const response = await request<any>('post', '/sessions/checkin', { desk_id: deskId }, {
      onSuccess: (data) => {
        addNotification({
          id: uuidv4(),
          type: 'success',
          message: '✅ Checked in successfully!',
        });
        loadCurrentSession();
      },
      onError: () => {
        addNotification({
          id: uuidv4(),
          type: 'error',
          message: 'Check-in failed',
        });
      },
    });
  };

  const handleCheckOut = async () => {
    if (!currentSession) return;

    await request<any>('post', `/sessions/${currentSession.id}/checkout`, {}, {
      onSuccess: () => {
        addNotification({
          id: uuidv4(),
          type: 'success',
          message: '✅ Checked out successfully!',
        });
        setCurrentSession(null);
        loadDesks();
      },
    });
  };

  const handleAway = async () => {
    if (!currentSession) return;

    await request<any>('post', `/sessions/${currentSession.id}/away`, {}, {
      onSuccess: () => {
        addNotification({
          id: uuidv4(),
          type: 'info',
          message: '☕ You have 20 minutes away',
        });
      },
    });
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
    if (notification.duration) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, notification.duration * 1000);
    }
  };

  return (
    <div className="student-portal">
      <header className="portal-header">
        <h1>📚 DeskGuard - Library Desk Booking</h1>
        <p>Real-time desk availability and fair booking system</p>
      </header>

      <Notifications
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />

      <main className="portal-content">
        <div className="map-section">
          <LibraryMap
            desks={desks}
            onDeskClick={handleCheckIn}
            currentDeskId={currentSession?.desk_id}
          />
        </div>

        <aside className="session-section">
          {currentSession ? (
            <div className="session-panel">
              <h3>🎯 Current Session</h3>
              <p>Desk #{currentSession.desk_id}</p>
              <p>Status: {currentSession.status}</p>

              {currentSession.checked_in_at && (
                <SessionTimer
                  expiresAt={new Date(Date.now() + 7200000)}
                  type="session"
                />
              )}

              <div className="session-actions">
                <button onClick={handleAway} className="btn btn-warning">
                  ☕ Take a Break
                </button>
                <button onClick={handleCheckOut} className="btn btn-danger">
                  👋 Check Out
                </button>
              </div>
            </div>
          ) : (
            <div className="no-session">
              <h3>🔔 No Active Session</h3>
              <p>Click on a green desk to check in</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};
