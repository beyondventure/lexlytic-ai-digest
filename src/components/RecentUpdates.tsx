import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

const updates = [
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Recent Regulatory Updates</h2>
        <Button variant="link" className="text-accent hover:text-accent/80">
          View all updates <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {updates.map((update, index) => (
          <Card
            key={index}
            className="p-5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent cursor-pointer group"
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
              >
                View details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
