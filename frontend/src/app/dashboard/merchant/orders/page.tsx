'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Search, Filter, Eye, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { merchantApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    product: {
      name: string;
      images: Array<{ url: string }>;
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  PAID: 'مدفوع',
  PROCESSING: 'قيد المعالجة',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4" />,
  PAID: <CheckCircle className="w-4 h-4" />,
  PROCESSING: <Package className="w-4 h-4" />,
  SHIPPED: <Truck className="w-4 h-4" />,
  DELIVERED: <CheckCircle className="w-4 h-4" />,
  CANCELLED: <XCircle className="w-4 h-4" />,
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role !== 'MERCHANT') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'MERCHANT') {
      fetchStoreAndOrders();
    }
  }, [user]);

  const fetchStoreAndOrders = async () => {
    try {
      setLoading(true);
      const storeRes = await merchantApi.getMyStore();
      const storeData = storeRes.data.store;
      setStoreId(storeData.id);
      
      const ordersRes = await merchantApi.getStoreOrders(storeData.id);
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await merchantApi.updateOrderStatus(orderId, newStatus);
      toast.success('تم تحديث حالة الطلب');
      fetchStoreAndOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('فشل في تحديث حالة الطلب');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'MERCHANT') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة الطلبات
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              إدارة طلبات متجرك
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'الكل', value: orders.length, color: 'bg-gray-500' },
            { label: 'جديد', value: orders.filter(o => o.status === 'PENDING').length, color: 'bg-yellow-500' },
            { label: 'قيد التنفيذ', value: orders.filter(o => ['PAID', 'PROCESSING', 'SHIPPED'].includes(o.status)).length, color: 'bg-blue-500' },
            { label: 'مكتمل', value: orders.filter(o => o.status === 'DELIVERED').length, color: 'bg-green-500' },
          ].map((stat) => (
            <Card key={stat.label} className="card-hover">
              <CardContent className="p-4">
                <div className={`w-3 h-3 rounded-full ${stat.color} mb-2`}></div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="البحث برقم الطلب أو العميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                  <SelectItem value="PAID">مدفوع</SelectItem>
                  <SelectItem value="PROCESSING">قيد المعالجة</SelectItem>
                  <SelectItem value="SHIPPED">تم الشحن</SelectItem>
                  <SelectItem value="DELIVERED">تم التوصيل</SelectItem>
                  <SelectItem value="CANCELLED">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              الطلبات ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-medium">رقم الطلب</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">الإجمالي</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">التاريخ</th>
                      <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">
                              {order.customer.firstName} {order.customer.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{order.customer.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{order.total.toFixed(2)} ر.س</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}
                          >
                            {statusIcons[order.status]}
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                                <SelectItem value="PAID">مدفوع</SelectItem>
                                <SelectItem value="PROCESSING">قيد المعالجة</SelectItem>
                                <SelectItem value="SHIPPED">تم الشحن</SelectItem>
                                <SelectItem value="DELIVERED">تم التوصيل</SelectItem>
                                <SelectItem value="CANCELLED">ملغي</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد طلبات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-500">حالة الطلب</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${statusColors[selectedOrder.status]}`}>
                  {statusIcons[selectedOrder.status]}
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3">معلومات العميل</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                  <p><span className="text-gray-500">الاسم:</span> {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                  <p><span className="text-gray-500">البريد:</span> {selectedOrder.customer.email}</p>
                  {selectedOrder.customer.phone && (
                    <p><span className="text-gray-500">الهاتف:</span> {selectedOrder.customer.phone}</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-3">عنوان الشحن</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                  <p className="text-gray-500">{selectedOrder.shippingAddress.address}</p>
                  <p className="text-gray-500">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}</p>
                  <p className="text-gray-500">{selectedOrder.shippingAddress.phone}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">المنتجات</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {item.product.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{(item.price * item.quantity).toFixed(2)} ر.س</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">الإجمالي</span>
                  <span className="text-xl font-bold">{selectedOrder.total.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
