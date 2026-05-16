'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MousePointer, 
  Users, 
  TrendingUp, 
  Store,
  Link as LinkIcon,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  QrCode,
  Bell,
  CreditCard,
  MessageSquare,
  Megaphone,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { affiliateApi } from '@/lib/api';
import { toast } from 'sonner';

interface AffiliateStats {
  totalClicks: number;
  uniqueVisitors: number;
  activeCampaigns: number;
  promotedStores: number;
  totalConversions: number;
  totalEarnings: number;
  topLinks: Array<{
    id: string;
    url: string;
    clicks: number;
    conversions: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'click' | 'conversion' | 'campaign' | 'collaboration';
    description: string;
    amount?: number;
    createdAt: string;
  }>;
}

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
      toast.error('فشل في جلب بيانات المسوق');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'AFFILIATE') {
    return null;
  }

  const statCards = [
    {
      title: 'النقرات',
      value: stats?.totalClicks?.toLocaleString() || '0',
      icon: MousePointer,
      href: '/dashboard/affiliate/analytics',
      color: 'bg-blue-500',
      change: '+12.5%',
    },
    {
      title: 'الزوار الفريدين',
      value: stats?.uniqueVisitors?.toLocaleString() || '0',
      icon: Users,
      href: '/dashboard/affiliate/analytics',
      color: 'bg-green-500',
      change: '+8.2%',
    },
    {
      title: 'التحويلات',
      value: stats?.totalConversions?.toLocaleString() || '0',
      icon: TrendingUp,
      href: '/dashboard/affiliate/conversions',
      color: 'bg-purple-500',
      change: '+15.3%',
    },
    {
      title: 'الأرباح',
      value: `${(stats?.totalEarnings || 0).toFixed(2)} ر.س`,
      icon: CreditCard,
      href: '/dashboard/affiliate/earnings',
      color: 'bg-yellow-500',
      change: '+23.1%',
    },
    {
      title: 'الحملات النشطة',
      value: stats?.activeCampaigns?.toString() || '0',
      icon: Megaphone,
      href: '/dashboard/affiliate/campaigns',
      color: 'bg-indigo-500',
      change: '+2',
    },
    {
      title: 'المتاجر المروجة',
      value: stats?.promotedStores?.toString() || '0',
      icon: Store,
      href: '/dashboard/affiliate/stores',
      color: 'bg-pink-500',
      change: '+1',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                لوحة تحكم المسوق
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إدارة حملات التسويق وتتبع الأداء
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/affiliate/links">
                <Button variant="outline" className="gap-2">
                  <LinkIcon className="w-4 h-4" />
                  روابط الإحالة
                </Button>
              </Link>
              <Link href="/dashboard/affiliate/campaigns/new">
                <Button className="btn-gradient gap-2">
                  <Megaphone className="w-4 h-4" />
                  حملة جديدة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={stat.href}>
                <Card className="card-hover h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">
                        {stat.change}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {stat.title}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                أفضل الروابط
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.topLinks && stats.topLinks.length > 0 ? (
                <div className="space-y-3">
                  {stats.topLinks.slice(0, 5).map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{link.url}</p>
                        <p className="text-xs text-gray-500">
                          {link.clicks} نقرة • {link.conversions} تحويل
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  لا توجد روابط بعد
                </p>
              )}
              <Link href="/dashboard/affiliate/links">
                <Button variant="outline" className="w-full mt-4">
                  عرض جميع الروابط
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                النشاط الأخير
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'click' ? 'bg-blue-100' :
                        activity.type === 'conversion' ? 'bg-green-100' :
                        activity.type === 'campaign' ? 'bg-purple-100' :
                        'bg-yellow-100'
                      }`}>
                        {activity.type === 'click' && <MousePointer className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'conversion' && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {activity.type === 'campaign' && <Megaphone className="w-4 h-4 text-purple-600" />}
                        {activity.type === 'collaboration' && <MessageSquare className="w-4 h-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString('ar-SA')}
                          {activity.amount && ` • ${activity.amount} ر.س`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  لا يوجد نشاط حديث
                </p>
              )}
              <Link href="/dashboard/affiliate/activity">
                <Button variant="outline" className="w-full mt-4">
                  عرض كل النشاط
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/affiliate/analytics">
            <Button variant="outline" className="w-full h-16 justify-start gap-2">
              <Globe className="w-4 h-4" />
              تحليل الزوار
            </Button>
          </Link>
          <Link href="/dashboard/affiliate/campaigns">
            <Button variant="outline" className="w-full h-16 justify-start gap-2">
              <Megaphone className="w-4 h-4" />
              الحملات
            </Button>
          </Link>
          <Link href="/dashboard/affiliate/qr">
            <Button variant="outline" className="w-full h-16 justify-start gap-2">
              <QrCode className="w-4 h-4" />
              تسويق QR
            </Button>
          </Link>
          <Link href="/dashboard/affiliate/notifications">
            <Button variant="outline" className="w-full h-16 justify-start gap-2">
              <Bell className="w-4 h-4" />
              الإشعارات
            </Button>
          </Link>
            <Link href="/dashboard/affiliate/links">
              <Button variant="outline" className="w-full justify-start gap-2 h-16">
                <LinkIcon className="w-5 h-5" />
                إدارة الروابط
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="w-full justify-start gap-2 h-16">
                <Share2 className="w-5 h-5" />
                استكشف المتاجر للتسويق
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
