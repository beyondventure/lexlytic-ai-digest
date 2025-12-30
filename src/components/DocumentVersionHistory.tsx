import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { History, GitCompare, Clock, Plus, Minus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Version {
  id: string;
  version: string;
  date: string;
  author: string;
  changes: string[];
  additions: number;
  deletions: number;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  documentTitle: string;
}

export function DocumentVersionHistory({ documentId, documentTitle }: DocumentVersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  // Demo version history data
  const versions: Version[] = [
    {
      id: '1',
      version: '1.0',
      date: new Date().toISOString(),
      author: 'System',
      changes: ['Initial document upload and AI analysis'],
      additions: 100,
      deletions: 0,
    },
    {
      id: '2',
      version: '1.1',
      date: new Date(Date.now() - 86400000).toISOString(),
      author: 'System',
      changes: ['Updated risk score based on new regulatory requirements', 'Added KYC compliance section'],
      additions: 25,
      deletions: 5,
    },
    {
      id: '3',
      version: '1.2',
      date: new Date(Date.now() - 172800000).toISOString(),
      author: 'System',
      changes: ['Incorporated CBN circular amendments', 'Updated penalty provisions'],
      additions: 15,
      deletions: 8,
    },
  ];

  const toggleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    }
  };

  const DiffView = () => {
    if (selectedVersions.length !== 2) return null;
    
    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);
    
    if (!v1 || !v2) return null;

    return (
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-accent" />
              Version Comparison
            </DialogTitle>
            <DialogDescription>
              Comparing v{v1.version} with v{v2.version}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <Badge variant="outline" className="mb-1">v{v1.version}</Badge>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(v1.date), 'MMM d, yyyy')}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <Badge variant="outline" className="mb-1">v{v2.version}</Badge>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(v2.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Changes Summary</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-2 text-success">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">
                      +{Math.abs(v2.additions - v1.additions)} additions
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <Minus className="h-4 w-4" />
                    <span className="font-medium">
                      -{Math.abs(v2.deletions - v1.deletions)} deletions
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium">Detailed Changes</h5>
                <ScrollArea className="h-48 rounded-lg border p-3">
                  {v2.changes.map((change, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 py-2 border-b border-border last:border-0"
                    >
                      <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <Plus className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-sm">{change}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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
            {versions.map((version, index) => (
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
                          v{version.version}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(version.date), 'MMM d, yyyy h:mm a')}
                        <span>•</span>
                        <span>{version.author}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-success">+{version.additions}</span>
                    <span className="text-destructive">-{version.deletions}</span>
                  </div>
                </div>
                <ul className="mt-2 ml-6 space-y-1">
                  {version.changes.map((change, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Click on two versions to compare them
        </p>
      </CardContent>
      
      <DiffView />
    </Card>
  );
}
