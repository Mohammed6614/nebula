import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('❌ Redis error:', error);
});

redis.on('reconnecting', () => {
  logger.warn('🔄 Redis reconnecting...');
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    logger.info('Redis connection verified');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}

// Cache helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function clearPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
