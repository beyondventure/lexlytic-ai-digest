import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Globe,
  Building2,
  FileText,
  ChevronRight
} from "lucide-react";

const riskByJurisdiction = [
  { jurisdiction: "Nigeria", flag: "🇳🇬", score: 72, change: -5, documents: 12 },
  { jurisdiction: "Kenya", flag: "🇰🇪", score: 65, change: 3, documents: 8 },
  { jurisdiction: "South Africa", flag: "🇿🇦", score: 45, change: -2, documents: 15 },
  { jurisdiction: "Ghana", flag: "🇬🇭", score: 58, change: 0, documents: 6 },
  { jurisdiction: "European Union", flag: "🇪🇺", score: 38, change: -8, documents: 22 },
];

const riskByBusinessUnit = [
  { unit: "Finance", score: 68, issues: 5 },
  { unit: "Operations", score: 54, issues: 3 },
  { unit: "HR", score: 42, issues: 2 },
  { unit: "IT", score: 75, issues: 8 },
  { unit: "Legal", score: 35, issues: 1 },
];

const recentRisks = [
  { 
    id: 1,
    title: "CBN Cybersecurity Directive non-compliance",
    severity: "high",
    jurisdiction: "Nigeria",
    date: "2024-01-15",
    status: "open"
  },
  { 
    id: 2,
    title: "POPIA consent form updates required",
    severity: "medium",
    jurisdiction: "South Africa",
    date: "2024-01-12",
    status: "in_progress"
  },
  { 
    id: 3,
    title: "AML reporting threshold review",
    severity: "low",
    jurisdiction: "Kenya",
    date: "2024-01-10",
    status: "open"
  },
];

const Risk = () => {
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 50) return "text-warning";
    return "text-success";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-destructive";
    if (score >= 50) return "bg-warning";
    return "bg-success";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-info/10 text-info border-info/20";
    }
  };

  // Calculate overall score
  const overallScore = Math.round(
    riskByJurisdiction.reduce((sum, j) => sum + j.score, 0) / riskByJurisdiction.length
  );

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">Lexlytic</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Risk Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage regulatory risk across your organization
          </p>
        </div>

        {/* Risk Score Key */}
        <Card className="mb-8 bg-secondary/30">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-medium text-foreground">Risk Score Key:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">0-49: Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">50-69: Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">70-100: High Risk</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 text-center">
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <p className="text-sm text-muted-foreground mb-4">Overall Risk Score</p>
              <Progress value={overallScore} className={`h-2 ${getScoreBg(overallScore)}`} />
              <p className="text-xs text-muted-foreground mt-2">
                {overallScore >= 70 ? "High Risk" : overallScore >= 50 ? "Medium Risk" : "Low Risk"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">8</p>
                  <p className="text-sm text-muted-foreground">High Priority Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">63</p>
                  <p className="text-sm text-muted-foreground">Documents Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-sm text-muted-foreground">Jurisdictions Monitored</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Risk by Jurisdiction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                Risk by Jurisdiction
              </CardTitle>
              <CardDescription>Regulatory risk scores by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskByJurisdiction.map((j) => (
                  <div key={j.jurisdiction} className="flex items-center gap-4">
                    <span className="text-xl">{j.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{j.jurisdiction}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getScoreColor(j.score)}`}>{j.score}</span>
                          {j.change !== 0 && (
                            <span className={`text-xs flex items-center ${j.change < 0 ? 'text-success' : 'text-destructive'}`}>
                              {j.change < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                              {Math.abs(j.change)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress value={j.score} className={`h-1.5 ${getScoreBg(j.score)}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk by Business Unit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Risk by Business Unit
              </CardTitle>
              <CardDescription>Compliance risk across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskByBusinessUnit.map((unit) => (
                  <div key={unit.unit} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-foreground">{unit.unit}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{unit.issues} issues</span>
                        <span className={`text-sm font-bold ${getScoreColor(unit.score)}`}>{unit.score}</span>
                      </div>
                      <Progress value={unit.score} className={`h-1.5 ${getScoreBg(unit.score)}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Risks */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Risk Items</CardTitle>
              <CardDescription>Latest identified compliance risks</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      risk.severity === 'high' ? 'text-destructive' :
                      risk.severity === 'medium' ? 'text-warning' :
                      'text-info'
                    }`} />
                    <div>
                      <h4 className="font-medium text-foreground">{risk.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{risk.jurisdiction}</span>
                        <span className="text-xs text-muted-foreground">{risk.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                      {risk.severity}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Risk;
