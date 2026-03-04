import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import * as admin from 'firebase-admin';

// Environment variables should be read inside handlers or lazily to ensure dotenv has loaded.
const getJWTConfig = () => ({
    secret: process.env.JWT_SECRET || 'fallback_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

const getGoogleConfig = () => {
    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) console.warn('[OAuth] GOOGLE_CLIENT_ID is not defined in environment variables');
    return id;
};

// ── Init Firebase Admin (lazy singleton) ──
function getFirebaseAdmin() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID
        });
    }
    return admin.auth();
}

// ── Shared: Generate tokens (mirrors authController exactly) ──
function generateTokens(userId: string, role: string) {
    const { secret, expiresIn } = getJWTConfig();
    const accessToken = jwt.sign({ userId, role }, secret, { expiresIn: expiresIn } as any);
    const refreshTokenRaw = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return { accessToken, refreshTokenRaw, refreshTokenHash, refreshExpiresAt };
}

async function issueSession(res: Response, userId: string, role: string, ipAddress: string | undefined) {
    const { accessToken, refreshTokenRaw, refreshTokenHash, refreshExpiresAt } = generateTokens(userId, role);
    await prisma.refreshToken.create({
        data: { userId, tokenHash: refreshTokenHash, ipAddress: ipAddress ?? null, expiresAt: refreshExpiresAt }
    });
    res.cookie('refreshToken', refreshTokenRaw, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return accessToken;
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/google
// ─────────────────────────────────────────────
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { googleToken } = req.body;
        if (!googleToken) return res.status(400).json({ error: 'Google token is required.' });

        const GOOGLE_CLIENT_ID = getGoogleConfig();
        if (!GOOGLE_CLIENT_ID) {
            console.error('[OAuth] Google Login failed: Missing GOOGLE_CLIENT_ID');
            return res.status(500).json({ error: 'OAuth configuration error. Please check server logs.' });
        }

        const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
        let email: string, name: string, picture: string, googleId: string;
        try {
            const ticket = await oauthClient.verifyIdToken({ idToken: googleToken, audience: GOOGLE_CLIENT_ID });
            const p = ticket.getPayload()!;
            email = p.email!;
            name = p.name || '';
            picture = p.picture || '';
            googleId = p.sub;
        } catch (err: any) {
            console.error('[OAuth] Google Token Verification failed:', err.message);
            return res.status(401).json({ error: 'Invalid Google token. Please try again.' });
        }

        if (!email) return res.status(400).json({ error: 'Google account has no email address.' });

        // Find by googleId OR email
        let user = await prisma.user.findFirst({
            where: { OR: [{ googleId }, { email }] }
        });

        if (user) {
            if (user.isSuspended) return res.status(403).json({ error: 'Account suspended. Contact support.' });
            // Link Google if same email account signing in via Google for first time
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId, avatarUrl: picture || user.avatarUrl, isEmailVerified: true }
                });
            }
        } else {
            user = await prisma.user.create({
                data: {
                    email,
                    fullName: name || null,
                    googleId,
                    avatarUrl: picture || null,
                    role: 'BUYER',
                    verifiedStatus: 'BASIC',
                    isEmailVerified: true,
                }
            });
        }

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const accessToken = await issueSession(res, user.id, user.role, req.ip);

        return res.status(200).json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                verifiedStatus: user.verifiedStatus,
                avatarUrl: user.avatarUrl,
                walletBalance: user.walletBalance,
                pendingFunds: user.pendingFunds,
                trustScore: user.trustScore,
                isEmailVerified: user.isEmailVerified,
            }
        });
    } catch (error: any) {
        console.error('[OAuth] Google login CRITICAL error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/phone
// ─────────────────────────────────────────────
export const phoneLogin = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: 'Firebase ID token is required.' });

        let phone: string;
        try {
            const firebaseAuth = getFirebaseAdmin();
            const decoded = await firebaseAuth.verifyIdToken(idToken);
            phone = decoded.phone_number || '';
        } catch (err: any) {
            console.error('[OAuth] Firebase Phone verification failed:', err.message);
            return res.status(401).json({ error: 'Invalid or expired phone verification. Please try again.' });
        }

        if (!phone) return res.status(400).json({ error: 'Could not extract phone number from token.' });

        let user = await prisma.user.findUnique({ where: { phone } });

        if (user) {
            if (user.isSuspended) return res.status(403).json({ error: 'Account suspended. Contact support.' });
        } else {
            user = await prisma.user.create({
                data: {
                    phone,
                    role: 'BUYER',
                    verifiedStatus: 'BASIC',
                    isEmailVerified: false,
                }
            });
        }

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const accessToken = await issueSession(res, user.id, user.role, req.ip);

        return res.status(200).json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                verifiedStatus: user.verifiedStatus,
                avatarUrl: user.avatarUrl,
                walletBalance: user.walletBalance,
                pendingFunds: user.pendingFunds,
                trustScore: user.trustScore,
                isEmailVerified: user.isEmailVerified,
            }
        });
    } catch (error: any) {
        console.error('[OAuth] Phone login CRITICAL error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
