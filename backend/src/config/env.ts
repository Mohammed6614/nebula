import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  API_URL: z.string().default('http://localhost:5000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().optional().default('postgresql://localhost:5432/nebula'),
  DIRECT_URL: z.string().optional().default('postgresql://localhost:5432/nebula'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32).optional().default('default_jwt_secret_that_is_at_least_32_chars_long_for_dev'),
  JWT_REFRESH_SECRET: z.string().min(32).optional().default('default_refresh_secret_that_is_at_least_32_chars_long_for_dev'),
  JWT_EXPIRE: z.string().default('7d'),
  JWT_REFRESH_EXPIRE: z.string().default('30d'),

  // Email
  EMAIL_SERVICE: z.string().default('gmail'),
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.string().transform(Number).default('587'),
  EMAIL_SECURE: z.string().transform((val) => val === 'true').default('false'),
  EMAIL_USER: z.string().email().optional().default('noreply@nebula.sa'),
  EMAIL_PASS: z.string().optional().default(''),
  EMAIL_FROM_NAME: z.string().default('NEBULA Platform'),
  EMAIL_FROM_ADDRESS: z.string().email().optional().default('noreply@nebula.sa'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  // PayPal
  PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string().optional().default(''),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(''),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Tabby
  TABBY_PUBLIC_KEY: z.string().optional(),
  TABBY_SECRET_KEY: z.string().optional(),
  TABBY_MERCHANT_CODE: z.string().optional(),

  // Tamara
  TAMARA_API_URL: z.string().url().default('https://api.tamara.co'),
  TAMARA_API_KEY: z.string().optional(),
  TAMARA_API_SECRET: z.string().optional(),

  // Mada (HyperPay)
  HYPERPAY_ENTITY_ID: z.string().optional(),
  HYPERPAY_AUTHORIZATION: z.string().optional(),
  HYPERPAY_BASE_URL: z.string().url().default('https://test.oppwa.com'),

  // Security
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Platform
  PLATFORM_NAME: z.string().default('NEBULA'),
  PLATFORM_CURRENCY: z.string().default('SAR'),
  PLATFORM_VAT_PERCENTAGE: z.string().transform(Number).default('15'),
  PLATFORM_TIMEZONE: z.string().default('Asia/Riyadh'),
  PLATFORM_LOCALE: z.string().default('ar-SA'),

  // Subscription Plans
  MERCHANT_PLAN_BASIC_PRICE: z.string().transform(Number).default('99'),
  MERCHANT_PLAN_PRO_PRICE: z.string().transform(Number).default('299'),
  MERCHANT_PLAN_ENTERPRISE_PRICE: z.string().transform(Number).default('799'),
  AFFILIATE_PLAN_PRICE: z.string().transform(Number).default('49'),
  FIRST_MONTH_DISCOUNT_PERCENTAGE: z.string().transform(Number).default('50'),

  // Admin Accounts
  ADMIN_EMAIL: z.string().email().optional().default('admin@nebula.sa'),
  ADMIN_PASSWORD: z.string().min(8).optional().default('AdminPassword123'),
  SUPERVISOR_EMAIL: z.string().email().optional().default('supervisor@nebula.sa'),
  SUPERVISOR_PASSWORD: z.string().min(8).optional().default('SupervisorPass123'),
});

// Parse with better error handling
console.log('📝 Validating environment variables...');
let env: Env;
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

try {
  env = envSchema.parse(process.env);
  console.log('✅ Environment variables validated');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    if (!isDev) {
      process.exit(1);
    }
    console.warn('⚠️ Continuing with defaults in development mode...');
    env = envSchema.parse({});
  } else {
    console.error('❌ Unknown error during env validation:', error);
    if (!isDev) {
      process.exit(1);
    }
    env = envSchema.parse({});
  }
}

export { env };
export type Env = z.infer<typeof envSchema>;
