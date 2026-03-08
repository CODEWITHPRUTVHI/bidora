import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import prisma from '../utils/prisma';
import { AuctionService } from './auctionService';
import { NotificationService, setNotificationIO } from './notificationService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export let io: SocketIOServer;

export const initWebSocket = async (server: HTTPServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: (_origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
                callback(null, true); // Allow all for mobile testing
            },
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 20000,
        pingInterval: 10000
    });

    // ── Redis Adapter for Multi-Server Scaling ──────
    if (process.env.REDIS_URL) {
        try {
            const pubClient = createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();

            pubClient.on('error', (err) => console.error('WS Redis Pub Client Error', err));
            subClient.on('error', (err) => console.error('WS Redis Sub Client Error', err));

            await Promise.all([pubClient.connect(), subClient.connect()]);

            io.adapter(createAdapter(pubClient, subClient));
            console.log('📡 Redis Adapter → initialized (Scalable WS mode)');
        } catch (err) {
            console.error('❌ Redis Adapter Connection Failed. Falling back to memory adapter.', err);
        }
    }

    // ─────────────────────────────────────────────
    // Share io instance with NotificationService
    // ─────────────────────────────────────────────
    setNotificationIO(io);

    // ─────────────────────────────────────────────
    // Auth Middleware: Verify JWT on handshake
    // ─────────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: no token'));

        jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
            if (err) return next(new Error('Authentication error: invalid token'));

            // Re-fetch user to get latest isEmailVerified status from DB
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, role: true, isEmailVerified: true }
            });

            if (!user) return next(new Error('Authentication error: user not found'));

            socket.data.user = {
                userId: user.id,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            };
            next();
        });
    });

    // ─────────────────────────────────────────────
    // Connection Handler
    // ─────────────────────────────────────────────
    io.on('connection', (socket: Socket) => {
        const { userId, role } = socket.data.user;
        console.log(`[WS] Connected: ${socket.id} | user: ${userId}`);

        // Auto-join personal notification room
        socket.join(`user:${userId}`);

        // ── JOIN AUCTION ROOM ─────────────────────
        socket.on('join_auction', async (auctionId: string) => {
            if (!auctionId) return;
            socket.join(auctionId);
            console.log(`[WS] ${userId} joined auction room: ${auctionId}`);

            // Broadcast room count to everyone in the room
            const roomSize = (await io.in(auctionId).fetchSockets()).length;
            io.to(auctionId).emit('room_stats', { viewers: roomSize });
        });

        // ── LEAVE AUCTION ROOM ────────────────────
        socket.on('leave_auction', async (auctionId: string) => {
            console.log(`[WS] ${userId} leaving room: ${auctionId}`);
            socket.leave(auctionId);

            const roomSize = (await io.in(auctionId).fetchSockets()).length;
            io.to(auctionId).emit('room_stats', { viewers: roomSize });
        });


        // ── PLACE BID ─────────────────────────────
        socket.on('place_bid', async (data: { auctionId: string; amount: number }) => {
            // Email verification check bypassed for now
            // if (!user.isEmailVerified) {
            //     return socket.emit('bid_error', { message: 'Please verify your email to place bids.' });
            // }
            console.log(`[WS] ${userId} attempting bid: ${data.amount} on ${data.auctionId}`);
            const now = Date.now();
            if (socket.data.lastBidTime && now - socket.data.lastBidTime < 1000) {
                return socket.emit('bid_error', { message: 'You are bidding too fast! Please wait a moment.' });
            }
            socket.data.lastBidTime = now;

            try {
                const { auctionId, amount } = data;
                const bidderId = userId;

                // Get previous highest bidder BEFORE placing new bid
                // so we can notify them of being outbid
                const { previousHighestBidderId, previousHighestBid, result } =
                    await AuctionService.placeBidWithOutbidInfo(auctionId, bidderId, amount);

                // Broadcast new bid state to everyone in the room
                io.to(auctionId).emit('new_bid', {
                    auctionId,
                    highestBid: Number(amount),
                    bidderId,
                    timestamp: result.bid.createdAt
                });

                // Broadcast time extension if anti-snipe triggered
                if (result.extended) {
                    io.to(auctionId).emit('time_extended', {
                        auctionId,
                        newEndTime: result.updatedAuction.endTime
                    });
                }

                // Confirm bid to the placing bidder
                socket.emit('bid_confirmed', {
                    auctionId,
                    yourBid: Number(amount),
                    timestamp: result.bid.createdAt
                });

                // Async: Persist notifications (non-blocking)
                NotificationService.notifyBidPlaced(bidderId, auctionId, '', amount).catch(() => { });

                if (previousHighestBidderId && previousHighestBidderId !== bidderId) {
                    // Real-time outbid notification via WS room
                    io.to(`user:${previousHighestBidderId}`).emit('outbid', {
                        auctionId,
                        newHighestBid: Number(amount)
                    });
                    // Persist outbid notification
                    NotificationService.notifyOutbid(
                        previousHighestBidderId, auctionId, '', Number(amount)
                    ).catch(() => { });
                }

            } catch (error: any) {
                socket.emit('bid_error', { message: error.message });
            }
        });

        // ── SEND REACTION ─────────────────────────
        socket.on('send_reaction', (data: { auctionId: string; reaction: string }) => {
            const { auctionId, reaction } = data;
            if (!auctionId || !reaction) return;

            // Broadcast reaction to everyone in the room except sender
            socket.to(auctionId).emit('new_reaction', {
                auctionId,
                reaction,
                userId: socket.data.user.userId
            });

            console.log(`[WS] Reaction ${reaction} sent by ${userId} in ${auctionId}`);
        });

        // ── DISCONNECT ────────────────────────────
        socket.on('disconnect', () => {
            console.log(`[WS] Disconnected: ${socket.id} | user: ${userId}`);
        });
    });
};
