import { prisma } from '../config/database';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
}

interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  isActive?: boolean;
}

export class CategoryService {
  // Create category
  async createCategory(storeId: string, tenantId: string, input: CreateCategoryInput) {
    // Check if slug is unique within store
    const slugExists = await prisma.category.findUnique({
      where: {
        storeId_slug: {
          storeId,
          slug: input.slug,
        },
      },
    });

    if (slugExists) {
      throw new BadRequestError('Category slug already exists in this store');
    }

    // Validate parent if provided
    if (input.parentId) {
      const parent = await prisma.category.findFirst({
        where: {
          id: input.parentId,
          storeId,
        },
      });

      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }
    }

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        image: input.image,
        storeId,
        tenantId,
        parentId: input.parentId,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    logger.info(`Category created: ${category.id} in store ${storeId}`);

    return category;
  }

  // Get categories for store
  async getCategories(storeId: string, includeInactive = false) {
    const where: Record<string, unknown> = { storeId };

    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    // Return only root categories (those without parent)
    return categories.filter((cat) => !cat.parentId);
  }

  // Get category by ID
  async getCategoryById(categoryId: string, storeId: string, includeInactive = false) {
    const where: Record<string, unknown> = { id: categoryId, storeId };

    if (!includeInactive) {
      where.isActive = true;
    }

    const category = await prisma.category.findFirst({
      where,
      include: {
        parent: true,
        children: {
          where: includeInactive ? {} : { isActive: true },
        },
        products: {
          where: { isActive: true, status: 'ACTIVE' },
          take: 12,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: { take: 1, select: { url: true } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  // Get category by slug (public)
  async getCategoryBySlug(storeSlug: string, categorySlug: string) {
    const category = await prisma.category.findFirst({
      where: {
        slug: categorySlug,
        isActive: true,
        store: {
          slug: storeSlug,
          isActive: true,
        },
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
        },
        products: {
          where: { isActive: true, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            images: { take: 1, select: { url: true } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  // Update category
  async updateCategory(
    categoryId: string,
    storeId: string,
    input: UpdateCategoryInput
  ) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== category.slug) {
      const slugExists = await prisma.category.findUnique({
        where: {
          storeId_slug: {
            storeId,
            slug: input.slug,
          },
        },
      });

      if (slugExists) {
        throw new BadRequestError('Category slug already exists');
      }
    }

    // Validate parent
    if (input.parentId) {
      if (input.parentId === categoryId) {
        throw new BadRequestError('Category cannot be its own parent');
      }

      const parent = await prisma.category.findFirst({
        where: {
          id: input.parentId,
          storeId,
        },
      });

      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        image: input.image,
        isActive: input.isActive,
        parentId: input.parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    logger.info(`Category updated: ${categoryId}`);

    return updated;
  }

  // Delete category
  async deleteCategory(categoryId: string, storeId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId },
      include: {
        children: true,
        products: { take: 1 },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if has children
    if (category.children.length > 0) {
      throw new BadRequestError('Cannot delete category with subcategories');
    }

    // Check if has products
    if (category.products.length > 0) {
      throw new BadRequestError('Cannot delete category with products');
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    logger.info(`Category deleted: ${categoryId}`);
  }
}

export const categoryService = new CategoryService();
