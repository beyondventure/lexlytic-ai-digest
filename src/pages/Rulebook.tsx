import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, FileText } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const Rulebook = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: documents, isLoading } = useDocuments({ search: searchQuery });

  return (
    <div className="min-h-screen bg-background">
      <Navigation onChatOpen={() => setIsChatOpen(true)} />
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary">CBN Rulebook</h1>
            <p className="text-muted-foreground text-lg">
              Browse all regulatory documents, circulars, and guidelines from the Central Bank of Nigeria
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))
            ) : documents && documents.length > 0 ? (
              documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent cursor-pointer group"
                  onClick={() => doc.pdf_url && window.open(doc.pdf_url, '_blank')}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <FileText className="h-5 w-5 text-accent" />
                          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                            {doc.title}
                          </h3>
                        </div>
                        {doc.reference_number && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Reference: {doc.reference_number}
                          </p>
                        )}
                        {doc.summary && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {doc.summary.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {doc.category && doc.category.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.category.slice(0, 2).map((cat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Badge variant="default" className="bg-success text-white">
                          {doc.document_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search terms" : "Click 'Sync Now' on the home page to fetch documents"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rulebook;
