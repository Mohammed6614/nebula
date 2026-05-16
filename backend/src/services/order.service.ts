import { prisma } from '../config/database';
import { BadRequestError, NotFoundError, ForbiddenError, InternalError } from '../utils/errors';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../types';
import { generateRandomToken } from '../utils/tokens';
import QRCode from 'qrcode';
import logger from '../utils/logger';
import { env } from '../config/env';

interface CreateOrderInput {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  paymentMethod: PaymentMethod;
  affiliateCode?: string;
}

interface ListOrdersParams {
  page: number;
  limit: number;
  storeId?: string;
  customerId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  tenantId?: string;
}

export class OrderService {
  // Create order
  async createOrder(customerId: string, storeId: string, input: CreateOrderInput) {
    // Get store and validate
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || !store.isActive) {
      throw new BadRequestError('Store not found or inactive');
    }

    // Validate and get products
    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId,
        isActive: true,
        status: 'ACTIVE',
      },
      include: {
        images: { take: 1 },
        variants: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestError('Some products are not available');
    }

    // Build order items and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestError(`Product ${item.productId} not found`);
      }

      let unitPrice = product.price.toNumber();
      let variantTitle = '';

      // Check variant if specified
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestError(`Variant ${item.variantId} not found`);
        }
        unitPrice = variant.price.toNumber();
        variantTitle = variant.title;
      }

      // Check inventory
      if (product.inventoryTracked) {
        const availableQty = item.variantId
          ? product.variants.find((v) => v.id === item.variantId)?.inventoryQuantity || 0
          : product.inventoryQuantity;

        if (availableQty < item.quantity) {
          throw new BadRequestError(`Insufficient inventory for ${product.name}`);
        }
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        productName: product.name,
        productImage: product.images[0]?.url,
        variantTitle,
      });
    }

    // Calculate VAT
    const vatRate = env.PLATFORM_VAT_PERCENTAGE / 100;
    const taxAmount = subtotal * vatRate;
    const total = subtotal + taxAmount;

    // Find affiliate if code provided
    let affiliateId: string | undefined;
    if (input.affiliateCode) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { referralCode: input.affiliateCode },
      });
      if (affiliate) {
        affiliateId = affiliate.id;
      }
    }

    // Generate order number
    const orderNumber = `NBL${Date.now().toString(36).toUpperCase()}${generateRandomToken(4).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        storeId,
        customerId,
        tenantId: store.tenantId,
        subtotal,
        taxAmount,
        shippingAmount: 0, // Calculate based on shipping rules
        total,
        currency: env.PLATFORM_CURRENCY,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: input.paymentMethod,
        shippingAddress: input.shippingAddress,
        shippingCity: input.shippingAddress.city,
        shippingCountry: input.shippingAddress.country,
        affiliateId,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        store: {
          select: { name: true, slug: true },
        },
      },
    });

    // Generate QR code for order verification
    const verificationUrl = `${env.API_URL}/orders/${order.id}/verify`;
    const qrCode = await QRCode.toDataURL(verificationUrl);

    await prisma.order.update({
      where: { id: order.id },
      data: { qrCode },
    });

    // Track affiliate click conversion
    if (affiliateId) {
      // Update the most recent click as converted
      await prisma.affiliateClick.updateMany({
        where: {
          affiliateId,
          converted: false,
        },
        data: {
          converted: true,
          orderId: order.id,
        },
      });

      // Update affiliate stats
      await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          totalOrders: { increment: 1 },
        },
      });
    }

    // Reduce inventory
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product?.inventoryTracked) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { inventoryQuantity: { decrement: item.quantity } },
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: { inventoryQuantity: { decrement: item.quantity } },
          });
        }
      }
    }

    logger.info(`Order created: ${order.id} for store ${storeId}`);

    return {
      ...order,
      qrCode,
    };
  }

  // Get order by ID
  async getOrderById(orderId: string, userId: string, userRole: string, tenantId?: string) {
    const where: Record<string, unknown> = { id: orderId };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: true,
        customer: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check permissions
    const isOwner = order.customerId === userId;
    const isStoreOwner = false; // Store relation not available, check via storeId
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERVISOR';

    if (!isOwner && !isStoreOwner && !isAdmin) {
      throw new ForbiddenError('Access denied');
    }

    return order;
  }

  // List orders
  async listOrders(params: ListOrdersParams) {
    const { page, limit, storeId, customerId, status, paymentStatus, tenantId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (storeId) {
      where.storeId = storeId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            take: 3,
            select: {
              productName: true,
              quantity: true,
              unitPrice: true,
            },
          },
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
          store: {
            select: { name: true, slug: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update order status
  async updateOrderStatus(
    orderId: string,
    storeId: string,
    status: OrderStatus,
    userRole: string
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    logger.info(`Order ${orderId} status updated to ${status}`);

    return updated;
  }

  // Update payment status
  async updatePaymentStatus(orderId: string, status: PaymentStatus, transactionId?: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: status,
        paymentTransactionId: transactionId,
      },
    });

    logger.info(`Order ${orderId} payment status updated to ${status}`);

    return order;
  }

  // Verify order via QR code
  async verifyOrder(orderId: string, userId: string, userRole: string, tenantId?: string) {
    const order = await this.getOrderById(orderId, userId, userRole, tenantId);

    if (order.qrVerified) {
      throw new BadRequestError('Order already verified');
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        qrVerified: true,
        qrVerifiedAt: new Date(),
      },
    });

    return updated;
  }

  // Get order stats for store
  async getOrderStats(storeId: string, tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      ordersLast30Days,
      ordersLast7Days,
      revenueStats,
      statusCounts,
    ] = await Promise.all([
      prisma.order.count({ where: { storeId, tenantId } }),
      prisma.order.count({ where: { storeId, tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { storeId, tenantId, createdAt: { gte: sevenDaysAgo } } }),
      prisma.order.groupBy({
        by: ['status'],
        where: { storeId, tenantId },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { storeId, tenantId },
        _count: { id: true },
      }),
    ]);

    const totalRevenue = revenueStats
      .filter((s) => s.status === 'DELIVERED' || s.status === 'CONFIRMED')
      .reduce((sum, s) => sum + (s._sum.total?.toNumber() || 0), 0);

    return {
      totalOrders,
      ordersLast30Days,
      ordersLast7Days,
      totalRevenue,
      byStatus: statusCounts.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }

  // Cancel order
  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Only allow cancellation if not already delivered
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestError('Order cannot be cancelled');
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: order.paymentStatus === 'COMPLETED' ? 'REFUNDED' : 'CANCELLED',
      },
    });

    // Restore inventory
    const items = await prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { inventoryQuantity: { increment: item.quantity } },
      });
    }

    logger.info(`Order ${orderId} cancelled. Reason: ${reason || 'Not specified'}`);

    return updated;
  }
}

export const orderService = new OrderService();
