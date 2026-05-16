import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedUser, UserRole } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { prisma } from '../config/database';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        isEmailVerified: true,
        hasCompletedOnboarding: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Account suspended');
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      isEmailVerified: user.isEmailVerified,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}

export function requireEmailVerified(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  if (!req.user.isEmailVerified) {
    next(new ForbiddenError('Email verification required'));
    return;
  }

  next();
}

export function requireOnboarding(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  // Skip for admin and supervisor (no onboarding needed)
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPERVISOR') {
    next();
    return;
  }

  if (!req.user.hasCompletedOnboarding) {
    next(new ForbiddenError('Onboarding required', { 
      requiresOnboarding: true,
      role: req.user.role 
    }));
    return;
  }

  next();
}

// Multi-tenant middleware
export function requireTenantAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  // System admins can access all tenants
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPERVISOR') {
    next();
    return;
  }

  // Users must have a tenant ID
  if (!req.user.tenantId) {
    next(new ForbiddenError('No tenant assigned'));
    return;
  }

  next();
}
