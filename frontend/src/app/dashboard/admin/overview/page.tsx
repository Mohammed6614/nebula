'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Store, TrendingUp, Users, DollarSign, ShoppingCart, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  stores: { active: number; growth: string };
  subscriptions: { active: number; mrr: number };
  users: { total: number; newThisMonth: number; growth: string; byRole: any };
  orders: { today: number; thisMonth: number };
  revenue: { total: number; mrr: number };
  topStores: Array<{
    id: string;
    name: string;
    slug: string;
    owner: { firstName: string; lastName: string; email: string };
    productsCount: number;
    ordersCount: number;
    isActive: boolean;
    createdAt: string;
  }>;
}

interface RecentActivity {
  auditLogs: any[];
  recentOrders: any[];
}

export default function AdminOverviewPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);
  const [growthMetrics, setGrowthMetrics] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, activityRes, revenueRes, growthRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivity({ limit: 10 }),
        adminApi.getRevenueAnalytics({ period: 30 }),
        adminApi.getGrowthMetrics({ period: 30 }),
      ]);

      setStats(statsRes.data.data);
      setRecentActivity(activityRes.data.data);
      setRevenueAnalytics(revenueRes.data.data);
      setGrowthMetrics(growthRes.data.data);
    } catch (error: any) {
      toast({
        title: 'Error loading dashboard',
        description: error.response?.data?.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Transform dailyRevenue data for chart
  const revenueChartData = revenueAnalytics?.dailyRevenue 
    ? Object.entries(revenueAnalytics.dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue: Number(revenue),
      }))
    : [];

  // Transform usersByRole for pie chart
  const usersByRoleData = stats?.users?.byRole 
    ? Object.entries(stats.users.byRole).map(([role, count]) => ({
        role: role.charAt(0) + role.slice(1).toLowerCase(),
        count: Number(count),
      }))
    : [];

  // Growth metrics for bar chart
  const growthChartData = growthMetrics ? [
    { metric: 'Users', value: growthMetrics.newUsers, color: '#3b82f6' },
    { metric: 'Stores', value: growthMetrics.newStores, color: '#22c55e' },
    { metric: 'Subscriptions', value: growthMetrics.newSubscriptions, color: '#a855f7' },
    { metric: 'Orders', value: growthMetrics.newOrders, color: '#f97316' },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Platform performance and metrics</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Stores"
          value={stats?.stores.active || 0}
          change={stats?.stores.growth}
          icon={Store}
          color="bg-blue-500"
        />
        <KPICard
          title="Active Subscriptions"
          value={stats?.subscriptions.active || 0}
          subtitle={`MRR: ${formatPrice(stats?.subscriptions.mrr || 0)}`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <KPICard
          title="Total Users"
          value={stats?.users.total || 0}
          change={stats?.users.growth}
          subtitle={`+${stats?.users.newThisMonth || 0} this month`}
          icon={Users}
          color="bg-green-500"
        />
        <KPICard
          title="Total Revenue"
          value={formatPrice(stats?.revenue.total || 0)}
          subtitle={`MRR: ${formatPrice(stats?.revenue.mrr || 0)}`}
          icon={DollarSign}
          color="bg-yellow-500"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Orders Today</p>
                <p className="text-2xl font-bold">{stats?.orders.today || 0}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Orders This Month</p>
                <p className="text-2xl font-bold">{stats?.orders.thisMonth || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">ARR</p>
                <p className="text-2xl font-bold">{formatPrice(revenueAnalytics?.arr || 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `SAR ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`SAR ${value.toFixed(2)}`, 'Revenue']}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {growthChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => value} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No growth data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users by Role Distribution */}
      {usersByRoleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {usersByRoleData.map((item) => (
                <div key={item.role} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{item.count}</p>
                  <p className="text-sm text-gray-500 capitalize">{item.role}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Stores */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Stores</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.topStores && stats.topStores.length > 0 ? (
            <div className="space-y-4">
              {stats.topStores.map((store, index) => (
                <div key={store.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-600' :
                      'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-600' :
                      'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{store.name}</h4>
                      <p className="text-sm text-gray-500">
                        {store.owner.firstName} {store.owner.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{store.productsCount}</p>
                      <p className="text-gray-500">Products</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{store.ordersCount}</p>
                      <p className="text-gray-500">Orders</p>
                    </div>
                    <div className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        store.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {store.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No stores available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.auditLogs?.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {log.user?.firstName} {log.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.action} - {log.entity}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({ title, value, change, subtitle, icon: Icon, color }: {
  title: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  const isPositive = change && parseFloat(change) >= 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{change}%
                </p>
              </div>
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
