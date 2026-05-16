import { Router } from 'express';
import { authController, authValidations } from '../controllers/auth.controller';
import { validateBody, validateQuery } from '../middleware/validation';
import { authRateLimiter, sensitiveOperationLimiter } from '../middleware/rateLimiter';
import { authenticate, requireEmailVerified } from '../middleware/auth';

const router = Router();

// Public routes with rate limiting
router.post(
  '/register',
  authRateLimiter,
  validateBody(authValidations.register.shape.body),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(authValidations.login.shape.body),
  authController.login
);

router.post(
  '/refresh',
  validateBody(authValidations.refreshToken.shape.body),
  authController.refreshToken
);

router.post(
  '/logout',
  validateBody(authValidations.refreshToken.shape.body),
  authController.logout
);

router.get(
  '/verify-email',
  validateQuery(authValidations.verifyEmail.shape.query),
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  authRateLimiter,
  validateBody(authValidations.resendVerification.shape.body),
  authController.resendVerification
);

router.post(
  '/forgot-password',
  sensitiveOperationLimiter,
  validateBody(authValidations.forgotPassword.shape.body),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  sensitiveOperationLimiter,
  validateBody(authValidations.resetPassword.shape.body),
  authController.resetPassword
);

// Protected routes
router.get('/me', authenticate, authController.me);

router.post(
  '/change-password',
  authenticate,
  requireEmailVerified,
  validateBody(authValidations.changePassword.shape.body),
  authController.changePassword
);

export default router;
