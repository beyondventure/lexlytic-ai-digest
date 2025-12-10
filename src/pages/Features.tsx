import { Link } from "react-router-dom";
import { 
  FileText, 
  Globe, 
  Bell, 
  Users, 
  Languages, 
  FileCheck, 
  Shield, 
  BarChart3,
  ArrowRight,
  Check,
  Zap,
  Lock,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Document Upload & Summarization",
    description: "Upload legislation in PDF, DOCX, or TXT formats. Our AI provides plain-language summaries with automatic extraction of obligations, penalties, and key definitions.",
    capabilities: [
      "Support for 100MB files processed in 60 seconds",
      "URL import for online legislation",
      "95% accuracy validated by legal experts",
      "Auto-tagging with 10+ categories"
    ]
  },
  {
    icon: Globe,
    title: "Multijurisdictional Analysis",
    description: "Compare similar laws across 2-10 jurisdictions with our intelligent matrix view. Track amendments and version changes over time.",
    capabilities: [
      "Side-by-side comparison matrix",
      "Pre-built comparison templates",
      "AI-generated difference highlights",
      "Export to DOCX/PDF"
    ]
  },
  {
    icon: Bell,
    title: "Real-Time Regulatory Alerts",
    description: "Never miss a regulatory change. Get instant notifications filtered by jurisdiction, sector, and custom keywords.",
    capabilities: [
      "Delivery within 15 minutes of detection",
      "100+ jurisdictions covered",
      "High/Medium/Low severity classification",
      "Weekly/Monthly digest options"
    ]
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together in shared workspaces with real-time annotations, document version control, and activity tracking.",
    capabilities: [
      "Unlimited team members",
      "Real-time commenting",
      "@mention notifications",
      "Full audit trail"
    ]
  },
  {
    icon: Languages,
    title: "Multilingual Engine",
    description: "Break language barriers with legal-specialized translation across 20+ languages, preserving technical terminology.",
    capabilities: [
      "20+ languages supported",
      "Legal terminology preservation",
      "Side-by-side bilingual view",
      "Multilingual summaries"
    ]
  },
  {
    icon: FileCheck,
    title: "Compliance Automation",
    description: "Auto-generate compliance reports, extract obligations, and identify gaps between requirements and your current practices.",
    capabilities: [
      "10+ pre-built templates",
      "Obligation extraction",
      "Gap analysis reports",
      "Custom template builder"
    ]
  },
  {
    icon: Shield,
    title: "Risk Management Suite",
    description: "Quantify regulatory risk with AI-powered scoring. Visualize exposure across jurisdictions and business units.",
    capabilities: [
      "Risk scores (1-100)",
      "Interactive risk heatmaps",
      "Business unit mapping",
      "AI mitigation suggestions"
    ]
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Track compliance trends, monitor team productivity, and generate executive-level reports with one click.",
    capabilities: [
      "Real-time dashboards",
      "Custom report builder",
      "Trend analysis",
      "Executive summaries"
    ]
  }
];

const stats = [
  { icon: Zap, label: "Query Response", value: "<5s" },
  { icon: Check, label: "Summarization Accuracy", value: "95%" },
  { icon: Clock, label: "Alert Delivery", value: "<15min" },
  { icon: Lock, label: "Uptime SLA", value: "99.9%" },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-foreground">Lexlytic</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/cbn-portal" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              CBN Portal
            </Link>
            <Link to="/features" className="text-sm font-medium text-accent transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Every Feature You Need for{" "}
            <span className="text-accent">Regulatory Excellence</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            From document analysis to risk management, Lexlytic provides a complete suite of tools 
            designed specifically for legal and compliance professionals.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-accent" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className={`overflow-hidden ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                <div className="md:flex">
                  <div className={`md:w-1/2 p-8 ${index % 2 === 0 ? '' : 'md:order-2'}`}>
                    <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                      <feature.icon className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.capabilities.map((cap) => (
                        <li key={cap} className="flex items-center gap-3 text-sm">
                          <Check className="w-5 h-5 text-accent flex-shrink-0" />
                          <span className="text-foreground">{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`md:w-1/2 bg-gradient-to-br from-secondary to-muted p-8 flex items-center justify-center ${index % 2 === 0 ? '' : 'md:order-1'}`}>
                    <div className="w-full max-w-sm aspect-video bg-card rounded-lg shadow-lg border border-border flex items-center justify-center">
                      <feature.icon className="w-16 h-16 text-accent/30" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Compliance Workflow?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of legal professionals who trust Lexlytic for regulatory intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-card">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">L</span>
            </div>
            <span className="font-semibold text-foreground">Lexlytic</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Lexlytic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
