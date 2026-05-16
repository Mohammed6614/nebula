import { Router } from 'express';
import { subscriptionController, subscriptionValidations } from '../controllers/subscription.controller';
import { validateBody } from '../middleware/validation';
import { authenticate, requireEmailVerified } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.post(
  '/',
  authenticate,
  requireEmailVerified,
  validateBody(subscriptionValidations.createSubscription.shape.body),
  subscriptionController.createSubscription
);

router.get('/my-subscription', authenticate, subscriptionController.getMySubscription);

router.post(
  '/:subscriptionId/cancel',
  authenticate,
  requireEmailVerified,
  subscriptionController.cancelSubscription
);

export default router;
