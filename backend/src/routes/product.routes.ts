import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate, requireRole, requireOnboarding } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/public/:storeSlug/:productSlug', productController.getProductBySlug);

// Protected routes (merchant only)
router.get('/', authenticate, productController.listProducts);
router.post('/', authenticate, requireRole('MERCHANT'), requireOnboarding, productController.createProduct);
router.get('/:productId', authenticate, productController.getProduct);
router.patch('/:productId', authenticate, requireRole('MERCHANT'), requireOnboarding, productController.updateProduct);
router.delete('/:productId', authenticate, requireRole('MERCHANT'), requireOnboarding, productController.deleteProduct);

export default router;
