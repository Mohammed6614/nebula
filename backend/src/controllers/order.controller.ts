import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { storeService } from '../services/store.service';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export class OrderController {
  // Create order (customer)
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { storeId } = req.body;
      const order = await orderService.createOrder(req.user.id, storeId, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Order created successfully',
        data: { order },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get my orders (customer)
  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { page = 1, limit = 10, status } = req.query;
      
      const result = await orderService.listOrders({
        page: Number(page),
        limit: Number(limit),
        customerId: req.user.id,
        status: status as string,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get store orders (merchant)
  async getStoreOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can view store orders',
        });
      }

      const { storeId } = req.params;
      const { page = 1, limit = 10, status, paymentStatus } = req.query;
      
      const result = await orderService.listOrders({
        page: Number(page),
        limit: Number(limit),
        storeId,
        status: status as string,
        paymentStatus: paymentStatus as string,
        tenantId: req.user.tenantId,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get order by ID
  async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { orderId } = req.params;
      const order = await orderService.getOrderById(
        orderId,
        req.user.id,
        req.user.role,
        req.user.tenantId
      );

      const response: ApiResponse = {
        success: true,
        message: 'Order retrieved successfully',
        data: { order },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update order status (merchant)
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can update order status',
        });
      }

      const { orderId } = req.params;
      const { status } = req.body;
      
      // Get merchant's store
      const store = await storeService.getMyStore(req.user.id);
      
      const order = await orderService.updateOrderStatus(orderId, store.id, status);

      const response: ApiResponse = {
        success: true,
        message: 'Order status updated successfully',
        data: { order },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Verify order via QR code
  async verifyOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { orderId } = req.params;
      const order = await orderService.verifyOrder(
        orderId,
        req.user.id,
        req.user.role,
        req.user.tenantId
      );

      const response: ApiResponse = {
        success: true,
        message: 'Order verified successfully',
        data: { order },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { orderId } = req.params;
      const { reason } = req.body;
      
      const order = await orderService.cancelOrder(orderId, req.user.id, reason);

      const response: ApiResponse = {
        success: true,
        message: 'Order cancelled successfully',
        data: { order },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
