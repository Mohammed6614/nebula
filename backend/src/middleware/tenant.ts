import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// Multi-tenant middleware to ensure tenant isolation
export function tenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  // Admins and supervisors can access all data
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPERVISOR') {
    next();
    return;
  }

  // For other roles, add tenant filter to query
  if (req.user.tenantId) {
    // Store tenant context for use in controllers
    req.tenantId = req.user.tenantId;
    req.isSystemAdmin = false;
  } else {
    next(new ForbiddenError('No tenant assigned to user'));
    return;
  }

  next();
}

// Middleware to extract tenant from subdomain or header
export function extractTenant(req: Request, _res: Response, next: NextFunction): void {
  // Try to get tenant from subdomain
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];

  // If subdomain is not www or api, treat it as store slug
  if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'localhost') {
    req.storeSlug = subdomain;
  }

  // Also check header for tenant
  const tenantHeader = req.headers['x-tenant-id'];
  if (tenantHeader) {
    req.tenantIdFromHeader = String(tenantHeader);
  }

  next();
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      isSystemAdmin?: boolean;
      storeSlug?: string;
      tenantIdFromHeader?: string;
    }
  }
}
