import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { redis } from '../config/redis';
import logger from '../utils/logger';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later',
    });
  },
});

// Rate limiter for sensitive operations
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive operation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests for this operation',
    });
  },
});

// Custom Redis-based rate limiter for more control
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  // Remove old entries
  await redis.zremrangebyscore(`ratelimit:${key}`, 0, windowStart);

  // Count current requests
  const currentRequests = await redis.zcard(`ratelimit:${key}`);

  if (currentRequests >= maxRequests) {
    // Get the oldest request time
    const oldestRequest = await redis.zrange(`ratelimit:${key}`, 0, 0, 'WITHSCORES');
    const resetTime = parseInt(oldestRequest[1] || '0') + windowSeconds;

    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }

  // Add current request
  await redis.zadd(`ratelimit:${key}`, now, `${now}-${Math.random()}`);
  await redis.expire(`ratelimit:${key}`, windowSeconds);

  return {
    allowed: true,
    remaining: maxRequests - currentRequests - 1,
    resetTime: now + windowSeconds,
  };
}
