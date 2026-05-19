import { prisma } from '../config/database';
import { startOfMonth, endOfMonth, subMonths, subDays, startOfDay, endOfDay } from 'date-fns';
import logger from '../utils/logger';
import cacheService from './cache.service';

interface PaginationParams {
  page: number;
  limit: number;
}

interface UserFilters extends PaginationParams {
  search?: string;
  role?: string;
  status?: string;
}

interface StoreFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  status?: string;
}

interface SubscriptionFilters extends PaginationParams {
  status?: string;
  plan?: string;
}

interface PaymentFilters extends PaginationParams {
  status?: string;
  type?: string;
  gateway?: string;
}

interface SecurityEventFilters extends PaginationParams {
  type?: string;
  severity?: string;
}

interface AuditLogFilters extends PaginationParams {
  userId?: string;
  action?: string;
  entity?: string;
}

interface NotificationFilters extends PaginationParams {
  unreadOnly?: boolean;
}

interface SupportTicketFilters extends PaginationParams {
  status?: string;
  priority?: string;
  category?: string;
}

export class AdminService {
  // ===========================================
  // GLOBAL OVERVIEW DASHBOARD
  // ===========================================

  async getDashboardStats() {
    const cacheKey = 'admin:dashboard:stats';
    
    return cacheService.getOrSet(cacheKey, async () => {
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
        return sum + Number(sub.price || 0);
      }, 0);

      // Users by role
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

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

      // Orders
      const ordersToday = await prisma.order.count({
        where: {
          createdAt: { gte: startOfDay(now) },
        },
      });

      const ordersThisMonth = await prisma.order.count({
        where: {
          createdAt: {
            gte: thisMonthStart,
            lte: thisMonthEnd,
          },
        },
      });

      // Total revenue
      const payments = await prisma.payment.findMany({
        where: { status: 'COMPLETED' },
      });
      const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

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

      return {
        stores: {
          active: activeStores,
          growth: lastMonthStores > 0
            ? ((activeStores - lastMonthStores) / lastMonthStores * 100).toFixed(1)
            : '0',
        },
        subscriptions: {
          active: activeSubscriptions,
          mrr: Number(mrr.toFixed(2)),
        },
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          growth: newUsersLastMonth > 0
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
            : '0',
          byRole: usersByRole.reduce((acc: any, item: any) => {
            acc[item.role] = item._count;
            return acc;
          }, {}),
        },
        orders: {
          today: ordersToday,
          thisMonth: ordersThisMonth,
        },
        revenue: {
          total: Number(totalRevenue.toFixed(2)),
          mrr: Number(mrr.toFixed(2)),
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
      };
    }, 300); // Cache for 5 minutes
  }

  async getRevenueAnalytics(periodDays: number) {
    const startDate = subDays(new Date(), periodDays);
    
    // Get daily revenue data
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyRevenue = payments.reduce((acc: any, payment: any) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += Number(payment.amount);
      return acc;
    }, {});

    // Calculate ARR (Annual Recurring Revenue)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
    });
    const mrr = activeSubscriptions.reduce((sum: number, sub: any) => sum + Number(sub.price), 0);
    const arr = mrr * 12;

    return {
      dailyRevenue,
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      period: periodDays,
    };
  }

  async getGrowthMetrics(periodDays: number) {
    const startDate = subDays(new Date(), periodDays);
    
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } },
    });

    const newStores = await prisma.store.count({
      where: { createdAt: { gte: startDate } },
    });

    const newSubscriptions = await prisma.subscription.count({
      where: { createdAt: { gte: startDate } },
    });

    const newOrders = await prisma.order.count({
      where: { createdAt: { gte: startDate } },
    });

    return {
      period: periodDays,
      newUsers,
      newStores,
      newSubscriptions,
      newOrders,
    };
  }

  async getRecentActivity(limit: number) {
    // Get recent audit logs
    const auditLogs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: Math.floor(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          select: { name: true },
        },
        customer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return {
      auditLogs,
      recentOrders,
    };
  }

  // ===========================================
  // USER MANAGEMENT
  // ===========================================

  async getUsers(filters: UserFilters) {
    const { page, limit, search, role, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
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

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        store: true,
        affiliate: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id: string, updates: any) {
    const { role, status } = updates;

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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'user',
        entityId: id,
        oldValues: updates.oldValues || {},
        newValues: { role, status },
      },
    });

    // Invalidate cache
    await cacheService.invalidateDashboardCache();
    await cacheService.invalidateUserCache(id);

    return user;
  }

  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
  }

  async getUserActivityLogs(userId: string, filters: PaginationParams) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===========================================
  // STORE MANAGEMENT
  // ===========================================

  async getStores(filters: StoreFilters) {
    const { page, limit, search, isActive, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
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

    return {
      stores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStoreById(id: string) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        paymentSettings: true,
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    return store;
  }

  async toggleStoreStatus(id: string) {
    const store = await prisma.store.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!store) {
      throw new Error('Store not found');
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'store',
        entityId: id,
        oldValues: { isActive: store.isActive },
        newValues: { isActive: updatedStore.isActive },
      },
    });

    // Invalidate cache
    await cacheService.invalidateDashboardCache();
    await cacheService.invalidateStoreCache(id);

    return updatedStore;
  }

  async deleteStore(id: string) {
    await prisma.store.delete({ where: { id } });
    await cacheService.invalidateDashboardCache();
    await cacheService.invalidateStoreCache(id);
  }

  async getStoreHealth(id: string) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    // Calculate health metrics
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentOrders = await prisma.order.count({
      where: {
        storeId: id,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const healthScore = this.calculateHealthScore(store._count.products, recentOrders, store.isActive);

    return {
      storeId: id,
      storeName: store.name,
      isActive: store.isActive,
      productsCount: store._count.products,
      ordersCount: store._count.orders,
      recentOrders,
      healthScore,
      healthStatus: this.getHealthStatus(healthScore),
    };
  }

  private calculateHealthScore(productsCount: number, recentOrders: number, isActive: boolean): number {
    if (!isActive) return 0;
    
    let score = 50; // Base score
    score += Math.min(productsCount * 2, 30); // Up to 30 points for products
    score += Math.min(recentOrders * 5, 20); // Up to 20 points for recent orders
    
    return Math.min(score, 100);
  }

  private getHealthStatus(score: number): string {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  }

  // ===========================================
  // SUBSCRIPTION MANAGEMENT
  // ===========================================

  async getSubscriptions(filters: SubscriptionFilters) {
    const { page, limit, status, plan } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
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

    return {
      subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSubscriptionById(id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return subscription;
  }

  async cancelSubscription(id: string, reason?: string) {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CANCEL',
        entity: 'subscription',
        entityId: id,
        newValues: { status: 'CANCELLED', reason },
      },
    });

    // Invalidate cache
    await cacheService.invalidateDashboardCache();

    return subscription;
  }

  // ===========================================
  // PAYMENTS & TRANSACTIONS
  // ===========================================

  async getPayments(filters: PaymentFilters) {
    const { page, limit, status, type, gateway } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (gateway) where.gateway = gateway;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: { id: true, plan: true, user: { select: { email: true } } },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  // ===========================================
  // ANALYTICS & BUSINESS INTELLIGENCE
  // ===========================================

  async getAnalytics(periodDays: number) {
    const startDate = subDays(new Date(), periodDays);

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
      ? (cancelledSubscriptions / totalSubscriptions) * 100
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
      ? (usersWithStores / registeredUsers) * 100
      : 0;

    // Average revenue per user
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
    });

    const arpu = activeUsers > 0
      ? Number(totalRevenue._sum.amount || 0) / activeUsers
      : 0;

    return {
      period: periodDays,
      churnRate: Number(churnRate.toFixed(2)),
      activeUsers,
      conversionRate: Number(conversionRate.toFixed(2)),
      totalSubscriptions,
      cancelledSubscriptions,
      arpu: Number(arpu.toFixed(2)),
      totalRevenue: Number(totalRevenue._sum.amount || 0),
    };
  }

  async exportAnalyticsReport(periodDays: number, format: string) {
    const analytics = await this.getAnalytics(periodDays);
    
    if (format === 'csv') {
      const headers = 'Metric,Value\n';
      const rows = Object.entries(analytics)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');
      return headers + rows;
    }

    return analytics;
  }

  // ===========================================
  // SECURITY CENTER
  // ===========================================

  async getSecurityEvents(filters: SecurityEventFilters) {
    const { page, limit, type, severity } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.action = type;
    if (severity) {
      // Map severity to action types
      const severityMap: any = {
        high: ['DELETE', 'BAN', 'SUSPEND'],
        medium: ['UPDATE', 'CANCEL'],
        low: ['CREATE', 'LOGIN'],
      };
      where.action = { in: severityMap[severity] || [] };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBlockedIPs() {
    // This would typically use a separate blocked_ips table or Redis
    // For now, return empty array
    return {
      blockedIPs: [],
      total: 0,
    };
  }

  async blockIP(ip: string, reason?: string) {
    // This would typically store in a blocked_ips table or Redis
    logger.info(`IP blocked: ${ip}, Reason: ${reason}`);
  }

  async unblockIP(ip: string) {
    // This would typically remove from blocked_ips table or Redis
    logger.info(`IP unblocked: ${ip}`);
  }

  // ===========================================
  // AUDIT LOGS
  // ===========================================

  async getAuditLogs(filters: AuditLogFilters) {
    const { page, limit, userId, action, entity } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===========================================
  // NOTIFICATIONS
  // ===========================================

  async getAdminNotifications(filters: NotificationFilters) {
    const { page, limit, unreadOnly } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (unreadOnly) where.inAppRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markNotificationAsRead(id: string) {
    await prisma.notification.update({
      where: { id },
      data: {
        inAppRead: true,
        inAppReadAt: new Date(),
      },
    });
  }

  async markAllNotificationsAsRead() {
    await prisma.notification.updateMany({
      where: { inAppRead: false },
      data: {
        inAppRead: true,
        inAppReadAt: new Date(),
      },
    });
  }

  // ===========================================
  // SUPPORT & TICKETING SYSTEM
  // ===========================================

  async getSupportTickets(filters: SupportTicketFilters) {
    const { page, limit, status, priority, category } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          admin: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSupportTicketById(id: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        admin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    return ticket;
  }

  async updateSupportTicket(id: string, updates: any) {
    const { status, priority, category } = updates;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status, priority, category },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        admin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'support_ticket',
        entityId: id,
        newValues: { status, priority, category },
      },
    });

    return ticket;
  }

  async replyToSupportTicket(id: string, reply: string, adminId?: string) {
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        adminReply: reply,
        adminId: adminId,
        status: 'in_progress',
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        admin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'REPLY',
        entity: 'support_ticket',
        entityId: id,
        newValues: { hasReply: true },
      },
    });

    return ticket;
  }

  async closeSupportTicket(id: string) {
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        admin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CLOSE',
        entity: 'support_ticket',
        entityId: id,
        newValues: { status: 'closed' },
      },
    });

    return ticket;
  }

  // ===========================================
  // PLATFORM SETTINGS
  // ===========================================

  async getPlatformSettings(category?: string) {
    const where: any = {};
    if (category) where.category = category;

    const settings = await prisma.platformSetting.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    // Group by category
    const grouped = settings.reduce((acc: any, setting: any) => {
      if (!acc[setting.category]) acc[setting.category] = {};
      acc[setting.category][setting.key] = setting.value;
      return acc;
    }, {});

    return grouped;
  }

  async updatePlatformSetting(key: string, value: any) {
    const setting = await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, category: 'general' },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'platform_setting',
        entityId: setting.id,
        newValues: { key, value },
      },
    });

    // Invalidate cache
    await cacheService.invalidateAdminCache();

    return setting;
  }

  // ===========================================
  // FEATURE FLAGS
  // ===========================================

  async getFeatureFlags(enabled?: boolean, plan?: string) {
    const where: any = {};
    if (enabled !== undefined) where.enabled = enabled;
    if (plan) where.plan = plan;

    const flags = await prisma.featureFlag.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return flags;
  }

  async createFeatureFlag(data: any) {
    const { name, description, enabled, plan, rollout } = data;

    const flag = await prisma.featureFlag.create({
      data: {
        name,
        description,
        enabled: enabled || false,
        plan,
        rollout: rollout || 0,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'feature_flag',
        entityId: flag.id,
        newValues: { name, enabled, plan, rollout },
      },
    });

    return flag;
  }

  async updateFeatureFlag(id: string, updates: any) {
    const { name, description, enabled, plan, rollout } = updates;

    const flag = await prisma.featureFlag.update({
      where: { id },
      data: {
        name,
        description,
        enabled,
        plan,
        rollout,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'feature_flag',
        entityId: id,
        newValues: { name, enabled, plan, rollout },
      },
    });

    return flag;
  }

  async deleteFeatureFlag(id: string) {
    await prisma.featureFlag.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'feature_flag',
        entityId: id,
      },
    });
  }

  async checkFeatureFlag(name: string, plan?: string): Promise<boolean> {
    const flag = await prisma.featureFlag.findUnique({
      where: { name },
    });

    if (!flag) return false;
    if (!flag.enabled) return false;
    if (flag.plan && flag.plan !== plan) return false;
    
    // Check rollout percentage
    if (flag.rollout < 1) {
      // For gradual rollout, you would typically use user ID hash
      // For now, return true if rollout > 0
      return flag.rollout > 0;
    }

    return true;
  }
}
