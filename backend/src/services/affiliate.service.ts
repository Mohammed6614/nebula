import { prisma } from '../config/database';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

interface TrackClickInput {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface AffiliateStats {
  totalClicks: number;
  totalOrders: number;
  clicksToday: number;
  clicksThisMonth: number;
  ordersToday: number;
  ordersThisMonth: number;
  conversionRate: number;
}

export class AffiliateService {
  // Track affiliate click
  async trackClick(input: TrackClickInput): Promise<{ redirectUrl: string }> {
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode: input.referralCode },
      include: { user: true },
    });

    if (!affiliate) {
      throw new NotFoundError('Affiliate not found');
    }

    // Create click record
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        referrer: input.referrer,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
      },
    });

    // Update affiliate stats
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalClicks: { increment: 1 },
        lastClickAt: new Date(),
      },
    });

    logger.info(`Affiliate click tracked: ${input.referralCode}`);

    // Return redirect URL to marketplace
    return {
      redirectUrl: `/marketplace?ref=${input.referralCode}`,
    };
  }

  // Get affiliate by user ID
  async getAffiliateByUserId(userId: string) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundError('Affiliate profile not found');
    }

    return affiliate;
  }

  // Get affiliate stats
  async getAffiliateStats(userId: string): Promise<AffiliateStats> {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundError('Affiliate profile not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      clicksToday,
      clicksThisMonth,
      ordersToday,
      ordersThisMonth,
    ] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliate.id,
          createdAt: { gte: today },
        },
      }),
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliate.id,
          createdAt: { gte: thisMonth },
        },
      }),
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliate.id,
          createdAt: { gte: today },
          converted: true,
        },
      }),
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliate.id,
          createdAt: { gte: thisMonth },
          converted: true,
        },
      }),
    ]);

    const conversionRate = affiliate.totalClicks > 0
      ? (affiliate.totalOrders / affiliate.totalClicks) * 100
      : 0;

    return {
      totalClicks: affiliate.totalClicks,
      totalOrders: affiliate.totalOrders,
      clicksToday,
      clicksThisMonth,
      ordersToday,
      ordersThisMonth,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  // Get affiliate clicks with pagination
  async getAffiliateClicks(
    userId: string,
    params: {
      page: number;
      limit: number;
      converted?: boolean;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundError('Affiliate profile not found');
    }

    const { page, limit, converted, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      affiliateId: affiliate.id,
    };

    if (converted !== undefined) {
      where.converted = converted;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = endDate;
      }
    }

    const [clicks, total] = await Promise.all([
      prisma.affiliateClick.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          affiliate: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      }),
      prisma.affiliateClick.count({ where }),
    ]);

    return {
      clicks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get all affiliates (admin/supervisor only)
  async getAllAffilias(params: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [affiliates, total] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { totalClicks: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              clicks: true,
              orders: true,
            },
          },
        },
      }),
      prisma.affiliate.count({ where }),
    ]);

    return {
      affiliates,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update affiliate (mainly for supervisors to monitor)
  async updateAffiliateStatus(
    affiliateId: string,
    updates: { isActive?: boolean },
    userRole: string
  ) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR') {
      throw new ForbiddenError('Access denied');
    }

    const affiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: updates as any,
    });

    return affiliate;
  }
}

export const affiliateService = new AffiliateService();
