'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Store, Users, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';

const roles = [
  { id: 'MERCHANT', label: 'تاجر', icon: Store, description: 'أنشئ متجرك الإلكتروني' },
  { id: 'AFFILIATE', label: 'مسوق', icon: Users, description: 'سوق للمتاجر واكسب' },
  { id: 'CUSTOMER', label: 'عميل', icon: ShoppingBag, description: 'تسوق من المتاجر' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('MERCHANT');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register({
        ...formData,
        role: selectedRole,
      });
      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: 'جاري تحويلك...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'خطأ في إنشاء الحساب',
        description: error.response?.data?.message || 'حدث خطأ أثناء التسجيل',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-nebula-50/50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="border-0 shadow-2xl shadow-nebula-500/10">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-nebula-500 to-purple-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              اختر نوع الحساب وأكمل بياناتك
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedRole === role.id
                      ? 'border-nebula-500 bg-nebula-50 dark:bg-nebula-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-nebula-300'
                  }`}
                >
                  <role.icon className={`w-6 h-6 mx-auto mb-2 ${
                    selectedRole === role.id ? 'text-nebula-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium">{role.label}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">الاسم الأول</Label>
                  <Input
                    id="firstName"
                    placeholder="محمد"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">الاسم الأخير</Label>
                  <Input
                    id="lastName"
                    placeholder="الأحمد"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pr-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-gradient"
                disabled={isLoading}
              >
                {isLoading ? (
                  'جاري إنشاء الحساب...'
                ) : (
                  <>
                    إنشاء الحساب
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-nebula-600 hover:text-nebula-700 font-medium">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
