import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Alerts = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*, documents(title)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive/10 border-destructive text-destructive";
      case "medium":
        return "bg-warning/10 border-warning text-warning";
      default:
        return "bg-info/10 border-info text-info";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onChatOpen={() => setIsChatOpen(true)} />
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary">Regulatory Alerts</h1>
            <p className="text-muted-foreground text-lg">
              Stay informed about important regulatory changes and compliance requirements
            </p>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`p-6 border-l-4 ${getSeverityColor(alert.severity || 'info')}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getSeverityIcon(alert.severity || 'info')}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {alert.alert_type}
                            </Badge>
                            <Badge variant="outline" className={getSeverityColor(alert.severity || 'info')}>
                              {alert.severity || 'info'}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">
                            {alert.message}
                          </h3>
                          {alert.documents && (
                            <p className="text-sm text-muted-foreground">
                              Related document: {alert.documents.title}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(alert.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No alerts</h3>
                <p className="text-muted-foreground">
                  You're all caught up! Check back later for new regulatory alerts.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;
