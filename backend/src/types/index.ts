import { UserRole, UserStatus, SubscriptionStatus, SubscriptionPlan, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// Re-export Prisma enums
export { UserRole, UserStatus, SubscriptionStatus, SubscriptionPlan, OrderStatus, PaymentStatus, PaymentMethod };

// Auth Types
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string | null;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  iat?: number;
  exp?: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Subscription Types
export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  regularPrice: number;
  features: string[];
  isPopular?: boolean;
}

// Payment Types
export interface PaymentGatewayConfig {
  gateway: PaymentMethod;
  isEnabled: boolean;
  config: Record<string, string>;
}

export interface CreatePaymentIntent {
  amount: number;
  currency: string;
  orderId?: string;
  subscriptionId?: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

// Order Types
export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

// Affiliate Types
export interface AffiliateStats {
  totalClicks: number;
  totalOrders: number;
  conversionRate: number;
  clicksToday: number;
  ordersToday: number;
}

// Analytics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: OrderStatus;
    createdAt: Date;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
}

// Notification Types
export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// Webhook Types
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
  signature?: string;
}

// File Upload
export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

// Cache Keys
export enum CacheKeys {
  USER = 'user',
  STORE = 'store',
  PRODUCT = 'product',
  ORDER = 'order',
  SUBSCRIPTION = 'subscription',
  DASHBOARD_STATS = 'dashboard:stats',
}

// Multi-tenant
export interface TenantContext {
  tenantId: string;
  isSystemAdmin: boolean;
}
