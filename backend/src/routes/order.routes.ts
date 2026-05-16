import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate, requireRole, requireOnboarding } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/', authenticate, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getMyOrders);

// Merchant routes
router.get('/store/:storeId', authenticate, requireRole('MERCHANT'), requireOnboarding, orderController.getStoreOrders);

// Shared routes
router.get('/:orderId', authenticate, orderController.getOrder);
router.patch('/:orderId/status', authenticate, requireRole('MERCHANT'), requireOnboarding, orderController.updateOrderStatus);
router.get('/:orderId/verify', authenticate, orderController.verifyOrder);
router.post('/:orderId/cancel', authenticate, orderController.cancelOrder);

export default router;
