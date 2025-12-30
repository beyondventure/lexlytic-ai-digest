import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  useIsAdmin,
  useAdminStats,
  useAllUsers,
  useRecentReports,
  useDocumentStats,
  useRegulatoryAlerts,
  usePlatformAnalytics,
  useSupportMessages,
} from '@/hooks/useAdminData';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { DocumentAnalyticsChart } from '@/components/admin/DocumentAnalyticsChart';
import { RecentReportsTable } from '@/components/admin/RecentReportsTable';
import { RegulatoryAlertsPanel } from '@/components/admin/RegulatoryAlertsPanel';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { PlatformSettingsCard } from '@/components/admin/PlatformSettingsCard';
import { ComprehensiveAnalytics } from '@/components/admin/ComprehensiveAnalytics';
import { SupportMessagesPanel } from '@/components/admin/SupportMessagesPanel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Settings,
  BarChart3,
  CreditCard,
  Shield,
  TrendingUp,
  Activity,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate('/auth');
    });
  }, [navigate]);

  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const { data: stats, isLoading: statsLoading } = useAdminStats(isAdmin || false);
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useAllUsers(isAdmin || false);
  const { data: reports, isLoading: reportsLoading } = useRecentReports(isAdmin || false);
  const { data: docStats, isLoading: docStatsLoading } = useDocumentStats(isAdmin || false);
  const { data: regulatoryAlerts, isLoading: alertsLoading } = useRegulatoryAlerts(isAdmin || false);
  const { data: platformAnalytics, isLoading: analyticsLoading } = usePlatformAnalytics(isAdmin || false);
  const { data: supportMessages, isLoading: supportLoading } = useSupportMessages(isAdmin || false);

  // Mock payment data for demonstration
  const paymentStats = {
    totalRevenue: 45250,
    monthlyRevenue: 8750,
    activeSubscriptions: 23,
    conversionRate: 12.5,
  };

  const recentPayments = [
    { id: '1', user: 'Legal Corp Ltd', plan: 'Enterprise', amount: 499, date: new Date().toISOString(), status: 'completed' },
    { id: '2', user: 'FinTech Solutions', plan: 'Professional', amount: 199, date: new Date(Date.now() - 86400000).toISOString(), status: 'completed' },
    { id: '3', user: 'Compliance Inc', plan: 'Professional', amount: 199, date: new Date(Date.now() - 172800000).toISOString(), status: 'completed' },
    { id: '4', user: 'Law Partners LLP', plan: 'Enterprise', amount: 499, date: new Date(Date.now() - 259200000).toISOString(), status: 'pending' },
    { id: '5', user: 'Risk Advisory Co', plan: 'Starter', amount: 49, date: new Date(Date.now() - 345600000).toISOString(), status: 'completed' },
  ];

  if (!user || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">Lexlytic</span>
            </Link>
            <Badge variant="destructive" className="ml-2">Admin</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Logged in as: {user.email}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Complete platform management and analytics overview
            </p>
          </div>

          {/* Stats Cards */}
          <AdminStatsCards stats={stats} isLoading={statsLoading} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-6 w-full max-w-3xl">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Support</span>
                {stats?.unreadSupportTickets ? (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {stats.unreadSupportTickets}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <DocumentAnalyticsChart data={docStats} isLoading={docStatsLoading} />
              
              <div className="grid lg:grid-cols-2 gap-6">
                <RecentReportsTable reports={reports} isLoading={reportsLoading} />
                <RegulatoryAlertsPanel alerts={regulatoryAlerts} isLoading={alertsLoading} />
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <ComprehensiveAnalytics 
                analytics={platformAnalytics} 
                stats={stats} 
                isLoading={analyticsLoading || statsLoading} 
              />
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <SupportMessagesPanel 
                messages={supportMessages} 
                isLoading={supportLoading} 
                currentUserId={user?.id || ''} 
              />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <UserManagementTable
                users={users}
                isLoading={usersLoading}
                onRefresh={refetchUsers}
              />

              {/* Role Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent" />
                    Role Permissions Matrix
                  </CardTitle>
                  <CardDescription>Access levels for each role</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        <TableHead className="text-center">Viewer</TableHead>
                        <TableHead className="text-center">Editor</TableHead>
                        <TableHead className="text-center">Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { name: 'View documents', viewer: true, editor: true, admin: true },
                        { name: 'Upload documents', viewer: false, editor: true, admin: true },
                        { name: 'Edit documents', viewer: false, editor: true, admin: true },
                        { name: 'Delete documents', viewer: false, editor: false, admin: true },
                        { name: 'Run due diligence', viewer: true, editor: true, admin: true },
                        { name: 'Export reports', viewer: true, editor: true, admin: true },
                        { name: 'Manage team', viewer: false, editor: false, admin: true },
                        { name: 'View analytics', viewer: false, editor: false, admin: true },
                        { name: 'Billing access', viewer: false, editor: false, admin: true },
                        { name: 'Platform settings', viewer: false, editor: false, admin: true },
                      ].map((perm) => (
                        <TableRow key={perm.name}>
                          <TableCell className="font-medium">{perm.name}</TableCell>
                          <TableCell className="text-center">
                            {perm.viewer ? (
                              <span className="text-success">✓</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {perm.editor ? (
                              <span className="text-success">✓</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {perm.admin ? (
                              <span className="text-success">✓</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <RecentReportsTable reports={reports} isLoading={reportsLoading} />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Report Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Average Risk Score</span>
                        <Badge className="bg-warning">52.3</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">High Risk Reports</span>
                        <Badge variant="destructive">{reports?.filter(r => (r.overall_risk_score || 0) >= 70).length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Medium Risk Reports</span>
                        <Badge className="bg-warning">{reports?.filter(r => (r.overall_risk_score || 0) >= 50 && (r.overall_risk_score || 0) < 70).length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Low Risk Reports</span>
                        <Badge className="bg-success">{reports?.filter(r => (r.overall_risk_score || 0) < 50).length || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <RegulatoryAlertsPanel alerts={regulatoryAlerts} isLoading={alertsLoading} />
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              {/* Payment Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <DollarSign className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${paymentStats.totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${paymentStats.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">This Month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Users className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{paymentStats.activeSubscriptions}</p>
                        <p className="text-xs text-muted-foreground">Active Subscriptions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-info/10 rounded-lg">
                        <Activity className="h-5 w-5 text-info" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{paymentStats.conversionRate}%</p>
                        <p className="text-xs text-muted-foreground">Conversion Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Payments Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Recent Payments
                  </CardTitle>
                  <CardDescription>Latest subscription payments and transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.user}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.plan}</Badge>
                          </TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {payment.status === 'completed' ? (
                              <Badge className="bg-success">Completed</Badge>
                            ) : (
                              <Badge className="bg-warning">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Subscription Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Breakdown</CardTitle>
                  <CardDescription>Distribution of subscription plans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Starter</span>
                        <Badge variant="secondary">$49/mo</Badge>
                      </div>
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-xs text-muted-foreground">subscribers</p>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Professional</span>
                        <Badge className="bg-primary">$199/mo</Badge>
                      </div>
                      <p className="text-2xl font-bold">11</p>
                      <p className="text-xs text-muted-foreground">subscribers</p>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-accent/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Enterprise</span>
                        <Badge className="bg-accent">$499/mo</Badge>
                      </div>
                      <p className="text-2xl font-bold">4</p>
                      <p className="text-xs text-muted-foreground">subscribers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <PlatformSettingsCard />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Platform Version</span>
                      <Badge variant="outline">v2.1.0</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Database Status</span>
                      <Badge className="bg-success">Connected</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">AI Service</span>
                      <Badge className="bg-success">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Storage Used</span>
                      <Badge variant="secondary">2.4 GB / 10 GB</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">API Calls (Today)</span>
                      <Badge variant="secondary">1,234</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Last Backup</span>
                      <Badge variant="outline">{new Date().toLocaleDateString()}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
