// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

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
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

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
    if (!req.user?.isEmailVerified) {
        return res.status(403).json({ error: 'Please verify your email to access this feature.' });
    }
    next();
};
