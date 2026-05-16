'use client';

import { motion } from 'framer-motion';
import { Store, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { storeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  city: string | null;
  isActive: boolean;
}

export default function MarketplacePage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch stores from API
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        const response = await storeApi.listStores({ isActive: true });
        setStores(response.data.data.stores || []);
      } catch (error: any) {
        toast({
          title: 'خطأ في تحميل المتاجر',
          description: error.response?.data?.message || 'حدث خطأ أثناء تحميل المتاجر',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [toast]);

  // Filter stores based on search query
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    
    const query = searchQuery.toLowerCase();
    return stores.filter((store) =>
      store.name.toLowerCase().includes(query) ||
      (store.description && store.description.toLowerCase().includes(query)) ||
      (store.city && store.city.toLowerCase().includes(query))
    );
  }, [stores, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              استكشف المتاجر
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              اكتشف مجموعة متنوعة من المتاجر الإلكترونية على منصة NEBULA
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="ابحث عن متجر..."
                className="pr-10 py-6 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nebula-600"></div>
          </div>
        )}

        {/* Stores Grid */}
        {!isLoading && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="card-hover h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-nebula-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        {store.logo ? (
                          <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{store.name}</CardTitle>
                        {store.city && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin className="w-4 h-4" />
                            {store.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {store.description || 'لا يوجد وصف'}
                    </p>
                    <Link href={`/store/${store.slug}`}>
                      <Button className="w-full btn-gradient">
                        زيارة المتجر
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && searchQuery && filteredStores.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              لا توجد نتائج للبحث
            </h3>
            <p className="text-gray-500">
              جرب بحثاً مختلفاً
            </p>
          </div>
        )}

        {/* Empty state for when no stores at all */}
        {!isLoading && !searchQuery && stores.length === 0 && (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              لا توجد متاجر حالياً
            </h3>
            <p className="text-gray-500">
              كن أول من يبدأ متجراً على المنصة!
            </p>
            <Link href="/register">
              <Button className="mt-4 btn-gradient">
                إنشاء متجر
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
