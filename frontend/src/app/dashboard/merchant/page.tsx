'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus, Settings, Store, Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { merchantApi } from '@/lib/api';
import { toast } from 'sonner';

interface StoreStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: {
    products: number;
    orders: number;
  };
}

export default function MerchantDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [store, setStore] = useState<Store | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'MERCHANT') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First get the store
        const storeRes = await merchantApi.getMyStore();
        const storeData = storeRes.data.store;
        setStore(storeData);
        
        // Then get stats using store ID
        if (storeData?.id) {
          const statsRes = await merchantApi.getStoreStats(storeData.id);
          setStats(statsRes.data.stats);
        }
      } catch (error) {
        console.error('Error fetching merchant data:', error);
        toast.error('فشل في جلب بيانات المتجر');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'MERCHANT') {
      fetchData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'MERCHANT') {
    return null;
  }

  const merchantCards = [
    {
      title: 'المنتجات',
      value: stats?.totalProducts?.toString() || '0',
      icon: Package,
      href: '/dashboard/merchant/products',
      color: 'bg-blue-500',
    },
    {
      title: 'الطلبات',
      value: stats?.totalOrders?.toString() || '0',
      icon: ShoppingCart,
      href: '/dashboard/merchant/orders',
      color: 'bg-purple-500',
    },
    {
      title: 'المبيعات',
      value: `${(stats?.totalRevenue || 0).toFixed(0)} ر.س`,
      icon: DollarSign,
      href: '/dashboard/merchant/analytics',
      color: 'bg-green-500',
    },
    {
      title: 'المتجر',
      value: store?.name || '-',
      icon: Store,
      href: '/dashboard/merchant/store',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                لوحة تحكم التاجر
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                مرحباً، {user.firstName}!
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/merchant/products/new">
                <Button className="btn-gradient gap-2">
                  <Plus className="w-4 h-4" />
                  منتج جديد
                </Button>
              </Link>
              <Link href="/dashboard/merchant/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  الإعدادات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {merchantCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={card.href}>
                <Card className="card-hover cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </CardTitle>
                    <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/merchant/products">
              <Button variant="outline" className="w-full justify-start gap-2 h-16">
                <Package className="w-5 h-5" />
                إدارة المنتجات
              </Button>
            </Link>
            <Link href="/dashboard/merchant/orders">
              <Button variant="outline" className="w-full justify-start gap-2 h-16">
                <ShoppingCart className="w-5 h-5" />
                إدارة الطلبات
              </Button>
            </Link>
            <Link href="/dashboard/merchant/store">
              <Button variant="outline" className="w-full justify-start gap-2 h-16">
                <Settings className="w-5 h-5" />
                إعدادات المتجر
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Orders & Order Stats */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                آخر الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.total.toFixed(2)} ر.س</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد طلبات حديثة</p>
              )}
              <Link href="/dashboard/merchant/orders">
                <Button variant="outline" className="w-full mt-4">
                  عرض جميع الطلبات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Order Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                حالة الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.ordersByStatus && stats.ordersByStatus.length > 0 ? (
                <div className="space-y-3">
                  {stats.ordersByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm">
                        {item.status === 'PENDING' && 'قيد الانتظار'}
                        {item.status === 'PAID' && 'مدفوع'}
                        {item.status === 'PROCESSING' && 'قيد المعالجة'}
                        {item.status === 'SHIPPED' && 'تم الشحن'}
                        {item.status === 'DELIVERED' && 'تم التوصيل'}
                        {item.status === 'CANCELLED' && 'ملغي'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-nebula-600"
                            style={{
                              width: `${
                                (item.count / (stats?.totalOrders || 1)) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Store URL */}
        {store && (
          <div className="mt-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-nebula-600" />
                    <div>
                      <p className="text-sm text-gray-500">رابط متجرك</p>
                      <p className="font-medium">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/store/${store.slug}`
                          : `/store/${store.slug}`}
                      </p>
                    </div>
                  </div>
                  <Link href={`/store/${store.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      معاينة
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
