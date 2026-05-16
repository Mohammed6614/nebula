import { prisma } from '../config/database';
import { env } from '../config/env';
import { paypalService } from './paypal.service';
import { BadRequestError, NotFoundError, ForbiddenError, InternalError } from '../utils/errors';
import { SubscriptionPlan, SubscriptionStatus, SubscriptionPlanDetails } from '../types';
import logger from '../utils/logger';

export class SubscriptionService {
  // Get subscription plans with pricing
  getSubscriptionPlans(): SubscriptionPlanDetails[] {
    const discountPercentage = env.FIRST_MONTH_DISCOUNT_PERCENTAGE;

    return [
      {
        id: SubscriptionPlan.BASIC,
        name: 'Basic',
        description: 'Perfect for small businesses just getting started',
        price: this.calculateDiscountedPrice(env.MERCHANT_PLAN_BASIC_PRICE, discountPercentage),
        regularPrice: env.MERCHANT_PLAN_BASIC_PRICE,
        features: [
          'Up to 100 products',
          'Basic analytics',
          'Email support',
          'Custom store page',
          'SSL security',
        ],
      },
      {
        id: SubscriptionPlan.PRO,
        name: 'Pro',
        description: 'For growing businesses with advanced needs',
        price: this.calculateDiscountedPrice(env.MERCHANT_PLAN_PRO_PRICE, discountPercentage),
        regularPrice: env.MERCHANT_PLAN_PRO_PRICE,
        features: [
          'Unlimited products',
          'Advanced analytics',
          'Priority support',
          'Custom domain',
          'Abandoned cart recovery',
          'Discount codes',
        ],
        isPopular: true,
      },
      {
        id: SubscriptionPlan.ENTERPRISE,
        name: 'Enterprise',
        description: 'For large-scale operations',
        price: this.calculateDiscountedPrice(env.MERCHANT_PLAN_ENTERPRISE_PRICE, discountPercentage),
        regularPrice: env.MERCHANT_PLAN_ENTERPRISE_PRICE,
        features: [
          'Everything in Pro',
          'Dedicated account manager',
          'API access',
          'Custom integrations',
          'White-label options',
          'SLA guarantee',
        ],
      },
      {
        id: SubscriptionPlan.AFFILIATE,
        name: 'Affiliate',
        description: 'For marketers and influencers',
        price: this.calculateDiscountedPrice(env.AFFILIATE_PLAN_PRICE, discountPercentage),
        regularPrice: env.AFFILIATE_PLAN_PRICE,
        features: [
          'Referral tracking',
          'Traffic analytics',
          'Marketing tools',
          'Community access',
          'No commissions on sales',
        ],
      },
    ];
  }

  private calculateDiscountedPrice(price: number, discountPercentage: number): number {
    return Math.round(price * (1 - discountPercentage / 100));
  }

  // Get plan price by type
  getPlanPrice(plan: SubscriptionPlan): { price: number; regularPrice: number } {
    switch (plan) {
      case SubscriptionPlan.BASIC:
        return {
          price: this.calculateDiscountedPrice(env.MERCHANT_PLAN_BASIC_PRICE, env.FIRST_MONTH_DISCOUNT_PERCENTAGE),
          regularPrice: env.MERCHANT_PLAN_BASIC_PRICE,
        };
      case SubscriptionPlan.PRO:
        return {
          price: this.calculateDiscountedPrice(env.MERCHANT_PLAN_PRO_PRICE, env.FIRST_MONTH_DISCOUNT_PERCENTAGE),
          regularPrice: env.MERCHANT_PLAN_PRO_PRICE,
        };
      case SubscriptionPlan.ENTERPRISE:
        return {
          price: this.calculateDiscountedPrice(env.MERCHANT_PLAN_ENTERPRISE_PRICE, env.FIRST_MONTH_DISCOUNT_PERCENTAGE),
          regularPrice: env.MERCHANT_PLAN_ENTERPRISE_PRICE,
        };
      case SubscriptionPlan.AFFILIATE:
        return {
          price: this.calculateDiscountedPrice(env.AFFILIATE_PLAN_PRICE, env.FIRST_MONTH_DISCOUNT_PERCENTAGE),
          regularPrice: env.AFFILIATE_PLAN_PRICE,
        };
      default:
        throw new BadRequestError('Invalid subscription plan');
    }
  }

  // Create subscription for user
  async createSubscription(
    userId: string,
    plan: SubscriptionPlan,
    paymentMethodId?: string
  ): Promise<{ subscriptionId: string; approvalUrl?: string }> {
    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PENDING', 'TRIAL'] },
      },
    });

    if (existingSubscription) {
      throw new BadRequestError('User already has an active subscription');
    }

    const { price, regularPrice } = this.getPlanPrice(plan);

    // Create PayPal subscription
    const paypalResult = await paypalService.createSubscription(
      plan,
      price,
      regularPrice,
      env.FIRST_MONTH_DISCOUNT_PERCENTAGE,
      userId
    );

    // Calculate billing periods
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Create subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan,
        status: 'PENDING',
        price,
        regularPrice,
        currency: env.PLATFORM_CURRENCY,
        isFirstMonthDiscount: true,
        discountPercentage: env.FIRST_MONTH_DISCOUNT_PERCENTAGE,
        paypalSubscriptionId: paypalResult.subscriptionId,
        paypalPlanId: paypalResult.planId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingDate: periodEnd,
      },
    });

    logger.info(`Subscription created for user ${userId}, plan ${plan}, ID: ${subscription.id}`);

    return {
      subscriptionId: subscription.id,
      approvalUrl: paypalResult.approvalUrl,
    };
  }

  // Activate subscription after PayPal approval
  async activateSubscription(paypalSubscriptionId: string, paypalData: Record<string, unknown>): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { paypalSubscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startedAt: now,
        currentPeriodEnd: periodEnd,
        nextBillingDate: periodEnd,
      },
    });

    // Update user onboarding status
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { hasCompletedOnboarding: true },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        type: 'SUBSCRIPTION',
        status: 'COMPLETED',
        amount: subscription.price,
        currency: subscription.currency,
        gateway: 'PAYPAL',
        gatewayTransactionId: paypalData.id as string,
        gatewayResponse: paypalData as any,
        subscriptionId: subscription.id,
      },
    });

    logger.info(`Subscription activated: ${subscription.id}`);
  }

  // Handle subscription renewal (after first month, full price)
  async handleSubscriptionRenewal(paypalSubscriptionId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { paypalSubscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // If this is the first renewal, switch to regular price
    if (subscription.isFirstMonthDiscount) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          isFirstMonthDiscount: false,
          price: subscription.regularPrice,
          discountPercentage: null,
        },
      });

      logger.info(`Subscription ${subscription.id} switched to regular price`);
    }

    // Update billing dates
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingDate: periodEnd,
      },
    });

    logger.info(`Subscription renewed: ${subscription.id}`);
  }

  // Cancel subscription
  async cancelSubscription(userId: string, subscriptionId: string, reason?: string): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'PENDING') {
      throw new BadRequestError('Subscription cannot be cancelled');
    }

    // Cancel in PayPal
    if (subscription.paypalSubscriptionId) {
      await paypalService.cancelSubscription(subscription.paypalSubscriptionId, reason);
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    logger.info(`Subscription cancelled: ${subscriptionId}`);
  }

  // Get user subscription
  async getUserSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PENDING', 'PAST_DUE'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      price: subscription.price,
      regularPrice: subscription.regularPrice,
      isFirstMonthDiscount: subscription.isFirstMonthDiscount,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      cancelledAt: subscription.cancelledAt,
    };
  }

  // Handle PayPal webhook events
  async handleWebhook(eventType: string, resource: Record<string, unknown>): Promise<void> {
    logger.info(`Processing PayPal webhook: ${eventType}`);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        // Subscription created (handled in activate)
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.activateSubscription(
          resource.id as string,
          resource
        );
        break;

      case 'BILLING.SUBSCRIPTION.UPDATED':
        // Handle updates
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.handleSubscriptionCancellation(resource.id as string);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await this.handleSubscriptionSuspension(resource.id as string);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await this.handlePaymentFailure(resource.id as string);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Handle successful payment (renewal)
        const billingAgreementId = resource.billing_agreement_id as string;
        if (billingAgreementId) {
          await this.handleSubscriptionRenewal(billingAgreementId);
        }
        break;

      default:
        logger.warn(`Unhandled PayPal webhook event: ${eventType}`);
    }
  }

  private async handleSubscriptionCancellation(paypalSubscriptionId: string): Promise<void> {
    await prisma.subscription.updateMany({
      where: { paypalSubscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  private async handleSubscriptionSuspension(paypalSubscriptionId: string): Promise<void> {
    await prisma.subscription.updateMany({
      where: { paypalSubscriptionId },
      data: { status: 'PAST_DUE' },
    });
  }

  private async handlePaymentFailure(paypalSubscriptionId: string): Promise<void> {
    await prisma.subscription.updateMany({
      where: { paypalSubscriptionId },
      data: { status: 'PAST_DUE' },
    });

    // Notify user about payment failure
    const subscription = await prisma.subscription.findUnique({
      where: { paypalSubscriptionId },
      include: { user: true },
    });

    if (subscription) {
      // TODO: Send notification to user
      logger.warn(`Payment failed for subscription ${subscription.id}`);
    }
  }
}

export const subscriptionService = new SubscriptionService();
