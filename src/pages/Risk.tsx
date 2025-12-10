import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Globe,
  FileText,
  ChevronRight
} from "lucide-react";

interface JurisdictionRisk {
  jurisdiction: string;
  flag: string;
  score: number;
  documents: number;
}

const jurisdictionFlags: Record<string, string> = {
  "Nigeria": "🇳🇬",
  "Kenya": "🇰🇪",
  "South Africa": "🇿🇦",
  "Ghana": "🇬🇭",
  "European Union": "🇪🇺",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  "Singapore": "🇸🇬",
  "Hong Kong": "🇭🇰",
  "Canada": "🇨🇦",
  "Australia": "🇦🇺",
  "India": "🇮🇳",
};

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

  // Fetch all user documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["risk_documents", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("uploaded_by", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate risk by jurisdiction from actual documents
  const riskByJurisdiction: JurisdictionRisk[] = (() => {
    if (!documents || documents.length === 0) return [];
    
    const jurisdictionMap = new Map<string, { scores: number[], count: number }>();
    
    documents.forEach(doc => {
      const jurisdiction = doc.jurisdiction || "Unknown";
      const existing = jurisdictionMap.get(jurisdiction) || { scores: [], count: 0 };
      if (doc.risk_score !== null) {
        existing.scores.push(doc.risk_score);
      }
      existing.count++;
      jurisdictionMap.set(jurisdiction, existing);
    });

    return Array.from(jurisdictionMap.entries())
      .map(([jurisdiction, data]) => ({
        jurisdiction,
        flag: jurisdictionFlags[jurisdiction] || "🌍",
        score: data.scores.length > 0 
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
        documents: data.count,
      }))
      .filter(j => j.score > 0)
      .sort((a, b) => b.score - a.score);
  })();

  // Get high-risk documents for recent risks section
  const recentRisks = documents
    ?.filter(d => d.risk_score !== null && d.risk_score > 0)
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 5)
    .map(doc => ({
      id: doc.id,
      title: doc.title,
      severity: (doc.risk_score || 0) >= 70 ? 'high' : (doc.risk_score || 0) >= 50 ? 'medium' : 'low',
      jurisdiction: doc.jurisdiction || 'Unknown',
      date: doc.updated_at || doc.created_at,
      risk_score: doc.risk_score,
      status: doc.status,
    })) || [];

  // Calculate stats
  const totalDocuments = documents?.length || 0;
  const analyzedDocs = documents?.filter(d => d.risk_score !== null) || [];
  const highPriorityIssues = documents?.filter(d => (d.risk_score || 0) >= 70).length || 0;
  const uniqueJurisdictions = new Set(documents?.map(d => d.jurisdiction).filter(Boolean)).size;
  
  const overallScore = analyzedDocs.length > 0
    ? Math.round(analyzedDocs.reduce((sum, d) => sum + (d.risk_score || 0), 0) / analyzedDocs.length)
    : 0;

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
            Monitor and manage regulatory risk based on your uploaded documents
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : totalDocuments === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Documents Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload legal documents to generate risk analysis and see your compliance posture.
              </p>
              <Button asChild>
                <Link to="/documents/upload">Upload Document</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall Score */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="md:col-span-1">
                <CardContent className="pt-6 text-center">
                  <div className={`text-5xl font-bold mb-2 ${overallScore > 0 ? getScoreColor(overallScore) : 'text-muted-foreground'}`}>
                    {overallScore > 0 ? overallScore : 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Overall Risk Score</p>
                  {overallScore > 0 && (
                    <>
                      <Progress value={overallScore} className={`h-2 ${getScoreBg(overallScore)}`} />
                      <p className="text-xs text-muted-foreground mt-2">
                        {overallScore >= 70 ? "High Risk" : overallScore >= 50 ? "Medium Risk" : "Low Risk"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{highPriorityIssues}</p>
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
                      <p className="text-2xl font-bold text-foreground">{analyzedDocs.length}</p>
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
                      <p className="text-2xl font-bold text-foreground">{uniqueJurisdictions}</p>
                      <p className="text-sm text-muted-foreground">Jurisdictions Covered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Score Key */}
            <Card className="mb-6 bg-secondary/30">
              <CardContent className="py-4">
                <div className="flex flex-col gap-4">
                  {/* Color Key with visual bars */}
                  <div className="flex flex-wrap items-center gap-8">
                    <span className="text-sm font-medium text-foreground">Understanding the Chart:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-3 bg-success rounded-full" />
                      <span className="text-sm text-muted-foreground">Green = Low Risk (0-49)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-3 bg-warning rounded-full" />
                      <span className="text-sm text-muted-foreground">Yellow = Medium Risk (50-69)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-3 bg-destructive rounded-full" />
                      <span className="text-sm text-muted-foreground">Red = High Risk (70-100)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {riskByJurisdiction.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Risk by Jurisdiction */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-accent" />
                      Risk by Jurisdiction
                    </CardTitle>
                    <CardDescription>Average risk scores from your documents by country</CardDescription>
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
                                <span className="text-xs text-muted-foreground">({j.documents} docs)</span>
                              </div>
                            </div>
                            <Progress value={j.score} className={`h-1.5 ${getScoreBg(j.score)}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      Risk Distribution
                    </CardTitle>
                    <CardDescription>Document count by risk level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-destructive">High Risk</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {documents?.filter(d => (d.risk_score || 0) >= 70).length || 0} documents
                            </span>
                          </div>
                          <Progress 
                            value={((documents?.filter(d => (d.risk_score || 0) >= 70).length || 0) / (analyzedDocs.length || 1)) * 100} 
                            className="h-2 bg-destructive" 
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-warning">Medium Risk</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {documents?.filter(d => (d.risk_score || 0) >= 50 && (d.risk_score || 0) < 70).length || 0} documents
                            </span>
                          </div>
                          <Progress 
                            value={((documents?.filter(d => (d.risk_score || 0) >= 50 && (d.risk_score || 0) < 70).length || 0) / (analyzedDocs.length || 1)) * 100} 
                            className="h-2 bg-warning" 
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-success">Low Risk</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {documents?.filter(d => (d.risk_score || 0) > 0 && (d.risk_score || 0) < 50).length || 0} documents
                            </span>
                          </div>
                          <Progress 
                            value={((documents?.filter(d => (d.risk_score || 0) > 0 && (d.risk_score || 0) < 50).length || 0) / (analyzedDocs.length || 1)) * 100} 
                            className="h-2 bg-success" 
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Risks from Documents */}
            {recentRisks.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Documents by Risk Level</CardTitle>
                    <CardDescription>Your documents sorted by risk score</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/documents">View All Documents</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentRisks.map((risk) => (
                      <Link
                        key={risk.id}
                        to={`/documents/${risk.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            risk.severity === 'high' ? 'text-destructive' :
                            risk.severity === 'medium' ? 'text-warning' :
                            'text-success'
                          }`} />
                          <div>
                            <h4 className="font-medium text-foreground">{risk.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">{risk.jurisdiction}</span>
                              <span className="text-xs text-muted-foreground">Risk Score: {risk.risk_score}</span>
                              <span className="text-xs text-muted-foreground">{new Date(risk.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                            {risk.severity}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Risk;
