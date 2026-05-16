'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Store, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-nebula-50/50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-nebula-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nebula-100 dark:bg-nebula-900/50 text-nebula-700 dark:text-nebula-300 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                منصة التجارة الإلكترونية الجديدة
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
            >
              أطلق متجرك الإلكتروني مع{' '}
              <span className="text-gradient">NEBULA</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
            >
              منصة SaaS متكاملة للتجارة الإلكترونية في السعودية والخليج. 
              أنشئ متجرك في دقائق، تكامل كامل مع المدفوعات، وبدون عمولات.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl">
                  تصفح المتاجر
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              كل ما تحتاجه لنجاح متجرك
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              NEBULA توفر لك كل الأدوات اللازمة لإدارة متجرك الإلكتروني بكفاءة واحترافية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-nebula-100 dark:bg-nebula-900/50 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-nebula-600 dark:text-nebula-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans Preview */}
      <section className="py-20 bg-gradient-to-b from-nebula-50/50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              خطط أسعار بسيطة وشفافة
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              اختر الخطة المناسبة لك وابدأ رحلتك في عالم التجارة الإلكترونية
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
              <Zap className="w-4 h-4" />
              خصم 50% على أول شهر
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl ${
                  plan.popular
                    ? 'bg-nebula-gradient text-white scale-105 shadow-2xl shadow-nebula-500/30'
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-white text-nebula-600 text-sm font-semibold shadow-lg">
                      الأكثر شعبية
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.price}
                    </span>
                    <span className={plan.popular ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
                      ر.س/شهر
                    </span>
                  </div>
                  {plan.originalPrice && (
                    <p className="text-sm line-through opacity-60 mt-1">
                      {plan.originalPrice} ر.س
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${plan.popular ? 'text-white' : 'text-nebula-500'}`} />
                      <span className={plan.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-white text-nebula-600 hover:bg-gray-100'
                        : 'btn-gradient'
                    }`}
                  >
                    ابدأ الآن
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">NEBULA</h3>
              <p className="text-gray-400">
                منصة التجارة الإلكترونية المتكاملة للسوق السعودي والخليجي
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">المنتج</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">المميزات</Link></li>
                <li><Link href="/pricing" className="hover:text-white">الأسعار</Link></li>
                <li><Link href="/marketplace" className="hover:text-white">المتاجر</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">الشركة</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">من نحن</Link></li>
                <li><Link href="/contact" className="hover:text-white">اتصل بنا</Link></li>
                <li><Link href="/careers" className="hover:text-white">الوظائف</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">قانوني</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">سياسة الخصوصية</Link></li>
                <li><Link href="/terms" className="hover:text-white">شروط الاستخدام</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 NEBULA. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: 'متجر احترافي',
    description: 'أنشئ متجرك الإلكتروني بتصميم احترافي وجذاب في دقائق معدودة',
    icon: Store,
  },
  {
    title: 'إدارة المنتجات',
    description: 'أضف ونظم منتجاتك بسهولة مع دعم التصنيفات والمخزون',
    icon: Zap,
  },
  {
    title: 'نظام مدفوعات متكامل',
    description: 'تكامل كامل مع PayPal، تابي، تمارا، مدى، والدفع عند الاستلام',
    icon: Users,
  },
  {
    title: 'نظام تسويق بالعمولة',
    description: 'دع المسوقين يساعدونك في نشر متجرك وزيادة مبيعاتك',
    icon: Sparkles,
  },
  {
    title: 'تحليلات متقدمة',
    description: 'تتبع مبيعاتك وزوارك بشكل مباشر مع لوحة تحليلات شاملة',
    icon: Store,
  },
  {
    title: 'دعم فني 24/7',
    description: 'فريق دعم متخصص جاهز لمساعدتك على مدار الساعة',
    icon: Users,
  },
];

const plans = [
  {
    name: 'Basic',
    price: 49,
    originalPrice: 99,
    features: ['حتى 100 منتج', 'تصميم أساسي', 'دعم البريد الإلكتروني'],
    popular: false,
  },
  {
    name: 'Pro',
    price: 149,
    originalPrice: 299,
    features: ['منتجات غير محدودة', 'تصميم متقدم', 'دعم أولوي', 'دومين مخصص'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 399,
    originalPrice: 799,
    features: ['كل مميزات Pro', 'مدير حساب مخصص', 'API كامل', 'تكاملات مخصصة'],
    popular: false,
  },
];
