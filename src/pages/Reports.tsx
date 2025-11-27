import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Calendar } from "lucide-react";

const Reports = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Placeholder data - will be replaced with real data later
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation onChatOpen={() => setIsChatOpen(true)} />
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary">Compliance Reports</h1>
            <p className="text-muted-foreground text-lg">
              Generate and access compliance reports and analytics
            </p>
          </div>

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
                  <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-bold text-success">98%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Generated</p>
                  <p className="text-2xl font-bold text-foreground">Today</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Available Reports</h2>
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
