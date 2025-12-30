import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  created_at: string;
  overall_risk_score: number | null;
  user_id: string;
}

interface RecentReportsTableProps {
  reports: Report[] | undefined;
  isLoading: boolean;
}

export const RecentReportsTable = ({ reports, isLoading }: RecentReportsTableProps) => {
  const getRiskBadge = (score: number | null) => {
    if (!score) return <Badge variant="outline">N/A</Badge>;
    if (score >= 70) return <Badge variant="destructive">High Risk ({score})</Badge>;
    if (score >= 50) return <Badge className="bg-warning text-warning-foreground">Medium ({score})</Badge>;
    return <Badge className="bg-success text-success-foreground">Low ({score})</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Due Diligence Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
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
          <FileText className="h-5 w-5" />
          Recent Due Diligence Reports
        </CardTitle>
        <CardDescription>Latest risk assessments across all users</CardDescription>
      </CardHeader>
      <CardContent>
        {reports && reports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{getRiskBadge(report.overall_risk_score)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No reports available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};
