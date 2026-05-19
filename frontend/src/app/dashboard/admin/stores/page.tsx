'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Store, Ban, CheckCircle, Trash2, MoreHorizontal,
  ChevronLeft, ChevronRight, Activity, TrendingUp, Package, ShoppingCart
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatPrice } from '@/lib/utils';

interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isVerified: boolean;
  owner: { id: string; email: string; firstName: string; lastName: string };
  _count: { products: number; orders: number };
  createdAt: string;
}

interface StoreHealth {
  storeId: string;
  storeName: string;
  isActive: boolean;
  productsCount: number;
  ordersCount: number;
  recentOrders: number;
  healthScore: number;
  healthStatus: string;
}

export default function AdminStoresPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [storeHealth, setStoreHealth] = useState<StoreHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    loadStores();
  }, [page, search, statusFilter]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== '') params.isActive = statusFilter === 'active';

      const response = await adminApi.getStores(params);
      setStores(response.data.data.stores);
      setTotal(response.data.data.total);
    } catch (error: any) {
      toast({
        title: 'Error loading stores',
        description: error.response?.data?.message || 'Failed to load stores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStoreStatus = async (storeId: string) => {
    try {
      await adminApi.toggleStoreStatus(storeId);
      toast({ title: 'Store status updated successfully' });
      loadStores();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update store status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) return;
    
    try {
      await adminApi.deleteStore(storeId);
      toast({ title: 'Store deleted successfully' });
      loadStores();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete store',
        variant: 'destructive',
      });
    }
  };

  const handleViewHealth = async (store: Store) => {
    setSelectedStore(store);
    setShowHealthModal(true);
    setHealthLoading(true);
    
    try {
      const response = await adminApi.getStoreHealth(store.id);
      setStoreHealth(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error loading store health',
        description: error.response?.data?.message || 'Failed to load store health',
        variant: 'destructive',
      });
    } finally {
      setHealthLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'bg-green-100 text-green-700';
      case 'GOOD': return 'bg-blue-100 text-blue-700';
      case 'FAIR': return 'bg-yellow-100 text-yellow-700';
      case 'POOR': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'GOOD': return <Activity className="w-5 h-5 text-blue-600" />;
      case 'FAIR': return <TrendingUp className="w-5 h-5 text-yellow-600" />;
      case 'POOR': return <Ban className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Store Management</h1>
          <p className="text-gray-500">Manage all platform stores</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search stores..."
              className="pr-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stores Table */}
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
                      <th className="text-right py-3 px-4 font-medium">Store</th>
                      <th className="text-right py-3 px-4 font-medium">Owner</th>
                      <th className="text-right py-3 px-4 font-medium">Products</th>
                      <th className="text-right py-3 px-4 font-medium">Orders</th>
                      <th className="text-right py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Verified</th>
                      <th className="text-right py-3 px-4 font-medium">Created</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store) => (
                      <tr key={store.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nebula-500 to-purple-600 flex items-center justify-center">
                              <Store className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{store.name}</p>
                              <p className="text-sm text-gray-500">/{store.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm">{store.owner.firstName} {store.owner.lastName}</p>
                          <p className="text-xs text-gray-500">{store.owner.email}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{store._count.products}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{store._count.orders}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            store.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {store.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {store.isVerified ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(store.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHealth(store)}
                              title="View Health"
                            >
                              <Activity className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStoreStatus(store.id)}
                              className={store.isActive ? 'text-yellow-600' : 'text-green-600'}
                              title={store.isActive ? 'Suspend' : 'Activate'}
                            >
                              {store.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStore(store.id)}
                              className="text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">
                  Total: {total} stores
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

      {/* Health Modal */}
      {showHealthModal && selectedStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Store Health - {selectedStore.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHealthModal(false)}>
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {healthLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600 mx-auto"></div>
                </div>
              ) : storeHealth ? (
                <div className="space-y-6">
                  {/* Health Score */}
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getHealthStatusIcon(storeHealth.healthStatus)}
                      <span className={`text-2xl font-bold ${getHealthStatusColor(storeHealth.healthStatus).split(' ')[1]}`}>
                        {storeHealth.healthStatus}
                      </span>
                    </div>
                    <p className="text-4xl font-bold">{storeHealth.healthScore}/100</p>
                    <p className="text-sm text-gray-500 mt-1">Health Score</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        <p className="text-sm text-gray-500">Products</p>
                      </div>
                      <p className="text-2xl font-bold">{storeHealth.productsCount}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-gray-500">Total Orders</p>
                      </div>
                      <p className="text-2xl font-bold">{storeHealth.ordersCount}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <p className="text-sm text-gray-500">Recent Orders (30d)</p>
                      </div>
                      <p className="text-2xl font-bold">{storeHealth.recentOrders}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="w-5 h-5 text-orange-500" />
                        <p className="text-sm text-gray-500">Status</p>
                      </div>
                      <p className="text-2xl font-bold">{storeHealth.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load store health data
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
