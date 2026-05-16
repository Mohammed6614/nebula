'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  QrCode, 
  Plus, 
  Download, 
  Share2,
  Copy,
  Eye,
  Store,
  Megaphone,
  Smartphone,
  Link as LinkIcon,
  Trash2,
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
import QRCode from 'qrcode';

interface QRCodeItem {
  id: string;
  name: string;
  description?: string;
  type: 'STORE' | 'CAMPAIGN' | 'PRODUCT' | 'CUSTOM';
  targetUrl: string;
  qrCodeDataUrl: string;
  isActive: boolean;
  scans: number;
  uniqueScans: number;
  conversions: number;
  createdAt: string;
  lastScanAt?: string;
  storeId?: string;
  storeName?: string;
  campaignId?: string;
  campaignName?: string;
  customData?: any;
}

export default function AffiliateQRPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewQR, setShowNewQR] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCodeItem | null>(null);
  const [newQR, setNewQR] = useState({
    name: '',
    description: '',
    type: 'CUSTOM' as 'CUSTOM' | 'STORE' | 'CAMPAIGN' | 'PRODUCT',
    targetUrl: '',
    storeId: '',
    campaignId: '',
    customData: '',
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
    fetchQRCodes();
  }, [user]);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await affiliateApi.getQRCodes();
      setQrCodes(response.data.qrCodes || []);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast.error('فشل في جلب رموز QR');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('فشل في إنشاء رمز QR');
      return null;
    }
  };

  const handleCreateQR = async () => {
    try {
      const qrDataUrl = await generateQRCode(newQR.targetUrl);
      if (!qrDataUrl) return;

      const requestData = {
        name: newQR.name,
        description: newQR.description,
        type: newQR.type,
        targetUrl: newQR.targetUrl,
        qrCodeDataUrl: qrDataUrl,
        ...(newQR.type === 'STORE' && { storeId: newQR.storeId }),
        ...(newQR.type === 'CAMPAIGN' && { campaignId: newQR.campaignId }),
        ...(newQR.type === 'CUSTOM' && { customData: newQR.customData }),
      };

      await affiliateApi.createQRCode(requestData);
      toast.success('تم إنشاء رمز QR بنجاح');
      setShowNewQR(false);
      setNewQR({
        name: '',
        description: '',
        type: 'CUSTOM',
        targetUrl: '',
        storeId: '',
        campaignId: '',
        customData: '',
      });
      fetchQRCodes();
    } catch (error) {
      console.error('Error creating QR code:', error);
      toast.error('فشل في إنشاء رمز QR');
    }
  };

  const handleDownloadQR = async (qrCode: QRCodeItem) => {
    try {
      const link = document.createElement('a');
      link.href = qrCode.qrCodeDataUrl;
      link.download = `qr-${qrCode.name}-${qrCode.id}.png`;
      link.click();
      toast.success('تم تحميل رمز QR');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('فشل في تحميل رمز QR');
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('تم نسخ الرابط');
    } catch (error) {
      toast.error('فشل في نسخ الرابط');
    }
  };

  const handleDeleteQR = async (qrId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرمز؟')) {
      return;
    }
    
    try {
      await affiliateApi.deleteQRCode(qrId);
      toast.success('تم حذف رمز QR');
      fetchQRCodes();
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast.error('فشل في حذف رمز QR');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'STORE': return Store;
      case 'CAMPAIGN': return Megaphone;
      case 'PRODUCT': return LinkIcon;
      default: return QrCode;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STORE': return 'bg-blue-100 text-blue-800';
      case 'CAMPAIGN': return 'bg-purple-100 text-purple-800';
      case 'PRODUCT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'STORE': return 'متجر';
      case 'CAMPAIGN': return 'حملة';
      case 'PRODUCT': return 'منتج';
      default: return 'مخصص';
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
      title: 'رموز QR النشطة',
      value: qrCodes.filter(qr => qr.isActive).length,
      icon: QrCode,
      color: 'bg-blue-500',
    },
    {
      title: 'إجمالي المسحات',
      value: qrCodes.reduce((sum, qr) => sum + qr.scans, 0).toLocaleString(),
      icon: Smartphone,
      color: 'bg-green-500',
    },
    {
      title: 'مسحات فريدة',
      value: qrCodes.reduce((sum, qr) => sum + qr.uniqueScans, 0).toLocaleString(),
      icon: Eye,
      color: 'bg-purple-500',
    },
    {
      title: 'التحويلات',
      value: qrCodes.reduce((sum, qr) => sum + qr.conversions, 0).toLocaleString(),
      icon: Megaphone,
      color: 'bg-yellow-500',
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
                تسويق QR
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                إنشاء وإدارة رموز QR للتسويق
              </p>
            </div>
            <Button 
              onClick={() => setShowNewQR(true)}
              className="btn-gradient gap-2"
            >
              <Plus className="w-4 h-4" />
              رمز QR جديد
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

        {/* New QR Modal */}
        {showNewQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  إنشاء رمز QR جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      placeholder="QR Campaign 2024"
                      value={newQR.name}
                      onChange={(e) => setNewQR({...newQR, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">النوع</Label>
                    <Select value={newQR.type} onValueChange={(value: 'CUSTOM' | 'STORE' | 'CAMPAIGN' | 'PRODUCT') => setNewQR({...newQR, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOM">مخصص</SelectItem>
                        <SelectItem value="STORE">متجر</SelectItem>
                        <SelectItem value="CAMPAIGN">حملة</SelectItem>
                        <SelectItem value="PRODUCT">منتج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    placeholder="وصف رمز QR..."
                    value={newQR.description}
                    onChange={(e) => setNewQR({...newQR, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="targetUrl">الرابط المستهدف</Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://nebula.sa/store/example?ref=AFF123"
                    value={newQR.targetUrl}
                    onChange={(e) => setNewQR({...newQR, targetUrl: e.target.value})}
                  />
                </div>
                
                {newQR.type === 'CUSTOM' && (
                  <div>
                    <Label htmlFor="customData">بيانات مخصصة (JSON)</Label>
                    <Textarea
                      id="customData"
                      placeholder='{"campaign": "summer", "source": "offline"}'
                      value={newQR.customData}
                      onChange={(e) => setNewQR({...newQR, customData: e.target.value})}
                      rows={3}
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateQR} className="flex-1">
                    إنشاء رمز QR
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewQR(false)}>
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* QR Codes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.length > 0 ? (
            qrCodes.map((qrCode, index) => (
              <motion.div
                key={qrCode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(qrCode.type)}`}>
                          {getTypeText(qrCode.type)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          qrCode.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {qrCode.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center mb-4">
                      <img 
                        src={qrCode.qrCodeDataUrl} 
                        alt={qrCode.name}
                        className="w-32 h-32 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {qrCode.name}
                    </h3>
                    
                    {qrCode.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        {qrCode.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{qrCode.scans.toLocaleString()}</p>
                        <p className="text-gray-500">مسحات</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{qrCode.uniqueScans.toLocaleString()}</p>
                        <p className="text-gray-500">فريدة</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{qrCode.conversions.toLocaleString()}</p>
                        <p className="text-gray-500">تحويلات</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQR(qrCode)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(qrCode.targetUrl)}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQR(qrCode)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {qrCode.lastScanAt && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500">
                          آخر مسح: {new Date(qrCode.lastScanAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                لا توجد رموز QR بعد
              </p>
              <Button 
                onClick={() => setShowNewQR(true)}
                className="btn-gradient gap-2"
              >
                <Plus className="w-4 h-4" />
                إنشاء رمز QR جديد
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* QR Detail Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{selectedQR.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <img 
                  src={selectedQR.qrCodeDataUrl} 
                  alt={selectedQR.name}
                  className="w-48 h-48 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                />
              </div>
              
              {selectedQR.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {selectedQR.description}
                </p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">النوع:</span>
                  <span className="font-medium">{getTypeText(selectedQR.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">المسحات:</span>
                  <span className="font-medium">{selectedQR.scans.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">التحويلات:</span>
                  <span className="font-medium">{selectedQR.conversions.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownloadQR(selectedQR)}
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>
                <Button
                  onClick={() => handleCopyLink(selectedQR.targetUrl)}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Copy className="w-4 h-4" />
                  نسخ الرابط
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setSelectedQR(null)}
                className="w-full mt-2"
              >
                إغلاق
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
