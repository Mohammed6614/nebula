'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Store, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const navigateTo = (path: string) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nebula-500 to-purple-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">NEBULA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/marketplace" className="text-gray-600 dark:text-gray-300 hover:text-nebula-600 dark:hover:text-nebula-400 transition-colors">
              المتاجر
            </Link>
            <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-nebula-600 dark:hover:text-nebula-400 transition-colors">
              الأسعار
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="gap-2" onClick={() => navigateTo('/dashboard')}>
                  <User className="w-4 h-4" />
                  {user?.firstName}
                </Button>
                <Button variant="outline" onClick={() => logout()}>
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigateTo('/login')}>
                  تسجيل الدخول
                </Button>
                <Button className="btn-gradient" onClick={() => navigateTo('/register')}>
                  إنشاء حساب
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                href="/marketplace"
                className="block py-2 text-gray-600 dark:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                المتاجر
              </Link>
              <Link
                href="/pricing"
                className="block py-2 text-gray-600 dark:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                الأسعار
              </Link>
              {isAuthenticated ? (
                <>
                  <button
                    className="block w-full text-right py-2 text-gray-600 dark:text-gray-300"
                    onClick={() => navigateTo('/dashboard')}
                  >
                    لوحة التحكم
                  </button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                  >
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => navigateTo('/login')}>
                    تسجيل الدخول
                  </Button>
                  <Button className="w-full btn-gradient" onClick={() => navigateTo('/register')}>
                    إنشاء حساب
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
