'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Store, Save, Upload, Palette, CreditCard, ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { merchantApi } from '@/lib/api';
import { toast } from 'sonner';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  coverImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
}

interface PaymentSettings {
  paypalEnabled: boolean;
  paypalClientId?: string;
  tabbyEnabled: boolean;
  tamaraEnabled: boolean;
  madaEnabled: boolean;
}

export default function StoreSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [store, setStore] = useState<StoreData | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeRes = await merchantApi.getMyStore();
      setStore(storeRes.data.store);
      
      // Fetch payment settings
      if (storeRes.data.store?.id) {
        try {
          const paymentRes = await merchantApi.getPaymentSettings(storeRes.data.store.id);
          setPaymentSettings(paymentRes.data.settings);
        } catch (error) {
          console.log('Payment settings not available');
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error('فشل في جلب بيانات المتجر');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!store?.id) return;
    
    try {
      setSaving(true);
      await merchantApi.updateStore(store.id, store);
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('Error saving store:', error);
      toast.error('فشل في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    if (!store?.id || !paymentSettings) return;
    
    try {
      setSaving(true);
      await merchantApi.updatePaymentSettings(store.id, paymentSettings);
      toast.success('تم حفظ إعدادات الدفع بنجاح');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('فشل في حفظ إعدادات الدفع');
    } finally {
      setSaving(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                إعدادات المتجر
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                تخصيص وإدارة متجرك
              </p>
            </div>
            <div className="flex gap-2">
              {store && (
                <Link href={`/store/${store.slug}`} target="_blank">
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    معاينة المتجر
                  </Button>
                </Link>
              )}
              <Button onClick={handleSave} disabled={saving} className="btn-gradient gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="general">عام</TabsTrigger>
            <TabsTrigger value="appearance">المظهر</TabsTrigger>
            <TabsTrigger value="payment">الدفع</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  معلومات المتجر
                </CardTitle>
                <CardDescription>
                  المعلومات الأساسية لمتجرك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم المتجر *</Label>
                    <Input
                      id="name"
                      value={store?.name || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">معرف المتجر (Slug) *</Label>
                    <Input
                      id="slug"
                      value={store?.slug || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف المتجر</Label>
                  <Textarea
                    id="description"
                    value={store?.description || ''}
                    onChange={(e) => setStore(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={store?.email || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, email: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={store?.phone || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={store?.address || ''}
                    onChange={(e) => setStore(prev => prev ? { ...prev, address: e.target.value } : null)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                      id="city"
                      value={store?.city || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, city: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">الدولة</Label>
                    <Input
                      id="country"
                      value={store?.country || ''}
                      onChange={(e) => setStore(prev => prev ? { ...prev, country: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Switch
                    checked={store?.isActive || false}
                    onCheckedChange={(checked) => setStore(prev => prev ? { ...prev, isActive: checked } : null)}
                  />
                  <Label>المتجر نشط</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  المظهر والتصميم
                </CardTitle>
                <CardDescription>
                  تخصيص ألوان وشعار المتجر
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>شعار المتجر</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      {store?.logo ? (
                        <img src={store.logo} alt="Logo" className="w-24 h-24 mx-auto object-contain" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      )}
                      <p className="text-sm text-gray-500">اسحب الصورة هنا أو انقر للاختيار</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>صورة الغلاف</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      {store?.coverImage ? (
                        <img src={store.coverImage} alt="Cover" className="w-full h-24 mx-auto object-cover rounded" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      )}
                      <p className="text-sm text-gray-500">اسحب الصورة هنا أو انقر للاختيار</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">اللون الأساسي</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={store?.primaryColor || '#4F46E5'}
                        onChange={(e) => setStore(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={store?.primaryColor || '#4F46E5'}
                        onChange={(e) => setStore(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={store?.secondaryColor || '#10B981'}
                        onChange={(e) => setStore(prev => prev ? { ...prev, secondaryColor: e.target.value } : null)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={store?.secondaryColor || '#10B981'}
                        onChange={(e) => setStore(prev => prev ? { ...prev, secondaryColor: e.target.value } : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  إعدادات الدفع
                </CardTitle>
                <CardDescription>
                  تكوين بوابات الدفع المقبولة في متجرك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PayPal */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-blue-600">Pay</span>
                      </div>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-gray-500">الدفع عبر PayPal</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings?.paypalEnabled || false}
                      onCheckedChange={(checked) => setPaymentSettings(prev => prev ? { ...prev, paypalEnabled: checked } : null)}
                    />
                  </div>
                  {paymentSettings?.paypalEnabled && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label>معرف العميل (Client ID)</Label>
                      <Input
                        type="password"
                        value={paymentSettings?.paypalClientId || ''}
                        onChange={(e) => setPaymentSettings(prev => prev ? { ...prev, paypalClientId: e.target.value } : null)}
                        placeholder="أدخل معرف العميل من PayPal"
                      />
                      <p className="text-xs text-gray-500">
                        يمكنك الحصول على هذا من لوحة تحكم PayPal Developer
                      </p>
                    </div>
                  )}
                </div>

                {/* Tabby */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-purple-600">T</span>
                      </div>
                      <div>
                        <p className="font-medium">Tabby</p>
                        <p className="text-sm text-gray-500">اشتري الآن وادفع لاحقاً</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings?.tabbyEnabled || false}
                      onCheckedChange={(checked) => setPaymentSettings(prev => prev ? { ...prev, tabbyEnabled: checked } : null)}
                    />
                  </div>
                </div>

                {/* Tamara */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-pink-600">TM</span>
                      </div>
                      <div>
                        <p className="font-medium">Tamara</p>
                        <p className="text-sm text-gray-500">قسم فاتورتك على 3 دفعات</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings?.tamaraEnabled || false}
                      onCheckedChange={(checked) => setPaymentSettings(prev => prev ? { ...prev, tamaraEnabled: checked } : null)}
                    />
                  </div>
                </div>

                {/* Mada */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-green-600">M</span>
                      </div>
                      <div>
                        <p className="font-medium">مدى (Mada)</p>
                        <p className="text-sm text-gray-500">الدفع عبر بطاقات مدى</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings?.madaEnabled || false}
                      onCheckedChange={(checked) => setPaymentSettings(prev => prev ? { ...prev, madaEnabled: checked } : null)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSavePaymentSettings} 
                  disabled={saving}
                  className="w-full btn-gradient"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الدفع'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Store URL Card */}
        {store && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-nebula-600" />
                    <div>
                      <p className="text-sm text-gray-500">رابط متجرك</p>
                      <p className="font-medium">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/store/${store.slug}`
                          : `/store/${store.slug}`}
                      </p>
                    </div>
                  </div>
                  <Link href={`/store/${store.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      معاينة
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
