import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { ApiResponse } from '../types';
import { env } from '../config/env';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('Unexpected error:', err);
  }

  // Handle AppError
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      errors: err.details ? Object.entries(err.details).map(([field, message]) => ({
        field,
        message: String(message),
      })) : undefined,
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
    };

    res.status(422).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or expired token',
    };

    res.status(401).json(response);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // @ts-expect-error Prisma error code
    const code = err.code;

    if (code === 'P2002') {
      const response: ApiResponse = {
        success: false,
        message: 'Unique constraint violation - resource already exists',
      };
      res.status(409).json(response);
      return;
    }

    if (code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        message: 'Record not found',
      };
      res.status(404).json(response);
      return;
    }
  }

  // Handle Prisma connection errors
  if (err.name === 'PrismaClientInitializationError') {
    const response: ApiResponse = {
      success: false,
      message: 'Database connection error. Please try again later.',
    };
    res.status(503).json(response);
    return;
  }

  // Default error response
  const response: ApiResponse = {
    success: false,
    message: env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message || 'Internal server error',
  };

  res.status(500).json(response);
}
