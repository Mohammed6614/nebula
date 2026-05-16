import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { storeService } from '../services/store.service';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

export class CategoryController {
  // Get categories for store
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = req.params;
      const includeInactive = req.query.includeInactive === 'true' || req.user?.role === 'MERCHANT';
      
      const categories = await categoryService.getCategories(storeId, includeInactive);

      const response: ApiResponse = {
        success: true,
        message: 'Categories retrieved successfully',
        data: { categories },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get category by ID
  async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const storeId = req.query.storeId as string;
      const includeInactive = req.user?.role === 'MERCHANT';
      
      const category = await categoryService.getCategoryById(categoryId, storeId, includeInactive);

      const response: ApiResponse = {
        success: true,
        message: 'Category retrieved successfully',
        data: { category },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get category by slug (public)
  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeSlug, categorySlug } = req.params;
      
      const category = await categoryService.getCategoryBySlug(storeSlug, categorySlug);

      const response: ApiResponse = {
        success: true,
        message: 'Category retrieved successfully',
        data: { category },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Create category (merchant only)
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can create categories',
        });
      }

      // Get merchant's store
      const store = await storeService.getMyStore(req.user.id);
      
      const category = await categoryService.createCategory(store.id, store.tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Category created successfully',
        data: { category },
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update category (merchant only)
  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can update categories',
        });
      }

      const { categoryId } = req.params;
      const store = await storeService.getMyStore(req.user.id);
      
      const category = await categoryService.updateCategory(categoryId, store.id, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Category updated successfully',
        data: { category },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Delete category (merchant only)
  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'MERCHANT') {
        return res.status(403).json({
          success: false,
          message: 'Only merchants can delete categories',
        });
      }

      const { categoryId } = req.params;
      const store = await storeService.getMyStore(req.user.id);
      
      await categoryService.deleteCategory(categoryId, store.id);

      const response: ApiResponse = {
        success: true,
        message: 'Category deleted successfully',
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
