import { query } from '../config/database';
import { logger } from '../utils/logger';

export const initializeDatabase = async () => {
  try {
    logger.info('Initializing database...');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create desks table
    await query(`
      CREATE TABLE IF NOT EXISTS desks (
        id UUID PRIMARY KEY,
        desk_number INT NOT NULL,
        floor INT,
        section VARCHAR(20),
        status VARCHAR(20) DEFAULT 'free',
        current_session_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        desk_id UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        checked_in_at TIMESTAMP DEFAULT NOW(),
        checked_out_at TIMESTAMP,
        away_started_at TIMESTAMP,
        is_responding BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (desk_id) REFERENCES desks(id)
      )
    `);

    // Create events table (for audit log)
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY,
        desk_id UUID NOT NULL,
        session_id UUID NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (desk_id) REFERENCES desks(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // Create indices for faster queries
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_desk_id ON sessions(desk_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_desks_status ON desks(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_desk_id ON events(desk_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id)');

    logger.info('✅ Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
};
