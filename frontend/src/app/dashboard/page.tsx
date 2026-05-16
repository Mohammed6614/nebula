'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    // Prevent redirect loop
    if (sessionStorage.getItem('redirect_from_/dashboard')) return;

    const roleRedirects: Record<string, string> = {
      MERCHANT: '/dashboard/merchant',
      AFFILIATE: '/dashboard/affiliate',
      CUSTOMER: '/dashboard/customer',
      ADMIN: '/dashboard/admin',
      SUPERVISOR: '/dashboard/supervisor',
    };

    const targetRoute = user ? roleRedirects[user.role] || '/login' : '/login';
    
    if (targetRoute !== '/dashboard') {
      sessionStorage.setItem('redirect_from_/dashboard', 'true');
      router.replace(targetRoute);
    }
  }, [user, isInitialized, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600"></div>
    </div>
  );
}
