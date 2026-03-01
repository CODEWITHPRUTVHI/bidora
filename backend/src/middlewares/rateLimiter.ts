import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';

// Create a redis client for rate limiting
const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379/0' });
redisClient.connect().catch(console.error);

// General API rate limiter with Redis store for multi-server scaling
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Increased for dev
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Authentication rate limiter (stricter to prevent brute force)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Increased for dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again after an hour' }
});

// Bidding rate limiter (to prevent spamming bids via REST fallback)
export const bidLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 bids per minute maximum
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many bids placed in a short time, please slow down' }
});
