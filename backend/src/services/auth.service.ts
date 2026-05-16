import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens } from '../utils/jwt';
import { 
  createRefreshToken, 
  verifyRefreshToken, 
  revokeRefreshToken,
  createEmailVerificationToken,
  verifyEmailToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetUsed,
  generateReferralCode
} from '../utils/tokens';
import { sendEmail, generateVerificationEmailTemplate, generatePasswordResetEmailTemplate } from '../config/email';
import { env } from '../config/env';
import { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError, 
  NotFoundError,
  ForbiddenError 
} from '../utils/errors';
import { UserRole, Tokens, AuthenticatedUser } from '../types';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  // Register new user
  async register(input: RegisterInput): Promise<{ user: AuthenticatedUser; tokens: Tokens }> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Create email verification token
    const verificationToken = await createEmailVerificationToken(user.id);
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'تأكيد البريد الإلكتروني - NEBULA',
      html: generateVerificationEmailTemplate(verificationUrl, user.firstName),
    });

    // If affiliate role, create affiliate record with referral code
    if (input.role === 'AFFILIATE') {
      await prisma.affiliate.create({
        data: {
          userId: user.id,
          referralCode: generateReferralCode(),
        },
      });
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        isEmailVerified: user.isEmailVerified,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
      tokens,
    };
  }

  // Login user
  async login(input: LoginInput): Promise<{ user: AuthenticatedUser; tokens: Tokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is active
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Account suspended');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Save refresh token
    await createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        isEmailVerified: user.isEmailVerified,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
      tokens,
    };
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const userId = await verifyRefreshToken(refreshToken);

    if (!userId) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Revoke old token
    await revokeRefreshToken(refreshToken);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedError('User not found or suspended');
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Save new refresh token
    await createRefreshToken(user.id);

    return tokens;
  }

  // Logout
  async logout(refreshToken: string): Promise<void> {
    await revokeRefreshToken(refreshToken);
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    const userId = await verifyEmailToken(token);

    if (!userId) {
      throw new BadRequestError('Invalid or expired verification token');
    }
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Delete old tokens
    await prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    // Create new token
    const verificationToken = await createEmailVerificationToken(user.id);
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'تأكيد البريد الإلكتروني - NEBULA',
      html: generateVerificationEmailTemplate(verificationUrl, user.firstName),
    });
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = await createPasswordResetToken(user.id);
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور - NEBULA',
      html: generatePasswordResetEmailTemplate(resetUrl, user.firstName),
    });
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await verifyPasswordResetToken(token);

    if (!userId) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await markPasswordResetUsed(token);
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // Get current user
  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        isEmailVerified: true,
        hasCompletedOnboarding: true,
        phone: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      isEmailVerified: user.isEmailVerified,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    };
  }
}

export const authService = new AuthService();
