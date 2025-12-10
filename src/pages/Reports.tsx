import { CBNNavigation } from "@/components/CBNNavigation";
import { useState } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Calendar, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2,
  FileUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const COMPLIANCE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-compliance`;

const Reports = () => {
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
    complianceScore: number | null;
    documentName: string;
    analyzedAt: string;
  } | null>(null);

  const reports = [
    {
      id: 1,
      title: "Monthly Compliance Summary",
      description: "Overview of regulatory changes and compliance status for the past month",
      date: "March 2025",
      type: "Monthly",
    },
    {
      id: 2,
      title: "Quarterly Risk Assessment",
      description: "Comprehensive analysis of regulatory risks and compliance gaps",
      date: "Q1 2025",
      type: "Quarterly",
    },
    {
      id: 3,
      title: "Annual Regulatory Review",
      description: "Year-end summary of all regulatory updates and their impact",
      date: "2024",
      type: "Annual",
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word document, or text file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For text files, read directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return await file.text();
    }
    
    // For PDF and other files, we'll send a note that parsing is limited
    // In production, you'd use a proper PDF parser
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = () => {
        // For non-text files, we'll indicate the file type
        resolve(`[Document: ${file.name}]\n\nNote: This document was uploaded as a ${file.type}. For full analysis, text content was extracted where possible. If this is a scanned PDF, text extraction may be limited.\n\nFile size: ${(file.size / 1024).toFixed(2)} KB`);
      };
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const documentContent = await extractTextFromFile(selectedFile);
      
      const response = await fetch(COMPLIANCE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          documentContent,
          documentName: selectedFile.name,
          documentType: selectedFile.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze document");
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      toast({
        title: "Analysis Complete",
        description: `Compliance score: ${result.complianceScore || 'N/A'}%`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze document",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreIcon = (score: number | null) => {
    if (score === null) return null;
    if (score >= 80) return <CheckCircle2 className="h-8 w-8 text-success" />;
    if (score >= 60) return <AlertTriangle className="h-8 w-8 text-warning" />;
    return <XCircle className="h-8 w-8 text-destructive" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <CBNNavigation onChatOpen={() => setIsChatOpen(true)} />
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary">Compliance Reports</h1>
            <p className="text-muted-foreground text-lg">
              Generate compliance reports and analyze your documents against CBN regulations
            </p>
          </div>

          {/* Compliance Checker Section */}
          <Card className="p-6 border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Upload className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Compliance Checker</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload your policy documents to check compliance with CBN regulations
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        {selectedFile ? selectedFile.name : "Click to upload document"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, Word, or Text files up to 10MB
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="bg-accent hover:bg-accent/90"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          "Check Compliance"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Score Display */}
                <div className="flex items-center justify-center">
                  {analysisResult ? (
                    <div className="text-center space-y-3">
                      {getScoreIcon(analysisResult.complianceScore)}
                      <div>
                        <p className={`text-4xl font-bold ${getScoreColor(analysisResult.complianceScore)}`}>
                          {analysisResult.complianceScore !== null ? `${analysisResult.complianceScore}%` : 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">Compliance Score</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Analyzed: {new Date(analysisResult.analyzedAt).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Upload a document to see compliance score</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Detailed Analysis</h3>
                  <ScrollArea className="h-[400px] w-full rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                        {analysisResult.analysis}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Compliance Rate</p>
                  <p className="text-2xl font-bold text-success">
                    {analysisResult?.complianceScore ? `${analysisResult.complianceScore}%` : '—'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Analysis</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analysisResult ? "Today" : "—"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Report Templates</h2>
              <Button className="bg-accent hover:bg-accent/90 gap-2">
                <FileText className="h-4 w-4" />
                Generate New Report
              </Button>
            </div>

            <div className="grid gap-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-foreground">
                          {report.title}
                        </h3>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {report.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{report.date}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
