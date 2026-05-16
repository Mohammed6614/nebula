import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionPlan } from '../types';
import { ApiResponse } from '../types';

const createSubscriptionSchema = z.object({
  body: z.object({
    plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE', 'AFFILIATE']),
  }),
});

const cancelSubscriptionSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const subscriptionController = {
  // Get subscription plans
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = subscriptionService.getSubscriptionPlans();

      const response: ApiResponse = {
        success: true,
        message: 'Subscription plans retrieved',
        data: { plans },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Create subscription
  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const validated = createSubscriptionSchema.parse({ body: req.body });
      const result = await subscriptionService.createSubscription(
        req.user.id,
        validated.body.plan as SubscriptionPlan
      );

      const response: ApiResponse = {
        success: true,
        message: 'Subscription created successfully',
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get current user subscription
  async getMySubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const subscription = await subscriptionService.getUserSubscription(req.user.id);

      const response: ApiResponse = {
        success: true,
        message: subscription ? 'Subscription retrieved' : 'No active subscription',
        data: { subscription },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Cancel subscription
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { subscriptionId } = req.params;
      const validated = cancelSubscriptionSchema.parse({ body: req.body });

      await subscriptionService.cancelSubscription(
        req.user.id,
        subscriptionId,
        validated.body.reason
      );

      const response: ApiResponse = {
        success: true,
        message: 'Subscription cancelled successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },
};

export const subscriptionValidations = {
  createSubscription: createSubscriptionSchema,
  cancelSubscription: cancelSubscriptionSchema,
};
