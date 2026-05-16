'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  Megaphone,
  Handshake,
  TrendingUp,
  Clock,
  Filter,
  Trash2,
  Eye,
  Archive
} from 'lucide-react';
import Link from 'next/link';
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

interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'SUBSCRIPTION' | 'CAMPAIGN' | 'COLLABORATION' | 'PAYMENT' | 'SYSTEM' | 'PERFORMANCE';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  data?: any;
  actionUrl?: string;
  actionText?: string;
}

export default function AffiliateNotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SUBSCRIPTION' | 'CAMPAIGN' | 'COLLABORATION' | 'PAYMENT' | 'SYSTEM' | 'PERFORMANCE'>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('فشل في جلب الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await affiliateApi.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('فشل في تحديث الإشعار');
    }
  };

  const markAllAsRead = async () => {
    try {
      await affiliateApi.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      toast.success('تم تحديث جميع الإشعارات');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('فشل في تحديث الإشعارات');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      return;
    }
    
    try {
      await affiliateApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('تم حذف الإشعار');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('فشل في حذف الإشعار');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = typeFilter === 'ALL' || notification.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || notification.category === categoryFilter;
    const matchesRead = readFilter === 'ALL' || 
      (readFilter === 'READ' && notification.isRead) ||
      (readFilter === 'UNREAD' && !notification.isRead);
    
    return matchesType && matchesCategory && matchesRead;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO': return Bell;
      case 'SUCCESS': return CheckCircle;
      case 'WARNING': return AlertCircle;
      case 'ERROR': return XCircle;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SUBSCRIPTION': return DollarSign;
      case 'CAMPAIGN': return Megaphone;
      case 'COLLABORATION': return Handshake;
      case 'PAYMENT': return DollarSign;
      case 'PERFORMANCE': return TrendingUp;
      default: return Bell;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'SUBSCRIPTION': return 'الاشتراك';
      case 'CAMPAIGN': return 'الحملات';
      case 'COLLABORATION': return 'التعاون';
      case 'PAYMENT': return 'الدفعات';
      case 'SYSTEM': return 'النظام';
      case 'PERFORMANCE': return 'الأداء';
      default: return category;
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

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const statsCards = [
    {
      title: 'الإشعارات غير المقروءة',
      value: unreadCount,
      icon: Bell,
      color: 'bg-blue-500',
    },
    {
      title: 'الإشعارات الإجمالية',
      value: notifications.length,
      icon: Archive,
      color: 'bg-gray-500',
    },
    {
      title: 'إشعارات النظام',
      value: notifications.filter(n => n.category === 'SYSTEM').length,
      icon: Bell,
      color: 'bg-purple-500',
    },
    {
      title: 'إشعارات الأداء',
      value: notifications.filter(n => n.category === 'PERFORMANCE').length,
      icon: TrendingUp,
      color: 'bg-green-500',
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
                الإشعارات
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إدارة الإشعارات والتنبيهات
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline">
                  تحديد الكل كمقروء
                </Button>
              )}
              <Button variant="outline">
                <Archive className="w-4 h-4 mr-2" />
                أرشفة الكل
              </Button>
            </div>
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
              <Select value={typeFilter} onValueChange={(value: 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR') => setTypeFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  <SelectItem value="INFO">معلومات</SelectItem>
                  <SelectItem value="SUCCESS">نجاح</SelectItem>
                  <SelectItem value="WARNING">تحذير</SelectItem>
                  <SelectItem value="ERROR">خطأ</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={(value: 'ALL' | 'SUBSCRIPTION' | 'CAMPAIGN' | 'COLLABORATION' | 'PAYMENT' | 'SYSTEM' | 'PERFORMANCE') => setCategoryFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  <SelectItem value="SUBSCRIPTION">الاشتراك</SelectItem>
                  <SelectItem value="CAMPAIGN">الحملات</SelectItem>
                  <SelectItem value="COLLABORATION">التعاون</SelectItem>
                  <SelectItem value="PAYMENT">الدفعات</SelectItem>
                  <SelectItem value="SYSTEM">النظام</SelectItem>
                  <SelectItem value="PERFORMANCE">الأداء</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={readFilter} onValueChange={(value: 'ALL' | 'READ' | 'UNREAD') => setReadFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">الكل</SelectItem>
                  <SelectItem value="READ">مقروء</SelectItem>
                  <SelectItem value="UNREAD">غير مقروء</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>
              الإشعارات ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification, index) => {
                  const TypeIcon = getTypeIcon(notification.type);
                  const CategoryIcon = getCategoryIcon(notification.category);
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                        !notification.isRead 
                          ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 mb-3">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <CategoryIcon className="w-3 h-3" />
                                <span>{getCategoryText(notification.category)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(notification.createdAt).toLocaleDateString('ar-SA')}</span>
                              </div>
                              {notification.readAt && (
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>مقروء {new Date(notification.readAt).toLocaleDateString('ar-SA')}</span>
                                </div>
                              )}
                            </div>
                            
                            {notification.actionUrl && (
                              <div className="mt-3">
                                <Link href={notification.actionUrl}>
                                  <Button variant="outline" size="sm">
                                    {notification.actionText || 'عرض التفاصيل'}
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  لا توجد إشعارات
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
