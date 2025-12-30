import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { History, GitCompare, Clock, Plus, Minus, ArrowRight, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Version {
  id: string;
  version_number: number;
  content_snapshot: string | null;
  summary_snapshot: string | null;
  risk_score_snapshot: number | null;
  changes_description: string | null;
  created_at: string;
  created_by: string;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  documentTitle: string;
  currentSummary?: string;
  currentRiskScore?: number;
}

export function DocumentVersionHistory({ 
  documentId, 
  documentTitle,
  currentSummary,
  currentRiskScore 
}: DocumentVersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [viewVersion, setViewVersion] = useState<Version | null>(null);

  // Fetch real version history from database
  const { data: versions, isLoading, refetch } = useQuery({
    queryKey: ['document_versions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as Version[];
    },
  });

  // Create initial version if none exists
  useEffect(() => {
    const createInitialVersion = async () => {
      if (versions && versions.length === 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('document_versions').insert({
            document_id: documentId,
            version_number: 1,
            summary_snapshot: currentSummary,
            risk_score_snapshot: currentRiskScore,
            changes_description: 'Initial document upload and analysis',
            created_by: user.id,
          });
          refetch();
        }
      }
    };
    createInitialVersion();
  }, [versions, documentId, currentSummary, currentRiskScore, refetch]);

  const toggleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    }
  };

  const DiffView = () => {
    if (selectedVersions.length !== 2 || !versions) return null;
    
    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);
    
    if (!v1 || !v2) return null;

    const older = v1.version_number < v2.version_number ? v1 : v2;
    const newer = v1.version_number > v2.version_number ? v1 : v2;

    const riskChange = (newer.risk_score_snapshot || 0) - (older.risk_score_snapshot || 0);

    return (
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-accent" />
              Version Comparison
            </DialogTitle>
            <DialogDescription>
              Comparing v{older.version_number} with v{newer.version_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <Badge variant="outline" className="mb-1">v{older.version_number}</Badge>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(older.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <Badge variant="outline" className="mb-1">v{newer.version_number}</Badge>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(newer.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Changes Summary</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${riskChange < 0 ? 'bg-success/10 border-success/20' : riskChange > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted border-border'}`}>
                  <div className={`flex items-center gap-2 ${riskChange < 0 ? 'text-success' : riskChange > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {riskChange < 0 ? <Minus className="h-4 w-4" /> : riskChange > 0 ? <Plus className="h-4 w-4" /> : null}
                    <span className="font-medium">
                      Risk Score: {riskChange > 0 ? '+' : ''}{riskChange} points
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {older.risk_score_snapshot || 'N/A'} → {newer.risk_score_snapshot || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <div className="text-muted-foreground font-medium">
                    {newer.version_number - older.version_number} version(s) difference
                  </div>
                </div>
              </div>

              {newer.changes_description && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Changes in v{newer.version_number}</h5>
                  <div className="p-3 rounded-lg border bg-muted/50">
                    <p className="text-sm">{newer.changes_description}</p>
                  </div>
                </div>
              )}

              {newer.summary_snapshot && older.summary_snapshot && newer.summary_snapshot !== older.summary_snapshot && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Summary Changes</h5>
                  <div className="grid gap-2">
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-xs text-destructive font-medium mb-1">Previous (v{older.version_number})</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{older.summary_snapshot}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                      <p className="text-xs text-success font-medium mb-1">New (v{newer.version_number})</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{newer.summary_snapshot}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Version History
            </CardTitle>
            <CardDescription>
              Track changes and amendments over time
            </CardDescription>
          </div>
          {selectedVersions.length === 2 && (
            <Button size="sm" onClick={() => setShowDiff(true)}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Selected
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {versions && versions.length > 0 ? (
              versions.map((version, index) => (
                <div
                  key={version.id}
                  onClick={() => toggleVersionSelect(version.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedVersions.includes(version.id)
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                        {index < versions.length - 1 && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-12 bg-border" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? 'default' : 'outline'}>
                            v{version.version_number}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {version.risk_score_snapshot !== null && (
                        <Badge variant={
                          version.risk_score_snapshot >= 70 ? 'destructive' :
                          version.risk_score_snapshot >= 50 ? 'secondary' : 'outline'
                        } className="text-xs">
                          Risk: {version.risk_score_snapshot}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewVersion(version);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {version.changes_description && (
                    <p className="mt-2 ml-6 text-sm text-muted-foreground">
                      {version.changes_description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No version history available</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {versions && versions.length > 1 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Click on two versions to compare them
          </p>
        )}
      </CardContent>
      
      <DiffView />

      {/* View Version Dialog */}
      <Dialog open={!!viewVersion} onOpenChange={() => setViewVersion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version {viewVersion?.version_number} Details</DialogTitle>
            <DialogDescription>
              {viewVersion && format(new Date(viewVersion.created_at), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewVersion?.risk_score_snapshot !== null && (
              <div>
                <h4 className="text-sm font-medium mb-2">Risk Score</h4>
                <Badge variant={
                  (viewVersion?.risk_score_snapshot || 0) >= 70 ? 'destructive' :
                  (viewVersion?.risk_score_snapshot || 0) >= 50 ? 'secondary' : 'outline'
                }>
                  {viewVersion?.risk_score_snapshot}
                </Badge>
              </div>
            )}
            {viewVersion?.changes_description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Changes</h4>
                <p className="text-sm text-muted-foreground">{viewVersion.changes_description}</p>
              </div>
            )}
            {viewVersion?.summary_snapshot && (
              <div>
                <h4 className="text-sm font-medium mb-2">Summary at this version</h4>
                <p className="text-sm text-muted-foreground">{viewVersion.summary_snapshot}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}