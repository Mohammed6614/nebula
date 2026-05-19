'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, AlertTriangle, Activity, Lock, Eye, ChevronLeft, ChevronRight,
  Search, Filter
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location: string;
  timestamp: string;
}

interface SuspiciousActivity {
  id: string;
  type: string;
  description: string;
  severity: string;
  ipAddress: string;
  userId: string | null;
  timestamp: string;
  resolved: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: any;
  ipAddress: string;
  timestamp: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function AdminSecurityPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'suspicious' | 'audit'>('login');
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadSecurityData();
  }, [activeTab, page]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'login') {
        const response = await adminApi.getLoginAttempts({ page, limit: 20 });
        setLoginAttempts(response.data.data.attempts);
        setTotal(response.data.data.total);
      } else if (activeTab === 'suspicious') {
        const response = await adminApi.getSuspiciousActivities({ page, limit: 20 });
        setSuspiciousActivities(response.data.data.activities);
        setTotal(response.data.data.total);
      } else if (activeTab === 'audit') {
        const response = await adminApi.getAuditLogs({ page, limit: 20 });
        setAuditLogs(response.data.data.logs);
        setTotal(response.data.data.total);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading security data',
        description: error.response?.data?.message || 'Failed to load security data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveActivity = async (activityId: string) => {
    try {
      await adminApi.resolveSuspiciousActivity(activityId);
      toast({ title: 'Activity resolved successfully' });
      loadSecurityData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resolve activity',
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Center</h1>
        <p className="text-gray-500">Monitor platform security and audit logs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'login' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('login'); setPage(1); }}
        >
          <Lock className="w-4 h-4 mr-2" />
          Login Attempts
        </Button>
        <Button
          variant={activeTab === 'suspicious' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('suspicious'); setPage(1); }}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Suspicious Activity
        </Button>
        <Button
          variant={activeTab === 'audit' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('audit'); setPage(1); }}
        >
          <Activity className="w-4 h-4 mr-2" />
          Audit Logs
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Login Attempts Tab */}
          {activeTab === 'login' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800">
                        <th className="text-right py-3 px-4 font-medium">Email</th>
                        <th className="text-right py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">IP Address</th>
                        <th className="text-right py-3 px-4 font-medium">Location</th>
                        <th className="text-right py-3 px-4 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-4 px-4">{attempt.email}</td>
                          <td className="py-4 px-4">
                            {attempt.success ? (
                              <span className="text-green-600">Success</span>
                            ) : (
                              <span className="text-red-600">Failed</span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-mono text-sm">{attempt.ipAddress}</td>
                          <td className="py-4 px-4">{attempt.location || 'Unknown'}</td>
                          <td className="py-4 px-4 text-sm text-gray-500">{formatDate(attempt.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-500">Total: {total} attempts</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-2">{page}</span>
                    <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suspicious Activity Tab */}
          {activeTab === 'suspicious' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800">
                        <th className="text-right py-3 px-4 font-medium">Type</th>
                        <th className="text-right py-3 px-4 font-medium">Description</th>
                        <th className="text-right py-3 px-4 font-medium">Severity</th>
                        <th className="text-right py-3 px-4 font-medium">IP Address</th>
                        <th className="text-right py-3 px-4 font-medium">Timestamp</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousActivities.map((activity) => (
                        <tr key={activity.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-4 px-4">{activity.type}</td>
                          <td className="py-4 px-4">{activity.description}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${getSeverityBadgeColor(activity.severity)}`}>
                              {activity.severity}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-sm">{activity.ipAddress}</td>
                          <td className="py-4 px-4 text-sm text-gray-500">{formatDate(activity.timestamp)}</td>
                          <td className="py-4 px-4">
                            {!activity.resolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolveActivity(activity.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-500">Total: {total} activities</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-2">{page}</span>
                    <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800">
                        <th className="text-right py-3 px-4 font-medium">User</th>
                        <th className="text-right py-3 px-4 font-medium">Action</th>
                        <th className="text-right py-3 px-4 font-medium">Entity</th>
                        <th className="text-right py-3 px-4 font-medium">IP Address</th>
                        <th className="text-right py-3 px-4 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-4 px-4">
                            <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                            <p className="text-sm text-gray-500">{log.user.email}</p>
                          </td>
                          <td className="py-4 px-4">{log.action}</td>
                          <td className="py-4 px-4">{log.entity}</td>
                          <td className="py-4 px-4 font-mono text-sm">{log.ipAddress}</td>
                          <td className="py-4 px-4 text-sm text-gray-500">{formatDate(log.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-500">Total: {total} logs</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-2">{page}</span>
                    <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
