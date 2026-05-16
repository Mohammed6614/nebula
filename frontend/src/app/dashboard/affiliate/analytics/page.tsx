'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  Users, 
  MousePointer, 
  Smartphone, 
  Monitor,
  BarChart3,
  TrendingUp,
  Eye,
  MapPin,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { affiliateApi } from '@/lib/api';
import { toast } from 'sonner';

interface AnalyticsData {
  totalClicks: number;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topCountries: Array<{
    country: string;
    visitors: number;
    percentage: number;
  }>;
  topDevices: Array<{
    device: string;
    visitors: number;
    percentage: number;
  }>;
  topBrowsers: Array<{
    browser: string;
    visitors: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;
    clicks: number;
    visitors: number;
    conversions: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    clicks: number;
  }>;
}

export default function AffiliateAnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchAnalytics();
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getAnalytics({ dateRange });
      setData(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('فشل في جلب بيانات التحليل');
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

  const overviewCards = [
    {
      title: 'النقرات',
      value: data?.totalClicks?.toLocaleString() || '0',
      icon: MousePointer,
      color: 'bg-blue-500',
      change: '+12.5%',
    },
    {
      title: 'الزوار الفريدين',
      value: data?.uniqueVisitors?.toLocaleString() || '0',
      icon: Users,
      color: 'bg-green-500',
      change: '+8.2%',
    },
    {
      title: 'مرات عرض الصفحة',
      value: data?.pageViews?.toLocaleString() || '0',
      icon: Eye,
      color: 'bg-purple-500',
      change: '+15.3%',
    },
    {
      title: 'معدل الارتداد',
      value: `${(data?.bounceRate || 0).toFixed(1)}%`,
      icon: BarChart3,
      color: 'bg-yellow-500',
      change: '-2.1%',
    },
    {
      title: 'متوسط مدة الجلسة',
      value: `${Math.floor((data?.avgSessionDuration || 0) / 60)}:${((data?.avgSessionDuration || 0) % 60).toString().padStart(2, '0')}`,
      icon: Calendar,
      color: 'bg-indigo-500',
      change: '+5.4%',
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
                تحليل الزوار
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إحصائيات مفصلة عن الزوار والنقرات
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={(value: '7d' | '30d' | '90d') => setDateRange(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">آخر 7 أيام</SelectItem>
                  <SelectItem value="30d">آخر 30 يوم</SelectItem>
                  <SelectItem value="90d">آخر 90 يوم</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {overviewCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${
                      card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {card.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Stats Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                إحصائيات يومية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.dailyStats && data.dailyStats.length > 0 ? (
                <div className="space-y-3">
                  {data.dailyStats.slice(-7).map((stat, index) => (
                    <div key={stat.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {new Date(stat.date).toLocaleDateString('ar-SA', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-blue-600">
                            {stat.clicks} نقرة
                          </span>
                          <span className="text-xs text-green-600">
                            {stat.visitors} زائر
                          </span>
                          {stat.conversions > 0 && (
                            <span className="text-xs text-purple-600">
                              {stat.conversions} تحويل
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{stat.clicks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                توزيع النقرات بالساعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.hourlyStats && data.hourlyStats.length > 0 ? (
                <div className="space-y-2">
                  {data.hourlyStats.map((stat) => (
                    <div key={stat.hour} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-12">
                        {stat.hour}:00
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
                        <div 
                          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                          style={{ 
                            width: `${(stat.clicks / Math.max(...data.hourlyStats.map(s => s.clicks))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-left">
                        {stat.clicks}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Geographic & Device Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                أفضل الدول
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.topCountries && data.topCountries.length > 0 ? (
                <div className="space-y-3">
                  {data.topCountries.slice(0, 5).map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{country.country === 'SA' ? '🇸🇦' : '🌍'}</span>
                        <span className="text-sm font-medium">{country.country}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{country.visitors.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{country.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                أفضل الأجهزة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.topDevices && data.topDevices.length > 0 ? (
                <div className="space-y-3">
                  {data.topDevices.slice(0, 5).map((device, index) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{device.device}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{device.visitors.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{device.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Browsers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                أفضل المتصفحات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.topBrowsers && data.topBrowsers.length > 0 ? (
                <div className="space-y-3">
                  {data.topBrowsers.slice(0, 5).map((browser, index) => (
                    <div key={browser.browser} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{browser.browser}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{browser.visitors.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{browser.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
