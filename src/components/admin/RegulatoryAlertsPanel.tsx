import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface RegulatoryAlert {
  id: string;
  title: string;
  description: string | null;
  jurisdiction: string;
  sector: string | null;
  severity: string | null;
  source_url: string | null;
  effective_date: string | null;
  created_at: string;
}

interface RegulatoryAlertsPanelProps {
  alerts: RegulatoryAlert[] | undefined;
  isLoading: boolean;
}

export const RegulatoryAlertsPanel = ({ alerts, isLoading }: RegulatoryAlertsPanelProps) => {
  const getSeverityBadge = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Regulatory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Regulatory Alerts
        </CardTitle>
        <CardDescription>Latest regulatory updates and compliance notifications</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts && alerts.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityBadge(alert.severity)}
                        <Badge variant="outline">{alert.jurisdiction}</Badge>
                        {alert.sector && <Badge variant="secondary">{alert.sector}</Badge>}
                      </div>
                      <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {format(new Date(alert.created_at), 'MMM d, yyyy')}</span>
                        {alert.effective_date && (
                          <span>Effective: {format(new Date(alert.effective_date), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    {alert.source_url && (
                      <a
                        href={alert.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No regulatory alerts available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
