// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

// Timer Configuration (in seconds)
export const SESSION_TIMEOUT = 7200; // 2 hours
export const AWAY_TIMEOUT = 1200; // 20 minutes
export const PROMPT_RESPONSE_TIME = 300; // 5 minutes

// UI Configuration
export const GRID_COLUMNS = 10; // Desks per row in map
export const DESK_SIZE = 50; // Size of each desk square (px)
