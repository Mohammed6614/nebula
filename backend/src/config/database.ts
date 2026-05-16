import { PrismaClient } from '@prisma/client';
import { env } from './env';
import logger from '../utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDatabase(maxRetries = 3, timeoutMs = 5000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`⏳ Database connection attempt ${attempt}/${maxRetries}...`);
      
      // Add timeout to prevent hanging
      const connectPromise = prisma.$connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      logger.info('✅ Database connected successfully');
      return;
    } catch (error) {
      logger.error(`❌ Database connection attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        logger.error('❌ All database connection attempts failed');
        throw error;
      }
      
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
