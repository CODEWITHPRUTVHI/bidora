import './utils/loadEnv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

// Routes
import authRoutes from './routes/authRoutes';
import auctionRoutes from './routes/auctionRoutes';
import walletRoutes from './routes/walletRoutes';
import shippingRoutes from './routes/shippingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import ratingRoutes from './routes/ratingRoutes';
import disputeRoutes from './routes/disputeRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import watchlistRoutes from './routes/watchlistRoutes';
import paymentRoutes from './routes/paymentRoutes';
import verificationRoutes from './routes/verificationRoutes';

// Services & Utils
import { initWebSocket } from './services/websocketService';
import { initCronJobs } from './utils/cron';
import { apiLimiter } from './middlewares/rateLimiter';

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Respect X-Forwarded-For (Railway/Vercel)

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow all origins for local mobile testing convenience
        callback(null, true);
    },
    credentials: true    // Required for httpOnly cookie (refresh token)
}));

// General JSON body parsing (webhook parsing is handled in the route if needed)

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());  // Parse refresh token from httpOnly cookie

// ─────────────────────────────────────────────
// HTTP Server
// ─────────────────────────────────────────────
const httpServer = createServer(app);

// ─────────────────────────────────────────────
// Global Rate Limiting
// ─────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auctions', auctionRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/verification', verificationRoutes);

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        message: 'Bidora Backend is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// ─────────────────────────────────────────────
// 404 Fallback
// ─────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error(' [31m[Global Error Handler] [39m', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});

// ─────────────────────────────────────────────
// Boot Sequence
// ─────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`\n🚀 Bidora Server   → http://localhost:${PORT}`);

    initWebSocket(httpServer);
    console.log('📡 WebSocket Engine → initialized');

    initCronJobs();
    console.log('⏰ Cron Jobs       → 4 jobs active');

    console.log('\n📋 Active routes:');
    console.log(`   POST   /api/v1/auth/register`);
    console.log(`   POST   /api/v1/auth/login`);
    console.log(`   POST   /api/v1/auth/logout`);
    console.log(`   POST   /api/v1/auth/refresh`);
    console.log(`   GET    /api/v1/auth/me`);
    console.log(`   GET    /api/v1/auctions`);
    console.log(`   POST   /api/v1/auctions`);
    console.log(`   GET    /api/v1/auctions/:id`);
    console.log(`   GET    /api/v1/wallet`);
    console.log(`   POST   /api/v1/wallet/deposit`);
    console.log(`   POST   /api/v1/wallet/pay/:auctionId`);
    console.log(`   POST   /api/v1/shipping/:auctionId/ship`);
    console.log(`   POST   /api/v1/shipping/:auctionId/confirm`);
    console.log(`   GET    /api/v1/notifications`);
    console.log(`\n✅ Ready.\n`);
});
