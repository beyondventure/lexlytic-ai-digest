import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ExportButton } from '@/components/ExportButton';
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  Scale,
  Globe,
  TrendingUp,
} from 'lucide-react';

interface UploadedDoc {
  id: string;
  name: string;
  status: 'pending' | 'analyzing' | 'complete';
  riskScore?: number;
  redFlags: string[];
}

const DueDiligence = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<UploadedDoc[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallAnalysis, setOverallAnalysis] = useState<{
    overallRisk: number;
    summary: string;
    recommendations: string[];
    redFlags: string[];
  } | null>(null);

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
      status: 'pending' as const,
      redFlags: [],
    }));

    setFiles([...files, ...newDocs]);
    toast({
      title: `${newDocs.length} document${newDocs.length > 1 ? 's' : ''} added`,
      description: 'Click "Run Due Diligence Analysis" to begin.',
    });
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

    // Simulate analysis for each document
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'analyzing' } : f
        )
      );

      await new Promise((r) => setTimeout(r, 1500));

      const riskScore = Math.floor(Math.random() * 60) + 20;
      const redFlags = riskScore >= 60
        ? ['Incomplete compliance provisions', 'Missing penalty clauses']
        : riskScore >= 40
        ? ['Minor documentation gaps']
        : [];

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'complete', riskScore, redFlags } : f
        )
      );
    }

    // Generate overall analysis
    const avgRisk = Math.round(
      files.reduce((acc, f) => acc + (f.riskScore || 50), 0) / files.length
    );

    setOverallAnalysis({
      overallRisk: avgRisk,
      summary: `Analysis of ${files.length} document${files.length > 1 ? 's' : ''} reveals ${avgRisk >= 60 ? 'significant' : avgRisk >= 40 ? 'moderate' : 'minimal'} compliance risks. Key areas of concern include regulatory alignment, documentation completeness, and penalty provisions.`,
      recommendations: [
        'Review and update KYC/AML procedures to align with latest CBN circulars',
        'Ensure all documents include proper penalty and enforcement provisions',
        'Conduct quarterly compliance reviews with legal counsel',
        'Implement automated regulatory monitoring for real-time updates',
      ],
      redFlags: files.flatMap((f) => f.redFlags).filter((v, i, a) => a.indexOf(v) === i),
    });

    setIsAnalyzing(false);
    toast({
      title: 'Analysis Complete',
      description: `Due diligence analysis completed for ${files.length} documents.`,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-destructive';
    if (score >= 50) return 'text-warning';
    return 'text-success';
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
                riskScore: overallAnalysis.overallRisk,
                summary: overallAnalysis.summary,
                redFlags: overallAnalysis.redFlags,
                mitigationSuggestions: overallAnalysis.recommendations,
                content: files.map((f) => ({
                  section: f.name,
                  items: f.redFlags.length > 0 ? f.redFlags : ['No issues identified'],
                })),
              }}
            />
          )}
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Due Diligence Analysis</h1>
            <p className="text-muted-foreground">
              Upload multiple documents for comprehensive legal risk assessment and compliance review
            </p>
          </div>

          {/* Upload Section */}
          <Card className="border-2 border-dashed border-accent/30">
            <CardContent className="py-8">
              <div className="text-center">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="bulk-upload"
                />
                <label htmlFor="bulk-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Upload Documents for Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to select multiple files (PDF, Word, Text)
                  </p>
                  <Button variant="outline">Select Files</Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Uploaded Documents ({files.length})</CardTitle>
                  <CardDescription>Documents queued for due diligence analysis</CardDescription>
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
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <div className="flex items-center gap-2">
                            {file.status === 'pending' && (
                              <Badge variant="outline">Pending</Badge>
                            )}
                            {file.status === 'analyzing' && (
                              <Badge className="bg-warning">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Analyzing
                              </Badge>
                            )}
                            {file.status === 'complete' && (
                              <Badge className="bg-success">Complete</Badge>
                            )}
                            {file.redFlags.length > 0 && (
                              <Badge variant="destructive">
                                {file.redFlags.length} issue{file.redFlags.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {file.riskScore !== undefined && (
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${getScoreColor(file.riskScore)}`}>
                            {file.riskScore}
                          </span>
                          <p className="text-xs text-muted-foreground">Risk Score</p>
                        </div>
                      )}
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
                    <div className={`text-4xl font-bold ${getScoreColor(overallAnalysis.overallRisk)}`}>
                      {overallAnalysis.overallRisk}
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Risk Score</p>
                    <Progress
                      value={overallAnalysis.overallRisk}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-foreground">{files.length}</div>
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
                    <div className="text-4xl font-bold text-success">
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
                      Red Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overallAnalysis.redFlags.length > 0 ? (
                      <ul className="space-y-2">
                        {overallAnalysis.redFlags.map((flag, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg"
                          >
                            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-4">
                        <Shield className="h-8 w-8 text-success mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No red flags identified</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {overallAnalysis.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 p-2 bg-success/10 rounded-lg"
                        >
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DueDiligence;
