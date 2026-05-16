'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  Crown,
  Zap,
  Star
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

interface Subscription {
  id: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
  currency: string;
  features: string[];
  paymentMethod?: string;
  lastPaymentAt?: string;
  nextPaymentAt?: string;
  daysUntilExpiry: number;
  usage: {
    clicks: number;
    clicksLimit: number;
    campaigns: number;
    campaignsLimit: number;
    stores: number;
    storesLimit: number;
  };
}

interface Plan {
  id: string;
  name: string;
  type: 'BASIC' | 'PRO' | 'ENTERPRISE';
  price: number;
  currency: string;
  duration: 'MONTHLY' | 'YEARLY';
  features: Array<{
    name: string;
    included: boolean;
    value?: string;
  }>;
  popular?: boolean;
  icon?: any;
}

export default function AffiliateSubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'AFFILIATE') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subscriptionResponse, plansResponse] = await Promise.all([
        affiliateApi.getCurrentSubscription(),
        affiliateApi.getAvailablePlans(),
      ]);
      
      setSubscription(subscriptionResponse.data.subscription);
      setPlans(plansResponse.data.plans || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('فشل في جلب بيانات الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      await affiliateApi.upgradeSubscription(planId);
      toast.success('تم ترقية الاشتراك بنجاح');
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('فشل في ترقية الاشتراك');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟')) {
      return;
    }
    
    try {
      await affiliateApi.cancelSubscription();
      toast.success('تم إلغاء الاشتراك');
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('فشل في إلغاء الاشتراك');
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      await affiliateApi.toggleAutoRenew(!subscription?.autoRenew);
      toast.success(`تم ${!subscription?.autoRenew ? 'تفعيل' : 'إلغاء'} التجديد التلقائي`);
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error toggling auto renew:', error);
      toast.error('فشل في تحديث التجديد التلقائي');
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'BASIC': return Star;
      case 'PRO': return Zap;
      case 'ENTERPRISE': return Crown;
      default: return CreditCard;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'نشط';
      case 'EXPIRED': return 'منتهي';
      case 'CANCELLED': return 'ملغي';
      case 'PENDING': return 'قيد الانتظار';
      default: return status;
    }
  };

  const getPlanName = (type: string) => {
    switch (type) {
      case 'BASIC': return 'الأساسي';
      case 'PRO': return 'المحترف';
      case 'ENTERPRISE': return 'المؤسسات';
      default: return type;
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

  const filteredPlans = plans.map(plan => ({
    ...plan,
    price: billingCycle === 'YEARLY' ? plan.price * 10 : plan.price,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                إدارة الاشتراك
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إدارة اشتراك المسوق والخطط المتاحة
              </p>
            </div>
            <Select value={billingCycle} onValueChange={(value: 'MONTHLY' | 'YEARLY') => setBillingCycle(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">شهري</SelectItem>
                <SelectItem value="YEARLY">سنوي (خصم 17%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Subscription */}
        {subscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                الاشتراك الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const Icon = getPlanIcon(subscription.plan);
                      return <Icon className="w-5 h-5 text-blue-600" />;
                    })()}
                    <h3 className="text-lg font-semibold">
                      {getPlanName(subscription.plan)}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">السعر</p>
                  <p className="text-xl font-bold">
                    {subscription.price} {subscription.currency}/{billingCycle === 'YEARLY' ? 'سنة' : 'شهر'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">مدة الاشتراك</p>
                  <p className="font-medium">
                    {new Date(subscription.startDate).toLocaleDateString('ar-SA')} - {new Date(subscription.endDate).toLocaleDateString('ar-SA')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscription.daysUntilExpiry} يوم متبقي
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">التجديد التلقائي</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      subscription.autoRenew 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {subscription.autoRenew ? 'مفعل' : 'معطل'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleAutoRenew}
                    >
                      {subscription.autoRenew ? 'إلغاء' : 'تفعيل'}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Usage Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">النقرات</span>
                    <span className="text-sm font-medium">
                      {subscription.usage.clicks}/{subscription.usage.clicksLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(subscription.usage.clicks / subscription.usage.clicksLimit) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">الحملات</span>
                    <span className="text-sm font-medium">
                      {subscription.usage.campaigns}/{subscription.usage.campaignsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${(subscription.usage.campaigns / subscription.usage.campaignsLimit) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">المتاجر</span>
                    <span className="text-sm font-medium">
                      {subscription.usage.stores}/{subscription.usage.storesLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: `${(subscription.usage.stores / subscription.usage.storesLimit) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 mt-6">
                {subscription.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    className="text-red-600 hover:text-red-700"
                  >
                    إلغاء الاشتراك
                  </Button>
                )}
                {subscription.status === 'EXPIRED' && (
                  <Link href="/dashboard/affiliate/subscription/plans">
                    <Button className="btn-gradient">
                      تجديد الاشتراك
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>الخطط المتاحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPlans.map((plan, index) => {
                const Icon = getPlanIcon(plan.type);
                const isCurrentPlan = subscription?.plan === plan.type;
                const canUpgrade = subscription && 
                  ['BASIC', 'PRO'].includes(plan.type) && 
                  ['BASIC', 'PRO'].includes(subscription.plan) &&
                  plan.type !== subscription.plan;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`card-hover h-full relative ${
                      plan.popular ? 'ring-2 ring-blue-500' : ''
                    } ${isCurrentPlan ? 'border-blue-500' : ''}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            الأكثر شعبية
                          </span>
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="text-center mb-6">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                            plan.type === 'BASIC' ? 'bg-gray-100' :
                            plan.type === 'PRO' ? 'bg-blue-100' :
                            'bg-purple-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              plan.type === 'BASIC' ? 'text-gray-600' :
                              plan.type === 'PRO' ? 'text-blue-600' :
                              'text-purple-600'
                            }`} />
                          </div>
                          <h3 className="text-xl font-bold mb-2">
                            {plan.name}
                          </h3>
                          <div className="text-3xl font-bold mb-1">
                            {plan.price} {plan.currency}
                          </div>
                          <p className="text-gray-500 text-sm">
                            {billingCycle === 'YEARLY' ? '/سنة' : '/شهر'}
                          </p>
                          {billingCycle === 'YEARLY' && (
                            <p className="text-green-600 text-sm mt-1">
                              وفر {plan.price * 2} {plan.currency} سنوياً
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          {plan.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-2">
                              {feature.included ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className={`text-sm ${!feature.included ? 'text-gray-400' : ''}`}>
                                {feature.name}
                                {feature.value && (
                                  <span className="font-medium mr-1">{feature.value}</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          className={`w-full ${
                            isCurrentPlan 
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                              : plan.popular 
                                ? 'btn-gradient' 
                                : ''
                          }`}
                          disabled={isCurrentPlan}
                          onClick={() => !isCurrentPlan && handleUpgradePlan(plan.id)}
                        >
                          {isCurrentPlan ? 'الخطة الحالية' : 'ترقية الآن'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
