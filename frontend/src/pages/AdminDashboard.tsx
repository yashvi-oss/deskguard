import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { Desk, Notification } from '../types';
import { Notifications } from '../components/Notifications';
import { v4 as uuidv4 } from 'uuid';
import '../styles/admin-dashboard.css';

interface DashboardStats {
  total_desks: number;
  free_desks: number;
  occupied_desks: number;
  away_desks: number;
  abandoned_desks: number;
  active_sessions: number;
  occupancy_rate: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { request } = useApi();
  const { emit, on, isConnected } = useWebSocket();

  useEffect(() => {
    loadStats();
    loadDesks();
  }, []);

  useEffect(() => {
    if (isConnected) {
      emit('watch-all-desks');
    }

    on('desk:updated', (data) => {
      setDesks((prev) =>
        prev.map((d) => (d.id === data.desk_id ? { ...d, ...data } : d))
      );
    });
  }, [isConnected]);

  const loadStats = async () => {
    const statsData = await request<DashboardStats>('get', '/admin/dashboard/stats');
    setStats(statsData);
  };

  const loadDesks = async () => {
    const deskData = await request<{ desks: Desk[] }>('get', '/desks/map');
    if (deskData) {
      setDesks(deskData.desks);
    }
  };

  const handleResetDesk = async (deskId: string) => {
    await request<any>('post', `/admin/desks/${deskId}/reset`, {}, {
      onSuccess: () => {
        addNotification({
          id: uuidv4(),
          type: 'success',
          message: '✅ Desk reset successfully',
        });
        loadStats();
        loadDesks();
      },
    });
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>📊 Librarian Dashboard</h1>
      </header>

      <Notifications
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>📚 Total Desks</h3>
            <p className="stat-value">{stats.total_desks}</p>
          </div>
          <div className="stat-card success">
            <h3>🟢 Free</h3>
            <p className="stat-value">{stats.free_desks}</p>
          </div>
          <div className="stat-card danger">
            <h3>🔴 Occupied</h3>
            <p className="stat-value">{stats.occupied_desks}</p>
          </div>
          <div className="stat-card warning">
            <h3>🟡 Away</h3>
            <p className="stat-value">{stats.away_desks}</p>
          </div>
          <div className="stat-card gray">
            <h3>⚫ Abandoned</h3>
            <p className="stat-value">{stats.abandoned_desks}</p>
          </div>
          <div className="stat-card">
            <h3>📈 Occupancy</h3>
            <p className="stat-value">{stats.occupancy_rate}%</p>
          </div>
        </div>
      )}

      <div className="desks-section">
        <h2>All Desks Status</h2>
        <div className="desks-grid">
          {desks.map((desk) => (
            <div key={desk.id} className={`desk-card status-${desk.status}`}>
              <h4>Desk {desk.number}</h4>
              <p className="status">{desk.status.toUpperCase()}</p>
              {desk.status === 'abandoned' && (
                <button
                  onClick={() => handleResetDesk(desk.id)}
                  className="btn btn-small"
                >
                  🔄 Reset
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
