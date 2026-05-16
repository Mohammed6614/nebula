import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, Tokens } from '../types';

export function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): Tokens {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRE as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateVerificationToken(): string {
  return jwt.sign({ type: 'verification' }, env.JWT_SECRET, { expiresIn: '1h' });
}

export function generatePasswordResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'password-reset' }, env.JWT_SECRET, { expiresIn: '1h' });
}
