'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, Store, ShoppingCart, DollarSign, TrendingUp, Settings, 
  Shield, Activity, Bell, MessageSquare, CreditCard, BarChart3,
  Flag, LogOut, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

interface DashboardStats {
  stores: { active: number; growth: string };
  subscriptions: { active: number; mrr: number };
  users: { total: number; newThisMonth: number; growth: string };
  orders: { today: number; thisMonth: number };
  revenue: { total: number; mrr: number };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERVISOR')) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error loading dashboard stats',
        description: error.response?.data?.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
    return null;
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, href: '/dashboard/admin/overview', color: 'bg-blue-500' },
    { id: 'users', label: 'Users', icon: Users, href: '/dashboard/admin/users', color: 'bg-green-500' },
    { id: 'stores', label: 'Stores', icon: Store, href: '/dashboard/admin/stores', color: 'bg-purple-500' },
    { id: 'subscriptions', label: 'Subscriptions', icon: TrendingUp, href: '/dashboard/admin/subscriptions', color: 'bg-orange-500' },
    { id: 'payments', label: 'Payments', icon: CreditCard, href: '/dashboard/admin/payments', color: 'bg-yellow-500' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/admin/analytics', color: 'bg-cyan-500' },
    { id: 'security', label: 'Security', icon: Shield, href: '/dashboard/admin/security', color: 'bg-red-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/dashboard/admin/notifications', color: 'bg-pink-500' },
    { id: 'support', label: 'Support', icon: MessageSquare, href: '/dashboard/admin/support', color: 'bg-indigo-500' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/admin/settings', color: 'bg-gray-500' },
    { id: 'features', label: 'Feature Flags', icon: Flag, href: '/dashboard/admin/features', color: 'bg-teal-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nebula-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                  {user.role === 'ADMIN' ? 'System Administrator' : 'Supervisor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/admin/notifications">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Bell className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/dashboard/admin/settings">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-32" />
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Active Stores"
                value={stats?.stores.active || 0}
                change={stats?.stores.growth}
                icon={Store}
                color="bg-blue-500"
              />
              <StatCard
                title="Active Subscriptions"
                value={stats?.subscriptions.active || 0}
                subtitle={`MRR: ${formatPrice(stats?.subscriptions.mrr || 0)}`}
                icon={TrendingUp}
                color="bg-purple-500"
              />
              <StatCard
                title="Total Users"
                value={stats?.users.total || 0}
                change={stats?.users.growth}
                subtitle={`+${stats?.users.newThisMonth || 0} this month`}
                icon={Users}
                color="bg-green-500"
              />
              <StatCard
                title="Total Revenue"
                value={formatPrice(stats?.revenue.total || 0)}
                subtitle={`MRR: ${formatPrice(stats?.revenue.mrr || 0)}`}
                icon={DollarSign}
                color="bg-yellow-500"
              />
            </>
          )}
        </div>

        {/* Navigation Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Admin Control Center</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{item.label}</h3>
                        <p className="text-sm text-gray-500">
                          Manage {item.label.toLowerCase()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-nebula-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, subtitle, icon: Icon, color }: {
  title: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={`text-sm mt-1 ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(change) >= 0 ? '+' : ''}{change}%
              </p>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
