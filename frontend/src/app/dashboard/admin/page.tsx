'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, Store, ShoppingCart, DollarSign, TrendingUp, Settings, 
  Search, Filter, Ban, CheckCircle, Trash2, MoreHorizontal,
  Shield, Activity, LogOut, Mail, Bell, ChevronLeft, ChevronRight,
  UserX, UserCheck, AlertTriangle, BarChart3, PieChart, LineChart
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, formatDate } from '@/lib/utils';

interface DashboardStats {
  stores: { active: number; growth: string };
  subscriptions: { active: number; mrr: number };
  users: { total: number; newThisMonth: number; growth: string };
  orders: { today: number };
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

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  store: { id: string; name: string; slug: string } | null;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  owner: { id: string; email: string; firstName: string; lastName: string };
  subscription: { status: string; plan: { name: string; price: number } } | null;
  _count: { products: number; orders: number };
  createdAt: string;
}

type TabType = 'overview' | 'users' | 'stores' | 'subscriptions' | 'analytics' | 'security';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState({ role: '', status: '' });
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  
  // Stores
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [storePage, setStorePage] = useState(1);
  const [storeTotal, setStoreTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Load dashboard stats
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERVISOR')) {
      loadDashboardStats();
    }
  }, [user]);

  // Load users when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, userPage, userSearch, userFilter]);

  // Load stores when tab changes
  useEffect(() => {
    if (activeTab === 'stores') {
      loadStores();
    }
  }, [activeTab, storePage, storeSearch]);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data.data);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل الإحصائيات',
        description: error.response?.data?.message || 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const params: any = { page: userPage, limit: 10 };
      if (userSearch) params.search = userSearch;
      if (userFilter.role) params.role = userFilter.role;
      if (userFilter.status) params.status = userFilter.status;
      
      const response = await adminApi.getUsers(params);
      setUsers(response.data.data.users);
      setUserTotal(response.data.data.total);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل المستخدمين',
        description: error.response?.data?.message || 'حدث خطأ',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      setStoresLoading(true);
      const params: any = { page: storePage, limit: 10 };
      if (storeSearch) params.search = storeSearch;
      
      const response = await adminApi.getStores(params);
      setStores(response.data.data.stores);
      setStoreTotal(response.data.data.total);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل المتاجر',
        description: error.response?.data?.message || 'حدث خطأ',
        variant: 'destructive',
      });
    } finally {
      setStoresLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await adminApi.updateUser(userId, { status });
      toast({ title: 'تم تحديث حالة المستخدم بنجاح' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'حدث خطأ',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStoreStatus = async (storeId: string) => {
    try {
      await adminApi.toggleStoreStatus(storeId);
      toast({ title: 'تم تحديث حالة المتجر بنجاح' });
      loadStores();
      loadDashboardStats();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'حدث خطأ',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتجر؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    try {
      await adminApi.deleteStore(storeId);
      toast({ title: 'تم حذف المتجر بنجاح' });
      loadStores();
      loadDashboardStats();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'حدث خطأ',
        variant: 'destructive',
      });
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

  const sidebarItems = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'stores', label: 'المتاجر', icon: Store },
    { id: 'subscriptions', label: 'الاشتراكات', icon: TrendingUp },
    { id: 'analytics', label: 'التحليلات', icon: LineChart },
    { id: 'security', label: 'الحماية', icon: Shield },
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
                  لوحة تحكم المشرف
                </h1>
                <p className="text-xs text-gray-500">
                  {user.role === 'ADMIN' ? 'مدير النظام' : 'مشرف'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                    activeTab === item.id
                      ? 'bg-nebula-50 dark:bg-nebula-900/20 text-nebula-600 dark:text-nebula-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6 h-24"></CardContent>
                      </Card>
                    ))
                  ) : (
                    <>
                      <StatCard
                        title="المتاجر النشطة"
                        value={stats?.stores.active || 0}
                        change={stats?.stores.growth}
                        icon={Store}
                        color="bg-blue-500"
                      />
                      <StatCard
                        title="الاشتراكات"
                        value={stats?.subscriptions.active || 0}
                        subtitle={`${formatPrice(stats?.subscriptions.mrr || 0)}/شهر`}
                        icon={TrendingUp}
                        color="bg-purple-500"
                      />
                      <StatCard
                        title="المستخدمين"
                        value={stats?.users.total || 0}
                        change={stats?.users.growth}
                        subtitle={`+${stats?.users.newThisMonth || 0} هذا الشهر`}
                        icon={Users}
                        color="bg-green-500"
                      />
                      <StatCard
                        title="الإيرادات"
                        value={formatPrice(stats?.revenue.total || 0)}
                        subtitle={`MRR: ${formatPrice(stats?.revenue.mrr || 0)}`}
                        icon={DollarSign}
                        color="bg-yellow-500"
                      />
                    </>
                  )}
                </div>

                {/* Top Stores */}
                <Card>
                  <CardHeader>
                    <CardTitle>أفضل المتاجر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="animate-pulse space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                          <div key={i} className="h-12 bg-gray-100 rounded"></div>
                        ))}
                      </div>
                    ) : stats?.topStores && stats.topStores.length > 0 ? (
                      <div className="space-y-4">
                        {stats.topStores.map((store) => (
                          <div key={store.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nebula-500 to-purple-600 flex items-center justify-center">
                                <Store className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{store.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {store.owner.firstName} {store.owner.lastName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-500">{store._count.products} منتج</span>
                              <span className="text-gray-500">{store._count.orders} طلب</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                store.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {store.isActive ? 'نشط' : 'معلق'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد متاجر حالياً
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="بحث..."
                          className="pr-10 w-48"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                      <select
                        className="border rounded-md px-3 py-2"
                        value={userFilter.role}
                        onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })}
                      >
                        <option value="">كل الأدوار</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="MERCHANT">Merchant</option>
                        <option value="AFFILIATE">Affiliate</option>
                        <option value="CUSTOMER">Customer</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="animate-pulse space-y-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-3 px-4">المستخدم</th>
                              <th className="text-right py-3 px-4">الدور</th>
                              <th className="text-right py-3 px-4">الحالة</th>
                              <th className="text-right py-3 px-4">التحقق</th>
                              <th className="text-right py-3 px-4">تاريخ التسجيل</th>
                              <th className="text-right py-3 px-4">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="py-4 px-4">
                                  <div>
                                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                                    <p className="text-sm text-gray-500">{u.email}</p>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                    u.role === 'SUPERVISOR' ? 'bg-orange-100 text-orange-700' :
                                    u.role === 'MERCHANT' ? 'bg-blue-100 text-blue-700' :
                                    u.role === 'AFFILIATE' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                    u.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {u.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  {u.isEmailVerified ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                  )}
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-500">
                                  {formatDate(u.createdAt)}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex gap-2">
                                    {u.status === 'ACTIVE' ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUpdateUserStatus(u.id, 'SUSPENDED')}
                                        className="text-yellow-600"
                                      >
                                        <Ban className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUpdateUserStatus(u.id, 'ACTIVE')}
                                        className="text-green-600"
                                      >
                                        <UserCheck className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-500">
                          إجمالي: {userTotal} مستخدم
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={userPage === 1}
                            onClick={() => setUserPage(p => p - 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <span className="px-3 py-2">{userPage}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={userPage * 10 >= userTotal}
                            onClick={() => setUserPage(p => p + 1)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stores Tab */}
            {activeTab === 'stores' && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>إدارة المتاجر</CardTitle>
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="بحث عن متجر..."
                        className="pr-10 w-64"
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {storesLoading ? (
                    <div className="animate-pulse space-y-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-3 px-4">المتجر</th>
                              <th className="text-right py-3 px-4">المالك</th>
                              <th className="text-right py-3 px-4">الاشتراك</th>
                              <th className="text-right py-3 px-4">المنتجات</th>
                              <th className="text-right py-3 px-4">الطلبات</th>
                              <th className="text-right py-3 px-4">الحالة</th>
                              <th className="text-right py-3 px-4">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stores.map((store) => (
                              <tr key={store.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nebula-500 to-purple-600 flex items-center justify-center">
                                      <Store className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{store.name}</p>
                                      <p className="text-sm text-gray-500">/{store.slug}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <p className="text-sm">{store.owner.firstName} {store.owner.lastName}</p>
                                  <p className="text-xs text-gray-500">{store.owner.email}</p>
                                </td>
                                <td className="py-4 px-4">
                                  {store.subscription ? (
                                    <div>
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        store.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {store.subscription.plan.name}
                                      </span>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatPrice(store.subscription.plan.price)}/شهر
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                  )}
                                </td>
                                <td className="py-4 px-4">{store._count.products}</td>
                                <td className="py-4 px-4">{store._count.orders}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    store.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {store.isActive ? 'نشط' : 'معلق'}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleStoreStatus(store.id)}
                                      className={store.isActive ? 'text-yellow-600' : 'text-green-600'}
                                    >
                                      {store.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteStore(store.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-500">
                          إجمالي: {storeTotal} متجر
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={storePage === 1}
                            onClick={() => setStorePage(p => p - 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <span className="px-3 py-2">{storePage}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={storePage * 10 >= storeTotal}
                            onClick={() => setStorePage(p => p + 1)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Other Tabs Placeholders */}
            {activeTab === 'subscriptions' && (
              <Card>
                <CardHeader>
                  <CardTitle>إدارة الاشتراكات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>قسم الاشتراكات قيد التطوير</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'analytics' && (
              <Card>
                <CardHeader>
                  <CardTitle>التحليلات المتقدمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <LineChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>قسم التحليلات قيد التطوير</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>مركز الحماية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>سجلات التدقيق والحماية قيد التطوير</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
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
