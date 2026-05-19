import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  // ===========================================
  // GLOBAL OVERVIEW DASHBOARD
  // ===========================================

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.adminService.getDashboardStats();
      
      const response: ApiResponse = {
        success: true,
        message: 'Dashboard stats retrieved successfully',
        data: stats,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getRevenueAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30' } = req.query;
      const analytics = await this.adminService.getRevenueAnalytics(parseInt(period as string));
      
      const response: ApiResponse = {
        success: true,
        message: 'Revenue analytics retrieved successfully',
        data: analytics,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching revenue analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue analytics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getGrowthMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30' } = req.query;
      const metrics = await this.adminService.getGrowthMetrics(parseInt(period as string));
      
      const response: ApiResponse = {
        success: true,
        message: 'Growth metrics retrieved successfully',
        data: metrics,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching growth metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch growth metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '20' } = req.query;
      const activity = await this.adminService.getRecentActivity(parseInt(limit as string));
      
      const response: ApiResponse = {
        success: true,
        message: 'Recent activity retrieved successfully',
        data: activity,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // USER MANAGEMENT
  // ===========================================

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', search, role, status } = req.query;
      const result = await this.adminService.getUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        role: role as string,
        status: status as string,
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.adminService.getUserById(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: user,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await this.adminService.updateUser(id, updates);
      
      const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: user,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.adminService.deleteUser(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = '1', limit = '50' } = req.query;
      const logs = await this.adminService.getUserActivityLogs(id, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'User activity logs retrieved successfully',
        data: logs,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching user activity logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activity logs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // STORE MANAGEMENT
  // ===========================================

  async getStores(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', search, isActive, status } = req.query;
      const result = await this.adminService.getStores({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        isActive: isActive === 'true',
        status: status as string,
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Stores retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching stores:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stores',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getStoreById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const store = await this.adminService.getStoreById(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Store retrieved successfully',
        data: store,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching store:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch store',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async toggleStoreStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const store = await this.adminService.toggleStoreStatus(id);
      
      const response: ApiResponse = {
        success: true,
        message: `Store ${store.isActive ? 'activated' : 'suspended'} successfully`,
        data: store,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error toggling store status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle store status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteStore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.adminService.deleteStore(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Store deleted successfully',
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error deleting store:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete store',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getStoreHealth(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const health = await this.adminService.getStoreHealth(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Store health retrieved successfully',
        data: health,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching store health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch store health',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // SUBSCRIPTION MANAGEMENT
  // ===========================================

  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', status, plan } = req.query;
      const result = await this.adminService.getSubscriptions({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        plan: plan as string,
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching subscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscriptions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getSubscriptionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const subscription = await this.adminService.getSubscriptionById(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Subscription retrieved successfully',
        data: subscription,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const subscription = await this.adminService.cancelSubscription(id, reason);
      
      const response: ApiResponse = {
        success: true,
        message: 'Subscription cancelled successfully',
        data: subscription,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // PAYMENTS & TRANSACTIONS
  // ===========================================

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', status, type, gateway } = req.query;
      const result = await this.adminService.getPayments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        type: type as string,
        gateway: gateway as string,
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Payments retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await this.adminService.getPaymentById(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // ANALYTICS & BUSINESS INTELLIGENCE
  // ===========================================

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30' } = req.query;
      const analytics = await this.adminService.getAnalytics(parseInt(period as string));
      
      const response: ApiResponse = {
        success: true,
        message: 'Analytics retrieved successfully',
        data: analytics,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async exportAnalyticsReport(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30', format = 'csv' } = req.query;
      const report = await this.adminService.exportAnalyticsReport(
        parseInt(period as string),
        format as string
      );
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.csv');
        res.send(report);
      } else {
        const response: ApiResponse = {
          success: true,
          message: 'Analytics report generated successfully',
          data: report,
        };
        res.json(response);
      }
    } catch (error) {
      logger.error('Error exporting analytics report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // SECURITY CENTER
  // ===========================================

  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '50', type, severity } = req.query;
      const result = await this.adminService.getSecurityEvents({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string,
        severity: severity as string,
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Security events retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching security events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security events',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getBlockedIPs(req: Request, res: Response): Promise<void> {
    try {
      const blockedIPs = await this.adminService.getBlockedIPs();
      
      const response: ApiResponse = {
        success: true,
        message: 'Blocked IPs retrieved successfully',
        data: blockedIPs,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching blocked IPs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blocked IPs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async blockIP(req: Request, res: Response): Promise<void> {
    try {
      const { ip, reason } = req.body;
      await this.adminService.blockIP(ip, reason);
      
      const response: ApiResponse = {
        success: true,
        message: 'IP blocked successfully',
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error blocking IP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to block IP',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async unblockIP(req: Request, res: Response): Promise<void> {
    try {
      const { ip } = req.params;
      await this.adminService.unblockIP(ip);
      
      const response: ApiResponse = {
        success: true,
        message: 'IP unblocked successfully',
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error unblocking IP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unblock IP',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // AUDIT LOGS
  // ===========================================

  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '50', userId, action, entity } = req.query;
      const result = await this.adminService.getAuditLogs({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        userId: userId as string,
        action: action as string,
        entity: entity as string,
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // NOTIFICATIONS
  // ===========================================

  async getAdminNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', unreadOnly } = req.query;
      const result = await this.adminService.getAdminNotifications({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unreadOnly === 'true',
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Admin notifications retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching admin notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.adminService.markNotificationAsRead(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Notification marked as read',
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      await this.adminService.markAllNotificationsAsRead();
      
      const response: ApiResponse = {
        success: true,
        message: 'All notifications marked as read',
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // SUPPORT & TICKETING SYSTEM
  // ===========================================

  async getSupportTickets(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', status, priority, category } = req.query;
      const result = await this.adminService.getSupportTickets({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        priority: priority as string,
        category: category as string,
      });
      
      const response: ApiResponse = {
        success: true,
        message: 'Support tickets retrieved successfully',
        data: result,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching support tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch support tickets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getSupportTicketById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await this.adminService.getSupportTicketById(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Support ticket retrieved successfully',
        data: ticket,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch support ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateSupportTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const ticket = await this.adminService.updateSupportTicket(id, updates);
      
      const response: ApiResponse = {
        success: true,
        message: 'Support ticket updated successfully',
        data: ticket,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error updating support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update support ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async replyToSupportTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      const ticket = await this.adminService.replyToSupportTicket(id, reply);
      
      const response: ApiResponse = {
        success: true,
        message: 'Reply added successfully',
        data: ticket,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error replying to support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reply to support ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async closeSupportTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await this.adminService.closeSupportTicket(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Support ticket closed successfully',
        data: ticket,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error closing support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to close support ticket',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // PLATFORM SETTINGS
  // ===========================================

  async getPlatformSettings(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const settings = await this.adminService.getPlatformSettings(category as string);
      
      const response: ApiResponse = {
        success: true,
        message: 'Platform settings retrieved successfully',
        data: settings,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching platform settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch platform settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updatePlatformSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await this.adminService.updatePlatformSetting(key, value);
      
      const response: ApiResponse = {
        success: true,
        message: 'Platform setting updated successfully',
        data: setting,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error updating platform setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update platform setting',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ===========================================
  // FEATURE FLAGS
  // ===========================================

  async getFeatureFlags(req: Request, res: Response): Promise<void> {
    try {
      const { enabled, plan } = req.query;
      const flags = await this.adminService.getFeatureFlags(
        enabled === 'true',
        plan as string
      );
      
      const response: ApiResponse = {
        success: true,
        message: 'Feature flags retrieved successfully',
        data: flags,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching feature flags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feature flags',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const flagData = req.body;
      const flag = await this.adminService.createFeatureFlag(flagData);
      
      const response: ApiResponse = {
        success: true,
        message: 'Feature flag created successfully',
        data: flag,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error creating feature flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create feature flag',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const flag = await this.adminService.updateFeatureFlag(id, updates);
      
      const response: ApiResponse = {
        success: true,
        message: 'Feature flag updated successfully',
        data: flag,
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error updating feature flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feature flag',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.adminService.deleteFeatureFlag(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Feature flag deleted successfully',
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error deleting feature flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete feature flag',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const { plan } = req.query;
      const isEnabled = await this.adminService.checkFeatureFlag(name, plan as string);
      
      const response: ApiResponse = {
        success: true,
        message: 'Feature flag checked successfully',
        data: { name, enabled: isEnabled },
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error checking feature flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check feature flag',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AdminController();
