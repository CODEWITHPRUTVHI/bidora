import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { AuctionService } from './auctionService';
import prisma from '../utils/prisma';
import { NotificationService } from './notificationService';

const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
};


// ── QUEUES ──────────────────────────────────────
export const auctionQueue = new Queue('auction-engine', { connection: redisConnection });

// ── JOB HANDLER ─────────────────────────────────
export const initQueueWorker = async () => {
    try {
        const worker = new Worker('auction-engine', async (job: Job) => {
            const { auctionId, type } = job.data;

            console.log(`[Queue] Processing ${type} for auction: ${auctionId}`);

            if (type === 'AUCTION_START') {
                await prisma.auction.update({
                    where: { id: auctionId },
                    data: { status: 'LIVE' }
                });
                console.log(`[Queue] Auction ${auctionId} is now LIVE`);
            }

            if (type === 'AUCTION_END') {
                // Re-fetch auction to ensure it hasn't been extended (Anti-sniping check)
                const auction = await prisma.auction.findUnique({
                    where: { id: auctionId },
                    select: { endTime: true, status: true }
                });

                if (!auction || auction.status !== 'LIVE') return;

                // If the current time is still before endTime, it means it was extended.
                if (new Date() < new Date(auction.endTime)) {
                    console.log(`[Queue] Auction ${auctionId} was extended. Skipping finalization.`);
                    return;
                }

                const result = await AuctionService.finalizeAuction(auctionId);
                if (result?.winner) {
                    await NotificationService.notifyAuctionWon(
                        result.winner.bidderId,
                        auctionId,
                        '',
                        Number(result.winner.amount)
                    ).catch(console.error);
                }
            }
        }, {
            connection: redisConnection
        });

        worker.on('failed', (job: Job | undefined, err: Error) => {
            console.error(`[Queue] Job ${job?.id} failed:`, err);
        });

        worker.on('error', (err: Error) => {
            // Only log once or at intervals if needed, but BullMQ's core handles retries
            // We just want to avoid the massive stack trace spam in the console
        });

        console.log('👷 Queue Worker started (BullMQ)');
    } catch (error: any) {
        console.warn('⚠️ [Queue] Could not initialize BullMQ worker. Redis might be down. Auction scheduling will rely on Cron fallback.', error.message);
    }
};

/**
 * Schedule an auction to go live and to end.
 */
export const scheduleAuctionEvents = async (auctionId: string, startTime: Date, endTime: Date) => {
    try {
        const startDelay = Math.max(0, startTime.getTime() - Date.now());
        const endDelay = Math.max(0, endTime.getTime() - Date.now());

        // Schedule Start
        await auctionQueue.add(`start-${auctionId}`, { auctionId, type: 'AUCTION_START' }, {
            delay: startDelay,
            jobId: `start-${auctionId}`,
            removeOnComplete: true
        });

        // Schedule End
        await auctionQueue.add(`end-${auctionId}`, { auctionId, type: 'AUCTION_END' }, {
            delay: endDelay,
            jobId: `end-${auctionId}`,
            removeOnComplete: true
        });

        console.log(`[Queue] Scheduled events for ${auctionId} (Start in ${startDelay}ms, End in ${endDelay}ms)`);
    } catch (err) {
        console.warn(`[Queue Warning] Could not schedule events for ${auctionId}. Is Redis running?`, err);
    }
};

/**
 * Reschedule an auction end event (e.g. after anti-sniping extension).
 */
export const rescheduleAuctionEnd = async (auctionId: string, newEndTime: Date) => {
    try {
        const delay = Math.max(0, newEndTime.getTime() - Date.now());

        // BullMQ will overwrite the job with the same jobId
        await auctionQueue.add(`end-${auctionId}`, { auctionId, type: 'AUCTION_END' }, {
            delay,
            jobId: `end-${auctionId}`,
            removeOnComplete: true
        });

        console.log(`[Queue] Rescheduled end for ${auctionId} in ${delay}ms`);
    } catch (err) {
        console.warn(`[Queue Warning] Could not reschedule end for ${auctionId}. Is Redis running?`, err);
    }
};
