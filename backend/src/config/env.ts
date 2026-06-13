export const env = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  cors_origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwt_secret: process.env.JWT_SECRET || 'your-super-secret-key',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'deskguard',
    user: process.env.DB_USER || 'deskguard_user',
    password: process.env.DB_PASSWORD || 'deskguard_password',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
  },
  timers: {
    session_timeout: parseInt(process.env.SESSION_TIMEOUT || '7200'), // 2 hours
    away_timeout: parseInt(process.env.AWAY_TIMEOUT || '1200'), // 20 minutes
    prompt_interval: parseInt(process.env.PROMPT_INTERVAL || '7200'), // 2 hours
  },
};
