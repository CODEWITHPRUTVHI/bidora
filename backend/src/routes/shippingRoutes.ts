import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { addAddress, getAddresses, markAsShipped, confirmDelivery, getShippingDetail, autoGenerateLabel, markAsDelivered } from '../controllers/shippingController';

const router = Router();

router.use(authenticateJWT);

router.get('/address', getAddresses);
router.post('/address', addAddress);
router.get('/:auctionId', getShippingDetail);
router.post('/:auctionId/auto-label', autoGenerateLabel);
router.post('/:auctionId/ship', markAsShipped);
router.post('/:auctionId/delivered', markAsDelivered);
router.post('/:auctionId/confirm', confirmDelivery);

export default router;
