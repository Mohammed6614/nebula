'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Ban, CheckCircle, ChevronLeft, ChevronRight,
  TrendingUp, CreditCard, Calendar, DollarSign
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatPrice } from '@/lib/utils';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  price: number;
  currency: string;
  isFirstMonthDiscount: boolean;
  discountPercentage: number;
  regularPrice: number;
  paypalSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  startedAt: string;
  cancelledAt: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  payments: any[];
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadSubscriptions();
  }, [page, statusFilter, planFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;

      const response = await adminApi.getSubscriptions(params);
      setSubscriptions(response.data.data.subscriptions);
      setTotal(response.data.data.total);
    } catch (error: any) {
      toast({
        title: 'Error loading subscriptions',
        description: error.response?.data?.message || 'Failed to load subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      await adminApi.cancelSubscription(subscriptionId, { reason: 'Admin cancellation' });
      toast({ title: 'Subscription cancelled successfully' });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'EXPIRED': return 'bg-gray-100 text-gray-700';
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'BASIC': return 'bg-gray-100 text-gray-700';
      case 'PRO': return 'bg-blue-100 text-blue-700';
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-700';
      case 'AFFILIATE': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-gray-500">Manage all platform subscriptions</p>
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
            <option value="PAST_DUE">Past Due</option>
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">All Plans</option>
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
            <option value="AFFILIATE">Affiliate</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Subscriptions"
          value={subscriptions.filter(s => s.status === 'ACTIVE').length}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <SummaryCard
          title="Total MRR"
          value={formatPrice(subscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s.price, 0))}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Cancelled This Month"
          value={subscriptions.filter(s => s.status === 'CANCELLED' && s.cancelledAt && new Date(s.cancelledAt).getMonth() === new Date().getMonth()).length}
          icon={Ban}
          color="bg-red-500"
        />
        <SummaryCard
          title="With First Month Discount"
          value={subscriptions.filter(s => s.isFirstMonthDiscount).length}
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800">
                      <th className="text-right py-3 px-4 font-medium">User</th>
                      <th className="text-right py-3 px-4 font-medium">Plan</th>
                      <th className="text-right py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Price</th>
                      <th className="text-right py-3 px-4 font-medium">Discount</th>
                      <th className="text-right py-3 px-4 font-medium">Period</th>
                      <th className="text-right py-3 px-4 font-medium">Next Billing</th>
                      <th className="text-right py-3 px-4 font-medium">Started</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">{sub.user.firstName} {sub.user.lastName}</p>
                            <p className="text-sm text-gray-500">{sub.user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getPlanBadgeColor(sub.plan)}`}>
                            {sub.plan}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(sub.status)}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">{formatPrice(sub.price)}</p>
                            {sub.isFirstMonthDiscount && (
                              <p className="text-xs text-gray-500 line-through">{formatPrice(sub.regularPrice)}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {sub.isFirstMonthDiscount ? (
                            <span className="text-green-600 text-sm">-{sub.discountPercentage}%</span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(sub.startedAt)}
                        </td>
                        <td className="py-4 px-4">
                          {sub.status === 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelSubscription(sub.id)}
                              className="text-red-600"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">
                  Total: {total} subscriptions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-2">{page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * 20 >= total}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
