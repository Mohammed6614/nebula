'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, ChevronLeft, ChevronRight, CreditCard,
  DollarSign, CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatPrice } from '@/lib/utils';

interface Payment {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayTransactionId: string;
  gatewayResponse: any;
  errorMessage: string | null;
  createdAt: string;
  subscription?: {
    id: string;
    plan: string;
    user: { email: string };
  };
}

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [page, statusFilter, typeFilter, gatewayFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (gatewayFilter) params.gateway = gatewayFilter;

      const response = await adminApi.getPayments(params);
      setPayments(response.data.data.payments);
      setTotal(response.data.data.total);
    } catch (error: any) {
      toast({
        title: 'Error loading payments',
        description: error.response?.data?.message || 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'REFUNDED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'REFUNDED': return <AlertTriangle className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION': return 'bg-blue-100 text-blue-700';
      case 'ONE_TIME': return 'bg-purple-100 text-purple-700';
      case 'REFUND': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalRevenue = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
  const failedPayments = payments.filter(p => p.status === 'FAILED').length;
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments & Transactions</h1>
          <p className="text-gray-500">Monitor all financial transactions</p>
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="SUBSCRIPTION">Subscription</option>
            <option value="ONE_TIME">One-Time</option>
            <option value="REFUND">Refund</option>
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
          >
            <option value="">All Gateways</option>
            <option value="PAYPAL">PayPal</option>
            <option value="STRIPE">Stripe</option>
            <option value="HYPERPAY">HyperPay</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Revenue"
          value={formatPrice(totalRevenue)}
          icon={DollarSign}
          color="bg-green-500"
        />
        <SummaryCard
          title="Completed"
          value={payments.filter(p => p.status === 'COMPLETED').length}
          icon={CheckCircle}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Failed"
          value={failedPayments}
          icon={XCircle}
          color="bg-red-500"
        />
        <SummaryCard
          title="Pending"
          value={pendingPayments}
          icon={Clock}
          color="bg-yellow-500"
        />
      </div>

      {/* Payments Table */}
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
                      <th className="text-right py-3 px-4 font-medium">Transaction ID</th>
                      <th className="text-right py-3 px-4 font-medium">Type</th>
                      <th className="text-right py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                      <th className="text-right py-3 px-4 font-medium">Gateway</th>
                      <th className="text-right py-3 px-4 font-medium">User/Subscription</th>
                      <th className="text-right py-3 px-4 font-medium">Date</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono">{payment.gatewayTransactionId.substring(0, 12)}...</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getTypeBadgeColor(payment.type)}`}>
                            {payment.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium">{formatPrice(payment.amount)}</p>
                          <p className="text-xs text-gray-500">{payment.currency}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm">{payment.gateway}</span>
                        </td>
                        <td className="py-4 px-4">
                          {payment.subscription ? (
                            <div>
                              <p className="text-sm">{payment.subscription.user.email}</p>
                              <p className="text-xs text-gray-500">{payment.subscription.plan}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">
                  Total: {total} transactions
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

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Payment Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)}>
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-mono text-sm">{selectedPayment.gatewayTransactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{selectedPayment.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedPayment.status)}
                      <span className="font-medium">{selectedPayment.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">{formatPrice(selectedPayment.amount)} {selectedPayment.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gateway</p>
                    <p className="font-medium">{selectedPayment.gateway}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                </div>

                {selectedPayment.errorMessage && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Error Message</p>
                    <p className="text-red-600">{selectedPayment.errorMessage}</p>
                  </div>
                )}

                {selectedPayment.gatewayResponse && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Gateway Response</p>
                    <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selectedPayment.gatewayResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
