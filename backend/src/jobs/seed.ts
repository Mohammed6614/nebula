import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import logger from '../utils/logger';

async function seed() {
  try {
    logger.info('🌱 Starting database seed...');

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: env.ADMIN_EMAIL },
    });

    if (!existingAdmin) {
      // Create admin user
      const adminPassword = await hashPassword(env.ADMIN_PASSWORD);
      const admin = await prisma.user.create({
        data: {
          email: env.ADMIN_EMAIL,
          password: adminPassword,
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN',
          status: 'ACTIVE',
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          hasCompletedOnboarding: true,
        },
      });
      logger.info(`✅ Admin user created: ${admin.email}`);
    } else {
      logger.info('ℹ️ Admin user already exists');
    }

    // Check if supervisor exists
    const existingSupervisor = await prisma.user.findUnique({
      where: { email: env.SUPERVISOR_EMAIL },
    });

    if (!existingSupervisor) {
      // Create supervisor user
      const supervisorPassword = await hashPassword(env.SUPERVISOR_PASSWORD);
      const supervisor = await prisma.user.create({
        data: {
          email: env.SUPERVISOR_EMAIL,
          password: supervisorPassword,
          firstName: 'Platform',
          lastName: 'Supervisor',
          role: 'SUPERVISOR',
          status: 'ACTIVE',
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          hasCompletedOnboarding: true,
        },
      });
      logger.info(`✅ Supervisor user created: ${supervisor.email}`);
    } else {
      logger.info('ℹ️ Supervisor user already exists');
    }

    // Create sample affiliates for testing supervisor dashboard
    const existingAffiliates = await prisma.affiliate.count();
    if (existingAffiliates === 0) {
      logger.info('🌱 Creating sample affiliates...');
      
      const sampleAffiliates = [
        { email: 'affiliate1@example.com', firstName: 'Ahmed', lastName: 'Al-Saud', referralCode: 'AHMED2024' },
        { email: 'affiliate2@example.com', firstName: 'Sara', lastName: 'Al-Rashid', referralCode: 'SARA2024' },
        { email: 'affiliate3@example.com', firstName: 'Mohammed', lastName: 'Al-Farsi', referralCode: 'MOH2024' },
        { email: 'affiliate4@example.com', firstName: 'Fatima', lastName: 'Al-Zahra', referralCode: 'FATI2024' },
        { email: 'affiliate5@example.com', firstName: 'Khalid', lastName: 'Al-Omar', referralCode: 'KHALID2024' },
      ];

      for (const affiliateData of sampleAffiliates) {
        const password = await hashPassword('password123');
        
        const user = await prisma.user.create({
          data: {
            email: affiliateData.email,
            password: password,
            firstName: affiliateData.firstName,
            lastName: affiliateData.lastName,
            role: 'AFFILIATE',
            status: 'ACTIVE',
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            hasCompletedOnboarding: true,
            lastLoginAt: new Date(),
          },
        });

        const affiliate = await prisma.affiliate.create({
          data: {
            userId: user.id,
            referralCode: affiliateData.referralCode,
            totalClicks: 0,
            totalOrders: 0,
          },
        });

        // Generate random clicks for this affiliate
        const daysBack = 30;
        const clicksCount = Math.floor(Math.random() * 50) + 10; // 10-60 clicks
        const convertedCount = Math.floor(clicksCount * 0.15); // 15% conversion rate

        for (let i = 0; i < clicksCount; i++) {
          const randomDate = new Date();
          randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * daysBack));
          randomDate.setHours(Math.floor(Math.random() * 24));
          
          const isConverted = i < convertedCount;
          
          await prisma.affiliateClick.create({
            data: {
              affiliateId: affiliate.id,
              ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              referrer: ['https://facebook.com', 'https://instagram.com', 'https://twitter.com', 'https://google.com'][Math.floor(Math.random() * 4)],
              utmSource: ['social', 'organic', 'email', 'direct'][Math.floor(Math.random() * 4)],
              utmMedium: ['referral', 'post', 'story', 'ad'][Math.floor(Math.random() * 4)],
              utmCampaign: ['summer2024', 'winter2024', 'launch', 'general'][Math.floor(Math.random() * 4)],
              converted: isConverted,
              createdAt: randomDate,
            },
          });
        }

        // Update affiliate totals
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: {
            totalClicks: clicksCount,
            totalOrders: convertedCount,
            lastClickAt: new Date(),
          },
        });

        logger.info(`✅ Created affiliate: ${affiliateData.firstName} ${affiliateData.lastName} (${clicksCount} clicks, ${convertedCount} orders)`);
      }
    } else {
      logger.info(`ℹ️ ${existingAffiliates} affiliates already exist`);
    }

    logger.info('🎉 Database seed completed successfully');
  } catch (error) {
    logger.error('❌ Database seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seed };
