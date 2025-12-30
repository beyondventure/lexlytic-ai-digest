import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Building2, Plus, Users, Mail, Briefcase,
  AlertTriangle, FileText, ChevronRight, Trash2, Edit2, X
} from 'lucide-react';

interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  owner_name: string | null;
  owner_email: string | null;
  created_at: string;
}

interface DocumentAssignment {
  id: string;
  document_id: string;
  business_unit_id: string;
  mitigation_status: string;
  mitigation_notes: string | null;
  document?: {
    id: string;
    title: string;
    risk_score: number | null;
    jurisdiction: string | null;
  };
}

interface BusinessUnitRiskMappingProps {
  userId: string;
  documents?: Array<{
    id: string;
    title: string;
    risk_score: number | null;
    jurisdiction: string | null;
  }>;
}

export function BusinessUnitRiskMapping({ userId, documents = [] }: BusinessUnitRiskMappingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAssignDoc, setShowAssignDoc] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnit | null>(null);
  const [newUnit, setNewUnit] = useState({
    name: '',
    description: '',
    department: '',
    owner_name: '',
    owner_email: '',
  });
  const [assignData, setAssignData] = useState({
    document_id: '',
    business_unit_id: '',
    mitigation_notes: '',
  });

  // Fetch business units
  const { data: businessUnits, isLoading } = useQuery({
    queryKey: ['business_units', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_units')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      if (error) throw error;
      return data as BusinessUnit[];
    },
  });

  // Fetch risk assignments
  const { data: assignments } = useQuery({
    queryKey: ['document_risk_assignments', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_risk_assignments')
        .select('*');
      if (error) throw error;
      return data as DocumentAssignment[];
    },
  });

  const handleCreateUnit = async () => {
    if (!newUnit.name.trim()) {
      toast({ title: 'Please enter a unit name', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('business_units').insert({
      user_id: userId,
      name: newUnit.name,
      description: newUnit.description || null,
      department: newUnit.department || null,
      owner_name: newUnit.owner_name || null,
      owner_email: newUnit.owner_email || null,
    });

    if (error) {
      toast({ title: 'Error creating business unit', variant: 'destructive' });
      return;
    }

    toast({ title: 'Business unit created' });
    setNewUnit({ name: '', description: '', department: '', owner_name: '', owner_email: '' });
    setShowAddUnit(false);
    queryClient.invalidateQueries({ queryKey: ['business_units'] });
  };

  const handleDeleteUnit = async (unitId: string) => {
    const { error } = await supabase.from('business_units').delete().eq('id', unitId);
    if (error) {
      toast({ title: 'Error deleting unit', variant: 'destructive' });
      return;
    }
    toast({ title: 'Business unit deleted' });
    queryClient.invalidateQueries({ queryKey: ['business_units'] });
  };

  const handleAssignDocument = async () => {
    if (!assignData.document_id || !assignData.business_unit_id) {
      toast({ title: 'Please select both document and business unit', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('document_risk_assignments').insert({
      document_id: assignData.document_id,
      business_unit_id: assignData.business_unit_id,
      assigned_by: userId,
      mitigation_notes: assignData.mitigation_notes || null,
      mitigation_status: 'pending',
    });

    if (error) {
      toast({ title: 'Error assigning document', variant: 'destructive' });
      return;
    }

    toast({ title: 'Document assigned to business unit' });
    setAssignData({ document_id: '', business_unit_id: '', mitigation_notes: '' });
    setShowAssignDoc(false);
    queryClient.invalidateQueries({ queryKey: ['document_risk_assignments'] });
  };

  const handleUpdateMitigationStatus = async (assignmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('document_risk_assignments')
      .update({ mitigation_status: newStatus })
      .eq('id', assignmentId);

    if (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
      return;
    }

    toast({ title: 'Mitigation status updated' });
    queryClient.invalidateQueries({ queryKey: ['document_risk_assignments'] });
  };

  const getUnitRiskStats = (unitId: string) => {
    const unitAssignments = assignments?.filter(a => a.business_unit_id === unitId) || [];
    const assignedDocs = unitAssignments.map(a => 
      documents.find(d => d.id === a.document_id)
    ).filter(Boolean);
    
    const totalRisk = assignedDocs.reduce((sum, d) => sum + (d?.risk_score || 0), 0);
    const avgRisk = assignedDocs.length > 0 ? Math.round(totalRisk / assignedDocs.length) : 0;
    const highRiskCount = assignedDocs.filter(d => (d?.risk_score || 0) >= 70).length;

    return { count: assignedDocs.length, avgRisk, highRiskCount };
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-destructive';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Business Unit Risk Mapping
            </CardTitle>
            <CardDescription>
              Assign risks to business units and track mitigation ownership
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAssignDoc} onOpenChange={setShowAssignDoc}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Assign Risk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Document Risk</DialogTitle>
                  <DialogDescription>
                    Assign a document's risk to a business unit for ownership and mitigation tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Document</label>
                    <Select
                      value={assignData.document_id}
                      onValueChange={(v) => setAssignData({ ...assignData, document_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.filter(d => d.risk_score !== null).map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>
                            <div className="flex items-center gap-2">
                              <span>{doc.title}</span>
                              <Badge variant={
                                (doc.risk_score || 0) >= 70 ? 'destructive' :
                                (doc.risk_score || 0) >= 50 ? 'secondary' : 'outline'
                              } className="text-xs">
                                {doc.risk_score}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Business Unit</label>
                    <Select
                      value={assignData.business_unit_id}
                      onValueChange={(v) => setAssignData({ ...assignData, business_unit_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessUnits?.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} {unit.department && `(${unit.department})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mitigation Notes</label>
                    <Textarea
                      placeholder="Add notes about mitigation plan..."
                      value={assignData.mitigation_notes}
                      onChange={(e) => setAssignData({ ...assignData, mitigation_notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAssignDocument} className="w-full">
                    Assign to Business Unit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Unit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Business Unit</DialogTitle>
                  <DialogDescription>
                    Create a new business unit for risk assignment and tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Unit Name *</label>
                    <Input
                      placeholder="e.g., Finance Department"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <Input
                      placeholder="e.g., Operations"
                      value={newUnit.department}
                      onChange={(e) => setNewUnit({ ...newUnit, department: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Brief description of this unit's responsibilities..."
                      value={newUnit.description}
                      onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Owner Name</label>
                      <Input
                        placeholder="John Smith"
                        value={newUnit.owner_name}
                        onChange={(e) => setNewUnit({ ...newUnit, owner_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Owner Email</label>
                      <Input
                        type="email"
                        placeholder="john@company.com"
                        value={newUnit.owner_email}
                        onChange={(e) => setNewUnit({ ...newUnit, owner_email: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateUnit} className="w-full">
                    Create Business Unit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : businessUnits && businessUnits.length > 0 ? (
            <div className="space-y-4">
              {businessUnits.map(unit => {
                const stats = getUnitRiskStats(unit.id);
                const unitAssignments = assignments?.filter(a => a.business_unit_id === unit.id) || [];
                
                return (
                  <div
                    key={unit.id}
                    className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{unit.name}</h4>
                          {unit.department && (
                            <Badge variant="outline" className="text-xs">
                              {unit.department}
                            </Badge>
                          )}
                        </div>
                        {unit.description && (
                          <p className="text-sm text-muted-foreground mt-1">{unit.description}</p>
                        )}
                        {unit.owner_name && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{unit.owner_name}</span>
                            {unit.owner_email && (
                              <>
                                <Mail className="h-3 w-3 ml-2" />
                                <span>{unit.owner_email}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteUnit(unit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{stats.count} documents</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={`h-4 w-4 ${getRiskColor(stats.avgRisk)}`} />
                        <span className={`text-sm ${getRiskColor(stats.avgRisk)}`}>
                          Avg Risk: {stats.avgRisk || 'N/A'}
                        </span>
                      </div>
                      {stats.highRiskCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.highRiskCount} high risk
                        </Badge>
                      )}
                    </div>

                    {unitAssignments.length > 0 && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-border">
                        {unitAssignments.slice(0, 3).map(assignment => {
                          const doc = documents.find(d => d.id === assignment.document_id);
                          if (!doc) return null;
                          return (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-2 rounded bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm truncate max-w-[200px]">{doc.title}</span>
                                <Badge variant={
                                  (doc.risk_score || 0) >= 70 ? 'destructive' :
                                  (doc.risk_score || 0) >= 50 ? 'secondary' : 'outline'
                                } className="text-xs">
                                  {doc.risk_score}
                                </Badge>
                              </div>
                              <Select
                                value={assignment.mitigation_status}
                                onValueChange={(v) => handleUpdateMitigationStatus(assignment.id, v)}
                              >
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="mitigated">Mitigated</SelectItem>
                                  <SelectItem value="accepted">Accepted</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                        {unitAssignments.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{unitAssignments.length - 3} more documents
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Business Units</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create business units to map risks and assign ownership
              </p>
              <Button onClick={() => setShowAddUnit(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Unit
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}