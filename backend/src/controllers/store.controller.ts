import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storeService } from '../services/store.service';
import { categoryService } from '../services/category.service';
import { ApiResponse } from '../types';

const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Store name is required'),
    slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().default('SA'),
    logo: z.string().optional(),
    coverImage: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }),
});

const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    logo: z.string().optional(),
    coverImage: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const listStoresSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('10'),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    isVerified: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  }),
});

export const storeController = {
  // Create store (merchant onboarding)
  async createStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const validated = createStoreSchema.parse({ body: req.body });
      const store = await storeService.createStore(req.user.id, validated.body);

      const response: ApiResponse = {
        success: true,
        message: 'Store created successfully',
        data: { store },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get my store
  async getMyStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const store = await storeService.getMyStore(req.user.id);

      const response: ApiResponse = {
        success: true,
        message: 'Store retrieved successfully',
        data: { store },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get public store by slug
  async getStoreBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const store = await storeService.getStoreBySlug(slug);

      const response: ApiResponse = {
        success: true,
        message: 'Store retrieved successfully',
        data: { store },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Update store
  async updateStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { storeId } = req.params;
      const validated = updateStoreSchema.parse({ body: req.body });

      const store = await storeService.updateStore(
        storeId,
        req.user.id,
        req.user.role,
        validated.body
      );

      const response: ApiResponse = {
        success: true,
        message: 'Store updated successfully',
        data: { store },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // List stores (admin only)
  async listStores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = listStoresSchema.parse({ query: req.query });
      const result = await storeService.listStores({
        page: validated.query.page,
        limit: validated.query.limit,
        search: validated.query.search,
        isActive: validated.query.isActive,
        isVerified: validated.query.isVerified,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Stores retrieved successfully',
        data: {
          stores: result.stores,
          meta: result.meta,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get store stats
  async getStoreStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { storeId } = req.params;
      const stats = await storeService.getStoreStats(
        storeId,
        req.user.id,
        req.user.role
      );

      const response: ApiResponse = {
        success: true,
        message: 'Store stats retrieved successfully',
        data: { stats },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get store categories (public)
  async getStoreCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.params;
      const categories = await categoryService.getCategories(storeId);

      const response: ApiResponse = {
        success: true,
        message: 'Categories retrieved successfully',
        data: { categories },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },
};

export const storeValidations = {
  createStore: createStoreSchema,
  updateStore: updateStoreSchema,
  listStores: listStoresSchema,
};
