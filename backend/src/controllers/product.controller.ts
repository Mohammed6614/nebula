import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { storeService } from '../services/store.service';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export class ProductController {
  // List products (for merchant with storeId, or public with storeSlug)
  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, storeId, categoryId, search, minPrice, maxPrice, status, isActive } = req.query;
      
      let actualStoreId = storeId as string | undefined;
      
      // If merchant is requesting and no storeId provided, get their store
      if (req.user?.role === 'MERCHANT' && !actualStoreId) {
        const store = await storeService.getMyStore(req.user.id);
        actualStoreId = store.id;
      }
      
      const result = await productService.listProducts({
        page: Number(page),
        limit: Number(limit),
        storeId: actualStoreId,
        categoryId: categoryId as string,
        search: search as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        status: status as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        tenantId: req.user?.tenantId,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Products retrieved successfully',
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get product by ID
  async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const product = await productService.getProductById(productId, req.user?.tenantId, req.user?.role === 'MERCHANT');

      const response: ApiResponse = {
        success: true,
        message: 'Product retrieved successfully',
        data: { product },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get product by slug (public)
  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeSlug, productSlug } = req.params;
      const product = await productService.getProductBySlug(storeSlug, productSlug);

      const response: ApiResponse = {
        success: true,
        message: 'Product retrieved successfully',
        data: { product },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Create product (merchant only)
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can create products',
        });
      }

      // Get merchant's store
      const store = await storeService.getMyStore(req.user.id);
      
      const product = await productService.createProduct(store.id, store.tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Product created successfully',
        data: { product },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update product (merchant only)
  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can update products',
        });
      }

      const { productId } = req.params;
      const store = await storeService.getMyStore(req.user.id);
      
      const product = await productService.updateProduct(productId, store.id, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Product updated successfully',
        data: { product },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Delete product (merchant only)
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can delete products',
        });
      }

      const { productId } = req.params;
      const store = await storeService.getMyStore(req.user.id);
      
      await productService.deleteProduct(productId, store.id);

      const response: ApiResponse = {
        success: true,
        message: 'Product deleted successfully',
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
