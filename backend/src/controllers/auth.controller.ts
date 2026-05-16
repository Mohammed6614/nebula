import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { UserRole } from '../types';
import { ApiResponse } from '../types';

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    phone: z.string().optional(),
    role: z.enum(['MERCHANT', 'AFFILIATE', 'CUSTOMER']),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

export const authController = {
  // Register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse({ body: req.body });
      const result = await authService.register(validated.body);

      const response: ApiResponse = {
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  // Login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse({ body: req.body });
      const result = await authService.login(validated.body);

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Refresh token
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = refreshTokenSchema.parse({ body: req.body });
      const tokens = await authService.refreshTokens(validated.body.refreshToken);

      const response: ApiResponse = {
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Verify email
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyEmailSchema.parse({ query: req.query });
      await authService.verifyEmail(validated.query.token);

      const response: ApiResponse = {
        success: true,
        message: 'Email verified successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Resend verification email
  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = resendVerificationSchema.parse({ body: req.body });
      await authService.resendVerificationEmail(validated.body.email);

      const response: ApiResponse = {
        success: true,
        message: 'Verification email sent',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Forgot password
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = forgotPasswordSchema.parse({ body: req.body });
      await authService.requestPasswordReset(validated.body.email);

      const response: ApiResponse = {
        success: true,
        message: 'If an account exists, a password reset email has been sent',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Reset password
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = resetPasswordSchema.parse({ body: req.body });
      await authService.resetPassword(validated.body.token, validated.body.password);

      const response: ApiResponse = {
        success: true,
        message: 'Password reset successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const validated = changePasswordSchema.parse({ body: req.body });
      await authService.changePassword(
        req.user.id,
        validated.body.currentPassword,
        validated.body.newPassword
      );

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get current user
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const user = await authService.getCurrentUser(req.user.id);

      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: { user },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },
};

// Export validation schemas for use in routes
export const authValidations = {
  register: registerSchema,
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  verifyEmail: verifyEmailSchema,
  resendVerification: resendVerificationSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  changePassword: changePasswordSchema,
};
