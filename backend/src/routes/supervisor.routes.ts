import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const router = Router();

// All supervisor routes require authentication and SUPERVISOR or ADMIN role
router.use(authenticate);
router.use(requireRole('SUPERVISOR', 'ADMIN'));

// ==================== DASHBOARD STATS ====================
router.get('/dashboard-stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    const [
      totalAffiliates,
      newAffiliatesThisMonth,
      totalClicks,
      clicksToday,
      totalOrders,
      suspectedFraudCases,
      topAffiliates,
    ] = await Promise.all([
      // Total affiliates
      prisma.affiliate.count(),

      // New affiliates this month
      prisma.affiliate.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Total clicks
      prisma.affiliateClick.count(),

      // Clicks today
      prisma.affiliateClick.count({
        where: {
          createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        },
      }),

      // Total orders from affiliates
      prisma.order.count({
        where: {
          affiliateId: { not: null },
        },
      }),

      // Suspected fraud cases (high clicks from same IP)
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT "ipAddress") as count
        FROM affiliate_clicks
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY "ipAddress"
        HAVING COUNT(*) > 50
      `,

      // Top 5 affiliates by clicks
      prisma.affiliate.findMany({
        take: 5,
        orderBy: { totalClicks: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

    const response: ApiResponse = {
      success: true,
      message: 'Supervisor dashboard stats retrieved',
      data: {
        overview: {
          totalAffiliates,
          newAffiliatesThisMonth,
          totalClicks,
          clicksToday,
          totalOrders,
          conversionRate: Math.round(conversionRate * 100) / 100,
          suspectedFraudCases: Array.isArray(suspectedFraudCases) ? suspectedFraudCases.length : 0,
        },
        topAffiliates,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    });
  }
});

// ==================== AFFILIATE MONITORING ====================
router.get('/affiliates', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as string) || 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { referralCode: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.user = { ...where.user, status };
    }

    const [affiliates, total] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              status: true,
              createdAt: true,
              lastLoginAt: true,
            },
          },
          _count: {
            select: {
              clicks: true,
              orders: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
      }),
      prisma.affiliate.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Affiliates retrieved successfully',
      data: {
        affiliates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch affiliates',
    });
  }
});

// Get single affiliate details with clicks history
router.get('/affiliates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const since = subDays(new Date(), days);

    const [affiliate, clicks, recentClicks] = await Promise.all([
      prisma.affiliate.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              status: true,
              isEmailVerified: true,
              createdAt: true,
              lastLoginAt: true,
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
      prisma.affiliateClick.groupBy({
        by: ['createdAt'],
        where: {
          affiliateId: id,
          createdAt: { gte: since },
        },
        _count: {
          id: true,
        },
      }),
      prisma.affiliateClick.findMany({
        where: { affiliateId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          referrer: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          converted: true,
          createdAt: true,
        },
      }),
    ]);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found',
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Affiliate details retrieved',
      data: {
        affiliate,
        clicksHistory: clicks,
        recentClicks,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching affiliate details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch affiliate details',
    });
  }
});

// Update affiliate status
router.patch('/affiliates/:id/status', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found',
      });
    }

    // Update user status
    await prisma.user.update({
      where: { id: affiliate.userId },
      data: { status },
    });

    const response: ApiResponse = {
      success: true,
      message: `Affiliate ${status.toLowerCase()} successfully`,
      data: { affiliateId: id, status },
    };
    res.json(response);
  } catch (error) {
    console.error('Error updating affiliate status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update affiliate status',
    });
  }
});

// ==================== FRAUD DETECTION ====================
router.get('/fraud-detection', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = subDays(new Date(), days);

    // Detect suspicious patterns
    const [suspiciousIPs, suspiciousAffiliates, botPatterns, spamPatterns] = await Promise.all([
      // IPs with excessive clicks (>100 clicks in period)
      prisma.$queryRawUnsafe(`
        SELECT 
          "ipAddress",
          COUNT(*) as click_count,
          COUNT(DISTINCT "affiliateId") as affiliate_count,
          array_agg(DISTINCT "affiliateId") as affiliate_ids
        FROM affiliate_clicks
        WHERE "createdAt" >= '${since.toISOString()}' AND "ipAddress" IS NOT NULL
        GROUP BY "ipAddress"
        HAVING COUNT(*) > 100
        ORDER BY click_count DESC
        LIMIT 20
      `),

      // Affiliates with abnormal click patterns
      prisma.$queryRawUnsafe(`
        SELECT 
          a.id,
          a."referralCode",
          COUNT(ac.id) as total_clicks,
          COUNT(DISTINCT ac."ipAddress") as unique_ips,
          ROUND(COUNT(DISTINCT ac."ipAddress")::numeric / COUNT(ac.id) * 100, 2) as uniqueness_ratio
        FROM affiliates a
        JOIN affiliate_clicks ac ON a.id = ac."affiliateId"
        WHERE ac."createdAt" >= '${since.toISOString()}'
        GROUP BY a.id, a."referralCode"
        HAVING COUNT(ac.id) > 50 
          AND (COUNT(DISTINCT ac."ipAddress")::numeric / COUNT(ac.id)) < 0.3
        ORDER BY total_clicks DESC
        LIMIT 20
      `),

      // Potential bot clicks (same user agent, rapid clicks)
      prisma.$queryRawUnsafe(`
        SELECT 
          "userAgent",
          "ipAddress",
          COUNT(*) as click_count,
          MIN("createdAt") as first_click,
          MAX("createdAt") as last_click,
          EXTRACT(EPOCH FROM (MAX("createdAt") - MIN("createdAt"))) / 60 as minutes_span
        FROM affiliate_clicks
        WHERE "createdAt" >= '${since.toISOString()}' 
          AND "userAgent" IS NOT NULL 
          AND "ipAddress" IS NOT NULL
        GROUP BY "userAgent", "ipAddress"
        HAVING COUNT(*) > 20 
          AND EXTRACT(EPOCH FROM (MAX("createdAt") - MIN("createdAt"))) / 60 < 5
        ORDER BY click_count DESC
        LIMIT 20
      `),

      // Spam patterns (no referrer, direct access abuse)
      prisma.$queryRawUnsafe(`
        SELECT 
          a.id,
          a."referralCode",
          COUNT(*) as total_clicks,
          COUNT(CASE WHEN referrer IS NULL OR referrer = '' THEN 1 END) as no_referrer_clicks,
          ROUND(COUNT(CASE WHEN referrer IS NULL OR referrer = '' THEN 1 END)::numeric / COUNT(*) * 100, 2) as no_referrer_pct
        FROM affiliates a
        JOIN affiliate_clicks ac ON a.id = ac."affiliateId"
        WHERE ac."createdAt" >= '${since.toISOString()}'
        GROUP BY a.id, a."referralCode"
        HAVING COUNT(*) > 30 
          AND (COUNT(CASE WHEN referrer IS NULL OR referrer = '' THEN 1 END)::numeric / COUNT(*)) > 0.8
        ORDER BY total_clicks DESC
        LIMIT 20
      `),
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Fraud detection analysis completed',
      data: {
        summary: {
          suspiciousIPsCount: Array.isArray(suspiciousIPs) ? suspiciousIPs.length : 0,
          suspiciousAffiliatesCount: Array.isArray(suspiciousAffiliates) ? suspiciousAffiliates.length : 0,
          botPatternsCount: Array.isArray(botPatterns) ? botPatterns.length : 0,
          spamPatternsCount: Array.isArray(spamPatterns) ? spamPatterns.length : 0,
        },
        details: {
          suspiciousIPs: suspiciousIPs || [],
          suspiciousAffiliates: suspiciousAffiliates || [],
          botPatterns: botPatterns || [],
          spamPatterns: spamPatterns || [],
        },
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error in fraud detection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform fraud detection',
    });
  }
});

// ==================== REPORTS ====================
router.get('/reports/top-affiliates', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = subDays(new Date(), days);

    const topAffiliates = await prisma.affiliate.findMany({
      take: 20,
      orderBy: { totalClicks: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            clicks: {
              where: {
                createdAt: { gte: since },
              },
            },
            orders: {
              where: {
                createdAt: { gte: since },
              },
            },
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Top affiliates report retrieved',
      data: {
        period: days,
        topAffiliates,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching top affiliates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top affiliates report',
    });
  }
});

router.get('/reports/top-links', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = subDays(new Date(), days);

    const topLinks = await prisma.affiliate.findMany({
      take: 20,
      orderBy: { totalClicks: 'desc' },
      select: {
        id: true,
        referralCode: true,
        totalClicks: true,
        totalOrders: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        clicks: {
          where: {
            createdAt: { gte: since },
          },
          select: {
            id: true,
            converted: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate conversion rates
    const linksWithStats = topLinks.map(link => ({
      ...link,
      conversionRate: link.totalClicks > 0 
        ? Math.round((link.totalOrders / link.totalClicks) * 100 * 100) / 100 
        : 0,
    }));

    const response: ApiResponse = {
      success: true,
      message: 'Top links report retrieved',
      data: {
        period: days,
        topLinks: linksWithStats,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching top links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top links report',
    });
  }
});

// Activity timeline
router.get('/reports/activity', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = subDays(new Date(), days);

    // Daily activity stats
    const dailyActivity = await prisma.$queryRawUnsafe(`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as clicks,
        COUNT(DISTINCT "ipAddress") as unique_ips,
        COUNT(CASE WHEN converted = true THEN 1 END) as conversions
      FROM affiliate_clicks
      WHERE "createdAt" >= '${since.toISOString()}'
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `);

    // Hourly distribution (for traffic pattern analysis)
    const hourlyDistribution = await prisma.$queryRawUnsafe(`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as clicks
      FROM affiliate_clicks
      WHERE "createdAt" >= '${since.toISOString()}'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `);

    // UTM performance
    const utmStats = await prisma.affiliateClick.groupBy({
      by: ['utmSource'],
      where: {
        createdAt: { gte: since },
        utmSource: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Activity report retrieved',
      data: {
        period: days,
        dailyActivity: dailyActivity || [],
        hourlyDistribution: hourlyDistribution || [],
        utmStats,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching activity report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity report',
    });
  }
});

export default router;
