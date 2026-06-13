import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

let client: any;

export const initRedis = async () => {
  client = createClient({
    socket: {
      host: env.redis.host,
      port: env.redis.port,
    },
    password: env.redis.password || undefined,
  });

  client.on('error', (err: any) => logger.error('Redis error', err));
  client.on('connect', () => logger.info('Redis connected'));

  await client.connect();
};

export const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

export const set = async (key: string, value: string, expireSeconds?: number): Promise<void> => {
  const client = getRedisClient();
  if (expireSeconds) {
    await client.setEx(key, expireSeconds, value);
  } else {
    await client.set(key, value);
  }
};

export const get = async (key: string): Promise<string | null> => {
  const client = getRedisClient();
  return await client.get(key);
};

export const del = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};

export const keys = async (pattern: string): Promise<string[]> => {
  const client = getRedisClient();
  return await client.keys(pattern);
};

export const disconnect = async (): Promise<void> => {
  if (client) {
    await client.quit();
    logger.info('Redis connection closed');
  }
};
