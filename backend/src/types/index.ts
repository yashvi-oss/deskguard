// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'librarian' | 'admin';
  created_at: Date;
}

// Desk Types
export type DeskStatus = 'free' | 'occupied' | 'away' | 'abandoned';
export type DeskColor = 'green' | 'red' | 'yellow' | 'gray';

export interface Desk {
  id: string;
  desk_number: number;
  floor: number;
  section: string;
  status: DeskStatus;
  current_session_id: string | null;
  current_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DeskMap {
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
  user_id: string;
  desk_id: string;
  status: SessionStatus;
  checked_in_at: Date;
  checked_out_at: Date | null;
  away_started_at: Date | null;
  is_responding: boolean;
  created_at: Date;
  updated_at: Date;
}

// Timer Types
export type TimerType = 'session' | 'away' | 'prompt';

export interface Timer {
  type: TimerType;
  expires_at: Date;
  created_at: Date;
}

// Event Types (for logging)
export interface DeskEvent {
  id: string;
  desk_id: string;
  session_id: string;
  event_type: 'checked_in' | 'away' | 'back' | 'checked_out' | 'abandoned' | 'prompted' | 'prompt_responded';
  created_at: Date;
}

// API Request/Response Types
export interface CheckInRequest {
  desk_id: string;
}

export interface CheckInResponse {
  session_id: string;
  desk_status: DeskStatus;
  expires_at: Date;
  message: string;
}

export interface AwayRequest {}

export interface AwayResponse {
  status: SessionStatus;
  expires_at: Date;
  message: string;
}

export interface CheckOutResponse {
  status: 'success';
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  timestamp: Date;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: Date;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
