'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Megaphone, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  BarChart3,
  Target,
  Users,
  TrendingUp,
  Calendar,
  MoreVertical,
  Play,
  Pause,
  Square
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'SOCIAL_MEDIA' | 'EMAIL' | 'QR_CODE' | 'INFLUENCER';
  platform?: 'TIKTOK' | 'SNAPCHAT' | 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'YOUTUBE';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  targetUrl: string;
  referralCode?: string;
  budget?: number;
  spent?: number;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
  earnings: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function AffiliateCampaignsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SOCIAL_MEDIA' | 'EMAIL' | 'QR_CODE' | 'INFLUENCER'>('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getCampaigns();
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('فشل في جلب الحملات');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await affiliateApi.updateCampaignStatus(campaignId, newStatus);
      toast.success(`تم ${newStatus === 'ACTIVE' ? 'تشغيل' : 'إيقاف'} الحملة`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('فشل في تحديث الحملة');
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحملة؟')) {
      return;
    }
    
    try {
      await affiliateApi.deleteCampaign(campaignId);
      toast.success('تم حذف الحملة');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('فشل في حذف الحملة');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && campaign.status === 'ACTIVE') ||
      (statusFilter === 'PAUSED' && campaign.status === 'PAUSED') ||
      (statusFilter === 'COMPLETED' && campaign.status === 'COMPLETED');
    
    const matchesType = 
      typeFilter === 'ALL' ||
      typeFilter === campaign.type;
    
    return matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Square className="w-4 h-4" />;
      case 'ACTIVE': return <Play className="w-4 h-4" />;
      case 'PAUSED': return <Pause className="w-4 h-4" />;
      case 'COMPLETED': return <Target className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SOCIAL_MEDIA': return <Users className="w-4 h-4" />;
      case 'EMAIL': return <Edit className="w-4 h-4" />;
      case 'QR_CODE': return <Target className="w-4 h-4" />;
      case 'INFLUENCER': return <TrendingUp className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
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
      title: 'الحملات النشطة',
      value: campaigns.filter(c => c.status === 'ACTIVE').length,
      icon: Play,
      color: 'bg-green-500',
    },
    {
      title: 'الحملات الموقفة',
      value: campaigns.filter(c => c.status === 'PAUSED').length,
      icon: Pause,
      color: 'bg-yellow-500',
    },
    {
      title: 'إجمالي النقرات',
      value: campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString(),
      icon: BarChart3,
      color: 'bg-blue-500',
    },
    {
      title: 'إجمالي التحويلات',
      value: campaigns.reduce((sum, c) => sum + c.conversions, 0).toLocaleString(),
      icon: TrendingUp,
      color: 'bg-purple-500',
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
                الحملات التسويقية
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إدارة وتتبع حملات التسويق
              </p>
            </div>
            <Link href="/dashboard/affiliate/campaigns/new">
              <Button className="btn-gradient gap-2">
                <Plus className="w-4 h-4" />
                حملة جديدة
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
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
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
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select value={statusFilter} onValueChange={(value: 'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED') => setStatusFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">الكل</SelectItem>
                    <SelectItem value="ACTIVE">نشطة</SelectItem>
                    <SelectItem value="PAUSED">موقفة</SelectItem>
                    <SelectItem value="COMPLETED">مكتملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type">النوع</Label>
                <Select value={typeFilter} onValueChange={(value: 'ALL' | 'SOCIAL_MEDIA' | 'EMAIL' | 'QR_CODE' | 'INFLUENCER') => setTypeFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">الكل</SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">وسائل التواصل الاجتماعي</SelectItem>
                    <SelectItem value="EMAIL">البريد الإلكتروني</SelectItem>
                    <SelectItem value="QR_CODE">رمز QR</SelectItem>
                    <SelectItem value="INFLUENCER">المؤثرون</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>
              الحملات ({filteredCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCampaigns.length > 0 ? (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {campaign.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)}`}>
                              {campaign.status === 'DRAFT' && 'مسودة'}
                              {campaign.status === 'ACTIVE' && 'نشطة'}
                              {campaign.status === 'PAUSED' && 'موقفة'}
                              {campaign.status === 'COMPLETED' && 'مكتملة'}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              {getTypeIcon(campaign.type)}
                              {campaign.type === 'SOCIAL_MEDIA' && 'وسائل التواصل'}
                              {campaign.type === 'EMAIL' && 'البريد الإلكتروني'}
                              {campaign.type === 'QR_CODE' && 'رمز QR'}
                              {campaign.type === 'INFLUENCER' && 'المؤثرون'}
                              {campaign.platform && ` • ${campaign.platform}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/affiliate/campaigns/${campaign.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              تعديل
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePauseResume(campaign.id, campaign.status)}
                            disabled={campaign.status === 'DRAFT' || campaign.status === 'COMPLETED'}
                          >
                            {campaign.status === 'ACTIVE' ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                إيقاف
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                تشغيل
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(campaign.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {campaign.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        {campaign.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">النقرات</p>
                        <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">الزوار الفريدين</p>
                        <p className="font-semibold">{campaign.uniqueClicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">التحويلات</p>
                        <p className="font-semibold">{campaign.conversions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">الأرباح</p>
                        <p className="font-semibold">{campaign.earnings.toFixed(2)} ر.س</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500">
                        <p>بدء: {new Date(campaign.startDate).toLocaleDateString('ar-SA')}</p>
                        {campaign.endDate && (
                          <p>انتهاء: {new Date(campaign.endDate).toLocaleDateString('ar-SA')}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>إنشاء: {new Date(campaign.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  لا توجد حملات حالياً
                </p>
                <Link href="/dashboard/affiliate/campaigns/new">
                  <Button className="btn-gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    إنشاء حملة جديدة
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
