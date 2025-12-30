import { Link } from "react-router-dom";
import { 
  Home, FileText, Upload, MessageSquare, Scale, AlertTriangle, 
  Globe, BookOpen, Shield, Settings, Users, Building, Bell,
  BarChart3, Languages, Search, Lock, Unlock, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RouteInfo {
  path: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
  category: string;
}

const routes: RouteInfo[] = [
  // Public Routes
  { path: "/", name: "Landing Page", description: "Platform overview and introduction", icon: <Home className="h-5 w-5" />, requiresAuth: false, category: "Public" },
  { path: "/features", name: "Features", description: "Detailed platform capabilities", icon: <BarChart3 className="h-5 w-5" />, requiresAuth: false, category: "Public" },
  { path: "/pricing", name: "Pricing", description: "Subscription plans and pricing", icon: <FileText className="h-5 w-5" />, requiresAuth: false, category: "Public" },
  { path: "/auth", name: "Authentication", description: "Login and signup portal", icon: <Lock className="h-5 w-5" />, requiresAuth: false, category: "Public" },
  
  // Main App Routes
  { path: "/dashboard", name: "Dashboard", description: "Main user dashboard with analytics", icon: <BarChart3 className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/documents", name: "My Documents", description: "View and manage uploaded documents", icon: <FileText className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/documents/upload", name: "Upload Document", description: "Upload new legal documents for analysis", icon: <Upload className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/chat", name: "AI Legal Chat", description: "Chat with Lexlytic AI assistant", icon: <MessageSquare className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/comparison", name: "Jurisdiction Compare", description: "Compare laws across jurisdictions", icon: <Scale className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/risk", name: "Risk Dashboard", description: "View risk analysis and scores", icon: <AlertTriangle className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/translate", name: "Legal Translation", description: "Translate legal documents", icon: <Languages className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/resources", name: "African Law Resources", description: "Browse African legal resources", icon: <Globe className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/due-diligence", name: "Due Diligence", description: "AI-powered due diligence analysis", icon: <Search className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  { path: "/alerts-settings", name: "Alert Settings", description: "Configure regulatory alerts", icon: <Bell className="h-5 w-5" />, requiresAuth: true, category: "Main App" },
  
  // CBN Co-pilot Routes
  { path: "/cbn-copilot", name: "CBN Co-pilot", description: "Central Bank of Nigeria regulatory portal", icon: <Building className="h-5 w-5" />, requiresAuth: true, category: "CBN Co-pilot" },
  { path: "/cbn-copilot/rulebook", name: "CBN Rulebook", description: "Browse CBN regulations and circulars", icon: <BookOpen className="h-5 w-5" />, requiresAuth: true, category: "CBN Co-pilot" },
  { path: "/cbn-copilot/alerts", name: "CBN Alerts", description: "CBN regulatory updates and alerts", icon: <Bell className="h-5 w-5" />, requiresAuth: true, category: "CBN Co-pilot" },
  { path: "/cbn-copilot/reports", name: "CBN Reports", description: "Compliance reports and analysis", icon: <FileText className="h-5 w-5" />, requiresAuth: true, category: "CBN Co-pilot" },
  
  // Admin Routes
  { path: "/admin", name: "Admin Panel", description: "Platform administration and analytics", icon: <Shield className="h-5 w-5" />, requiresAuth: true, category: "Admin" },
];

const categories = ["Public", "Main App", "CBN Co-pilot", "Admin"];

const SiteLinks = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-primary">Lexlytic</span>
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Site Links</h1>
            <p className="text-muted-foreground">
              Complete directory of all pages and features available on the Lexlytic platform.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{routes.length}</p>
                <p className="text-sm text-muted-foreground">Total Pages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{routes.filter(r => !r.requiresAuth).length}</p>
                <p className="text-sm text-muted-foreground">Public Pages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{routes.filter(r => r.requiresAuth).length}</p>
                <p className="text-sm text-muted-foreground">Protected Pages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </CardContent>
            </Card>
          </div>

          {/* Routes by Category */}
          {categories.map((category) => {
            const categoryRoutes = routes.filter(r => r.category === category);
            if (categoryRoutes.length === 0) return null;

            return (
              <div key={category} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-foreground">{category}</h2>
                  <Badge variant="secondary">{categoryRoutes.length} pages</Badge>
                </div>
                
                <div className="grid gap-3">
                  {categoryRoutes.map((route) => (
                    <Link key={route.path} to={route.path}>
                      <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              {route.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {route.name}
                                </h3>
                                {route.requiresAuth ? (
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <Unlock className="h-3 w-3 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {route.description}
                              </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {route.path}
                              </code>
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <Separator className="my-8" />

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
              <CardDescription>Understanding page access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Public - No login required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Protected - Login required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Admin - Admin access only</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SiteLinks;
