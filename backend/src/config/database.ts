import { Pool, QueryResult } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`, { text: text.substring(0, 50) });
    return result;
  } catch (error) {
    logger.error('Database query failed', { text, error });
    throw error;
  }
};

export const connect = async (): Promise<void> => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
};

export const disconnect = async (): Promise<void> => {
  await pool.end();
  logger.info('Database connection closed');
};
