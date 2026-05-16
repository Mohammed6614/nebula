import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate, requireRole, requireOnboarding } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/public/:storeSlug/:categorySlug', categoryController.getCategoryBySlug);

// Protected routes
router.get('/store/:storeId', categoryController.getCategories);
router.get('/:categoryId', authenticate, categoryController.getCategory);

// Merchant only routes
router.post('/', authenticate, requireRole('MERCHANT'), requireOnboarding, categoryController.createCategory);
router.patch('/:categoryId', authenticate, requireRole('MERCHANT'), requireOnboarding, categoryController.updateCategory);
router.delete('/:categoryId', authenticate, requireRole('MERCHANT'), requireOnboarding, categoryController.deleteCategory);

export default router;
