'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Flag, Plus, ToggleLeft, ToggleRight, Save, Trash2
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  plan: string | null;
  rollout: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeaturesPage() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    plan: '',
    rollout: 0,
  });

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getFeatureFlags();
      setFlags(response.data.data.flags);
    } catch (error: any) {
      toast({
        title: 'Error loading feature flags',
        description: error.response?.data?.message || 'Failed to load feature flags',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      await adminApi.updateFeatureFlag(flagId, { enabled });
      toast({ title: 'Feature flag updated successfully' });
      loadFeatureFlags();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update feature flag',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRollout = async (flagId: string, rollout: number) => {
    try {
      await adminApi.updateFeatureFlag(flagId, { rollout });
      toast({ title: 'Rollout updated successfully' });
      loadFeatureFlags();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update rollout',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFlag = async () => {
    try {
      await adminApi.createFeatureFlag(newFlag);
      toast({ title: 'Feature flag created successfully' });
      setShowCreateModal(false);
      setNewFlag({ name: '', description: '', plan: '', rollout: 0 });
      loadFeatureFlags();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create feature flag',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFlag = async (flagId: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    
    try {
      await adminApi.deleteFeatureFlag(flagId);
      toast({ title: 'Feature flag deleted successfully' });
      loadFeatureFlags();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete feature flag',
        variant: 'destructive',
      });
    }
  };

  const getPlanBadgeColor = (plan: string | null) => {
    if (!plan) return 'bg-gray-100 text-gray-700';
    switch (plan) {
      case 'BASIC': return 'bg-gray-100 text-gray-700';
      case 'PRO': return 'bg-blue-100 text-blue-700';
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-700';
      case 'AFFILIATE': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feature Flags</h1>
          <p className="text-gray-500">Control feature rollouts per plan</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Flag
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600 mx-auto"></div>
            </div>
          ) : flags.length > 0 ? (
            <div className="divide-y">
              {flags.map((flag) => (
                <div key={flag.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{flag.name}</h3>
                        {flag.plan && (
                          <span className={`px-2 py-0.5 rounded text-xs ${getPlanBadgeColor(flag.plan)}`}>
                            {flag.plan}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${flag.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {flag.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{flag.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Rollout:</span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={flag.rollout}
                            onChange={(e) => handleUpdateRollout(flag.id, parseFloat(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-nebula-600 h-2 rounded-full transition-all"
                            style={{ width: `${flag.rollout}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFlag(flag.id, !flag.enabled)}
                      >
                        {flag.enabled ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFlag(flag.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Flag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No feature flags found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Create Feature Flag</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  placeholder="new_feature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  placeholder="Feature description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Plan (Optional)</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={newFlag.plan}
                  onChange={(e) => setNewFlag({ ...newFlag, plan: e.target.value })}
                >
                  <option value="">All Plans</option>
                  <option value="BASIC">Basic</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                  <option value="AFFILIATE">Affiliate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Initial Rollout (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newFlag.rollout}
                  onChange={(e) => setNewFlag({ ...newFlag, rollout: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFlag}>
                <Save className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
