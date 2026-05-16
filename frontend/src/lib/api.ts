import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }) => api.post('/auth/register', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getMySubscription: () => api.get('/subscriptions/my-subscription'),
  createSubscription: (plan: string) =>
    api.post('/subscriptions', { plan }),
  cancelSubscription: (subscriptionId: string, reason?: string) =>
    api.post(`/subscriptions/${subscriptionId}/cancel`, { reason }),
};

export const storeApi = {
  createStore: (data: Record<string, unknown>) => api.post('/stores', data),
  getMyStore: () => api.get('/stores/my-store'),
  getStoreBySlug: (slug: string) => api.get(`/stores/public/${slug}`),
  updateStore: (storeId: string, data: Record<string, unknown>) =>
    api.patch(`/stores/${storeId}`, data),
  getStoreStats: (storeId: string) => api.get(`/stores/${storeId}/stats`),
  listStores: (params?: Record<string, unknown>) =>
    api.get('/stores', { params }),
};

export const productApi = {
  listProducts: (params?: Record<string, unknown>) =>
    api.get('/products', { params }),
  getProduct: (productId: string) => api.get(`/products/${productId}`),
  getProductBySlug: (storeSlug: string, productSlug: string) =>
    api.get(`/products/public/${storeSlug}/${productSlug}`),
  createProduct: (data: Record<string, unknown>) =>
    api.post('/products', data),
  updateProduct: (productId: string, data: Record<string, unknown>) =>
    api.patch(`/products/${productId}`, data),
  deleteProduct: (productId: string) => api.delete(`/products/${productId}`),
};

export const orderApi = {
  createOrder: (data: Record<string, unknown>) => api.post('/orders', data),
  getMyOrders: (params?: Record<string, unknown>) =>
    api.get('/orders/my-orders', { params }),
  getStoreOrders: (storeId: string, params?: Record<string, unknown>) =>
    api.get(`/orders/store/${storeId}`, { params }),
  getOrder: (orderId: string) => api.get(`/orders/${orderId}`),
  updateOrderStatus: (orderId: string, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status }),
  verifyOrder: (orderId: string) => api.get(`/orders/${orderId}/verify`),
};

export const categoryApi = {
  listCategories: (storeId: string) =>
    api.get(`/stores/${storeId}/categories`),
  createCategory: (data: Record<string, unknown>) =>
    api.post('/categories', data),
  updateCategory: (categoryId: string, data: Record<string, unknown>) =>
    api.patch(`/categories/${categoryId}`, data),
  deleteCategory: (categoryId: string) =>
    api.delete(`/categories/${categoryId}`),
};

export const affiliateApi = {
  getMyAffiliate: () => api.get('/affiliates/my-affiliate'),
  getStats: () => api.get('/affiliates/stats'),
  getClicks: (params?: Record<string, unknown>) =>
    api.get('/affiliates/clicks', { params }),
  trackClick: (referralCode: string, data?: Record<string, unknown>) =>
    api.post(`/affiliates/track/${referralCode}`, data),

  // Dashboard
  getDashboardStats: () => api.get('/affiliates/dashboard-stats'),

  // Referral Links
  getReferralLinks: () => api.get('/affiliates/referral-links'),
  createReferralLink: (data: Record<string, unknown>) =>
    api.post('/affiliates/referral-links', data),
  updateReferralLink: (linkId: string, data: Record<string, unknown>) =>
    api.patch(`/affiliates/referral-links/${linkId}`, data),
  deleteReferralLink: (linkId: string) =>
    api.delete(`/affiliates/referral-links/${linkId}`),

  // Analytics
  getAnalytics: (params?: Record<string, unknown>) =>
    api.get('/affiliates/analytics', { params }),

  // Campaigns
  getCampaigns: () => api.get('/affiliates/campaigns'),
  createCampaign: (data: Record<string, unknown>) =>
    api.post('/affiliates/campaigns', data),
  updateCampaign: (campaignId: string, data: Record<string, unknown>) =>
    api.patch(`/affiliates/campaigns/${campaignId}`, data),
  updateCampaignStatus: (campaignId: string, status: string) =>
    api.patch(`/affiliates/campaigns/${campaignId}/status`, { status }),
  deleteCampaign: (campaignId: string) =>
    api.delete(`/affiliates/campaigns/${campaignId}`),

  // Conversions
  getConversions: (params?: Record<string, unknown>) =>
    api.get('/affiliates/conversions', { params }),

  // Promoted Stores
  getPromotedStores: () => api.get('/affiliates/promoted-stores'),

  // Collaboration
  getCollaborations: () => api.get('/affiliates/collaborations'),
  requestCollaboration: (data: Record<string, unknown>) =>
    api.post('/affiliates/collaborations', data),
  sendCollaborationMessage: (collaborationId: string, message: string) =>
    api.post(`/affiliates/collaborations/${collaborationId}/messages`, { message }),

  // QR Codes
  getQRCodes: () => api.get('/affiliates/qr-codes'),
  createQRCode: (data: Record<string, unknown>) =>
    api.post('/affiliates/qr-codes', data),
  deleteQRCode: (qrId: string) =>
    api.delete(`/affiliates/qr-codes/${qrId}`),

  // Subscription
  getCurrentSubscription: () => api.get('/affiliates/subscription'),
  getAvailablePlans: () => api.get('/affiliates/subscription/plans'),
  upgradeSubscription: (planId: string) =>
    api.post('/affiliates/subscription/upgrade', { planId }),
  cancelSubscription: () => api.post('/affiliates/subscription/cancel'),
  toggleAutoRenew: (enabled: boolean) =>
    api.patch('/affiliates/subscription/auto-renew', { enabled }),

  // Notifications
  getNotifications: () => api.get('/affiliates/notifications'),
  markNotificationAsRead: (notificationId: string) =>
    api.patch(`/affiliates/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => api.post('/affiliates/notifications/mark-all-read'),
  deleteNotification: (notificationId: string) =>
    api.delete(`/affiliates/notifications/${notificationId}`),
};

export const adminApi = {
  // Dashboard Stats
  getDashboardStats: () => api.get('/admin/dashboard-stats'),

  // User Management
  getUsers: (params?: Record<string, unknown>) =>
    api.get('/admin/users', { params }),
  updateUser: (userId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/${userId}`, data),

  // Store Management
  getStores: (params?: Record<string, unknown>) =>
    api.get('/admin/stores', { params }),
  toggleStoreStatus: (storeId: string) =>
    api.patch(`/admin/stores/${storeId}/toggle-status`),
  deleteStore: (storeId: string) =>
    api.delete(`/admin/stores/${storeId}`),

  // Subscription Management
  getSubscriptions: (params?: Record<string, unknown>) =>
    api.get('/admin/subscriptions', { params }),

  // Analytics
  getAnalytics: (params?: Record<string, unknown>) =>
    api.get('/admin/analytics', { params }),

  // Audit Logs
  getAuditLogs: (params?: Record<string, unknown>) =>
    api.get('/admin/audit-logs', { params }),
};

export const supervisorApi = {
  // Dashboard Stats
  getDashboardStats: () => api.get('/supervisor/dashboard-stats'),

  // Affiliate Monitoring
  getAffiliates: (params?: Record<string, unknown>) =>
    api.get('/supervisor/affiliates', { params }),
  getAffiliate: (affiliateId: string) =>
    api.get(`/supervisor/affiliates/${affiliateId}`),
  updateAffiliateStatus: (affiliateId: string, status: string) =>
    api.patch(`/supervisor/affiliates/${affiliateId}/status`, { status }),

  // Fraud Detection
  getFraudDetection: (params?: Record<string, unknown>) =>
    api.get('/supervisor/fraud-detection', { params }),

  // Reports
  getTopAffiliates: (params?: Record<string, unknown>) =>
    api.get('/supervisor/reports/top-affiliates', { params }),
  getTopLinks: (params?: Record<string, unknown>) =>
    api.get('/supervisor/reports/top-links', { params }),
  getActivityReport: (params?: Record<string, unknown>) =>
    api.get('/supervisor/reports/activity', { params }),
};

// Merchant Dashboard API
export const merchantApi = {
  // Store
  getMyStore: () => api.get('/stores/my-store'),
  updateStore: (storeId: string, data: Record<string, unknown>) =>
    api.patch(`/stores/${storeId}`, data),
  getStoreStats: (storeId: string) => api.get(`/stores/${storeId}/stats`),

  // Products
  getProducts: (params?: Record<string, unknown>) =>
    api.get('/products', { params }),
  getProduct: (productId: string) => api.get(`/products/${productId}`),
  createProduct: (data: Record<string, unknown>) =>
    api.post('/products', data),
  updateProduct: (productId: string, data: Record<string, unknown>) =>
    api.patch(`/products/${productId}`, data),
  deleteProduct: (productId: string) => api.delete(`/products/${productId}`),

  // Orders
  getStoreOrders: (storeId: string, params?: Record<string, unknown>) =>
    api.get(`/orders/store/${storeId}`, { params }),
  getOrder: (orderId: string) => api.get(`/orders/${orderId}`),
  updateOrderStatus: (orderId: string, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status }),
  verifyOrder: (orderId: string) => api.get(`/orders/${orderId}/verify`),

  // Categories
  getCategories: (storeId: string) =>
    api.get(`/stores/${storeId}/categories`),
  createCategory: (data: Record<string, unknown>) =>
    api.post('/categories', data),
  updateCategory: (categoryId: string, data: Record<string, unknown>) =>
    api.patch(`/categories/${categoryId}`, data),
  deleteCategory: (categoryId: string) =>
    api.delete(`/categories/${categoryId}`),

  // Payment Settings
  getPaymentSettings: (storeId: string) =>
    api.get(`/stores/${storeId}/payment-settings`),
  updatePaymentSettings: (storeId: string, data: Record<string, unknown>) =>
    api.patch(`/stores/${storeId}/payment-settings`, data),

  // Subscription
  getSubscription: () => api.get('/subscriptions/my-subscription'),
  createCheckout: (plan: string) =>
    api.post('/subscriptions/create-checkout', { plan }),
  cancelSubscription: () => api.post('/subscriptions/cancel'),
  getInvoices: () => api.get('/subscriptions/invoices'),

  // Affiliate Collaboration
  getAffiliateLinks: () => api.get('/affiliates/store-links'),
  generateAffiliateLink: () => api.post('/affiliates/generate-link'),
  getAffiliateSales: (params?: Record<string, unknown>) =>
    api.get('/affiliates/store-sales', { params }),
};

export default api;
