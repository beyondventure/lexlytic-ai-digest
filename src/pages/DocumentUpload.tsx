import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Loader2,
  Globe,
  FileUp,
  X
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const jurisdictions = [
  "Nigeria", "United States", "United Kingdom", "European Union", "Singapore",
  "Hong Kong", "South Africa", "Kenya", "Ghana", "Canada", "Australia", "India"
];

const documentTypes = [
  "Legislation", "Regulation", "Circular", "Guideline", "Policy", "Contract", "Other"
];

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    jurisdiction: "",
    documentType: "",
  });

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/html'
      ];

      if (!allowedTypes.includes(file.type) && 
          !file.name.endsWith('.txt') && 
          !file.name.endsWith('.md') &&
          !file.name.endsWith('.html')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word, HTML, or text document",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 100MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, "") });
      }
    }
  };

  const handleUpload = async () => {
    if (!user) return;
    if (!selectedFile && !urlInput) {
      toast({
        title: "No content",
        description: "Please select a file or enter a URL",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title) {
      toast({
        title: "Title required",
        description: "Please enter a document title",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create document record
      const { data: doc, error: docError } = await supabase
        .from("legal_documents")
        .insert({
          uploaded_by: user.id,
          title: formData.title,
          file_name: selectedFile?.name || null,
          file_type: selectedFile?.type || 'url',
          file_size: selectedFile?.size || null,
          jurisdiction: formData.jurisdiction || null,
          document_type: formData.documentType || null,
          status: 'processing',
        })
        .select()
        .single();

      if (docError) throw docError;

      // If file selected, upload to storage
      if (selectedFile) {
        const filePath = `${user.id}/${doc.id}/${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('compliance-docs')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Update status to failed
          await supabase
            .from("legal_documents")
            .update({ status: 'failed' })
            .eq('id', doc.id);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('compliance-docs')
          .getPublicUrl(filePath);

        await supabase
          .from("legal_documents")
          .update({ file_url: urlData.publicUrl })
          .eq('id', doc.id);
      }

      // TODO: Trigger AI summarization via edge function

      toast({
        title: "Document uploaded",
        description: "Your document is being processed. You'll be notified when analysis is complete.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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

      <main className="container mx-auto px-6 pt-24 pb-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Document</h1>
          <p className="text-muted-foreground">
            Upload legislation or regulatory documents for AI-powered analysis and summarization.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Source</CardTitle>
            <CardDescription>
              Upload a file or provide a URL to online legislation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="file">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="gap-2">
                  <FileUp className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Import URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="mt-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.html"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-accent" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX, TXT, HTML up to 100MB
                      </p>
                    </label>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Legislation URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://www.example.gov/legislation/..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the URL of the legislation you want to analyze
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Data Protection Act 2023"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <Select
                    value={formData.jurisdiction}
                    onValueChange={(value) => setFormData({ ...formData, jurisdiction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map((j) => (
                        <SelectItem key={j} value={j}>{j}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={isLoading || (!selectedFile && !urlInput)}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DocumentUpload;
