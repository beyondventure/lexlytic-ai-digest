import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  FileText, 
  Globe, 
  Calendar, 
  AlertTriangle,
  BookOpen,
  Gavel,
  DollarSign,
  Languages,
  MessageSquare,
  RefreshCw
} from "lucide-react";

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState("fr");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
  }, [navigate]);

  const { data: document, isLoading, refetch } = useQuery({
    queryKey: ["legal_document", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const handleTranslate = async () => {
    if (!document?.full_text) return;
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { text: document.full_text.substring(0, 5000), sourceLang: "en", targetLang: targetLang },
      });
      if (error) throw error;
      setTranslatedText(data.translatedText);
      toast({ title: "Translation complete" });
    } catch (error) {
      toast({ title: "Translation failed", variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const handleResummarize = async () => {
    if (!document) return;
    toast({ title: "Re-analyzing document..." });
    try {
      const { error } = await supabase.functions.invoke("summarize-document", {
        body: {
          documentId: document.id,
          documentContent: document.full_text,
          documentTitle: document.title,
        },
      });
      if (error) throw error;
      toast({ title: "Analysis complete" });
      refetch();
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-destructive bg-destructive/10";
    if (score >= 40) return "text-warning bg-warning/10";
    return "text-success bg-success/10";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
          <div className="container mx-auto px-6 h-16 flex items-center">
            <Skeleton className="h-8 w-48" />
          </div>
        </nav>
        <main className="container mx-auto px-6 pt-24 pb-12">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <Button onClick={() => navigate("/documents")}>Back to Documents</Button>
        </Card>
      </div>
    );
  }

  const obligations = document.key_obligations as string[] || [];
  const penalties = document.key_penalties as string[] || [];
  const definitions = document.key_definitions as string[] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">Lexlytic</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleResummarize}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            <Button asChild>
              <Link to={`/chat?doc=${id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask AI
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{document.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {document.jurisdiction && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {document.jurisdiction}
                    </span>
                  )}
                  {document.document_type && (
                    <Badge variant="outline">{document.document_type}</Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(document.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {document.risk_score && (
                <div className={`px-4 py-2 rounded-lg ${getRiskColor(document.risk_score)}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <div className="text-sm font-medium">Risk Score</div>
                      <div className="text-2xl font-bold">{document.risk_score}/100</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="obligations">Obligations</TabsTrigger>
              <TabsTrigger value="penalties">Penalties</TabsTrigger>
              <TabsTrigger value="definitions">Definitions</TabsTrigger>
              <TabsTrigger value="translate">Translate</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {document.summary ? (
                    <p className="text-muted-foreground leading-relaxed">{document.summary}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No summary available. Click "Re-analyze" to generate.</p>
                  )}
                </CardContent>
              </Card>
              {document.full_text && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-accent" />
                      Full Text
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                        {document.full_text}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="obligations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-accent" />
                    Key Obligations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {obligations.length > 0 ? (
                    <ul className="space-y-3">
                      {obligations.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <span className="text-accent font-bold">{i + 1}.</span>
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No obligations extracted yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="penalties">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-destructive" />
                    Penalties & Enforcement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {penalties.length > 0 ? (
                    <ul className="space-y-3">
                      {penalties.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No penalties extracted yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="definitions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Key Definitions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {definitions.length > 0 ? (
                    <ul className="space-y-3">
                      {definitions.map((item: string, i: number) => (
                        <li key={i} className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No definitions extracted yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="translate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-accent" />
                    Translate Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="pt">Portuguese</option>
                      <option value="ar">Arabic</option>
                      <option value="sw">Swahili</option>
                      <option value="zu">Zulu</option>
                      <option value="yo">Yoruba</option>
                      <option value="ha">Hausa</option>
                      <option value="ig">Igbo</option>
                    </select>
                    <Button onClick={handleTranslate} disabled={translating || !document.full_text}>
                      {translating ? "Translating..." : "Translate"}
                    </Button>
                  </div>
                  {translatedText && (
                    <div className="max-h-96 overflow-y-auto p-4 bg-muted/50 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                        {translatedText}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DocumentDetail;
