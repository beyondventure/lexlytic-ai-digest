import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, AlertTriangle, MessageSquare, BarChart3, Shield } from 'lucide-react';
import type { AdminStats } from '@/hooks/useAdminData';

interface AdminStatsCardsProps {
  stats: AdminStats | undefined;
  isLoading: boolean;
}

export const AdminStatsCards = ({ stats, isLoading }: AdminStatsCardsProps) => {
  const cards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Documents',
      value: stats?.totalDocuments || 0,
      icon: FileText,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Due Diligence Reports',
      value: stats?.totalReports || 0,
      icon: Shield,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Alerts',
      value: stats?.totalAlerts || 0,
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Conversations',
      value: stats?.totalConversations || 0,
      icon: MessageSquare,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: 'Active Sessions',
      value: stats?.activeUsers || 0,
      icon: BarChart3,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
