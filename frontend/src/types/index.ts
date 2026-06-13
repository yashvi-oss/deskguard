// Desk Types
export type DeskStatus = 'free' | 'occupied' | 'away' | 'abandoned';
export type DeskColor = 'green' | 'red' | 'yellow' | 'gray';

export interface Desk {
  id: string;
  number: number;
  status: DeskStatus;
  color: DeskColor;
  current_user?: string;
  expires_at?: Date;
}

// Session Types
export type SessionStatus = 'active' | 'away' | 'abandoned' | 'checked_out';

export interface Session {
  id: string;
  desk_id: string;
  status: SessionStatus;
  checked_in_at: Date;
  checked_out_at?: Date;
  is_responding: boolean;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'librarian' | 'admin';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
