'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Plus, 
  MessageSquare, 
  DollarSign,
  Calendar,
  Store,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Send,
  Edit
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
import { affiliateApi } from '@/lib/api';
import { toast } from 'sonner';

interface Collaboration {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone?: string;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';
  type: 'PERCENTAGE' | 'FIXED' | 'HYBRID';
  percentageRate?: number;
  fixedAmount?: number;
  terms?: string;
  message?: string;
  merchantResponse?: string;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  isExternalPayment: boolean;
  externalPaymentMethod?: string;
  externalPaymentDetails?: string;
}

export default function AffiliateCollaborationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    merchantEmail: '',
    storeSlug: '',
    message: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'HYBRID',
    percentageRate: '',
    fixedAmount: '',
    isExternalPayment: false,
    externalPaymentMethod: '',
    externalPaymentDetails: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchCollaborations();
  }, [user]);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getCollaborations();
      setCollaborations(response.data.collaborations || []);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      toast.error('فشل في جلب طلبات التعاون');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = async () => {
    try {
      const requestData = {
        merchantEmail: newRequest.merchantEmail,
        storeSlug: newRequest.storeSlug,
        message: newRequest.message,
        type: newRequest.type,
        ...(newRequest.type === 'PERCENTAGE' && { percentageRate: parseFloat(newRequest.percentageRate) }),
        ...(newRequest.type === 'FIXED' && { fixedAmount: parseFloat(newRequest.fixedAmount) }),
        ...(newRequest.type === 'HYBRID' && { 
          percentageRate: parseFloat(newRequest.percentageRate),
          fixedAmount: parseFloat(newRequest.fixedAmount)
        }),
        isExternalPayment: newRequest.isExternalPayment,
        ...(newRequest.isExternalPayment && {
          externalPaymentMethod: newRequest.externalPaymentMethod,
          externalPaymentDetails: newRequest.externalPaymentDetails
        }),
      };

      await affiliateApi.requestCollaboration(requestData);
      toast.success('تم إرسال طلب التعاون بنجاح');
      setShowNewRequest(false);
      setNewRequest({
        merchantEmail: '',
        storeSlug: '',
        message: '',
        type: 'PERCENTAGE',
        percentageRate: '',
        fixedAmount: '',
        isExternalPayment: false,
        externalPaymentMethod: '',
        externalPaymentDetails: '',
      });
      fetchCollaborations();
    } catch (error) {
      console.error('Error requesting collaboration:', error);
      toast.error('فشل في إرسال طلب التعاون');
    }
  };

  const handleSendMessage = async (collaborationId: string, message: string) => {
    try {
      await affiliateApi.sendCollaborationMessage(collaborationId, message);
      toast.success('تم إرسال الرسالة');
      fetchCollaborations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('فشل في إرسال الرسالة');
    }
  };

  const filteredCollaborations = collaborations.filter(collab => 
    statusFilter === 'ALL' || collab.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'قيد الانتظار';
      case 'ACCEPTED': return 'مقبول';
      case 'REJECTED': return 'مرفوض';
      case 'ACTIVE': return 'نشط';
      case 'COMPLETED': return 'مكتمل';
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
      title: 'الطلبات المعلقة',
      value: collaborations.filter(c => c.status === 'PENDING').length,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'التعاونات النشطة',
      value: collaborations.filter(c => c.status === 'ACTIVE').length,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'الطلبات المرفوضة',
      value: collaborations.filter(c => c.status === 'REJECTED').length,
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      title: 'التعاونات المكتملة',
      value: collaborations.filter(c => c.status === 'COMPLETED').length,
      icon: CheckCircle,
      color: 'bg-gray-500',
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
                التعاون مع التجار
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إدارة طلبات التعاون والاتفاقيات مع التجار
              </p>
            </div>
            <Button 
              onClick={() => setShowNewRequest(true)}
              className="btn-gradient gap-2"
            >
              <Plus className="w-4 h-4" />
              طلب تعاون جديد
            </Button>
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

        {/* New Request Modal */}
        {showNewRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  طلب تعاون جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="merchantEmail">بريد التاجر</Label>
                    <Input
                      id="merchantEmail"
                      type="email"
                      placeholder="merchant@example.com"
                      value={newRequest.merchantEmail}
                      onChange={(e) => setNewRequest({...newRequest, merchantEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="storeSlug">رابط المتجر</Label>
                    <Input
                      id="storeSlug"
                      placeholder="store-name"
                      value={newRequest.storeSlug}
                      onChange={(e) => setNewRequest({...newRequest, storeSlug: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message">الرسالة</Label>
                  <Textarea
                    id="message"
                    placeholder="اكتب رسالتك للتجار..."
                    value={newRequest.message}
                    onChange={(e) => setNewRequest({...newRequest, message: e.target.value})}
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">نوع التعاون</Label>
                  <Select value={newRequest.type} onValueChange={(value: 'PERCENTAGE' | 'FIXED' | 'HYBRID') => setNewRequest({...newRequest, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">نسبة مئوية</SelectItem>
                      <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                      <SelectItem value="HYBRID">مختلط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(newRequest.type === 'PERCENTAGE' || newRequest.type === 'HYBRID') && (
                  <div>
                    <Label htmlFor="percentageRate">النسبة المئوية (%)</Label>
                    <Input
                      id="percentageRate"
                      type="number"
                      placeholder="15"
                      value={newRequest.percentageRate}
                      onChange={(e) => setNewRequest({...newRequest, percentageRate: e.target.value})}
                    />
                  </div>
                )}
                
                {(newRequest.type === 'FIXED' || newRequest.type === 'HYBRID') && (
                  <div>
                    <Label htmlFor="fixedAmount">المبلغ الثابت (ر.س)</Label>
                    <Input
                      id="fixedAmount"
                      type="number"
                      placeholder="500"
                      value={newRequest.fixedAmount}
                      onChange={(e) => setNewRequest({...newRequest, fixedAmount: e.target.value})}
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isExternalPayment"
                    checked={newRequest.isExternalPayment}
                    onChange={(e) => setNewRequest({...newRequest, isExternalPayment: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isExternalPayment">
                    الدفع خارج المنصة
                  </Label>
                </div>
                
                {newRequest.isExternalPayment && (
                  <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ الدفع بين التاجر والمسوق خارج المنصة
                    </p>
                    <div>
                      <Label htmlFor="externalPaymentMethod">طريقة الدفع</Label>
                      <Input
                        id="externalPaymentMethod"
                        placeholder="تحويل بنكي، PayPal، إلخ..."
                        value={newRequest.externalPaymentMethod}
                        onChange={(e) => setNewRequest({...newRequest, externalPaymentMethod: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="externalPaymentDetails">تفاصيل الدفع</Label>
                      <Textarea
                        id="externalPaymentDetails"
                        placeholder="رقم الحساب، البريد الإلكتروني، إلخ..."
                        value={newRequest.externalPaymentDetails}
                        onChange={(e) => setNewRequest({...newRequest, externalPaymentDetails: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleNewRequest} className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    إرسال الطلب
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewRequest(false)}>
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Select value={statusFilter} onValueChange={(value: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED') => setStatusFilter(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                <SelectItem value="ACCEPTED">مقبول</SelectItem>
                <SelectItem value="REJECTED">مرفوض</SelectItem>
                <SelectItem value="ACTIVE">نشط</SelectItem>
                <SelectItem value="COMPLETED">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Collaborations List */}
        <div className="space-y-4">
          {filteredCollaborations.length > 0 ? (
            filteredCollaborations.map((collab, index) => (
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        {collab.storeLogo ? (
                          <img 
                            src={collab.storeLogo} 
                            alt={collab.storeName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Store className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {collab.storeName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {collab.merchantName} • {collab.merchantEmail}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(collab.status)}`}>
                          {getStatusText(collab.status)}
                        </span>
                        <Link href={`/store/${collab.storeSlug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">نوع التعاون</p>
                        <p className="font-medium">
                          {collab.type === 'PERCENTAGE' && `${collab.percentageRate}% نسبة`}
                          {collab.type === 'FIXED' && `${collab.fixedAmount} ر.س ثابت`}
                          {collab.type === 'HYBRID' && `${collab.percentageRate}% + ${collab.fixedAmount} ر.س`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">الدفع</p>
                        <p className="font-medium">
                          {collab.isExternalPayment ? 'خارج المنصة' : 'داخل المنصة'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">تاريخ الطلب</p>
                        <p className="font-medium">
                          {new Date(collab.requestedAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    
                    {collab.message && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>رسالتك:</strong> {collab.message}
                        </p>
                      </div>
                    )}
                    
                    {collab.merchantResponse && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          <strong>رد التاجر:</strong> {collab.merchantResponse}
                        </p>
                      </div>
                    )}
                    
                    {collab.isExternalPayment && collab.externalPaymentDetails && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>تفاصيل الدفع الخارجي:</strong> {collab.externalPaymentDetails}
                        </p>
                      </div>
                    )}
                    
                    {collab.status === 'ACTIVE' && (
                      <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                          <MessageSquare className="w-4 h-4" />
                          إرسال رسالة
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <Edit className="w-4 h-4" />
                          تعديل الاتفاقية
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  لا توجد طلبات تعاون حالياً
                </p>
                <Button 
                  onClick={() => setShowNewRequest(true)}
                  className="btn-gradient gap-2"
                >
                  <Plus className="w-4 h-4" />
                  طلب تعاون جديد
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
