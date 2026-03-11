import rateLimit from 'express-rate-limit';

// General API rate limiter
// General API rate limiter
// Uses memory store directly to avoid Redis connection crashes
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
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
