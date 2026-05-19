'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, DollarSign, Users, Store, Download, Calendar
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState(30);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [revenueRes, metricsRes] = await Promise.all([
        adminApi.getRevenueAnalytics({ periodDays: period }),
        adminApi.getBusinessMetrics({ periodDays: period }),
      ]);
      setRevenueData(revenueRes.data.data);
      setMetrics(metricsRes.data.data);
    } catch (error: any) {
      toast({
        title: 'Error loading analytics',
        description: error.response?.data?.message || 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!metrics) return;
    const csv = Object.entries(metrics).map(([key, value]) => `${key},${value}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}days.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Business Intelligence</h1>
          <p className="text-gray-500">Platform performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2"
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="MRR"
              value={formatPrice(revenueData?.mrr || 0)}
              icon={DollarSign}
              color="bg-green-500"
            />
            <MetricCard
              title="ARR"
              value={formatPrice(revenueData?.arr || 0)}
              icon={TrendingUp}
              color="bg-blue-500"
            />
            <MetricCard
              title="Churn Rate"
              value={`${metrics?.churnRate || 0}%`}
              icon={Users}
              color="bg-red-500"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${metrics?.conversionRate || 0}%`}
              icon={Store}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Revenue</span>
                    <span className="font-bold">{formatPrice(revenueData?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Growth Rate</span>
                    <span className="font-bold text-green-600">+{metrics?.revenueGrowth || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">New Users</span>
                    <span className="font-bold">{metrics?.newUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active Users</span>
                    <span className="font-bold">{metrics?.activeUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retention Rate</span>
                    <span className="font-bold text-green-600">{metrics?.retentionRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
