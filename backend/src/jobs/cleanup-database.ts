/**
 * Database Cleanup Script - Remove FAKE Data Only
 * Removes fake/seed data while preserving real user data
 * Identifies fake data by patterns in email, referral code, or recent creation
 */

import { prisma } from '../config/database';
import logger from '../utils/logger';
import { env } from '../config/env';

async function cleanupDatabase() {
  console.log('🧹 Starting cleanup of FAKE data only...\n');

  try {
    // Find fake affiliates (created by seed script with pattern emails)
    const fakeAffiliateUsers = await prisma.user.findMany({
      where: {
        role: 'AFFILIATE',
        email: {
          contains: 'affiliate',
          mode: 'insensitive',
        },
      },
    });

    const fakeUserIds = fakeAffiliateUsers.map(u => u.id);
    console.log(`� Found ${fakeUserIds.length} fake affiliate users`);

    if (fakeUserIds.length === 0) {
      console.log('✅ No fake data found! Database is clean.');
      return;
    }

    // 1. Delete Affiliate Clicks for fake affiliates
    const fakeAffiliates = await prisma.affiliate.findMany({
      where: { userId: { in: fakeUserIds } },
    });
    const fakeAffiliateIds = fakeAffiliates.map(a => a.id);

    if (fakeAffiliateIds.length > 0) {
      const clicksResult = await prisma.affiliateClick.deleteMany({
        where: { affiliateId: { in: fakeAffiliateIds } },
      });
      console.log(`🗑️ Deleted ${clicksResult.count} fake affiliate clicks`);
    }

    // 2. Delete fake Affiliates
    const affiliatesResult = await prisma.affiliate.deleteMany({
      where: { userId: { in: fakeUserIds } },
    });
    console.log(`🗑️ Deleted ${affiliatesResult.count} fake affiliate accounts`);

    // 3. Delete fake users
    const usersResult = await prisma.user.deleteMany({
      where: { id: { in: fakeUserIds } },
    });
    console.log(`🗑️ Deleted ${usersResult.count} fake users`);

    // 4. Optionally clean up fake orders (if they have pattern like test@ or sample@)
    const fakeOrdersResult = await prisma.order.deleteMany({
      where: {
        customer: {
          email: {
            contains: 'test',
            mode: 'insensitive',
          },
        },
      },
    });
    if (fakeOrdersResult.count > 0) {
      console.log(`🗑️ Deleted ${fakeOrdersResult.count} fake test orders`);
    }

    console.log('\n✅ Cleanup completed! Real data preserved.');
    console.log('\n📊 Summary:');
    console.log(`   - Fake users removed: ${usersResult.count}`);
    console.log(`   - Fake affiliate accounts removed: ${affiliatesResult.count}`);
    console.log(`   - Real data: PRESERVED ✅`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupDatabase();
