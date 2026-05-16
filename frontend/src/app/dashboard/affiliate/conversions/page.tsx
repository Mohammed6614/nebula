'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Store, 
  Calendar,
  DollarSign,
  Eye,
  Filter,
  Download,
  ExternalLink,
  BarChart3,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { affiliateApi } from '@/lib/api';
import { toast } from 'sonner';

interface Conversion {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  storeName: string;
  storeSlug: string;
  productName: string;
  productPrice: number;
  commissionRate: number;
  commissionAmount: number;
  orderTotal: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAID';
  referralCode: string;
  referralLink: string;
  createdAt: string;
  confirmedAt?: string;
  paidAt?: string;
}

export default function AffiliateConversionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'PAID'>('ALL');
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
    fetchConversions();
  }, [user, statusFilter, dateRange]);

  const fetchConversions = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getConversions({ 
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        dateRange 
      });
      setConversions(response.data.conversions || []);
    } catch (error) {
      console.error('Error fetching conversions:', error);
      toast.error('فشل في جلب التحويلات');
    } finally {
      setLoading(false);
    }
  };

  const exportConversions = () => {
    const csv = [
      ['العميل', 'البريد', 'الهاتف', 'المتجر', 'المنتج', 'السعر', 'العمولة', 'الحالة', 'تاريخ الإنشاء', 'تاريخ التأكيد', 'تاريخ الدفع'],
      ...conversions.map(conv => [
        conv.customerName,
        conv.customerEmail,
        conv.customerPhone || '',
        `${conv.storeName} (${conv.storeSlug})`,
        conv.productName,
        conv.productPrice.toFixed(2),
        `${conv.commissionRate}%`,
        conv.commissionAmount.toFixed(2),
        conv.orderTotal.toFixed(2),
        conv.status,
        new Date(conv.createdAt).toLocaleDateString('ar-SA'),
        conv.confirmedAt ? new Date(conv.confirmedAt).toLocaleDateString('ar-SA') : '',
        conv.paidAt ? new Date(conv.paidAt).toLocaleDateString('ar-SA') : '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير التحويلات');
  };

  const filteredConversions = conversions.filter(conv => {
    const matchesSearch = 
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.productName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalEarnings = conversions.reduce((sum, conv) => sum + conv.commissionAmount, 0);
  const pendingCount = conversions.filter(c => c.status === 'PENDING').length;
  const confirmedCount = conversions.filter(c => c.status === 'CONFIRMED').length;
  const paidCount = conversions.filter(c => c.status === 'PAID').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'قيد الانتظار';
      case 'CONFIRMED': return 'مؤكد';
      case 'PAID': return 'مدفوع';
      default: return status;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                التحويلات
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                تتبع التحويلات والأرباح
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
              <Button onClick={exportConversions} className="gap-2">
                <Download className="w-4 h-4" />
                تصدير CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {conversions.length}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    إجمالي التحويلات
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalEarnings.toFixed(2)} ر.س
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    إجمالي الأرباح
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingCount}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    قيد الانتظار
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {confirmedCount}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    مؤكدة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-indigo-100">
                  <DollarSign className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {paidCount}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    مدفوعة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="ابحث بالعميل أو المتجر أو المنتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: 'ALL' | 'PENDING' | 'CONFIRMED' | 'PAID') => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                  <SelectItem value="CONFIRMED">مؤكد</SelectItem>
                  <SelectItem value="PAID">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conversions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              التحويلات ({filteredConversions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConversions.length > 0 ? (
              <div className="space-y-4">
                {filteredConversions.map((conversion, index) => (
                  <motion.div
                    key={conversion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {conversion.productName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(conversion.status)}`}>
                            {getStatusText(conversion.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>
                            <span className="font-medium">العميل:</span>
                            <span>{conversion.customerName}</span>
                          </div>
                          <div>
                            <span className="font-medium">البريد:</span>
                            <span>{conversion.customerEmail}</span>
                          </div>
                          {conversion.customerPhone && (
                            <div>
                              <span className="font-medium">الهاتف:</span>
                              <span>{conversion.customerPhone}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">المتجر:</span>
                            <Link 
                              href={`/store/${conversion.storeSlug}`}
                              target="_blank"
                              className="text-blue-600 hover:underline"
                            >
                              {conversion.storeName}
                            </Link>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {conversion.commissionAmount.toFixed(2)} ر.س
                          </p>
                          <p className="text-sm text-gray-500">
                            {conversion.commissionRate}% عمولة
                          </p>
                          <p className="text-sm text-gray-500">
                            إجمالي الطلب: {conversion.orderTotal.toFixed(2)} ر.س
                          </p>
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>كود الإحالة: {conversion.referralCode}</p>
                          <p>تاريخ الطلب: {new Date(conversion.createdAt).toLocaleDateString('ar-SA')}</p>
                          {conversion.confirmedAt && (
                            <p>تاريخ التأكيد: {new Date(conversion.confirmedAt).toLocaleDateString('ar-SA')}</p>
                          )}
                          {conversion.paidAt && (
                            <p>تاريخ الدفع: {new Date(conversion.paidAt).toLocaleDateString('ar-SA')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  لا توجد تحويلات بعد
                </p>
                <Link href="/dashboard/affiliate/links">
                  <Button className="btn-gradient">
                    إنشاء رابط إحالة جديد
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
