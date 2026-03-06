import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
    url: redisUrl
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const initRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('🚀 Redis Core Cache → Connected');
        }
    } catch (error: any) {
        console.error('❌ Redis Connection Failed. Core cache will be bypassed:', error.message);
    }
};
