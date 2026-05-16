'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Activity, AlertTriangle, TrendingUp, Search,
  Filter, Shield, BarChart3, Link2, MousePointer,
  UserCheck, Clock, Globe, Smartphone, Ban, CheckCircle,
  ChevronLeft, ChevronRight, MoreHorizontal, Flag,
  Eye, UserX, RefreshCw, ArrowUpRight, Bot, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supervisorApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Affiliate {
  id: string;
  referralCode: string;
  totalClicks: number;
  totalOrders: number;
  lastClickAt: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    status: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
  _count: {
    clicks: number;
    orders: number;
  };
}

interface FraudCase {
  ipAddress: string;
  click_count: number;
  affiliate_count: number;
  affiliate_ids: string[];
}

export default function SupervisorDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [fraudData, setFraudData] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [affiliateDetails, setAffiliateDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, affiliatesRes] = await Promise.all([
        supervisorApi.getDashboardStats(),
        supervisorApi.getAffiliates({ page: 1, limit: 10 }),
      ]);

      setStats(statsRes.data.data);
      setAffiliates(affiliatesRes.data.data.affiliates);
      setTotalPages(affiliatesRes.data.data.pagination.pages);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات لوحة التحكم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFraudDetection = async () => {
    try {
      const res = await supervisorApi.getFraudDetection();
      setFraudData(res.data.data);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الكشف عن الاحتيال',
        variant: 'destructive',
      });
    }
  };

  const loadReports = async () => {
    try {
      const [topAffiliatesRes, topLinksRes, activityRes] = await Promise.all([
        supervisorApi.getTopAffiliates({ days: 30 }),
        supervisorApi.getTopLinks({ days: 30 }),
        supervisorApi.getActivityReport({ days: 30 }),
      ]);

      setReports({
        topAffiliates: topAffiliatesRes.data.data.topAffiliates,
        topLinks: topLinksRes.data.data.topLinks,
        activity: activityRes.data.data,
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل التقارير',
        variant: 'destructive',
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'fraud') {
      loadFraudDetection();
    } else if (value === 'reports') {
      loadReports();
    }
  };

  const viewAffiliateDetails = async (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    try {
      const res = await supervisorApi.getAffiliate(affiliate.id);
      setAffiliateDetails(res.data.data);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل تفاصيل المسوق',
        variant: 'destructive',
      });
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, status: string) => {
    try {
      await supervisorApi.updateAffiliateStatus(affiliateId, status);
      toast({
        title: 'تم',
        description: `تم ${status === 'ACTIVE' ? 'تفعيل' : status === 'SUSPENDED' ? 'تعليق' : 'حظر'} المسوق بنجاح`,
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المسوق',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = async () => {
    try {
      const res = await supervisorApi.getAffiliates({
        page: currentPage,
        limit: 10,
        search: searchQuery,
      });
      setAffiliates(res.data.data.affiliates);
      setTotalPages(res.data.data.pagination.pages);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في البحث',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
      SUSPENDED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      BANNED: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    const labels = {
      ACTIVE: 'نشط',
      SUSPENDED: 'معلق',
      BANNED: 'محظور',
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || ''}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" dir="rtl">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">NEBULA</span>
              </Link>
              <div className="h-6 w-px bg-gray-600" />
              <span className="text-gray-400">لوحة المشرف</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-white">
                <Activity className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-gray-800 border-gray-700 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 ml-2" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 ml-2" />
              المسوقين
            </TabsTrigger>
            <TabsTrigger value="fraud" className="data-[state=active]:bg-purple-600">
              <ShieldAlert className="w-4 h-4 ml-2" />
              كشف الاحتيال
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-purple-600">
              <TrendingUp className="w-4 h-4 ml-2" />
              التقارير
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">إجمالي المسوقين</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatNumber(stats?.overview?.totalAffiliates || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">النقرات اليوم</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatNumber(stats?.overview?.clicksToday || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <MousePointer className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">معدل التحويل</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {stats?.overview?.conversionRate?.toFixed(2) || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">حالات الاحتيال</p>
                      <p className="text-3xl font-bold text-red-500 mt-1">
                        {stats?.overview?.suspectedFraudCases || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Affiliates */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  أفضل المسوقين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topAffiliates?.slice(0, 5).map((affiliate: Affiliate, index: number) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {affiliate.user.firstName} {affiliate.user.lastName}
                          </p>
                          <p className="text-sm text-gray-400">{affiliate.referralCode}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold">{formatNumber(affiliate.totalClicks)}</p>
                        <p className="text-sm text-gray-400">نقرة</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">إدارة المسوقين</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pr-10 w-64 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <Button onClick={handleSearch} variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">المسوق</TableHead>
                      <TableHead className="text-gray-400">الكود</TableHead>
                      <TableHead className="text-gray-400">النقرات</TableHead>
                      <TableHead className="text-gray-400">الطلبات</TableHead>
                      <TableHead className="text-gray-400">الحالة</TableHead>
                      <TableHead className="text-gray-400">آخر نشاط</TableHead>
                      <TableHead className="text-gray-400">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => (
                      <TableRow key={affiliate.id} className="border-gray-700">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {affiliate.user.firstName?.[0]}{affiliate.user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {affiliate.user.firstName} {affiliate.user.lastName}
                              </p>
                              <p className="text-sm text-gray-400">{affiliate.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{affiliate.referralCode}</TableCell>
                        <TableCell className="text-gray-300">{formatNumber(affiliate.totalClicks)}</TableCell>
                        <TableCell className="text-gray-300">{formatNumber(affiliate.totalOrders)}</TableCell>
                        <TableCell>{getStatusBadge(affiliate.user.status)}</TableCell>
                        <TableCell className="text-gray-300">
                          {affiliate.lastClickAt ? formatDate(affiliate.lastClickAt) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewAffiliateDetails(affiliate)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem
                                  onClick={() => updateAffiliateStatus(affiliate.id, 'ACTIVE')}
                                  className="text-green-400"
                                >
                                  <CheckCircle className="w-4 h-4 ml-2" />
                                  تفعيل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateAffiliateStatus(affiliate.id, 'SUSPENDED')}
                                  className="text-yellow-400"
                                >
                                  <AlertTriangle className="w-4 h-4 ml-2" />
                                  تعليق
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateAffiliateStatus(affiliate.id, 'BANNED')}
                                  className="text-red-400"
                                >
                                  <Ban className="w-4 h-4 ml-2" />
                                  حظر
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-400">
                    صفحة {currentPage} من {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fraud Detection Tab */}
          <TabsContent value="fraud">
            {!fraudData ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suspicious IPs */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-red-500" />
                      عناوين IP مشبوهة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fraudData.details?.suspiciousIPs?.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">لا يوجد عناوين IP مشبوهة</p>
                    ) : (
                      <div className="space-y-3">
                        {fraudData.details?.suspiciousIPs?.slice(0, 10).map((ip: FraudCase, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div>
                              <p className="text-white font-mono">{ip.ipAddress}</p>
                              <p className="text-sm text-gray-400">{ip.affiliate_count} مسوق</p>
                            </div>
                            <Badge variant="outline" className="bg-red-500/10 text-red-500">
                              {ip.click_count} نقرة
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bot Patterns */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bot className="w-5 h-5 text-orange-500" />
                      أنماط البوتات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fraudData.details?.botPatterns?.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">لم يتم اكتشاف بوتات</p>
                    ) : (
                      <div className="space-y-3">
                        {fraudData.details?.botPatterns?.slice(0, 10).map((bot: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-white font-mono text-sm">{bot.ipAddress}</p>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                                {bot.click_count} نقرة
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{bot.userAgent}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Spam Patterns */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Flag className="w-5 h-5 text-yellow-500" />
                      أنماط السبام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fraudData.details?.spamPatterns?.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">لا يوجد أنماط سبام</p>
                    ) : (
                      <div className="space-y-3">
                        {fraudData.details?.spamPatterns?.slice(0, 10).map((spam: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div>
                              <p className="text-white">{spam.referralCode}</p>
                              <p className="text-sm text-gray-400">{spam.no_referrer_pct}% بدون مصدر</p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                              {spam.no_referrer_clicks} نقرة
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Suspicious Affiliates */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserX className="w-5 h-5 text-purple-500" />
                      مسوقين مشبوهين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fraudData.details?.suspiciousAffiliates?.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">لا يوجد مسوقين مشبوهين</p>
                    ) : (
                      <div className="space-y-3">
                        {fraudData.details?.suspiciousAffiliates?.slice(0, 10).map((aff: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div>
                              <p className="text-white">{aff.referralCode}</p>
                              <p className="text-sm text-gray-400">{aff.uniqueness_ratio}% فريد</p>
                            </div>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                              {aff.total_clicks} نقرة
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            {!reports ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top Affiliates */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">أفضل المسوقين (30 يوم)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reports.topAffiliates?.slice(0, 10).map((aff: any, idx: number) => (
                        <div key={aff.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-white">{aff.user.firstName} {aff.user.lastName}</p>
                              <p className="text-sm text-gray-400">{aff._count.clicks} نقرة | {aff._count.orders} طلب</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* UTM Stats */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">أداء UTM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {reports.activity?.utmStats?.map((utm: any) => (
                        <div key={utm.utmSource} className="p-4 bg-gray-700/50 rounded-lg text-center">
                          <p className="text-lg font-bold text-white">{utm._count.id}</p>
                          <p className="text-sm text-gray-400">{utm.utmSource}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Affiliate Details Dialog */}
      <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">تفاصيل المسوق</DialogTitle>
            <DialogDescription className="text-gray-400">
              معلومات تفصيلية عن نشاط المسوق
            </DialogDescription>
          </DialogHeader>

          {selectedAffiliate && (
            <div className="space-y-6 mt-4">
              {/* Affiliate Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedAffiliate.user.firstName?.[0]}{selectedAffiliate.user.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedAffiliate.user.firstName} {selectedAffiliate.user.lastName}
                  </h3>
                  <p className="text-gray-400">{selectedAffiliate.user.email}</p>
                  <p className="text-sm text-purple-400 mt-1">{selectedAffiliate.referralCode}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{formatNumber(selectedAffiliate.totalClicks)}</p>
                  <p className="text-sm text-gray-400">إجمالي النقرات</p>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{formatNumber(selectedAffiliate.totalOrders)}</p>
                  <p className="text-sm text-gray-400">إجمالي الطلبات</p>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">
                    {selectedAffiliate.totalClicks > 0
                      ? ((selectedAffiliate.totalOrders / selectedAffiliate.totalClicks) * 100).toFixed(2)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-400">معدل التحويل</p>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">
                    {selectedAffiliate._count?.clicks || 0}
                  </p>
                  <p className="text-sm text-gray-400">نقرات (30 يوم)</p>
                </div>
              </div>

              {/* Recent Clicks */}
              {affiliateDetails?.recentClicks && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">آخر النقرات</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {affiliateDetails.recentClicks.slice(0, 20).map((click: any) => (
                      <div key={click.id} className="p-3 bg-gray-700/30 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 font-mono">{click.ipAddress || '—'}</span>
                          <span className="text-gray-500">{formatDate(click.createdAt)}</span>
                        </div>
                        {click.userAgent && (
                          <p className="text-gray-500 truncate mt-1">{click.userAgent}</p>
                        )}
                        {click.converted && (
                          <Badge className="mt-2 bg-green-500/10 text-green-500">تم التحويل</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
