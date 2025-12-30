import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck, Plus, Globe, AlertTriangle, CheckCircle2,
  XCircle, HelpCircle, ArrowRight, Trash2, Edit2, Scale
} from 'lucide-react';
import { format } from 'date-fns';

interface InternalPolicy {
  id: string;
  title: string;
  description: string | null;
  policy_text: string | null;
  category: string | null;
  effective_date: string | null;
  review_date: string | null;
  status: string;
  created_at: string;
}

interface PolicyMapping {
  id: string;
  policy_id: string;
  regulation_type: string;
  jurisdiction: string;
  compliance_status: string;
  gap_analysis: string | null;
  recommendations: string | null;
}

interface PolicyIntegrationProps {
  userId: string;
}

const regulationTypes = [
  'Data Protection',
  'Anti-Money Laundering',
  'Banking Regulations',
  'Securities Law',
  'Consumer Protection',
  'Cybersecurity',
  'Corporate Governance',
];

const jurisdictions = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

const policyCategories = [
  'Data Privacy',
  'Information Security',
  'Anti-Money Laundering',
  'Code of Conduct',
  'Risk Management',
  'Compliance',
  'HR Policies',
  'IT Policies',
];

export function PolicyIntegration({ userId }: PolicyIntegrationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InternalPolicy | null>(null);
  const [newPolicy, setNewPolicy] = useState({
    title: '',
    description: '',
    policy_text: '',
    category: '',
    effective_date: '',
    review_date: '',
  });
  const [newMapping, setNewMapping] = useState({
    policy_id: '',
    regulation_type: '',
    jurisdiction: '',
    compliance_status: 'unknown',
    gap_analysis: '',
    recommendations: '',
  });

  // Fetch internal policies
  const { data: policies, isLoading } = useQuery({
    queryKey: ['internal_policies', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_policies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InternalPolicy[];
    },
  });

  // Fetch policy mappings
  const { data: mappings } = useQuery({
    queryKey: ['policy_regulation_mappings', userId],
    queryFn: async () => {
      const policyIds = policies?.map(p => p.id) || [];
      if (policyIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('policy_regulation_mappings')
        .select('*')
        .in('policy_id', policyIds);
      if (error) throw error;
      return data as PolicyMapping[];
    },
    enabled: !!policies && policies.length > 0,
  });

  const handleCreatePolicy = async () => {
    if (!newPolicy.title.trim()) {
      toast({ title: 'Please enter a policy title', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('internal_policies').insert({
      user_id: userId,
      title: newPolicy.title,
      description: newPolicy.description || null,
      policy_text: newPolicy.policy_text || null,
      category: newPolicy.category || null,
      effective_date: newPolicy.effective_date || null,
      review_date: newPolicy.review_date || null,
      status: 'active',
    });

    if (error) {
      toast({ title: 'Error creating policy', variant: 'destructive' });
      return;
    }

    toast({ title: 'Internal policy created' });
    setNewPolicy({ title: '', description: '', policy_text: '', category: '', effective_date: '', review_date: '' });
    setShowAddPolicy(false);
    queryClient.invalidateQueries({ queryKey: ['internal_policies'] });
  };

  const handleDeletePolicy = async (policyId: string) => {
    const { error } = await supabase.from('internal_policies').delete().eq('id', policyId);
    if (error) {
      toast({ title: 'Error deleting policy', variant: 'destructive' });
      return;
    }
    toast({ title: 'Policy deleted' });
    queryClient.invalidateQueries({ queryKey: ['internal_policies'] });
  };

  const handleCreateMapping = async () => {
    if (!newMapping.policy_id || !newMapping.regulation_type || !newMapping.jurisdiction) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('policy_regulation_mappings').insert({
      policy_id: newMapping.policy_id,
      regulation_type: newMapping.regulation_type,
      jurisdiction: newMapping.jurisdiction,
      compliance_status: newMapping.compliance_status,
      gap_analysis: newMapping.gap_analysis || null,
      recommendations: newMapping.recommendations || null,
    });

    if (error) {
      toast({ title: 'Error creating mapping', variant: 'destructive' });
      return;
    }

    toast({ title: 'Policy-regulation mapping created' });
    setNewMapping({ policy_id: '', regulation_type: '', jurisdiction: '', compliance_status: 'unknown', gap_analysis: '', recommendations: '' });
    setShowAddMapping(false);
    queryClient.invalidateQueries({ queryKey: ['policy_regulation_mappings'] });
  };

  const handleUpdateComplianceStatus = async (mappingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('policy_regulation_mappings')
      .update({ compliance_status: newStatus })
      .eq('id', mappingId);

    if (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
      return;
    }

    toast({ title: 'Compliance status updated' });
    queryClient.invalidateQueries({ queryKey: ['policy_regulation_mappings'] });
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'non_compliant':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-success/10 text-success border-success/20">Compliant</Badge>;
      case 'partial':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Partial</Badge>;
      case 'non_compliant':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPolicyMappings = (policyId: string) => {
    return mappings?.filter(m => m.policy_id === policyId) || [];
  };

  const getJurisdictionFlag = (code: string) => {
    return jurisdictions.find(j => j.code === code)?.flag || '🌍';
  };

  // Calculate overall compliance stats
  const complianceStats = {
    compliant: mappings?.filter(m => m.compliance_status === 'compliant').length || 0,
    partial: mappings?.filter(m => m.compliance_status === 'partial').length || 0,
    nonCompliant: mappings?.filter(m => m.compliance_status === 'non_compliant').length || 0,
    unknown: mappings?.filter(m => m.compliance_status === 'unknown').length || 0,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-accent" />
              Policy Integration & Compliance Mapping
            </CardTitle>
            <CardDescription>
              Map internal policies against external regulations to identify compliance gaps
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAddMapping} onOpenChange={setShowAddMapping}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!policies || policies.length === 0}>
                  <Scale className="h-4 w-4 mr-2" />
                  Map to Regulation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Policy-Regulation Mapping</DialogTitle>
                  <DialogDescription>
                    Map an internal policy to an external regulation and assess compliance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Internal Policy *</label>
                    <Select
                      value={newMapping.policy_id}
                      onValueChange={(v) => setNewMapping({ ...newMapping, policy_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        {policies?.map(policy => (
                          <SelectItem key={policy.id} value={policy.id}>
                            {policy.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Regulation Type *</label>
                      <Select
                        value={newMapping.regulation_type}
                        onValueChange={(v) => setNewMapping({ ...newMapping, regulation_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {regulationTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Jurisdiction *</label>
                      <Select
                        value={newMapping.jurisdiction}
                        onValueChange={(v) => setNewMapping({ ...newMapping, jurisdiction: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select jurisdiction" />
                        </SelectTrigger>
                        <SelectContent>
                          {jurisdictions.map(j => (
                            <SelectItem key={j.code} value={j.code}>
                              {j.flag} {j.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Compliance Status</label>
                    <Select
                      value={newMapping.compliance_status}
                      onValueChange={(v) => setNewMapping({ ...newMapping, compliance_status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="partial">Partial Compliance</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gap Analysis</label>
                    <Textarea
                      placeholder="Identify gaps between policy and regulation..."
                      value={newMapping.gap_analysis}
                      onChange={(e) => setNewMapping({ ...newMapping, gap_analysis: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Recommendations</label>
                    <Textarea
                      placeholder="Recommendations to achieve compliance..."
                      value={newMapping.recommendations}
                      onChange={(e) => setNewMapping({ ...newMapping, recommendations: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateMapping} className="w-full">
                    Create Mapping
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddPolicy} onOpenChange={setShowAddPolicy}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Internal Policy</DialogTitle>
                  <DialogDescription>
                    Create an internal policy to map against external regulations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Policy Title *</label>
                    <Input
                      placeholder="e.g., Data Privacy Policy"
                      value={newPolicy.title}
                      onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newPolicy.category}
                      onValueChange={(v) => setNewPolicy({ ...newPolicy, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {policyCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Brief description of the policy..."
                      value={newPolicy.description}
                      onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Effective Date</label>
                      <Input
                        type="date"
                        value={newPolicy.effective_date}
                        onChange={(e) => setNewPolicy({ ...newPolicy, effective_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Review Date</label>
                      <Input
                        type="date"
                        value={newPolicy.review_date}
                        onChange={(e) => setNewPolicy({ ...newPolicy, review_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreatePolicy} className="w-full">
                    Create Policy
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Compliance Overview Stats */}
        {mappings && mappings.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="font-medium text-success">{complianceStats.compliant}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compliant</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="font-medium text-warning">{complianceStats.partial}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Partial</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">{complianceStats.nonCompliant}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Non-Compliant</p>
            </div>
            <div className="p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{complianceStats.unknown}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Unknown</p>
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : policies && policies.length > 0 ? (
            <div className="space-y-4">
              {policies.map(policy => {
                const policyMappings = getPolicyMappings(policy.id);
                
                return (
                  <div
                    key={policy.id}
                    className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{policy.title}</h4>
                          {policy.category && (
                            <Badge variant="outline" className="text-xs">
                              {policy.category}
                            </Badge>
                          )}
                          <Badge variant={policy.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {policy.status}
                          </Badge>
                        </div>
                        {policy.description && (
                          <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {policy.effective_date && (
                            <span>Effective: {format(new Date(policy.effective_date), 'MMM d, yyyy')}</span>
                          )}
                          {policy.review_date && (
                            <span>Review: {format(new Date(policy.review_date), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeletePolicy(policy.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {policyMappings.length > 0 ? (
                      <div className="space-y-2 mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground">Regulation Mappings</p>
                        {policyMappings.map(mapping => (
                          <div
                            key={mapping.id}
                            className="flex items-center justify-between p-2 rounded bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              {getComplianceIcon(mapping.compliance_status)}
                              <span className="text-xl">{getJurisdictionFlag(mapping.jurisdiction)}</span>
                              <div>
                                <span className="text-sm font-medium">{mapping.regulation_type}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({jurisdictions.find(j => j.code === mapping.jurisdiction)?.name})
                                </span>
                              </div>
                            </div>
                            <Select
                              value={mapping.compliance_status}
                              onValueChange={(v) => handleUpdateComplianceStatus(mapping.id, v)}
                            >
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unknown">Unknown</SelectItem>
                                <SelectItem value="compliant">Compliant</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No regulation mappings yet. 
                          <Button
                            variant="link"
                            className="px-1 h-auto"
                            onClick={() => {
                              setNewMapping({ ...newMapping, policy_id: policy.id });
                              setShowAddMapping(true);
                            }}
                          >
                            Add mapping
                          </Button>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Internal Policies</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add internal policies to map them against external regulations
              </p>
              <Button onClick={() => setShowAddPolicy(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Policy
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}