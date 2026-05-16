import { prisma } from '../config/database';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { generateRandomToken } from '../utils/tokens';
import logger from '../utils/logger';

interface CreateStoreInput {
  name: string;
  slug: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  coverImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface UpdateStoreInput extends Partial<CreateStoreInput> {
  isActive?: boolean;
}

export class StoreService {
  // Create store for merchant
  async createStore(ownerId: string, input: CreateStoreInput) {
    // Check if user is a merchant
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!user || user.role !== 'MERCHANT') {
      throw new ForbiddenError('Only merchants can create stores');
    }

    // Check if user already has a store
    const existingStore = await prisma.store.findUnique({
      where: { ownerId },
    });

    if (existingStore) {
      throw new BadRequestError('User already has a store');
    }

    // Check if slug is unique
    const slugExists = await prisma.store.findUnique({
      where: { slug: input.slug },
    });

    if (slugExists) {
      throw new BadRequestError('Store slug is already taken');
    }

    // Generate tenant ID
    const tenantId = `tenant_${generateRandomToken(8)}`;

    // Create store
    const store = await prisma.store.create({
      data: {
        ...input,
        ownerId,
        tenantId,
        isVerified: false,
      },
    });

    // Update user with tenant ID and onboarding status
    await prisma.user.update({
      where: { id: ownerId },
      data: {
        tenantId,
        hasCompletedOnboarding: true,
      },
    });

    // Create default payment settings
    await prisma.merchantPaymentSettings.create({
      data: {
        storeId: store.id,
      },
    });

    logger.info(`Store created: ${store.id} for user ${ownerId}`);

    return store;
  }

  // Get store by slug (public)
  async getStoreBySlug(slug: string) {
    const store = await prisma.store.findUnique({
      where: { slug, isActive: true },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        products: {
          where: { isActive: true, status: 'ACTIVE' },
          take: 12,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            images: {
              take: 1,
              select: { url: true },
            },
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return store;
  }

  // Get store by ID (for owner/admin)
  async getStoreById(storeId: string, userId: string, userRole: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        categories: true,
        paymentSettings: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' && store.ownerId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return store;
  }

  // Get my store (for merchant)
  async getMyStore(ownerId: string) {
    const store = await prisma.store.findUnique({
      where: { ownerId },
      include: {
        categories: true,
        paymentSettings: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return store;
  }

  // Update store
  async updateStore(storeId: string, userId: string, userRole: string, input: UpdateStoreInput) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' && store.ownerId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== store.slug) {
      const slugExists = await prisma.store.findUnique({
        where: { slug: input.slug },
      });

      if (slugExists) {
        throw new BadRequestError('Store slug is already taken');
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: input,
    });

    logger.info(`Store updated: ${storeId}`);

    return updatedStore;
  }

  // Update payment settings
  async updatePaymentSettings(
    storeId: string,
    userId: string,
    userRole: string,
    settings: Partial<{
      paypalEnabled: boolean;
      paypalEmail: string;
      paypalMerchantId: string;
      tabbyEnabled: boolean;
      tabbyPublicKey: string;
      tabbySecretKey: string;
      tamaraEnabled: boolean;
      tamaraApiKey: string;
      tamaraApiSecret: string;
      madaEnabled: boolean;
      madaEntityId: string;
      madaAuthorization: string;
      codEnabled: boolean;
    }>
  ) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' && store.ownerId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const updatedSettings = await prisma.merchantPaymentSettings.upsert({
      where: { storeId },
      create: {
        storeId,
        ...settings,
      },
      update: settings,
    });

    logger.info(`Payment settings updated for store: ${storeId}`);

    return updatedSettings;
  }

  // List all stores (admin only)
  async listStores(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    const { page, limit, search, isActive, isVerified } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return {
      stores,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Verify store (admin only)
  async verifyStore(storeId: string, verified: boolean) {
    const store = await prisma.store.update({
      where: { id: storeId },
      data: { isVerified: verified },
    });

    logger.info(`Store ${storeId} verification status: ${verified}`);

    return store;
  }

  // Get store stats
  async getStoreStats(storeId: string, userId: string, userRole: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' && store.ownerId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalOrders,
      recentOrders,
      revenueStats,
    ] = await Promise.all([
      prisma.product.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId } }),
      prisma.order.findMany({
        where: { storeId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { storeId },
        _count: { id: true },
        _sum: { total: true },
      }),
    ]);

    // Calculate revenue
    const totalRevenue = revenueStats
      .filter((s) => s.status === 'DELIVERED' || s.status === 'CONFIRMED')
      .reduce((sum, s) => sum + (s._sum.total?.toNumber() || 0), 0);

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      ordersByStatus: revenueStats.map((s) => ({
        status: s.status,
        count: s._count.id,
        revenue: s._sum.total?.toNumber() || 0,
      })),
    };
  }
}

export const storeService = new StoreService();
