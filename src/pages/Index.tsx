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
  Sparkles,
  Building2,
  Scale,
  Briefcase,
  BookOpen,
  Search,
  Zap,
  TrendingUp,
  Lock,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Legal Intelligence Engine",
    description: "Upload legislation, get AI-powered summaries with auto-tagging of obligations, penalties, and entities.",
    href: "/cbn-portal"
  },
  {
    icon: Globe,
    title: "Multijurisdictional Analysis",
    description: "Compare laws across regions with side-by-side matrices and track amendments over time.",
    href: "/comparison"
  },
  {
    icon: Bell,
    title: "Regulatory Alerts",
    description: "Real-time notifications on regulatory changes with customizable jurisdiction and sector filters.",
    href: "/alerts"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Shared workspaces with real-time annotations, comments, and document version control.",
    href: "/workspaces"
  },
  {
    icon: Languages,
    title: "Multilingual Engine",
    description: "Legal-specialized translation across 20+ languages preserving terminology and meaning.",
    href: "/translate"
  },
  {
    icon: FileCheck,
    title: "Compliance Automation",
    description: "Auto-generate compliance reports, extract obligations, and perform gap analysis.",
    href: "/compliance"
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Quantitative risk scoring, dashboards, and AI-powered mitigation suggestions.",
    href: "/risk"
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track regulatory trends, monitor compliance status, and generate executive reports.",
    href: "/analytics"
  }
];

const personas = [
  {
    icon: Scale,
    title: "Legal Researchers",
    description: "Reduce research time by 70% with AI-powered document analysis"
  },
  {
    icon: Building2,
    title: "Compliance Managers",
    description: "Monitor 200+ regulations across multiple markets effortlessly"
  },
  {
    icon: Briefcase,
    title: "In-House Counsel",
    description: "Proactive risk identification with team collaboration tools"
  },
  {
    icon: Shield,
    title: "Risk Officers",
    description: "Real-time risk dashboards with quantified regulatory exposure"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center animate-pulse-glow">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-foreground">Lexlytic</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/cbn-portal" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              CBN Portal
            </Link>
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-gradient" />
        
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large floating cards */}
          <div className="absolute top-20 left-[5%] w-64 h-40 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg animate-float p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm font-medium text-foreground">Document Analysis</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full w-full" />
              <div className="h-2 bg-muted rounded-full w-3/4" />
              <div className="h-2 bg-accent/30 rounded-full w-1/2" />
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-accent">
              <CheckCircle2 className="w-3 h-3" />
              <span>95% Accuracy</span>
            </div>
          </div>

          <div className="absolute top-40 right-[8%] w-56 h-48 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg animate-float-delayed p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Global Coverage</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['NG', 'GH', 'KE', 'ZA', 'EG', 'MA'].map((code) => (
                <div key={code} className="h-6 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground font-medium">
                  {code}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">100+ jurisdictions</div>
          </div>

          <div className="absolute bottom-32 left-[10%] w-52 h-36 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg animate-float-slow p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-xs font-medium text-foreground">Compliance Score</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">94%</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+12% this month</span>
            </div>
          </div>

          <div className="absolute bottom-24 right-[15%] w-48 h-32 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg animate-float p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-accent" />
              </div>
              <span className="text-xs font-medium text-foreground">Real-time Alerts</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">New CBN circular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-xs text-muted-foreground">Amendment pending</span>
              </div>
            </div>
          </div>

          {/* Orbiting icons */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] hidden lg:block">
            <div className="absolute inset-0 animate-orbit">
              <div className="w-12 h-12 bg-card rounded-xl shadow-lg flex items-center justify-center border border-border">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="absolute inset-0 animate-orbit-reverse">
              <div className="w-10 h-10 bg-card rounded-xl shadow-lg flex items-center justify-center border border-border">
                <Search className="w-5 h-5 text-accent" />
              </div>
            </div>
          </div>

          {/* Decorative blobs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="animate-slide-up inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6 border border-accent/20">
            <Sparkles className="w-4 h-4" />
            AI-Powered Regulatory Intelligence
          </div>
          <h1 className="animate-slide-up-delayed text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Navigate Complex Regulations with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary animate-gradient">
              Unprecedented Speed
            </span>
          </h1>
          <p className="animate-slide-up-delayed-2 text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform how your organization understands, tracks, and complies with legislation across jurisdictions. 
            Real-time intelligence, automated workflows, and cross-border analysis, all in one platform.
          </p>
          <div className="animate-slide-up-delayed-2 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Link to="/cbn-portal">
                Explore CBN Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="hover:scale-105 transition-all">
              <Link to="/demo">Request Demo</Link>
            </Button>
          </div>
          
          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-muted-foreground animate-slide-up-delayed-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              <span className="text-sm">Bank-grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-sm">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">95%</div>
              <div className="text-sm text-muted-foreground">Summarization Accuracy</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">&lt;5s</div>
              <div className="text-sm text-muted-foreground">Query Response Time</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">100+</div>
              <div className="text-sm text-muted-foreground">Jurisdictions Covered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">20+</div>
              <div className="text-sm text-muted-foreground">Languages Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Regulatory Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay compliant, from document analysis to risk management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 border-border hover:border-accent/30">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Legal Professionals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're a solo practitioner or part of a multinational team, Lexlytic adapts to your workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona) => (
              <Card key={persona.title} className="text-center border-border">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <persona.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{persona.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{persona.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Compliance Workflow?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of legal professionals who trust Lexlytic for regulatory intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-primary">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link to="/cbn-portal" className="hover:text-primary">CBN Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/docs" className="hover:text-primary">Documentation</Link></li>
                <li><Link to="/api" className="hover:text-primary">API</Link></li>
                <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary">About</Link></li>
                <li><Link to="/careers" className="hover:text-primary">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-primary">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-primary">Terms</Link></li>
                <li><Link to="/security" className="hover:text-primary">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">L</span>
              </div>
              <span className="font-semibold text-foreground">Lexlytic</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Lexlytic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
