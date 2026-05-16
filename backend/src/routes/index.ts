import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import subscriptionRoutes from './subscription.routes';
import storeRoutes from './store.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import categoryRoutes from './category.routes';
import adminRoutes from './admin.routes';
import supervisorRoutes from './supervisor.routes';
import { authenticate } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'NEBULA API is running',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
  res.json(response);
});

// API routes
router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/supervisor', supervisorRoutes);

// Protected test route
router.get('/protected', authenticate, (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Protected route accessed',
    data: {
      user: req.user,
    },
  };
  res.json(response);
});

export default router;
