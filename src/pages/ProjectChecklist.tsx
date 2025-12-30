import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, AlertCircle, FileText, Shield, Globe, ClipboardCheck, AlertTriangle, Brain, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface UserStory {
  id: string;
  story: string;
  status: "complete" | "partial" | "pending";
  implementation: string;
  route?: string;
}

interface Category {
  name: string;
  icon: React.ReactNode;
  description: string;
  stories: UserStory[];
}

const categories: Category[] = [
  {
    name: "Core Features",
    icon: <FileText className="h-5 w-5" />,
    description: "Essential platform functionality for document analysis and collaboration",
    stories: [
      {
        id: "core-1",
        story: "As a lawyer, I want to upload or paste legislation, so I can get a plain-language summary that's accurate and fast.",
        status: "complete",
        implementation: "DocumentUpload.tsx with PDF/Word text extraction and AI summarization via summarize-document edge function",
        route: "/documents/upload"
      },
      {
        id: "core-2",
        story: "As a business or legal professional, I want to ask the inbuilt AI chatbox any question about regulatory or legislative issues.",
        status: "complete",
        implementation: "Chat.tsx with legal-chat edge function providing AI-powered legal assistance",
        route: "/chat"
      },
      {
        id: "core-3",
        story: "As a user, I want the system to automatically tag important terms, so I can easily filter and find content across documents.",
        status: "complete",
        implementation: "Auto-tagging via AI summarization extracts key_definitions, key_obligations, key_penalties stored in legal_documents table",
        route: "/documents"
      },
      {
        id: "core-4",
        story: "As an in-house counsel, I want to compare similar laws across different jurisdictions (matrix style).",
        status: "complete",
        implementation: "Comparison.tsx with jurisdiction comparison matrix and side-by-side analysis",
        route: "/comparison"
      },
      {
        id: "core-5",
        story: "As a regulatory analyst, I want to see what sections of a law have changed over time.",
        status: "complete",
        implementation: "DocumentVersionHistory.tsx with database-backed version tracking and diff comparison",
        route: "/documents"
      },
      {
        id: "core-6",
        story: "As a legal team member, I want to invite my colleagues to a document for collaboration through comments and annotations.",
        status: "complete",
        implementation: "TeamInvite.tsx and DocumentComments.tsx with workspace collaboration features",
        route: "/documents"
      },
      {
        id: "core-7",
        story: "As legal and business professionals, I want to receive real-time regulatory alerts and implications for my business.",
        status: "complete",
        implementation: "Alerts.tsx with AlertSettings.tsx for customizable alert subscriptions",
        route: "/alerts"
      },
      {
        id: "core-8",
        story: "As a user, I want to review regulatory changes and law summaries in local or foreign languages.",
        status: "complete",
        implementation: "Translate.tsx with translate edge function for multi-language support",
        route: "/translate"
      }
    ]
  },
  {
    name: "Security and Admin Features",
    icon: <Shield className="h-5 w-5" />,
    description: "Platform security, user management, and access control",
    stories: [
      {
        id: "security-1",
        story: "As a platform admin, I want to manage users, roles, and access to ensure platform security and compliance.",
        status: "complete",
        implementation: "Admin.tsx with UserManagementTable.tsx, role-based access control via user_roles table",
        route: "/admin"
      },
      {
        id: "security-2",
        story: "As a user, I want my documents to be secure and encrypted, so I feel confident sharing sensitive legal material.",
        status: "complete",
        implementation: "Supabase RLS policies on legal_documents table with user-based access control"
      }
    ]
  },
  {
    name: "Multilingual and Cross-Jurisdictional",
    icon: <Globe className="h-5 w-5" />,
    description: "Translation and multi-jurisdiction compliance capabilities",
    stories: [
      {
        id: "multi-1",
        story: "As a non-native English-speaking legal professional, I want to read translated versions of legislation with AI-backed legal accuracy.",
        status: "complete",
        implementation: "Translate.tsx with legal-context aware translation via edge function",
        route: "/translate"
      },
      {
        id: "multi-2",
        story: "As a compliance officer, I want the system to translate legal texts while preserving legal meaning across jurisdictions.",
        status: "complete",
        implementation: "Translation engine maintains legal terminology accuracy",
        route: "/translate"
      },
      {
        id: "multi-3",
        story: "As a global legal advisor, I want to analyze compliance obligations in multiple regions for region-specific recommendations.",
        status: "complete",
        implementation: "Comparison.tsx with multi-jurisdiction analysis capabilities",
        route: "/comparison"
      }
    ]
  },
  {
    name: "Compliance & Due Diligence Automation",
    icon: <ClipboardCheck className="h-5 w-5" />,
    description: "Automated compliance reporting and due diligence analysis",
    stories: [
      {
        id: "compliance-1",
        story: "As a compliance manager, I want to automatically generate compliance reports based on uploaded laws or policies.",
        status: "complete",
        implementation: "Reports.tsx with check-compliance edge function for automated report generation",
        route: "/reports"
      },
      {
        id: "compliance-2",
        story: "As a legal due diligence analyst, I want to upload legal texts and receive a due diligence summary.",
        status: "complete",
        implementation: "DueDiligence.tsx with due-diligence edge function for comprehensive analysis",
        route: "/due-diligence"
      },
      {
        id: "compliance-3",
        story: "As a general counsel, I want Lexlytic to highlight red flags or high-risk clauses in local regulations.",
        status: "complete",
        implementation: "RedFlagHighlights.tsx component integrated with due diligence reports",
        route: "/due-diligence"
      },
      {
        id: "compliance-4",
        story: "As a user, I want to export AI-generated reports in DOCX or PDF format.",
        status: "complete",
        implementation: "ExportButton.tsx with exportUtils.ts supporting PDF and DOCX export",
        route: "/documents"
      },
      {
        id: "compliance-5",
        story: "As a regulatory advisor, I want each AI-generated insight to be backed by linked source citations.",
        status: "complete",
        implementation: "SourceCitations.tsx component displaying references for all AI outputs",
        route: "/due-diligence"
      }
    ]
  },
  {
    name: "Risk Management",
    icon: <AlertTriangle className="h-5 w-5" />,
    description: "Risk scoring, alerts, and mitigation strategies",
    stories: [
      {
        id: "risk-1",
        story: "As a compliance analyst, I want Lexlytic to assign a risk score to legal clauses or regulatory obligations.",
        status: "complete",
        implementation: "Risk.tsx with risk scoring system and legal_documents.risk_score field",
        route: "/risk"
      },
      {
        id: "risk-2",
        story: "As a risk manager, I want to receive alerts when new laws or amendments increase compliance risk.",
        status: "complete",
        implementation: "AlertSettings.tsx with severity-based alert subscriptions",
        route: "/alerts-settings"
      },
      {
        id: "risk-3",
        story: "As a corporate legal advisor, I want to map legal risks to specific business units.",
        status: "complete",
        implementation: "BusinessUnitRiskMapping.tsx with business_units and document_risk_assignments tables",
        route: "/risk"
      },
      {
        id: "risk-4",
        story: "As a general counsel, I want to view a dashboard of legal risks by severity and jurisdiction.",
        status: "complete",
        implementation: "Risk.tsx dashboard with severity filtering and jurisdiction breakdown",
        route: "/risk"
      },
      {
        id: "risk-5",
        story: "As a compliance officer, I want Lexlytic to suggest mitigation strategies based on identified legal risks.",
        status: "complete",
        implementation: "RiskMitigation.tsx component providing AI-generated mitigation recommendations",
        route: "/risk"
      }
    ]
  },
  {
    name: "Regulatory Intelligence",
    icon: <Brain className="h-5 w-5" />,
    description: "AI-powered regulatory analysis and collaboration",
    stories: [
      {
        id: "intel-1",
        story: "As a compliance officer, I want to upload regulatory documents and have AI agents analyze them.",
        status: "complete",
        implementation: "DocumentUpload.tsx with summarize-document edge function",
        route: "/documents/upload"
      },
      {
        id: "intel-2",
        story: "As a legal researcher, I want to translate legal documents into multiple languages accurately.",
        status: "complete",
        implementation: "Translate.tsx with multi-language translation support",
        route: "/translate"
      },
      {
        id: "intel-3",
        story: "As a compliance manager, I want the system to generate comprehensive compliance reports.",
        status: "complete",
        implementation: "Reports.tsx with automated compliance report generation",
        route: "/reports"
      },
      {
        id: "intel-4",
        story: "As a legal advisor, I want to receive real-time updates on regulatory changes.",
        status: "complete",
        implementation: "Alerts.tsx with RegulatoryAlertsPanel.tsx for real-time updates",
        route: "/alerts"
      },
      {
        id: "intel-5",
        story: "As a risk analyst, I want the platform to assign risk scores to compliance issues.",
        status: "complete",
        implementation: "Risk scoring integrated across platform with visual indicators",
        route: "/risk"
      },
      {
        id: "intel-6",
        story: "As a compliance team member, I want to collaborate with colleagues, sharing insights and annotations.",
        status: "complete",
        implementation: "Workspace collaboration with DocumentComments.tsx and TeamInvite.tsx"
      },
      {
        id: "intel-7",
        story: "As a policy manager, I want to integrate internal policies with external regulations to identify gaps.",
        status: "complete",
        implementation: "PolicyIntegration.tsx with internal_policies and policy_regulation_mappings tables",
        route: "/comparison"
      },
      {
        id: "intel-8",
        story: "As an international operations manager, I want jurisdiction-specific compliance guidance.",
        status: "complete",
        implementation: "Multi-jurisdiction support across Comparison, Alerts, and Documents",
        route: "/comparison"
      }
    ]
  }
];

const ProjectChecklist = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map(c => c.name));

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const allStories = categories.flatMap(c => c.stories);
  const completedCount = allStories.filter(s => s.status === "complete").length;
  const partialCount = allStories.filter(s => s.status === "partial").length;
  const pendingCount = allStories.filter(s => s.status === "pending").length;
  const totalCount = allStories.length;
  const progressPercentage = Math.round(((completedCount + partialCount * 0.5) / totalCount) * 100);

  const getStatusIcon = (status: UserStory["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "pending":
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: UserStory["status"]) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Complete</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Partial</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 print:static">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="print:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Lexlytic Project Status</h1>
                <p className="text-muted-foreground">User Stories Implementation Checklist</p>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-3xl font-bold text-foreground">{progressPercentage}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Progress value={progressPercentage} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">of {totalCount} user stories</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Partial</p>
                  <p className="text-3xl font-bold text-yellow-600">{partialCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">needs additional work</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-muted-foreground">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Circle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">not yet started</p>
            </CardContent>
          </Card>
        </div>

        {/* Excluded Note */}
        <Card className="mb-8 border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Note: OathAdmin/Notary Toolkit Excluded</p>
                <p className="text-sm text-muted-foreground mt-1">
                  As per project requirements, the OathAdmin/Notary Toolkit features (digital oath administration, 
                  notary public directory, and legal oath session scheduling) are excluded from this implementation phase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category.name}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {category.stories.filter(s => s.status === "complete").length} / {category.stories.length}
                      </p>
                      <p className="text-xs text-muted-foreground">completed</p>
                    </div>
                    <Badge variant="outline">
                      {Math.round((category.stories.filter(s => s.status === "complete").length / category.stories.length) * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedCategories.includes(category.name) && (
                <CardContent>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {category.stories.map((story) => (
                      <div 
                        key={story.id} 
                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="mt-0.5">
                          {getStatusIcon(story.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="text-sm text-foreground leading-relaxed">
                              {story.story}
                            </p>
                            {getStatusBadge(story.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium">Implementation:</span> {story.implementation}
                          </p>
                          {story.route && (
                            <Link 
                              to={story.route} 
                              className="inline-flex items-center text-xs text-primary hover:underline print:hidden"
                            >
                              View Feature →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Footer Summary */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Project Summary</h3>
              <p className="text-muted-foreground mb-4">
                Lexlytic has implemented <span className="font-medium text-green-600">{completedCount}</span> of {totalCount} user stories ({progressPercentage}% complete), 
                with <span className="font-medium text-yellow-600">{partialCount}</span> features partially implemented 
                and <span className="font-medium">{pendingCount}</span> pending development.
              </p>
              <p className="text-sm text-muted-foreground">
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProjectChecklist;
