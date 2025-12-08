import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { useRecentDocuments } from "@/hooks/useDocuments";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const fallbackUpdates = [
  {
    title: "Consumer Credit Guidelines 2025",
    status: "new",
    effectiveDate: "1 July 2025",
    summary:
      "New framework establishing minimum standards for consumer lending. Includes affordability assessments and responsible lending obligations.",
    category: "Consumer Protection",
  },
  {
    title: "Digital Lending Platform Requirements",
    status: "updated",
    effectiveDate: "15 May 2025",
    summary:
      "Updated compliance requirements for digital lending platforms. Enhanced due diligence and reporting obligations.",
    category: "Digital Lending",
  },
  {
    title: "FX Transaction Reporting Framework",
    status: "new",
    effectiveDate: "1 April 2025",
    summary:
      "Revised foreign exchange reporting requirements. New thresholds and reporting formats for cross-border transactions.",
    category: "FX",
  },
  {
    title: "PSP KYC Enhancement Directive",
    status: "updated",
    effectiveDate: "30 June 2025",
    summary:
      "Enhanced Know Your Customer standards for Payment Service Providers. Biometric verification and ongoing monitoring requirements.",
    category: "Fintech",
  },
];

export const RecentUpdates = () => {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useRecentDocuments(5);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Recent Regulatory Updates</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Use database documents if available, otherwise fallback to static data
  const displayData = documents && documents.length > 0 ? documents : null;

  const handleViewDetails = (pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Recent Regulatory Updates</h2>
        <Button 
          variant="link" 
          className="text-accent hover:text-accent/80"
          onClick={() => navigate('/rulebook')}
        >
          View all updates <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {!displayData && (
        <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg text-sm text-info">
          📌 Showing sample data. Click "Sync Now" above to fetch real CBN documents.
        </div>
      )}

      <div className="grid gap-4">
        {displayData ? (
          // Display database documents
          documents!.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent cursor-pointer group"
              onClick={() => handleViewDetails(doc.pdf_url)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      {doc.title}
                    </h3>
                    <Badge
                      variant="default"
                      className="bg-success text-white"
                    >
                      {doc.status === 'active' ? 'Active' : 'Updated'}
                    </Badge>
                    {doc.category && doc.category.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {doc.category[0]}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doc.summary?.substring(0, 180)}...
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {doc.issue_date ? formatDistanceToNow(new Date(doc.issue_date), { addSuffix: true }) : 'Recently added'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-accent hover:text-accent-foreground hover:border-accent gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(doc.pdf_url);
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/rulebook');
                    }}
                  >
                    Open in Rulebook
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          // Display fallback data
          fallbackUpdates.map((update, index) => (
            <Card
              key={index}
              className="p-5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent cursor-pointer group"
              onClick={() => navigate('/rulebook')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      {update.title}
                    </h3>
                    <Badge
                      variant={update.status === "new" ? "default" : "secondary"}
                      className={
                        update.status === "new"
                          ? "bg-success text-white"
                          : "bg-info/10 text-info"
                      }
                    >
                      {update.status === "new" ? "New" : "Updated"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {update.category}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {update.summary}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-medium">Effective: {update.effectiveDate}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground hover:border-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/rulebook');
                  }}
                >
                  View in Rulebook
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
