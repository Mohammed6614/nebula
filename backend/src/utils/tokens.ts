import crypto from 'crypto';
import { prisma } from '../config/database';
import { env } from '../config/env';

export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateReferralCode(): string {
  return 'NBL' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.emailVerification.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string): Promise<string | null> {
  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return null;
  }

  // Delete the token
  await prisma.emailVerification.delete({
    where: { id: verification.id },
  });

  // Update user
  await prisma.user.update({
    where: { id: verification.userId },
    data: {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  return verification.userId;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  // Invalidate any existing tokens
  await prisma.passwordReset.deleteMany({
    where: { userId },
  });

  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const reset = await prisma.passwordReset.findUnique({
    where: { token },
  });

  if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
    return null;
  }

  return reset.userId;
}

export async function markPasswordResetUsed(token: string): Promise<void> {
  await prisma.passwordReset.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    return null;
  }

  return refreshToken.userId;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.delete({
    where: { token },
  });
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}
