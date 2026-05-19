'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Users, Store, ShoppingCart, DollarSign, 
  TrendingUp, Settings, Shield, Activity, Bell, MessageSquare, 
  CreditCard, BarChart3, Flag, LogOut, ChevronRight, ChevronLeft,
  Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  color: string;
  badge?: number;
}

interface AdminSidebarProps {
  user?: {
    role: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  onLogout?: () => void;
}

const navigationItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/dashboard/admin/overview', color: 'text-blue-500' },
  { id: 'users', label: 'Users', icon: Users, href: '/dashboard/admin/users', color: 'text-green-500' },
  { id: 'stores', label: 'Stores', icon: Store, href: '/dashboard/admin/stores', color: 'text-purple-500' },
  { id: 'subscriptions', label: 'Subscriptions', icon: TrendingUp, href: '/dashboard/admin/subscriptions', color: 'text-orange-500' },
  { id: 'payments', label: 'Payments', icon: CreditCard, href: '/dashboard/admin/payments', color: 'text-yellow-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/admin/analytics', color: 'text-cyan-500' },
  { id: 'security', label: 'Security', icon: Shield, href: '/dashboard/admin/security', color: 'text-red-500' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/dashboard/admin/notifications', color: 'text-pink-500', badge: 3 },
  { id: 'support', label: 'Support', icon: MessageSquare, href: '/dashboard/admin/support', color: 'text-indigo-500' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/admin/settings', color: 'text-gray-500' },
  { id: 'features', label: 'Feature Flags', icon: Flag, href: '/dashboard/admin/features', color: 'text-teal-500' },
];

export default function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-50 transition-all duration-300",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin</h1>
                <p className="text-xs text-gray-500">Control Center</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex gap-1">
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:block"
            >
              {collapsed ? (
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={toggleMobile}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors relative",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? item.color : "text-gray-500")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        {!collapsed && user && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                {user.role}
              </span>
            </div>
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        )}
        
        {collapsed && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold mx-auto mb-3">
              {user?.firstName[0]}{user?.lastName[0]}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
