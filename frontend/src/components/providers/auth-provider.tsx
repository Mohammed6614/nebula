'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/verify-email'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitialized, initAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    // Wait for initialization to complete
    if (!isInitialized || isLoading) return;

    // Check if we already tried to redirect from this path
    const redirectKey = `redirect_from_${pathname}`;
    if (sessionStorage.getItem(redirectKey)) return;

    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname?.startsWith(`${route}/`));
    
    // Not logged in and trying to access protected route
    if (!user && !isPublicRoute) {
      sessionStorage.setItem(redirectKey, 'true');
      router.replace('/login');
      return;
    }

    // Logged in and on auth page - redirect to dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
      sessionStorage.setItem(redirectKey, 'true');
      const roleRedirects: Record<string, string> = {
        MERCHANT: '/dashboard/merchant',
        AFFILIATE: '/dashboard/affiliate',
        CUSTOMER: '/dashboard/customer',
        ADMIN: '/dashboard/admin',
        SUPERVISOR: '/dashboard/supervisor',
      };
      const targetRoute = roleRedirects[user.role] || '/dashboard';
      router.replace(targetRoute);
    }
  }, [user, isLoading, isInitialized, pathname, router]);

  // Show loading spinner during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
