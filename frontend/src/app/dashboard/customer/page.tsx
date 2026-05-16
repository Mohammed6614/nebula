'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Heart, MapPin, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && user.role !== 'CUSTOMER') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'CUSTOMER') {
    return null;
  }

  const customerCards = [
    {
      title: 'طلباتي',
      value: '0',
      icon: ShoppingCart,
      href: '/dashboard/customer/orders',
      color: 'bg-blue-500',
    },
    {
      title: 'المفضلة',
      value: '0',
      icon: Heart,
      href: '/dashboard/customer/wishlist',
      color: 'bg-red-500',
    },
    {
      title: 'العناوين',
      value: '0',
      icon: MapPin,
      href: '/dashboard/customer/addresses',
      color: 'bg-green-500',
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
                حسابي
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                مرحباً، {user.firstName}!
              </p>
            </div>
            <Link href="/dashboard/customer/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                الإعدادات
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {customerCards.map((card, index) => (
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

        {/* Recent Orders Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              طلباتي الأخيرة
            </h2>
            <Link href="/dashboard/customer/orders">
              <Button variant="outline">عرض الكل</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  لا توجد طلبات حالياً
                </h3>
                <p className="text-gray-500 mb-4">
                  ابدأ التسوق من متاجرنا المميزة
                </p>
                <Link href="/marketplace">
                  <Button className="btn-gradient">
                    تصفح المتاجر
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
