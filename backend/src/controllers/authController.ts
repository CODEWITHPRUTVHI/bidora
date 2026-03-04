import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { EmailService } from '../services/emailService';

// Environment variables should be read inside handlers or lazily to ensure dotenv has loaded.
const getJWTConfig = () => ({
    secret: process.env.JWT_SECRET || 'fallback_secret',
    accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
});

/**
 * Generates a short-lived access token and a long-lived refresh token.
 */
function generateTokens(userId: string, role: string) {
    const { secret, accessTokenExpiresIn } = getJWTConfig();
    const accessToken = jwt.sign({ userId, role }, secret, { expiresIn: accessTokenExpiresIn } as any);

    const refreshTokenRaw = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return { accessToken, refreshTokenRaw, refreshTokenHash, refreshExpiresAt };
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role, fullName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const userRole = (role === 'SELLER' || role === 'BUYER') ? role : 'BUYER';

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: userRole,
                verifiedStatus: 'BASIC',
                fullName: fullName || null,
                isEmailVerified: false,
                verificationCode,
                verificationExpiresAt
            },
            select: { id: true, email: true, role: true, fullName: true, trustScore: true, walletBalance: true, createdAt: true, isEmailVerified: true }
        });

        const { accessToken, refreshTokenRaw, refreshTokenHash, refreshExpiresAt } = generateTokens(user.id, user.role);

        // Persist refresh token hash (never store raw token in DB)
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshTokenHash,
                ipAddress: req.ip ?? null,
                expiresAt: refreshExpiresAt
            }
        });

        // Refresh token goes in httpOnly cookie; access token in response body
        res.cookie('refreshToken', refreshTokenRaw, {
            httpOnly: true,
            secure: true, // Required for sameSite: 'none'
            sameSite: 'none', // Required for cross-domain (Vercel -> Railway)
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send welcome email (fire-and-forget — non-blocking)
        if (user.email) {
            EmailService.sendWelcome(user.email, user.fullName || '').catch(() => { });
        }

        return res.status(201).json({ accessToken, user });
    } catch (error: any) {
        console.error('[Auth] Registration error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true, email: true, passwordHash: true, role: true, fullName: true,
                trustScore: true, walletBalance: true, isSuspended: true, suspiciousFlags: true
            }
        });

        if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ error: 'Account suspended. Contact support.' });
        }

        // Update last login timestamp
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        const { accessToken, refreshTokenRaw, refreshTokenHash, refreshExpiresAt } = generateTokens(user.id, user.role);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshTokenHash,
                ipAddress: req.ip ?? null,
                expiresAt: refreshExpiresAt
            }
        });

        res.cookie('refreshToken', refreshTokenRaw, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const { passwordHash: _, ...safeUser } = user;
        return res.status(200).json({ accessToken, user: safeUser });
    } catch (error: any) {
        console.error('[Auth] Login error:', error);

        // Handle bcrypt errors (e.g. invalid hash in DB)
        if (error.message && error.message.includes('bcrypt')) {
            console.error('[Auth] Bcrypt Error: Likely an invalid hash format in the database.');
            return res.status(500).json({ error: 'Internal server error', details: 'Authentication provider error' });
        }

        if (error.code && error.code.startsWith('P')) {
            console.error('[Auth] Prisma Error Code:', error.code, 'Meta:', error.meta);
        }

        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Database or authentication error'
        });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/refresh
// ─────────────────────────────────────────────
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const rawToken = req.cookies?.refreshToken;
        if (!rawToken) {
            return res.status(401).json({ error: 'No refresh token provided' });
        }

        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const storedToken = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { select: { id: true, role: true, isSuspended: true } } }
        });

        if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        if (storedToken.user.isSuspended) {
            return res.status(403).json({ error: 'Account suspended' });
        }

        // Rotate: revoke old, issue new refresh token
        await prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revoked: true } });

        const { accessToken, refreshTokenRaw: newRawToken, refreshTokenHash: newHash, refreshExpiresAt } =
            generateTokens(storedToken.user.id, storedToken.user.role);

        await prisma.refreshToken.create({
            data: {
                userId: storedToken.user.id,
                tokenHash: newHash,
                ipAddress: req.ip ?? null,
                expiresAt: refreshExpiresAt
            }
        });

        res.cookie('refreshToken', newRawToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ accessToken });
    } catch (error: any) {
        console.error('[Auth] Token refresh error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────
export const logout = async (req: Request, res: Response) => {
    try {
        const rawToken = req.cookies?.refreshToken;
        if (rawToken) {
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            await prisma.refreshToken.updateMany({
                where: { tokenHash },
                data: { revoked: true }
            });
        }
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('[Auth] Logout error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/auth/me
// ─────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true, email: true, role: true, fullName: true, avatarUrl: true,
                verifiedStatus: true, walletBalance: true, pendingFunds: true,
                trustScore: true, createdAt: true, isEmailVerified: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.status(200).json(user);
    } catch (error) {
        console.error('[Auth] Get-me error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/verify-email
// ─────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.isEmailVerified) return res.status(200).json({ message: 'Email already verified' });

        if (user.verificationCode !== code || (user.verificationExpiresAt && new Date() > user.verificationExpiresAt)) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationCode: null,
                verificationExpiresAt: null
            }
        });

        return res.status(200).json({ message: 'Email verified successfully! You can now participate in auctions.' });
    } catch (error) {
        console.error('[Auth] Verify-email error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/auth/me/verify-seller
// ─────────────────────────────────────────────
// MOVED TO ADMIN-ONLY APPROVAL FLOW. THIS ENDPOINT IS NOW DISABLED TO PREVENT SELF-VERIFICATION.
export const verifyMeAsSeller = async (req: AuthRequest, res: Response) => {
    return res.status(403).json({ error: 'Manual self-verification is disabled. Please contact an admin for seller verification.' });
};
