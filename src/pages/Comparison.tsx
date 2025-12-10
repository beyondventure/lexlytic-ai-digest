import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Globe, 
  Plus, 
  X, 
  Download,
  Loader2,
  Scale,
  AlertTriangle,
  DollarSign,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const jurisdictions = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "EU", name: "European Union", flag: "🇪🇺" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
];

const regulationTypes = [
  "Data Protection",
  "Anti-Money Laundering",
  "Banking Regulations",
  "Securities Law",
  "Consumer Protection",
  "Cybersecurity",
  "Corporate Governance",
];

// Sample comparison data
const comparisonData: Record<string, Record<string, any>> = {
  "Data Protection": {
    "NG": {
      law: "Nigeria Data Protection Act 2023",
      authority: "NDPC",
      penalties: "Up to 2% of annual gross revenue",
      consent: "Explicit consent required",
      dpo: "Required for organizations processing personal data",
      crossBorder: "Adequacy determination or safeguards required",
    },
    "KE": {
      law: "Data Protection Act 2019",
      authority: "ODPC",
      penalties: "Up to KES 5 million or 1% of annual turnover",
      consent: "Consent must be freely given",
      dpo: "Required for public authorities",
      crossBorder: "Consent or adequate safeguards required",
    },
    "ZA": {
      law: "POPIA 2013",
      authority: "Information Regulator",
      penalties: "Up to ZAR 10 million or imprisonment",
      consent: "Consent or legitimate interest",
      dpo: "Information Officer required",
      crossBorder: "Consent or binding rules required",
    },
    "GH": {
      law: "Data Protection Act 2012",
      authority: "Data Protection Commission",
      penalties: "Up to GHS 6,000 or imprisonment",
      consent: "Express consent required",
      dpo: "Registration with Commission required",
      crossBorder: "Commission approval required",
    },
    "EU": {
      law: "GDPR 2016",
      authority: "National DPAs",
      penalties: "Up to €20 million or 4% of global turnover",
      consent: "Freely given, specific, informed",
      dpo: "Required for certain processing",
      crossBorder: "Adequacy, SCCs, or BCRs required",
    },
  },
  "Anti-Money Laundering": {
    "NG": {
      law: "Money Laundering (Prevention and Prohibition) Act 2022",
      authority: "NFIU, EFCC",
      penalties: "Up to 14 years imprisonment",
      threshold: "₦5 million reporting threshold",
      kyc: "CDD required for all customers",
      reporting: "STR within 72 hours",
    },
    "KE": {
      law: "Proceeds of Crime and AML Act 2009",
      authority: "FRC",
      penalties: "Up to KES 25 million or 14 years",
      threshold: "KES 1 million reporting threshold",
      kyc: "CDD and EDD requirements",
      reporting: "STR within 7 days",
    },
    "ZA": {
      law: "FICA 2001",
      authority: "FIC",
      penalties: "Up to ZAR 100 million or 15 years",
      threshold: "ZAR 25,000 reporting threshold",
      kyc: "Risk-based CDD approach",
      reporting: "STR within 15 days",
    },
  },
};

const Comparison = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [selectedType, setSelectedType] = useState("Data Protection");
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(["NG", "KE"]);
  const [isLoading, setIsLoading] = useState(false);

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

  const addJurisdiction = (code: string) => {
    if (selectedJurisdictions.length < 5 && !selectedJurisdictions.includes(code)) {
      setSelectedJurisdictions([...selectedJurisdictions, code]);
    }
  };

  const removeJurisdiction = (code: string) => {
    if (selectedJurisdictions.length > 1) {
      setSelectedJurisdictions(selectedJurisdictions.filter(j => j !== code));
    }
  };

  const getJurisdiction = (code: string) => jurisdictions.find(j => j.code === code);

  const handleExport = () => {
    toast({ title: "Export started", description: "Your comparison report is being generated." });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  const currentData = comparisonData[selectedType] || {};

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
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Jurisdiction Comparison</h1>
          <p className="text-muted-foreground">
            Compare regulatory requirements across multiple jurisdictions
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Regulation Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regulationTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium text-foreground">Jurisdictions (max 5)</label>
            <div className="flex flex-wrap gap-2">
              {selectedJurisdictions.map(code => {
                const j = getJurisdiction(code);
                return (
                  <Badge key={code} variant="secondary" className="gap-1 px-3 py-1.5">
                    <span>{j?.flag}</span>
                    <span>{j?.name}</span>
                    <button onClick={() => removeJurisdiction(code)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              {selectedJurisdictions.length < 5 && (
                <Select onValueChange={addJurisdiction}>
                  <SelectTrigger className="w-[140px] h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="text-sm">Add</span>
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions
                      .filter(j => !selectedJurisdictions.includes(j.code))
                      .map(j => (
                        <SelectItem key={j.code} value={j.code}>
                          {j.flag} {j.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-secondary rounded-tl-lg font-semibold text-foreground">
                  Requirement
                </th>
                {selectedJurisdictions.map((code, i) => {
                  const j = getJurisdiction(code);
                  return (
                    <th
                      key={code}
                      className={`text-left p-4 bg-secondary font-semibold text-foreground ${
                        i === selectedJurisdictions.length - 1 ? 'rounded-tr-lg' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{j?.flag}</span>
                        <span>{j?.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {selectedType === "Data Protection" ? (
                <>
                  <ComparisonRow
                    label="Governing Law"
                    icon={<Scale className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.law || "-")}
                  />
                  <ComparisonRow
                    label="Regulatory Authority"
                    icon={<Globe className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.authority || "-")}
                  />
                  <ComparisonRow
                    label="Maximum Penalties"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.penalties || "-")}
                    highlight
                  />
                  <ComparisonRow
                    label="Consent Requirements"
                    icon={<Clock className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.consent || "-")}
                  />
                  <ComparisonRow
                    label="DPO Requirement"
                    icon={<Scale className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.dpo || "-")}
                  />
                  <ComparisonRow
                    label="Cross-Border Transfer"
                    icon={<Globe className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.crossBorder || "-")}
                  />
                </>
              ) : selectedType === "Anti-Money Laundering" ? (
                <>
                  <ComparisonRow
                    label="Governing Law"
                    icon={<Scale className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.law || "-")}
                  />
                  <ComparisonRow
                    label="Regulatory Authority"
                    icon={<Globe className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.authority || "-")}
                  />
                  <ComparisonRow
                    label="Maximum Penalties"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.penalties || "-")}
                    highlight
                  />
                  <ComparisonRow
                    label="Reporting Threshold"
                    icon={<DollarSign className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.threshold || "-")}
                  />
                  <ComparisonRow
                    label="KYC Requirements"
                    icon={<Scale className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.kyc || "-")}
                  />
                  <ComparisonRow
                    label="STR Timeline"
                    icon={<Clock className="h-4 w-4" />}
                    data={selectedJurisdictions.map(code => currentData[code]?.reporting || "-")}
                  />
                </>
              ) : (
                <tr>
                  <td colSpan={selectedJurisdictions.length + 1} className="p-8 text-center text-muted-foreground">
                    Comparison data for {selectedType} coming soon
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              AI-Generated Key Differences
            </CardTitle>
            <CardDescription>Automatically identified significant variations across jurisdictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <h4 className="font-semibold text-foreground mb-1">Penalty Severity</h4>
                <p className="text-sm text-muted-foreground">
                  The EU's GDPR has the highest potential penalties (up to 4% of global turnover), 
                  while Ghana's penalties are significantly lower. Nigeria's new 2023 Act aligns more closely with GDPR standards.
                </p>
              </div>
              <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                <h4 className="font-semibold text-foreground mb-1">Cross-Border Transfers</h4>
                <p className="text-sm text-muted-foreground">
                  All jurisdictions require safeguards for international data transfers, but Ghana uniquely requires 
                  explicit Commission approval, which may impact operational efficiency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const ComparisonRow = ({ 
  label, 
  icon, 
  data, 
  highlight = false 
}: { 
  label: string; 
  icon: React.ReactNode; 
  data: string[];
  highlight?: boolean;
}) => (
  <tr className="border-b border-border">
    <td className={`p-4 ${highlight ? 'bg-warning/5' : ''}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {label}
      </div>
    </td>
    {data.map((value, i) => (
      <td key={i} className={`p-4 text-sm text-muted-foreground ${highlight ? 'bg-warning/5' : ''}`}>
        {value}
      </td>
    ))}
  </tr>
);

export default Comparison;
