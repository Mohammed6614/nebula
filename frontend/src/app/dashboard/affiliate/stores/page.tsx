'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Store, 
  Users, 
  TrendingUp, 
  DollarSign,
  Star,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Eye,
  BarChart3,
  Handshake
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

interface PromotedStore {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  category: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  commissionRate: number;
  totalClicks: number;
  uniqueVisitors: number;
  conversions: number;
  earnings: number;
  collaborationStatus: 'NONE' | 'REQUESTED' | 'ACTIVE' | 'REJECTED';
  collaborationType?: 'PERCENTAGE' | 'FIXED' | 'HYBRID';
  collaborationAmount?: number;
  createdAt: string;
  lastClickAt?: string;
}

export default function AffiliateStoresPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [stores, setStores] = useState<PromotedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [collaborationFilter, setCollaborationFilter] = useState<'ALL' | 'NONE' | 'REQUESTED' | 'ACTIVE' | 'REJECTED'>('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchStores();
  }, [user]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getPromotedStores();
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('فشل في جلب المتاجر');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCollaboration = async (storeId: string) => {
    try {
      await affiliateApi.requestCollaboration(storeId);
      toast.success('تم إرسال طلب التعاون');
      fetchStores();
    } catch (error) {
      console.error('Error requesting collaboration:', error);
      toast.error('فشل في إرسال طلب التعاون');
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || store.category === categoryFilter;
    
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && store.isActive) ||
      (statusFilter === 'INACTIVE' && !store.isActive);
    
    const matchesCollaboration = 
      collaborationFilter === 'ALL' ||
      store.collaborationStatus === collaborationFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCollaboration;
  });

  const categories = [...new Set(stores.map(store => store.category))];

  const getCollaborationColor = (status: string) => {
    switch (status) {
      case 'NONE': return 'bg-gray-100 text-gray-800';
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCollaborationText = (status: string) => {
    switch (status) {
      case 'NONE': return 'لا يوجد تعاون';
      case 'REQUESTED': return 'تم إرسال الطلب';
      case 'ACTIVE': return 'تعاون نشط';
      case 'REJECTED': return 'مرفوض';
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

  const statsCards = [
    {
      title: 'المتاجر المروجة',
      value: stores.length,
      icon: Store,
      color: 'bg-blue-500',
    },
    {
      title: 'التعاونات النشطة',
      value: stores.filter(s => s.collaborationStatus === 'ACTIVE').length,
      icon: Handshake,
      color: 'bg-green-500',
    },
    {
      title: 'إجمالي النقرات',
      value: stores.reduce((sum, store) => sum + store.totalClicks, 0).toLocaleString(),
      icon: Eye,
      color: 'bg-purple-500',
    },
    {
      title: 'إجمالي الأرباح',
      value: `${stores.reduce((sum, store) => sum + store.earnings, 0).toFixed(2)} ر.س`,
      icon: DollarSign,
      color: 'bg-yellow-500',
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
                المتاجر المروجة
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إدارة المتاجر التي تروج لها
              </p>
            </div>
            <Link href="/marketplace">
              <Button className="btn-gradient gap-2">
                <Plus className="w-4 h-4" />
                استكشف المتاجر
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {stat.title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="ابحث بالاسم أو الوصف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(value: 'ALL' | 'ACTIVE' | 'INACTIVE') => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="INACTIVE">غير نشط</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={collaborationFilter} onValueChange={(value: 'ALL' | 'NONE' | 'REQUESTED' | 'ACTIVE' | 'REJECTED') => setCollaborationFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="التعاون" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  <SelectItem value="NONE">لا يوجد تعاون</SelectItem>
                  <SelectItem value="REQUESTED">تم إرسال الطلب</SelectItem>
                  <SelectItem value="ACTIVE">تعاون نشط</SelectItem>
                  <SelectItem value="REJECTED">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.length > 0 ? (
            filteredStores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-hover h-full">
                  <div className="relative">
                    {store.banner && (
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                        <img 
                          src={store.banner} 
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getCollaborationColor(store.collaborationStatus)}`}>
                        {getCollaborationText(store.collaborationStatus)}
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {store.logo ? (
                          <img 
                            src={store.logo} 
                            alt={store.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Store className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {store.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {store.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {store.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {store.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{store.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({store.totalReviews} تقييم)
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">النقرات</p>
                        <p className="font-bold">{store.totalClicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">التحويلات</p>
                        <p className="font-bold">{store.conversions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">الأرباح</p>
                        <p className="font-bold">{store.earnings.toFixed(2)} ر.س</p>
                      </div>
                      <div>
                        <p className="text-gray-500">العمولة</p>
                        <p className="font-bold">{store.commissionRate}%</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/store/${store.slug}`} target="_blank" className="flex-1">
                        <Button variant="outline" className="w-full gap-2">
                          <ExternalLink className="w-4 h-4" />
                          زيارة المتجر
                        </Button>
                      </Link>
                      
                      {store.collaborationStatus === 'NONE' && (
                        <Button 
                          onClick={() => handleRequestCollaboration(store.id)}
                          className="btn-gradient gap-2"
                        >
                          <Handshake className="w-4 h-4" />
                          طلب تعاون
                        </Button>
                      )}
                      
                      {store.collaborationStatus === 'ACTIVE' && (
                        <Button variant="outline" className="w-full">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          التفاصيل
                        </Button>
                      )}
                    </div>
                    
                    {store.lastClickAt && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500">
                          آخر نقرة: {new Date(store.lastClickAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                لا توجد متاجر مروجة بعد
              </p>
              <Link href="/marketplace">
                <Button className="btn-gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  استكشف المتاجر
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
