import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  FileText, 
  Plus, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Globe
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Documents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

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

  const { data: documents, isLoading } = useQuery({
    queryKey: ["legal_documents", user?.id, searchQuery, filter],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from("legal_documents")
        .select("*")
        .eq("uploaded_by", user.id)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      if (filter) {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "processing":
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "processing":
        return "bg-warning/10 text-warning border-warning/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
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
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link to="/documents/upload">
              <Plus className="h-4 w-4 mr-2" />
              Upload
            </Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Documents</h1>
            <p className="text-muted-foreground">
              Manage and analyze your uploaded legal documents
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filter || "All"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter(null)}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("completed")}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("processing")}>Processing</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("failed")}>Failed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : documents && documents.length > 0 ? (
              documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-accent"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                          <h3 className="font-semibold text-foreground truncate">
                            {doc.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {doc.jurisdiction && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {doc.jurisdiction}
                            </span>
                          )}
                          <span>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {doc.summary && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {doc.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {getStatusIcon(doc.status)}
                          <span className="ml-1 capitalize">{doc.status}</span>
                        </Badge>
                        {doc.risk_score && (
                          <Badge variant="outline" className={
                            doc.risk_score >= 70 ? 'text-destructive' :
                            doc.risk_score >= 40 ? 'text-warning' :
                            'text-success'
                          }>
                            Risk: {doc.risk_score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Upload your first document to get started"}
                </p>
                <Button asChild>
                  <Link to="/documents/upload">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documents;
