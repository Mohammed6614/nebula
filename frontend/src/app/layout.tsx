import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'NEBULA - منصة التجارة الإلكترونية المتكاملة',
  description: 'منصة SaaS متعددة التجار للسوق السعودي والخليجي. أنشئ متجرك الإلكتروني في دقائق مع نظام اشتراك مرن.',
  keywords: ['تجارة إلكترونية', 'SaaS', 'متجر إلكتروني', 'السعودية', 'الخليج', 'اشتراكات'],
  authors: [{ name: 'NEBULA Platform' }],
  openGraph: {
    title: 'NEBULA - منصة التجارة الإلكترونية المتكاملة',
    description: 'منصة SaaS متعددة التجار للسوق السعودي والخليجي',
    type: 'website',
    locale: 'ar_SA',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
