import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Building2, Crown } from "lucide-react";

const plans = [
  {
    name: "Enterprise",
    icon: Crown,
    pricePerRegion: "$1,500",
    contractValue: "$15k annually",
    revenueRequirement: "Gross revenue of $100M and above",
    features: [
      "Unlimited documents",
      "Full AI suite + customization",
      "All jurisdictions",
      "Custom alert workflows",
      "Risk management dashboard",
      "Dedicated success manager",
      "Unlimited users",
      "SSO & advanced security",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
  {
    name: "Midsize",
    icon: Building2,
    pricePerRegion: "$750",
    contractValue: "$7,500 annually",
    revenueRequirement: "Gross revenue of >$25M up to $100M",
    features: [
      "500 document uploads/month",
      "Advanced AI with citations",
      "20 jurisdictions",
      "Real-time alerts + digests",
      "Comparison matrix",
      "Priority support",
      "10 user seats",
      "Team workspaces",
      "API access",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Startup/Entry Level",
    icon: Zap,
    pricePerRegion: "$500",
    contractValue: "$1,000 annually",
    revenueRequirement: "Gross Revenue of >$5M",
    features: [
      "100 document uploads/month",
      "AI summarization & analysis",
      "5 jurisdictions",
      "Basic regulatory alerts",
      "Email support",
      "3 user seats",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

const faqs = [
  {
    question: "What happens after my free trial ends?",
    answer: "After your 14-day free trial, you can choose to subscribe to any plan. Your data and work will be preserved, and you can pick up right where you left off."
  },
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated."
  },
  {
    question: "Do you offer discounts for NGOs or educational institutions?",
    answer: "Yes! We offer 50% off for verified non-profits and educational institutions. Contact our sales team to apply."
  },
  {
    question: "What jurisdictions are covered?",
    answer: "We cover 100+ jurisdictions across Africa, including all 54 African countries, with deep coverage of Nigeria, Kenya, South Africa, Ghana, Egypt, and more."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use AES-256 encryption at rest, TLS 1.3 in transit, and are SOC2 Type II compliant. Your documents are never shared or used for training."
  },
  {
    question: "Can I export my data?",
    answer: "Yes, you can export all your documents, summaries, and reports in various formats including PDF, DOCX, and CSV at any time."
  },
];

const Pricing = () => {
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
            <Link to="/cbn-copilot" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              CBN Co-pilot
            </Link>
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-accent transition-colors">
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
          <Badge variant="secondary" className="mb-4">14-day free trial • No credit card required</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent{" "}
            <span className="text-accent">Pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the plan that fits your needs. All plans include our core AI-powered 
            legal intelligence features with no hidden fees.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden ${plan.popular ? 'border-accent shadow-lg shadow-accent/10 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <plan.icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price range per region</span>
                      <span className="text-lg font-bold text-foreground">{plan.pricePerRegion}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg. Contract Value</span>
                      <span className="text-lg font-bold text-foreground">{plan.contractValue}</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-xs text-center">
                      {plan.revenueRequirement}
                    </Badge>
                  </div>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-accent hover:bg-accent/90' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/auth">
                      {plan.cta}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Compare Plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Startup/Entry</th>
                  <th className="text-center py-4 px-4 font-medium text-accent">Midsize</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="py-4 px-4 text-sm">Document Uploads</td><td className="text-center">50/mo</td><td className="text-center text-accent font-medium">500/mo</td><td className="text-center">Unlimited</td></tr>
                <tr><td className="py-4 px-4 text-sm">AI Summarization</td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td></tr>
                <tr><td className="py-4 px-4 text-sm">Jurisdictions</td><td className="text-center">5</td><td className="text-center text-accent font-medium">20</td><td className="text-center">All</td></tr>
                <tr><td className="py-4 px-4 text-sm">Regulatory Alerts</td><td className="text-center">Basic</td><td className="text-center text-accent font-medium">Real-time</td><td className="text-center">Custom</td></tr>
                <tr><td className="py-4 px-4 text-sm">Comparison Matrix</td><td className="text-center">-</td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td></tr>
                <tr><td className="py-4 px-4 text-sm">Risk Dashboard</td><td className="text-center">-</td><td className="text-center">-</td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td></tr>
                <tr><td className="py-4 px-4 text-sm">Team Workspaces</td><td className="text-center">-</td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td></tr>
                <tr><td className="py-4 px-4 text-sm">API Access</td><td className="text-center">-</td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td></tr>
                <tr><td className="py-4 px-4 text-sm">SSO</td><td className="text-center">-</td><td className="text-center">-</td><td className="text-center"><Check className="w-5 h-5 text-accent mx-auto" /></td></tr>
                <tr><td className="py-4 px-4 text-sm">Support</td><td className="text-center">Email</td><td className="text-center text-accent font-medium">Priority</td><td className="text-center">Dedicated</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            No credit card required. Get full access to all Professional features for 14 days.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
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

export default Pricing;
