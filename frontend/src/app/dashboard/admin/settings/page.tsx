'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, DollarSign, Mail, CreditCard, Save, CheckCircle
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PlatformSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pricing' | 'email' | 'payment'>('pricing');
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [pricingSettings, setPricingSettings] = useState({
    basicPrice: '',
    proPrice: '',
    enterprisePrice: '',
    affiliatePrice: '',
    firstMonthDiscount: '',
  });
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    welcomeEmailSubject: '',
    welcomeEmailTemplate: '',
  });
  const [paymentSettings, setPaymentSettings] = useState({
    paypalClientId: '',
    paypalSecret: '',
    stripePublicKey: '',
    stripeSecretKey: '',
    hyperpayMerchantId: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPlatformSettings();
      const allSettings = response.data.data.settings;
      setSettings(allSettings);

      // Populate form states
      allSettings.forEach((setting: PlatformSetting) => {
        if (setting.category === 'pricing') {
          setPricingSettings(prev => ({ ...prev, [setting.key]: setting.value }));
        } else if (setting.category === 'email') {
          setEmailSettings(prev => ({ ...prev, [setting.key]: setting.value }));
        } else if (setting.category === 'payment') {
          setPaymentSettings(prev => ({ ...prev, [setting.key]: setting.value }));
        }
      });
    } catch (error: any) {
      toast({
        title: 'Error loading settings',
        description: error.response?.data?.message || 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async () => {
    try {
      setSaving(true);
      for (const [key, value] of Object.entries(pricingSettings)) {
        await adminApi.updatePlatformSetting(key, { value });
      }
      toast({ title: 'Pricing settings saved successfully' });
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save pricing settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      setSaving(true);
      for (const [key, value] of Object.entries(emailSettings)) {
        await adminApi.updatePlatformSetting(key, { value });
      }
      toast({ title: 'Email settings saved successfully' });
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save email settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    try {
      setSaving(true);
      for (const [key, value] of Object.entries(paymentSettings)) {
        await adminApi.updatePlatformSetting(key, { value });
      }
      toast({ title: 'Payment settings saved successfully' });
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save payment settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-gray-500">Configure platform-wide settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'pricing' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pricing')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Pricing
        </Button>
        <Button
          variant={activeTab === 'email' ? 'default' : 'outline'}
          onClick={() => setActiveTab('email')}
        >
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Button
          variant={activeTab === 'payment' ? 'default' : 'outline'}
          onClick={() => setActiveTab('payment')}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Payment Gateways
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Pricing Settings */}
          {activeTab === 'pricing' && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Basic Plan Price</label>
                    <Input
                      type="number"
                      value={pricingSettings.basicPrice}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, basicPrice: e.target.value })}
                      placeholder="29.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pro Plan Price</label>
                    <Input
                      type="number"
                      value={pricingSettings.proPrice}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, proPrice: e.target.value })}
                      placeholder="79.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Enterprise Plan Price</label>
                    <Input
                      type="number"
                      value={pricingSettings.enterprisePrice}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, enterprisePrice: e.target.value })}
                      placeholder="199.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Affiliate Plan Price</label>
                    <Input
                      type="number"
                      value={pricingSettings.affiliatePrice}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, affiliatePrice: e.target.value })}
                      placeholder="49.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">First Month Discount (%)</label>
                    <Input
                      type="number"
                      value={pricingSettings.firstMonthDiscount}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, firstMonthDiscount: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSavePricing} disabled={saving}>
                    {saving ? 'Saving...' : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Pricing Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Host</label>
                    <Input
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Port</label>
                    <Input
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP User</label>
                    <Input
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Welcome Email Subject</label>
                    <Input
                      value={emailSettings.welcomeEmailSubject}
                      onChange={(e) => setEmailSettings({ ...emailSettings, welcomeEmailSubject: e.target.value })}
                      placeholder="Welcome to NEBULA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Welcome Email Template</label>
                  <textarea
                    className="w-full border rounded-md p-3 min-h-[200px]"
                    value={emailSettings.welcomeEmailTemplate}
                    onChange={(e) => setEmailSettings({ ...emailSettings, welcomeEmailTemplate: e.target.value })}
                    placeholder="Welcome {{firstName}}, thank you for joining NEBULA..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveEmail} disabled={saving}>
                    {saving ? 'Saving...' : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Email Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    PayPal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Client ID</label>
                      <Input
                        value={paymentSettings.paypalClientId}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalClientId: e.target.value })}
                        placeholder="PayPal Client ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Secret</label>
                      <Input
                        type="password"
                        value={paymentSettings.paypalSecret}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalSecret: e.target.value })}
                        placeholder="PayPal Secret"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Stripe
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Public Key</label>
                      <Input
                        value={paymentSettings.stripePublicKey}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, stripePublicKey: e.target.value })}
                        placeholder="Stripe Public Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Secret Key</label>
                      <Input
                        type="password"
                        value={paymentSettings.stripeSecretKey}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeSecretKey: e.target.value })}
                        placeholder="Stripe Secret Key"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    HyperPay
                  </h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">Merchant ID</label>
                    <Input
                      value={paymentSettings.hyperpayMerchantId}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, hyperpayMerchantId: e.target.value })}
                      placeholder="HyperPay Merchant ID"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePayment} disabled={saving}>
                    {saving ? 'Saving...' : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Payment Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
