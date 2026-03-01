import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Response } from 'express';
import prisma from '../utils/prisma';
import { qs, qn } from '../utils/queryHelpers';

const router = Router();
router.use(authenticateJWT);

// GET /api/v1/notifications
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const page = qn(req.query.page, 1);
        const limit = qn(req.query.limit, 30);
        const unreadOnly = qs(req.query.unreadOnly);
        const skip = (page - 1) * limit;

        const where: any = { userId: req.user!.id };
        if (unreadOnly === 'true') where.isRead = false;

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.count({ where: { userId: req.user!.id, isRead: false } })
        ]);

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { id: req.params.id, userId: req.user!.id },
            data: { isRead: true }
        });
        return res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.id, isRead: false },
            data: { isRead: true }
        });
        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
