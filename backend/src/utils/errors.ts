import { ApiError } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApiError {
    return {
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details);
  }
}

// 422 - Unprocessable Entity
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

// 429 - Too Many Requests
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: Record<string, unknown>) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

// 500 - Internal Server Error
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}

// 503 - Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: Record<string, unknown>) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}
