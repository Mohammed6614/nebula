/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from '../config/env';
import { SubscriptionPlan } from '../types';
import logger from '../utils/logger';
import { InternalError } from '../utils/errors';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment configuration
function environment() {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;

  if (env.PAYPAL_MODE === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

const paypalClient = new paypal.core.PayPalHttpClient(environment());

export class PayPalService {
  // Create a product in PayPal
  async createProduct(name: string, description: string): Promise<string> {
    const request = new paypal.catalogProducts.ProductsCreateRequest();
    request.requestBody({
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    });

    try {
      const response = await paypalClient.execute(request);
      return response.result.id;
    } catch (error) {
      logger.error('Failed to create PayPal product:', error);
      throw new InternalError('Failed to create PayPal product');
    }
  }

  // Create a billing plan in PayPal
  async createBillingPlan(
    productId: string,
    planName: string,
    price: number,
    regularPrice: number,
    discountPercentage: number
  ): Promise<string> {
    const request = new paypal.subscriptions.PlansCreateRequest();
    
    // First month with discount, then regular price
    const setupFee = price; // Initial payment (discounted)
    
    request.requestBody({
      product_id: productId,
      name: planName,
      description: `${planName} Plan with ${discountPercentage}% off first month`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: regularPrice.toFixed(2),
              currency_code: env.PLATFORM_CURRENCY,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: setupFee.toFixed(2),
          currency_code: env.PLATFORM_CURRENCY,
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    });

    try {
      const response = await paypalClient.execute(request);
      return response.result.id;
    } catch (error) {
      logger.error('Failed to create PayPal billing plan:', error);
      throw new InternalError('Failed to create PayPal billing plan');
    }
  }

  // Create a subscription
  async createSubscription(
    plan: SubscriptionPlan,
    price: number,
    regularPrice: number,
    discountPercentage: number,
    userId: string
  ): Promise<{ subscriptionId: string; planId: string; approvalUrl?: string }> {
    // Create or get product
    const productName = `NEBULA ${plan} Plan`;
    const productDescription = `Subscription plan for NEBULA platform - ${plan} tier`;
    
    let productId: string;
    try {
      productId = await this.createProduct(productName, productDescription);
    } catch {
      // If product creation fails, use a fallback
      productId = 'NEBULA-SAAS-PRODUCT';
    }

    // Create billing plan
    const billingPlanId = await this.createBillingPlan(
      productId,
      productName,
      price,
      regularPrice,
      discountPercentage
    );

    // Create subscription
    const request = new paypal.subscriptions.SubscriptionsCreateRequest();
    request.requestBody({
      plan_id: billingPlanId,
      custom_id: userId,
      application_context: {
        brand_name: env.PLATFORM_NAME,
        locale: env.PLATFORM_LOCALE,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${env.FRONTEND_URL}/subscription/success`,
        cancel_url: `${env.FRONTEND_URL}/subscription/cancel`,
      },
    });

    try {
      const response = await paypalClient.execute(request);
      const subscriptionId = response.result.id;
      
      // Find approval URL
      const approvalUrl = response.result.links?.find(
        (link: { rel: string; href: string }) => link.rel === 'approve'
      )?.href;

      return {
        subscriptionId,
        planId: billingPlanId,
        approvalUrl,
      };
    } catch (error) {
      logger.error('Failed to create PayPal subscription:', error);
      throw new InternalError('Failed to create PayPal subscription');
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<Record<string, unknown>> {
    const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);

    try {
      const response = await paypalClient.execute(request);
      return response.result;
    } catch (error) {
      logger.error('Failed to get PayPal subscription:', error);
      throw new InternalError('Failed to get PayPal subscription details');
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    const request = new paypal.subscriptions.SubscriptionsCancelRequest(subscriptionId);
    request.requestBody({
      reason: reason || 'User requested cancellation',
    });

    try {
      await paypalClient.execute(request);
    } catch (error) {
      logger.error('Failed to cancel PayPal subscription:', error);
      throw new InternalError('Failed to cancel PayPal subscription');
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const request = new paypal.subscriptions.SubscriptionsUpdateRequest(subscriptionId);
    request.requestBody(updates);

    try {
      await paypalClient.execute(request);
    } catch (error) {
      logger.error('Failed to update PayPal subscription:', error);
      throw new InternalError('Failed to update PayPal subscription');
    }
  }

  // Verify webhook signature
  async verifyWebhookSignature(
    headers: Record<string, string>,
    body: string
  ): Promise<boolean> {
    // In production, implement proper webhook verification
    // For now, we'll do basic validation
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionId = headers['paypal-transmission-id'];
    const certId = headers['paypal-cert-id'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const transmissionTime = headers['paypal-transmission-time'];

    if (!authAlgo || !transmissionId || !certId || !transmissionSig || !transmissionTime) {
      return false;
    }

    // TODO: Implement proper webhook signature verification
    // This requires fetching PayPal's public certificate and verifying the signature
    return true;
  }

  // Process payment for order (one-time payment)
  async createOrderPayment(
    amount: number,
    orderId: string,
    customerEmail: string
  ): Promise<{ orderId: string; approvalUrl?: string }> {
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: env.PLATFORM_CURRENCY,
            value: amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: env.PLATFORM_CURRENCY,
                value: amount.toFixed(2),
              },
            },
          },
          custom_id: orderId,
          description: `Order #${orderId}`,
        },
      ],
      application_context: {
        brand_name: env.PLATFORM_NAME,
        locale: env.PLATFORM_LOCALE,
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'PAY_NOW',
        return_url: `${env.FRONTEND_URL}/checkout/success`,
        cancel_url: `${env.FRONTEND_URL}/checkout/cancel`,
      },
    });

    try {
      const response = await paypalClient.execute(request);
      const paypalOrderId = response.result.id;
      
      const approvalUrl = response.result.links?.find(
        (link: { rel: string; href: string }) => link.rel === 'approve'
      )?.href;

      return {
        orderId: paypalOrderId,
        approvalUrl,
      };
    } catch (error) {
      logger.error('Failed to create PayPal order:', error);
      throw new InternalError('Failed to create PayPal order');
    }
  }

  // Capture order payment
  async capturePayment(paypalOrderId: string): Promise<Record<string, unknown>> {
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    
    try {
      const response = await paypalClient.execute(request);
      return response.result;
    } catch (error) {
      logger.error('Failed to capture PayPal payment:', error);
      throw new InternalError('Failed to capture PayPal payment');
    }
  }
}

export const paypalService = new PayPalService();
