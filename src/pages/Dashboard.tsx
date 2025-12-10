import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Upload, 
  Bell, 
  BarChart3, 
  Plus, 
  LogOut, 
  User as UserIcon,
  Globe,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["legal_documents", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("uploaded_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: alerts } = useQuery({
    queryKey: ["regulatory_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regulatory_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const quickActions = [
    { icon: Upload, label: "Upload Document", href: "/documents/upload", color: "text-accent" },
    { icon: Globe, label: "Compare Jurisdictions", href: "/comparison", color: "text-info" },
    { icon: Bell, label: "Manage Alerts", href: "/alerts-settings", color: "text-warning" },
    { icon: MessageSquare, label: "Ask AI", href: "/chat", color: "text-success" },
  ];

  const stats = [
    { label: "Documents", value: documents?.length || 0, icon: FileText, trend: "+12%" },
    { label: "Active Alerts", value: alerts?.length || 0, icon: Bell, trend: "+3" },
    { label: "Risk Score", value: "72", icon: TrendingUp, trend: "-8%" },
    { label: "Pending Reviews", value: "4", icon: Clock, trend: "0" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-foreground">Lexlytic</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-accent">Dashboard</Link>
            <Link to="/documents" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Documents</Link>
            <Link to="/comparison" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Comparison</Link>
            <Link to="/risk" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Risk</Link>
            <Link to="/cbn-copilot" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">CBN Co-pilot</Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {alerts && alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-muted-foreground text-sm">
                  {profile?.full_name || user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your regulatory intelligence today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Card className="hover:shadow-md transition-all hover:border-accent/30 cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-secondary ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-success' : stat.trend.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {stat.trend}
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Documents</CardTitle>
                <CardDescription>Your recently uploaded legal documents</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/documents/upload">
                  <Plus className="h-4 w-4 mr-1" />
                  Upload
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {doc.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.jurisdiction || 'No jurisdiction'} • {doc.status}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No documents yet</p>
                  <Button size="sm" asChild>
                    <Link to="/documents/upload">Upload your first document</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Regulatory Alerts</CardTitle>
                <CardDescription>Latest regulatory changes worldwide</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/alerts-settings">Configure</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'high' ? 'border-l-destructive bg-destructive/5' :
                        alert.severity === 'medium' ? 'border-l-warning bg-warning/5' :
                        'border-l-info bg-info/5'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          alert.severity === 'high' ? 'text-destructive' :
                          alert.severity === 'medium' ? 'text-warning' :
                          'text-info'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.jurisdiction} • {new Date(alert.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No alerts yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
