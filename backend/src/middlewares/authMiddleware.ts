// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

// Environment variables should be read inside handlers or lazily to ensure dotenv has loaded.
const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    if (secret === 'fallback_secret') console.warn(' [33m[Auth Middleware] [39m Using fallback_secret. Check your .env file.');
    return secret;
};

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        isEmailVerified: boolean;
    };
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, getJWTSecret()) as { userId: string; role: string };

            // Basic fraud safeguard: check if user is blocked or has too many suspicious flags
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, role: true, suspiciousFlags: true, isEmailVerified: true }
            });

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (user.suspiciousFlags >= 5) {
                return res.status(403).json({ error: 'Account suspended due to suspicious activity' });
            }

            req.user = { id: user.id, role: user.role, isEmailVerified: user.isEmailVerified };
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } else {
        res.status(401).json({ error: 'Authorization header missing' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
export const requireEmailVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
    // if (!req.user?.isEmailVerified) {
    //     return res.status(403).json({ error: 'Please verify your email to access this feature.' });
    // }
    next();
};

/**
 * Optional auth: if a Bearer token is present, verify it and attach user.
 * If no token (or invalid), just continue as a guest — does NOT block the request.
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, getJWTSecret()) as { userId: string; role: string };
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, role: true, suspiciousFlags: true, isEmailVerified: true }
            });
            if (user && user.suspiciousFlags < 5) {
                req.user = { id: user.id, role: user.role, isEmailVerified: user.isEmailVerified };
            }
        } catch (_) {
            // Invalid token — treat as guest, don't block
        }
    }
    next();
};
