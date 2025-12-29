import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Globe, 
  FileText,
  Scale,
  Filter,
  BookOpen,
  Gavel,
  Scroll,
  Download
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AfricanLawResource {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  source_site: string;
  resource_type: string | null;
  jurisdiction: string | null;
  category: string | null;
  crawled_at: string;
  storage_path: string | null;
}

const Resources = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [downloadableFilter, setDownloadableFilter] = useState<string>("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Fetch all resources
  const { data: resources, isLoading, refetch } = useQuery({
    queryKey: ["african_law_resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("african_law_resources")
        .select("*")
        .order("crawled_at", { ascending: false });
      if (error) throw error;
      return data as AfricanLawResource[];
    },
  });

  // Crawl mutation
  const crawlMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('crawl-african-law', {
        body: { downloadAllPdfs: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Crawl complete! Found ${data.totalResources || 0} resources, ${data.pdfsStored || 0} PDFs stored.`);
      queryClient.invalidateQueries({ queryKey: ["african_law_resources"] });
    },
    onError: (error) => {
      toast.error(`Crawl failed: ${error.message}`);
    },
  });

  // Get unique values for filters
  const jurisdictions = [...new Set(resources?.map(r => r.jurisdiction).filter(Boolean) || [])].sort();
  const categories = [...new Set(resources?.map(r => r.category).filter(Boolean) || [])].sort();
  const sources = [...new Set(resources?.map(r => r.source_site).filter(Boolean) || [])].sort();

  // Filter resources
  const filteredResources = resources?.filter(r => {
    const matchesSearch = !searchQuery || 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.jurisdiction?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJurisdiction = jurisdictionFilter === "all" || r.jurisdiction === jurisdictionFilter;
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
    const matchesSource = sourceFilter === "all" || r.source_site === sourceFilter;
    const matchesDownloadable = downloadableFilter === "all" || 
      (downloadableFilter === "downloadable" && r.storage_path) ||
      (downloadableFilter === "external" && !r.storage_path);
    
    return matchesSearch && matchesJurisdiction && matchesCategory && matchesSource && matchesDownloadable;
  }) || [];

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'Constitution': return <Scroll className="h-4 w-4" />;
      case 'Case Law': return <Gavel className="h-4 w-4" />;
      case 'Legislation': return <BookOpen className="h-4 w-4" />;
      case 'Treaties': return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    if (source === 'Open Law Africa') return 'bg-accent/10 text-accent border-accent/20';
    if (source === 'African LII') return 'bg-primary/10 text-primary border-primary/20';
    return 'bg-secondary text-secondary-foreground';
  };

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
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/documents" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Documents</Link>
            <Link to="/resources" className="text-sm font-medium text-accent">Resources</Link>
            <Link to="/cbn-copilot" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">CBN Co-pilot</Link>
          </div>

          <Button 
            onClick={() => crawlMutation.mutate()}
            disabled={crawlMutation.isPending}
            className="bg-accent hover:bg-accent/90"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${crawlMutation.isPending ? 'animate-spin' : ''}`} />
            {crawlMutation.isPending ? 'Crawling...' : 'Refresh Data'}
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">African Law Resources</h1>
          <p className="text-muted-foreground">
            Comprehensive collection of African legal documents from various reputable sources
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{resources?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Resources</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{jurisdictions.length}</div>
                  <div className="text-sm text-muted-foreground">Jurisdictions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-info" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{categories.length}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources by title, URL, or jurisdiction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {jurisdictions.map(j => (
                    <SelectItem key={j} value={j!}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map(s => (
                    <SelectItem key={s} value={s!}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={downloadableFilter} onValueChange={setDownloadableFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="downloadable">Downloadable Only</SelectItem>
                  <SelectItem value="external">External Links Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredResources.length} of {resources?.length || 0} resources
        </div>

        {/* Resources List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {resources?.length === 0 ? 'No resources yet' : 'No matching resources'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {resources?.length === 0 
                  ? 'Click "Refresh Data" to crawl African law resources from Open Law Africa and African LII.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {resources?.length === 0 && (
                <Button onClick={() => crawlMutation.mutate()} disabled={crawlMutation.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${crawlMutation.isPending ? 'animate-spin' : ''}`} />
                  Start Crawling
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredResources.map((resource) => {
              // Get download URL from storage if available
              const getDownloadUrl = () => {
                if (resource.storage_path) {
                  const { data } = supabase.storage
                    .from('regulatory-pdfs')
                    .getPublicUrl(resource.storage_path);
                  return data.publicUrl;
                }
                return resource.url;
              };

              const handleDownload = (e: React.MouseEvent) => {
                e.stopPropagation();
                const url = getDownloadUrl();
                if (url) {
                  window.open(url, '_blank');
                }
              };

              return (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(resource.category)}
                          <a 
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground font-medium hover:text-accent transition-colors truncate"
                          >
                            {resource.title || 'Untitled Resource'}
                          </a>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {resource.url}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getSourceColor(resource.source_site)}>
                            {resource.source_site}
                          </Badge>
                          {resource.jurisdiction && (
                            <Badge variant="secondary">
                              <Globe className="h-3 w-3 mr-1" />
                              {resource.jurisdiction}
                            </Badge>
                          )}
                          {resource.category && (
                            <Badge variant="outline">
                              {resource.category}
                            </Badge>
                          )}
                          {resource.resource_type && resource.resource_type !== 'Web Page' && (
                            <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                              {resource.resource_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {resource.storage_path ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-accent hover:bg-accent/90"
                            onClick={handleDownload}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <a 
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6">
        <div className="container mx-auto px-6">
          <p className="text-xs text-muted-foreground text-center">
            Resources are sourced from{' '}
            <a href="https://www.openlawafrica.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Open Law Africa
            </a>
            {' '}and{' '}
            <a href="https://africanlii.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              African Legal Information Institute
            </a>
            . Last updated: {resources?.[0]?.crawled_at ? new Date(resources[0].crawled_at).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Resources;
