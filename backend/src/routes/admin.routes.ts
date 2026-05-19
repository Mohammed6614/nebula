import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import adminController from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin/supervisor role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPERVISOR'));

// ===========================================
// GLOBAL OVERVIEW DASHBOARD
// ===========================================
router.get('/dashboard-stats', adminController.getDashboardStats.bind(adminController));
router.get('/revenue-analytics', adminController.getRevenueAnalytics.bind(adminController));
router.get('/growth-metrics', adminController.getGrowthMetrics.bind(adminController));
router.get('/recent-activity', adminController.getRecentActivity.bind(adminController));

// ===========================================
// USER MANAGEMENT
// ===========================================
router.get('/users', adminController.getUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.patch('/users/:id', adminController.updateUser.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));
router.get('/users/:id/activity-logs', adminController.getUserActivityLogs.bind(adminController));

// ===========================================
// STORE MANAGEMENT
// ===========================================
router.get('/stores', adminController.getStores.bind(adminController));
router.get('/stores/:id', adminController.getStoreById.bind(adminController));
router.patch('/stores/:id/toggle-status', adminController.toggleStoreStatus.bind(adminController));
router.delete('/stores/:id', adminController.deleteStore.bind(adminController));
router.get('/stores/:id/health', adminController.getStoreHealth.bind(adminController));

// ===========================================
// SUBSCRIPTION MANAGEMENT
// ===========================================
router.get('/subscriptions', adminController.getSubscriptions.bind(adminController));
router.get('/subscriptions/:id', adminController.getSubscriptionById.bind(adminController));
router.patch('/subscriptions/:id/cancel', adminController.cancelSubscription.bind(adminController));

// ===========================================
// PAYMENTS & TRANSACTIONS
// ===========================================
router.get('/payments', adminController.getPayments.bind(adminController));
router.get('/payments/:id', adminController.getPaymentById.bind(adminController));

// ===========================================
// ANALYTICS & BUSINESS INTELLIGENCE
// ===========================================
router.get('/analytics', adminController.getAnalytics.bind(adminController));
router.get('/analytics/export', adminController.exportAnalyticsReport.bind(adminController));

// ===========================================
// SECURITY CENTER
// ===========================================
router.get('/security-events', adminController.getSecurityEvents.bind(adminController));
router.get('/security/blocked-ips', adminController.getBlockedIPs.bind(adminController));
router.post('/security/block-ip', adminController.blockIP.bind(adminController));
router.delete('/security/block-ip/:ip', adminController.unblockIP.bind(adminController));

// ===========================================
// AUDIT LOGS
// ===========================================
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

// ===========================================
// NOTIFICATIONS
// ===========================================
router.get('/notifications', adminController.getAdminNotifications.bind(adminController));
router.patch('/notifications/:id/read', adminController.markNotificationAsRead.bind(adminController));
router.patch('/notifications/read-all', adminController.markAllNotificationsAsRead.bind(adminController));

// ===========================================
// SUPPORT & TICKETING SYSTEM
// ===========================================
router.get('/support-tickets', adminController.getSupportTickets.bind(adminController));
router.get('/support-tickets/:id', adminController.getSupportTicketById.bind(adminController));
router.patch('/support-tickets/:id', adminController.updateSupportTicket.bind(adminController));
router.post('/support-tickets/:id/reply', adminController.replyToSupportTicket.bind(adminController));
router.patch('/support-tickets/:id/close', adminController.closeSupportTicket.bind(adminController));

// ===========================================
// PLATFORM SETTINGS
// ===========================================
router.get('/settings', adminController.getPlatformSettings.bind(adminController));
router.patch('/settings/:key', adminController.updatePlatformSetting.bind(adminController));

// ===========================================
// FEATURE FLAGS
// ===========================================
router.get('/feature-flags', adminController.getFeatureFlags.bind(adminController));
router.post('/feature-flags', adminController.createFeatureFlag.bind(adminController));
router.patch('/feature-flags/:id', adminController.updateFeatureFlag.bind(adminController));
router.delete('/feature-flags/:id', adminController.deleteFeatureFlag.bind(adminController));
router.get('/feature-flags/:name/check', adminController.checkFeatureFlag.bind(adminController));

export default router;
