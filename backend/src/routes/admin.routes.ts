import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const router = Router();

// All admin routes require authentication and admin/supervisor role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPERVISOR'));

// Dashboard Stats
router.get('/dashboard-stats', async (req: Request, res: Response) => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Active stores count
  const activeStores = await prisma.store.count({
    where: { isActive: true },
  });

  const lastMonthStores = await prisma.store.count({
    where: {
      isActive: true,
      createdAt: { lt: thisMonthStart },
    },
  });

  // Subscriptions
  const activeSubscriptions = await prisma.subscription.count({
    where: { status: 'ACTIVE' },
  });

  // MRR (Monthly Recurring Revenue)
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
  });

  const mrr = subscriptions.reduce((sum: number, sub: any) => {
    return sum + (sub.price || 0);
  }, 0);

  // Users
  const totalUsers = await prisma.user.count();
  const newUsersThisMonth = await prisma.user.count({
    where: {
      createdAt: {
        gte: thisMonthStart,
        lte: thisMonthEnd,
      },
    },
  });

  const newUsersLastMonth = await prisma.user.count({
    where: {
      createdAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
  });

  // Orders today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = await prisma.order.count({
    where: {
      createdAt: { gte: today },
    },
  });

  // Total revenue
  const payments = await prisma.payment.findMany({
    where: { status: 'COMPLETED' },
  });
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  // Top stores
  const topStores = await prisma.store.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: { firstName: true, lastName: true, email: true },
      },
      _count: {
        select: { products: true, orders: true },
      },
    },
  });

  const response: ApiResponse = {
    success: true,
    message: 'Dashboard stats retrieved',
    data: {
      stores: {
        active: activeStores,
        growth: lastMonthStores > 0
          ? ((activeStores - lastMonthStores) / lastMonthStores * 100).toFixed(1)
          : 0,
      },
      subscriptions: {
        active: activeSubscriptions,
        mrr,
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        growth: newUsersLastMonth > 0
          ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
          : 0,
      },
      orders: {
        today: ordersToday,
      },
      revenue: {
        total: totalRevenue,
        mrr,
      },
      topStores: topStores.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        owner: s.owner,
        productsCount: s._count.products,
        ordersCount: s._count.orders,
        isActive: s.isActive,
        createdAt: s.createdAt,
      })),
    },
  };

  res.json(response);
});

// User Management
router.get('/users', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, role, status } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        lastLoginAt: true,
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Users retrieved successfully',
    data: { users, total, page: parseInt(page as string), limit: parseInt(limit as string) },
  };
  res.json(response);
});

// Update User
const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'SUPERVISOR', 'MERCHANT', 'AFFILIATE', 'CUSTOMER']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
});

router.patch('/users/:id', validateRequest(updateUserSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, status } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { role, status },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
    },
  });

  const response: ApiResponse = {
    success: true,
    message: 'User updated successfully',
    data: { user },
  };
  res.json(response);
});

// Store Management
router.get('/stores', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, isActive } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { slug: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    }),
    prisma.store.count({ where }),
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Stores retrieved successfully',
    data: { stores, total, page: parseInt(page as string), limit: parseInt(limit as string) },
  };
  res.json(response);
});

// Toggle Store Status
router.patch('/stores/:id/toggle-status', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  const store = await prisma.store.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!store) {
    return res.status(404).json({ success: false, message: 'Store not found' });
  }

  const updatedStore = await prisma.store.update({
    where: { id },
    data: { isActive: !store.isActive },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  const response: ApiResponse = {
    success: true,
    message: `Store ${updatedStore.isActive ? 'activated' : 'suspended'} successfully`,
    data: { store: updatedStore },
  };
  res.json(response);
});

// Delete Store
router.delete('/stores/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.store.delete({ where: { id } });

  const response: ApiResponse = {
    success: true,
    message: 'Store deleted successfully',
  };
  res.json(response);
});

// Subscription Management
router.get('/subscriptions', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (status) where.status = status;

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Subscriptions retrieved successfully',
    data: { subscriptions, total, page: parseInt(page as string), limit: parseInt(limit as string) },
  };
  res.json(response);
});

// Analytics
router.get('/analytics', async (req: Request, res: Response) => {
  const { period = '30' } = req.query; // days
  const daysAgo = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // MRR over time - simplified without raw query
  const mrrData: any[] = [];

  // Churn rate
  const totalSubscriptions = await prisma.subscription.count({
    where: { createdAt: { gte: startDate } },
  });

  const cancelledSubscriptions = await prisma.subscription.count({
    where: {
      status: 'CANCELLED',
      cancelledAt: { gte: startDate },
    },
  });

  const churnRate = totalSubscriptions > 0
    ? ((cancelledSubscriptions / totalSubscriptions) * 100).toFixed(2)
    : 0;

  // Active users (with login in period)
  const activeUsers = await prisma.user.count({
    where: {
      lastLoginAt: { gte: startDate },
    },
  });

  // Conversion rate (registered users who created stores)
  const registeredUsers = await prisma.user.count({
    where: {
      createdAt: { gte: startDate },
    },
  });

  const usersWithStores = await prisma.user.count({
    where: {
      createdAt: { gte: startDate },
      role: 'MERCHANT',
    },
  });

  const conversionRate = registeredUsers > 0
    ? ((usersWithStores / registeredUsers) * 100).toFixed(2)
    : 0;

  const response: ApiResponse = {
    success: true,
    message: 'Analytics retrieved successfully',
    data: {
      mrrOverTime: mrrData,
      churnRate: parseFloat(churnRate as string),
      activeUsers,
      conversionRate: parseFloat(conversionRate as string),
      totalSubscriptions,
      cancelledSubscriptions,
    },
  };
  res.json(response);
});

// Audit Logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  const { page = '1', limit = '50', userId, action } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Audit logs retrieved successfully',
    data: { logs, total, page: parseInt(page as string), limit: parseInt(limit as string) },
  };
  res.json(response);
});

export default router;
