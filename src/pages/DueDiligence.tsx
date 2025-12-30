import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ExportButton } from '@/components/ExportButton';
import { extractTextFromFile, formatFileSize } from '@/lib/documentParser';
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  Scale,
  TrendingUp,
  BookOpen,
  Gavel,
  ListChecks,
} from 'lucide-react';

interface UploadedDoc {
  id: string;
  name: string;
  file: File;
  size: string;
  status: 'pending' | 'extracting' | 'analyzing' | 'complete' | 'error';
  content?: string;
  riskScore?: number;
  redFlags: string[];
  summary?: string;
  obligations?: string[];
  recommendations?: string[];
  jurisdiction?: string;
  documentType?: string;
  keyTerms?: string[];
  error?: string;
}

interface OverallAnalysis {
  riskScore: number;
  summary: string;
  redFlags: string[];
  obligations: string[];
  recommendations: string[];
}

const DueDiligence = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<UploadedDoc[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [overallAnalysis, setOverallAnalysis] = useState<OverallAnalysis | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate('/auth');
    });
  }, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newDocs: UploadedDoc[] = Array.from(selectedFiles).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      size: formatFileSize(file.size),
      status: 'pending' as const,
      redFlags: [],
    }));

    setFiles([...files, ...newDocs]);
    setOverallAnalysis(null);
    toast({
      title: `${newDocs.length} document${newDocs.length > 1 ? 's' : ''} added`,
      description: 'Click "Run Due Diligence Analysis" to begin.',
    });
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    setOverallAnalysis(null);
  };

  const runAnalysis = async () => {
    if (files.length === 0) {
      toast({
        title: 'No documents',
        description: 'Please upload documents first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setOverallAnalysis(null);

    try {
      // Step 1: Extract text from all documents
      const documentsWithContent: { name: string; content: string }[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: 'extracting' } : f
          )
        );

        try {
          const content = await extractTextFromFile(file.file);
          
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, content, status: 'pending' } : f
            )
          );

          documentsWithContent.push({
            name: file.name,
            content,
          });
        } catch (extractError) {
          console.error(`Failed to extract ${file.name}:`, extractError);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    status: 'error',
                    error: extractError instanceof Error ? extractError.message : 'Extraction failed',
                    redFlags: ['Failed to extract document content'],
                  }
                : f
            )
          );
        }

        setAnalysisProgress(((i + 1) / files.length) * 30);
      }

      if (documentsWithContent.length === 0) {
        toast({
          title: 'Extraction Failed',
          description: 'Could not extract content from any documents.',
          variant: 'destructive',
        });
        setIsAnalyzing(false);
        return;
      }

      // Step 2: Mark documents as analyzing
      setFiles((prev) =>
        prev.map((f) =>
          f.status !== 'error' ? { ...f, status: 'analyzing' } : f
        )
      );
      setAnalysisProgress(40);

      // Step 3: Call the AI analysis edge function
      toast({
        title: 'Analyzing Documents',
        description: `Performing AI-powered due diligence on ${documentsWithContent.length} document${documentsWithContent.length > 1 ? 's' : ''}...`,
      });

      const { data, error } = await supabase.functions.invoke('due-diligence', {
        body: { documents: documentsWithContent },
      });

      if (error) {
        console.error('Due diligence API error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisProgress(80);

      // Step 4: Update file results
      const analysisResults = data.documents;
      
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status === 'error') return f;
          
          const result = analysisResults.find((r: any) => r.name === f.name);
          if (result) {
            return {
              ...f,
              status: 'complete',
              riskScore: result.riskScore,
              redFlags: result.redFlags || [],
              summary: result.summary,
              obligations: result.obligations || [],
              recommendations: result.recommendations || [],
              jurisdiction: result.jurisdiction,
              documentType: result.documentType,
              keyTerms: result.keyTerms || [],
            };
          }
          return { ...f, status: 'complete' };
        })
      );

      // Step 5: Set overall analysis
      setOverallAnalysis({
        riskScore: data.overall.riskScore,
        summary: data.overall.summary,
        redFlags: data.overall.redFlags,
        obligations: data.overall.obligations,
        recommendations: data.overall.recommendations,
      });

      setAnalysisProgress(100);

      toast({
        title: 'Analysis Complete',
        description: `Due diligence analysis completed for ${documentsWithContent.length} documents.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An error occurred during analysis.',
        variant: 'destructive',
      });
      
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'analyzing' ? { ...f, status: 'error', error: 'Analysis failed' } : f
        )
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-destructive';
    if (score >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return { label: 'High Risk', variant: 'destructive' as const };
    if (score >= 50) return { label: 'Medium Risk', variant: 'secondary' as const };
    return { label: 'Low Risk', variant: 'outline' as const };
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">Lexlytic</span>
            </Link>
          </div>
          {overallAnalysis && (
            <ExportButton
              data={{
                title: 'Due Diligence Report',
                date: new Date().toLocaleDateString(),
                riskScore: overallAnalysis.riskScore,
                summary: overallAnalysis.summary,
                redFlags: overallAnalysis.redFlags,
                obligations: overallAnalysis.obligations,
                mitigationSuggestions: overallAnalysis.recommendations,
                content: files
                  .filter(f => f.status === 'complete')
                  .map((f) => ({
                    section: f.name,
                    items: [
                      `Risk Score: ${f.riskScore}/100`,
                      `Type: ${f.documentType || 'Unknown'}`,
                      `Jurisdiction: ${f.jurisdiction || 'Not specified'}`,
                      ...(f.summary ? [`Summary: ${f.summary}`] : []),
                      ...(f.redFlags.length > 0 ? [`Red Flags: ${f.redFlags.join(', ')}`] : []),
                    ],
                  })),
              }}
            />
          )}
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Due Diligence Analysis</h1>
            <p className="text-muted-foreground">
              Upload legal documents for AI-powered risk assessment, compliance review, and red flag detection
            </p>
          </div>

          {/* Upload Section */}
          <Card className="border-2 border-dashed border-accent/30 hover:border-accent/50 transition-colors">
            <CardContent className="py-8">
              <div className="text-center">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="bulk-upload"
                  disabled={isAnalyzing}
                />
                <label htmlFor="bulk-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Upload Documents for Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to select files (PDF, Word, Text)
                  </p>
                  <Button variant="outline" disabled={isAnalyzing}>Select Files</Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-4 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span className="font-medium">Analyzing documents...</span>
                  <span className="text-muted-foreground">{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Uploaded Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documents ({files.length})</CardTitle>
                  <CardDescription>Documents for due diligence analysis</CardDescription>
                </div>
                <Button onClick={runAnalysis} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scale className="h-4 w-4 mr-2" />
                      Run Due Diligence Analysis
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-5 w-5 text-accent mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {file.status === 'pending' && (
                              <Badge variant="outline">Pending</Badge>
                            )}
                            {file.status === 'extracting' && (
                              <Badge className="bg-blue-500">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Extracting
                              </Badge>
                            )}
                            {file.status === 'analyzing' && (
                              <Badge className="bg-yellow-500">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Analyzing
                              </Badge>
                            )}
                            {file.status === 'complete' && (
                              <>
                                <Badge className="bg-green-500">Complete</Badge>
                                {file.riskScore !== undefined && (
                                  <Badge variant={getScoreBadge(file.riskScore).variant}>
                                    {getScoreBadge(file.riskScore).label}
                                  </Badge>
                                )}
                                {file.documentType && (
                                  <Badge variant="outline">{file.documentType}</Badge>
                                )}
                              </>
                            )}
                            {file.status === 'error' && (
                              <Badge variant="destructive">Error</Badge>
                            )}
                          </div>
                          {file.status === 'complete' && file.summary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {file.summary}
                            </p>
                          )}
                          {file.error && (
                            <p className="text-sm text-destructive mt-2">{file.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {file.riskScore !== undefined && (
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${getScoreColor(file.riskScore)}`}>
                              {file.riskScore}
                            </span>
                            <p className="text-xs text-muted-foreground">Risk Score</p>
                          </div>
                        )}
                        {!isAnalyzing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {overallAnalysis && (
            <>
              {/* Summary Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(overallAnalysis.riskScore)}`}>
                      {overallAnalysis.riskScore}
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Risk Score</p>
                    <Progress
                      value={overallAnalysis.riskScore}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-foreground">
                      {files.filter(f => f.status === 'complete').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Documents Analyzed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-destructive">
                      {overallAnalysis.redFlags.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Red Flags Identified</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-green-500">
                      {overallAnalysis.recommendations.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Recommendations</p>
                  </CardContent>
                </Card>
              </div>

              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {overallAnalysis.summary}
                  </p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Red Flags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Red Flags ({overallAnalysis.redFlags.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overallAnalysis.redFlags.length > 0 ? (
                      <ul className="space-y-2">
                        {overallAnalysis.redFlags.map((flag, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg"
                          >
                            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-4">
                        <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No red flags identified</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      Recommendations ({overallAnalysis.recommendations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {overallAnalysis.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Key Obligations */}
              {overallAnalysis.obligations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5 text-accent" />
                      Key Legal Obligations ({overallAnalysis.obligations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {overallAnalysis.obligations.map((obligation, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                        >
                          <ListChecks className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{obligation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Individual Document Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Document-by-Document Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files
                      .filter(f => f.status === 'complete')
                      .map((file) => (
                        <div key={file.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground">{file.name}</h4>
                              <div className="flex gap-2 mt-1">
                                {file.documentType && (
                                  <Badge variant="outline">{file.documentType}</Badge>
                                )}
                                {file.jurisdiction && (
                                  <Badge variant="secondary">{file.jurisdiction}</Badge>
                                )}
                              </div>
                            </div>
                            {file.riskScore !== undefined && (
                              <div className="text-right">
                                <span className={`text-xl font-bold ${getScoreColor(file.riskScore)}`}>
                                  {file.riskScore}/100
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {file.summary && (
                            <p className="text-sm text-muted-foreground mb-3">{file.summary}</p>
                          )}

                          {file.redFlags.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-destructive mb-1">Red Flags:</p>
                              <div className="flex flex-wrap gap-1">
                                {file.redFlags.map((flag, i) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {file.keyTerms && file.keyTerms.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Key Terms:</p>
                              <div className="flex flex-wrap gap-1">
                                {file.keyTerms.map((term, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {term}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DueDiligence;
