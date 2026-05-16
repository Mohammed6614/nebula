import { Router } from 'express';
import { storeController, storeValidations } from '../controllers/store.controller';
import { validateBody, validateQuery } from '../middleware/validation';
import { authenticate, requireRole, requireOnboarding } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';

const router = Router();

// Public routes
router.get('/public/:slug', storeController.getStoreBySlug);
router.get('/public/:storeId/categories', storeController.getStoreCategories);

// Protected routes
router.post(
  '/',
  authenticate,
  requireRole('MERCHANT'),
  validateBody(storeValidations.createStore.shape.body),
  storeController.createStore
);

router.get('/my-store', authenticate, requireRole('MERCHANT'), storeController.getMyStore);

router.patch(
  '/:storeId',
  authenticate,
  requireOnboarding,
  validateBody(storeValidations.updateStore.shape.body),
  storeController.updateStore
);

router.get(
  '/:storeId/stats',
  authenticate,
  requireOnboarding,
  tenantIsolation,
  storeController.getStoreStats
);

// Admin only routes
router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPERVISOR'),
  validateQuery(storeValidations.listStores.shape.query),
  storeController.listStores
);

export default router;
