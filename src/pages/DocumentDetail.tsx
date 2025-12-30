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
import { ExportButton } from "@/components/ExportButton";
import { DocumentComments } from "@/components/DocumentComments";
import { TeamInvite } from "@/components/TeamInvite";
import { DocumentVersionHistory } from "@/components/DocumentVersionHistory";
import { SourceCitations } from "@/components/SourceCitations";
import { RedFlagHighlights } from "@/components/RedFlagHighlights";
import { RiskMitigation } from "@/components/RiskMitigation";
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
  RefreshCw,
  Shield,
  History,
  Users
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

  // Handle both array of objects and array of strings for backwards compatibility
  const obligations = (document.key_obligations as Array<{title?: string; section?: string; description?: string} | string>) || [];
  const penalties = (document.key_penalties as Array<{title?: string; section?: string; description?: string} | string>) || [];
  const definitions = (document.key_definitions as Array<{term?: string; definition?: string} | string>) || [];

  // Prepare export data
  const exportData = {
    title: document.title,
    date: new Date().toLocaleDateString(),
    jurisdiction: document.jurisdiction || undefined,
    documentType: document.document_type || undefined,
    riskScore: document.risk_score || undefined,
    summary: document.summary || undefined,
    obligations: obligations,
    penalties: penalties,
    definitions: definitions,
    content: [
      {
        section: 'Key Obligations',
        items: obligations.map(o => typeof o === 'string' ? o : (o.title || o.description || '')),
      },
      {
        section: 'Penalties & Enforcement',
        items: penalties.map(p => typeof p === 'string' ? p : (p.title || p.description || '')),
      },
      {
        section: 'Key Definitions',
        items: definitions.map(d => typeof d === 'string' ? d : (d.term || '')),
      },
    ],
    redFlags: document.risk_score && document.risk_score >= 50 
      ? ['Potential compliance gaps identified', 'Review recommended before implementation']
      : [],
    mitigationSuggestions: [
      'Conduct regular compliance reviews',
      'Implement monitoring procedures',
      'Maintain documentation of compliance efforts',
    ],
    citations: [
      'CBN Guidelines on Electronic Banking',
      'CBN AML/CFT Regulations 2022',
      'Money Laundering Prevention Act',
    ],
  };

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
            <TeamInvite documentId={id || ''} documentTitle={document.title} />
            <ExportButton data={exportData} />
            <Button variant="outline" onClick={handleResummarize}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            <Button asChild>
              <Link to={`/chat?doc=${id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Lexlytic
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
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
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="obligations">Obligations</TabsTrigger>
              <TabsTrigger value="penalties">Penalties</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="collaborate">Collaborate</TabsTrigger>
              <TabsTrigger value="translate">Translate</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
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

                  {/* Red Flags Section */}
                  <RedFlagHighlights 
                    riskScore={document.risk_score || 0}
                    jurisdiction={document.jurisdiction || undefined}
                    documentType={document.document_type || undefined}
                  />

                  {document.full_text && (
                    <Card>
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
                </div>
                
                {/* Definitions Sidebar */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5 text-accent" />
                        Key Definitions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {definitions.length > 0 ? (
                        <ul className="space-y-3">
                          {definitions.slice(0, 5).map((item, i: number) => {
                            const isObject = typeof item === 'object' && item !== null;
                            return (
                              <li key={i} className="p-2 bg-muted/50 rounded-lg">
                                {isObject && 'term' in item ? (
                                  <>
                                    <div className="font-medium text-foreground text-sm">{item.term}</div>
                                    {item.definition && <div className="text-xs text-muted-foreground mt-1">{item.definition}</div>}
                                  </>
                                ) : (
                                  <span className="text-foreground text-sm">{String(item)}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm italic">No definitions extracted yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
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
                      {obligations.map((item, i: number) => {
                        const isObject = typeof item === 'object' && item !== null;
                        return (
                          <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <span className="text-accent font-bold">{i + 1}.</span>
                            <div className="flex-1">
                              {isObject ? (
                                <>
                                  <div className="font-medium text-foreground">{item.title}</div>
                                  {item.section && <div className="text-xs text-muted-foreground mb-1">{item.section}</div>}
                                  {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                                </>
                              ) : (
                                <span className="text-foreground">{String(item)}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
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
                      {penalties.map((item, i: number) => {
                        const isObject = typeof item === 'object' && item !== null;
                        return (
                          <li key={i} className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              {isObject ? (
                                <>
                                  <div className="font-medium text-foreground">{item.title}</div>
                                  {item.section && <div className="text-xs text-muted-foreground mb-1">{item.section}</div>}
                                  {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                                </>
                              ) : (
                                <span className="text-foreground">{String(item)}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No penalties extracted yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <RiskMitigation 
                riskScore={document.risk_score || 0}
                jurisdiction={document.jurisdiction || undefined}
                documentType={document.document_type || undefined}
              />
            </TabsContent>

            <TabsContent value="citations">
              <SourceCitations 
                jurisdiction={document.jurisdiction || undefined}
                documentType={document.document_type || undefined}
              />
            </TabsContent>

            <TabsContent value="history">
              <DocumentVersionHistory 
                documentId={id || ''}
                documentTitle={document.title}
              />
            </TabsContent>

            <TabsContent value="collaborate">
              <div className="grid md:grid-cols-2 gap-6">
                {user && (
                  <DocumentComments 
                    documentId={id || ''} 
                    userId={user.id} 
                  />
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent" />
                      Team Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Invite team members to collaborate on this document. They can view, comment, and annotate.
                    </p>
                    <TeamInvite documentId={id || ''} documentTitle={document.title} />
                  </CardContent>
                </Card>
              </div>
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
