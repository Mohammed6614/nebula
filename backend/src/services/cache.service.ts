import Redis from 'ioredis';
import { env } from '../config/env';
import logger from '../utils/logger';

class CacheService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis cache connected');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis cache error:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis cache connection closed');
    });
  }

  private getConnection() {
    if (!this.isConnected) {
      logger.warn('Redis not connected, cache operations will be skipped');
      return null;
    }
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getConnection();
    if (!client) return null;

    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const client = this.getConnection();
    if (!client) return;

    try {
      const serialized = JSON.stringify(value);
      await client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const client = this.getConnection();
    if (!client) return;

    try {
      await client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    const client = this.getConnection();
    if (!client) return;

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
  }

  async invalidateStoreCache(storeId: string): Promise<void> {
    await this.deletePattern(`store:${storeId}:*`);
  }

  async invalidateDashboardCache(): Promise<void> {
    await this.deletePattern('dashboard:*');
  }

  async invalidateAdminCache(): Promise<void> {
    await this.deletePattern('admin:*');
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async flushAll(): Promise<void> {
    const client = this.getConnection();
    if (!client) return;

    try {
      await client.flushall();
      logger.info('Redis cache flushed');
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
    logger.info('Redis cache disconnected');
  }
}

export default new CacheService();
