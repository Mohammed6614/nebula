import { prisma } from '../config/database';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  inventoryQuantity: number;
  inventoryTracked: boolean;
  lowStockThreshold?: number;
  categoryId?: string;
  images?: Array<{ url: string; alt?: string; position?: number }>;
  variants?: Array<{
    title: string;
    sku?: string;
    price: number;
    compareAtPrice?: number;
    inventoryQuantity: number;
    options?: Record<string, string>;
  }>;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  isActive?: boolean;
}

interface UpdateProductInput extends Partial<CreateProductInput> {}

interface ListProductsParams {
  page: number;
  limit: number;
  storeId?: string;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  isActive?: boolean;
  tenantId?: string;
}

export class ProductService {
  // Create product
  async createProduct(storeId: string, tenantId: string, input: CreateProductInput) {
    // Check if slug is unique within store
    const slugExists = await prisma.product.findUnique({
      where: {
        storeId_slug: {
          storeId,
          slug: input.slug,
        },
      },
    });

    if (slugExists) {
      throw new BadRequestError('Product slug already exists in this store');
    }

    // Verify category belongs to store
    if (input.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: input.categoryId,
          storeId,
        },
      });

      if (!category) {
        throw new BadRequestError('Category not found in this store');
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        sku: input.sku,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        costPerItem: input.costPerItem,
        inventoryQuantity: input.inventoryQuantity,
        inventoryTracked: input.inventoryTracked ?? true,
        lowStockThreshold: input.lowStockThreshold ?? 5,
        status: input.status ?? 'DRAFT',
        isActive: input.isActive ?? false,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        storeId,
        tenantId,
        categoryId: input.categoryId,
        images: input.images ? {
          create: input.images.map((img, index) => ({
            url: img.url,
            alt: img.alt || input.name,
            position: img.position ?? index,
          })),
        } : undefined,
        variants: input.variants ? {
          create: input.variants.map((variant) => ({
            title: variant.title,
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            inventoryQuantity: variant.inventoryQuantity,
            options: variant.options,
          })),
        } : undefined,
      },
      include: {
        images: true,
        variants: true,
        category: true,
      },
    });

    logger.info(`Product created: ${product.id} in store ${storeId}`);

    return product;
  }

  // Get product by ID
  async getProductById(productId: string, tenantId?: string, includeInactive = false) {
    const where: Record<string, unknown> = { id: productId };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (!includeInactive) {
      where.isActive = true;
      where.status = 'ACTIVE';
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        variants: true,
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  // Get product by slug (public)
  async getProductBySlug(storeSlug: string, productSlug: string) {
    const product = await prisma.product.findFirst({
      where: {
        slug: productSlug,
        isActive: true,
        status: 'ACTIVE',
        store: {
          slug: storeSlug,
          isActive: true,
        },
      },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        variants: true,
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  // List products
  async listProducts(params: ListProductsParams) {
    const { page, limit, storeId, categoryId, search, minPrice, maxPrice, status, isActive, tenantId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (storeId) {
      where.storeId = storeId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        (where.price as Record<string, number>).gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (where.price as Record<string, number>).lte = maxPrice;
      }
    }

    if (status) {
      where.status = status;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            take: 1,
            orderBy: { position: 'asc' },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          store: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { variants: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update product
  async updateProduct(productId: string, storeId: string, input: UpdateProductInput) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== product.slug) {
      const slugExists = await prisma.product.findUnique({
        where: {
          storeId_slug: {
            storeId,
            slug: input.slug,
          },
        },
      });

      if (slugExists) {
        throw new BadRequestError('Product slug already exists in this store');
      }
    }

    // Update product
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        sku: input.sku,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        costPerItem: input.costPerItem,
        inventoryQuantity: input.inventoryQuantity,
        inventoryTracked: input.inventoryTracked,
        lowStockThreshold: input.lowStockThreshold,
        status: input.status,
        isActive: input.isActive,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        categoryId: input.categoryId,
      },
      include: {
        images: true,
        variants: true,
        category: true,
      },
    });

    logger.info(`Product updated: ${productId}`);

    return updated;
  }

  // Delete product
  async deleteProduct(productId: string, storeId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    logger.info(`Product deleted: ${productId}`);
  }

  // Update inventory
  async updateInventory(productId: string, storeId: string, quantity: number) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { inventoryQuantity: quantity },
    });

    return updated;
  }

  // Add product images
  async addProductImages(
    productId: string,
    storeId: string,
    images: Array<{ url: string; alt?: string; position?: number }>
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await prisma.productImage.createMany({
      data: images.map((img, index) => ({
        url: img.url,
        alt: img.alt || product.name,
        position: img.position ?? index,
        productId,
      })),
    });

    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });
  }

  // Delete product image
  async deleteProductImage(productId: string, storeId: string, imageId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await prisma.productImage.deleteMany({
      where: { id: imageId, productId },
    });
  }
}

export const productService = new ProductService();
