import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export function validateRequest(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Update request with validated data
      req.body = validated.body;
      req.query = validated.query;
      req.params = validated.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          details[path] = err.message;
        });

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

export function validateBody(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          details[path] = err.message;
        });

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          details[path] = err.message;
        });

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          details[path] = err.message;
        });

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}
