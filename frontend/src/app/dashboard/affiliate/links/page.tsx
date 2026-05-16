'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Link as LinkIcon, 
  Copy, 
  Share2, 
  Plus,
  Eye,
  BarChart3,
  Calendar,
  Filter,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { affiliateApi } from '@/lib/api';
import { toast } from 'sonner';

interface ReferralLink {
  id: string;
  url: string;
  referralCode: string;
  customName?: string;
  description?: string;
  isActive: boolean;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
  earnings: number;
  createdAt: string;
  lastClickAt?: string;
}

export default function AffiliateLinksPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'created' | 'clicks' | 'conversions' | 'earnings'>('created');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchLinks();
  }, [user]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getReferralLinks();
      setLinks(response.data.links || []);
    } catch (error) {
      console.error('Error fetching referral links:', error);
      toast.error('فشل في جلب روابط الإحالة');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('تم نسخ الرابط');
    } catch (error) {
      toast.error('فشل في نسخ الرابط');
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) {
      return;
    }
    
    try {
      await affiliateApi.deleteReferralLink(linkId);
      toast.success('تم حذف الرابط');
      fetchLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('فشل في حذف الرابط');
    }
  };

  const filteredAndSortedLinks = links
    .filter(link => {
      const matchesSearch = 
        link.customName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && link.isActive) ||
        (statusFilter === 'INACTIVE' && !link.isActive);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'clicks':
          return b.clicks - a.clicks;
        case 'conversions':
          return b.conversions - a.conversions;
        case 'earnings':
          return b.earnings - a.earnings;
        default:
          return 0;
      }
    });

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
                روابط الإحالة
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إدارة وتتبع روابط التسويق بالعمولة
              </p>
            </div>
            <Link href="/dashboard/affiliate/links/new">
              <Button className="btn-gradient gap-2">
                <Plus className="w-4 h-4" />
                رابط جديد
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <LinkIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {links.length}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    إجمالي الروابط
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {links.reduce((sum, link) => sum + link.clicks, 0).toLocaleString()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    إجمالي النقرات
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {links.reduce((sum, link) => sum + link.conversions, 0).toLocaleString()}
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
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {links.reduce((sum, link) => sum + link.earnings, 0).toFixed(2)} ر.س
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    إجمالي الأرباح
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
                <Label htmlFor="search" className="text-sm">بحث</Label>
                <div className="relative">
                  <Input
                    id="search"
                    type="text"
                    placeholder="ابحث بالاسم أو كود الإحالة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
              
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
              
              <Select value={sortBy} onValueChange={(value: 'created' | 'clicks' | 'conversions' | 'earnings') => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">تاريخ الإنشاء</SelectItem>
                  <SelectItem value="clicks">عدد النقرات</SelectItem>
                  <SelectItem value="conversions">عدد التحويلات</SelectItem>
                  <SelectItem value="earnings">الأرباح</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Links List */}
        <Card>
          <CardHeader>
            <CardTitle>
              الروابط ({filteredAndSortedLinks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAndSortedLinks.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {link.customName || `رابط الإحالة - ${link.referralCode}`}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            link.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {link.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                        
                        {link.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                            {link.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                            {link.url}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link.url)}
                            className="gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            نسخ
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                          >
                            <Share2 className="w-3 h-3" />
                            مشاركة
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/affiliate/links/${link.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                تعديل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(link.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-500">النقرات</p>
                        <p className="font-semibold text-lg">{link.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">زوار فريدين</p>
                        <p className="font-semibold text-lg">{link.uniqueClicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">التحويلات</p>
                        <p className="font-semibold text-lg">{link.conversions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">الأرباح</p>
                        <p className="font-semibold text-lg">{link.earnings.toFixed(2)} ر.س</p>
                      </div>
                    </div>
                    
                    {link.lastClickAt && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500">
                          آخر نقرة: {new Date(link.lastClickAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  لا توجد روابط إحالة
                </p>
                <Link href="/dashboard/affiliate/links/new">
                  <Button className="btn-gradient">
                    <Plus className="w-4 h-4 mr-2" />
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
