import { Navbar } from '@/components/layout/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}
