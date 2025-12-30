import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  Users,
  DollarSign,
  Briefcase,
  Scale,
  Clock,
} from 'lucide-react';

interface RiskItem {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  businessUnit: string;
  description: string;
  mitigations: string[];
  status: 'open' | 'in_progress' | 'resolved';
}

interface BusinessUnitRisk {
  name: string;
  icon: React.ReactNode;
  score: number;
  risks: number;
}

interface RiskMitigationProps {
  riskScore?: number;
  jurisdiction?: string;
  documentType?: string;
}

export function RiskMitigation({ riskScore = 0, jurisdiction, documentType }: RiskMitigationProps) {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  // Generate risks based on document context
  const generateRisks = (): RiskItem[] => {
    const risks: RiskItem[] = [];
    
    if (riskScore >= 70) {
      risks.push({
        id: '1',
        title: 'Non-Compliance with Reporting Requirements',
        severity: 'high',
        businessUnit: 'Finance',
        description: 'Current documentation may not meet regulatory reporting timelines and formats.',
        mitigations: [
          'Implement automated compliance reporting system',
          'Assign dedicated compliance officer for monitoring',
          'Establish quarterly compliance review meetings',
          'Create compliance checklist for all submissions',
        ],
        status: 'open',
      });
    }
    
    if (riskScore >= 50) {
      risks.push({
        id: '2',
        title: 'Inadequate Customer Due Diligence',
        severity: 'medium',
        businessUnit: 'Operations',
        description: 'KYC procedures may not fully align with enhanced due diligence requirements.',
        mitigations: [
          'Update KYC policy documentation',
          'Implement tiered verification system',
          'Train staff on enhanced due diligence procedures',
          'Deploy automated identity verification tools',
        ],
        status: 'in_progress',
      });
    }
    
    risks.push({
      id: '3',
      title: 'Data Protection & Privacy Gaps',
      severity: riskScore >= 60 ? 'medium' : 'low',
      businessUnit: 'IT',
      description: 'Data handling procedures need alignment with privacy regulations.',
      mitigations: [
        'Conduct data privacy impact assessment',
        'Implement encryption for sensitive data',
        'Update data retention policies',
        'Train employees on data handling procedures',
      ],
      status: 'open',
    });

    if (jurisdiction === 'Nigeria') {
      risks.push({
        id: '4',
        title: 'CBN Circular Compliance Gap',
        severity: 'medium',
        businessUnit: 'Legal',
        description: 'Recent CBN circulars may require policy updates.',
        mitigations: [
          'Subscribe to CBN regulatory alerts',
          'Quarterly policy review against new circulars',
          'Engage regulatory counsel for interpretation',
          'Update internal procedures within 30 days of new circulars',
        ],
        status: 'open',
      });
    }

    return risks;
  };

  const risks = generateRisks();

  const businessUnits: BusinessUnitRisk[] = [
    {
      name: 'Finance',
      icon: <DollarSign className="h-4 w-4" />,
      score: risks.filter(r => r.businessUnit === 'Finance').reduce((acc, r) => 
        acc + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 20 : 10), 0),
      risks: risks.filter(r => r.businessUnit === 'Finance').length,
    },
    {
      name: 'Operations',
      icon: <Building2 className="h-4 w-4" />,
      score: risks.filter(r => r.businessUnit === 'Operations').reduce((acc, r) => 
        acc + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 20 : 10), 0),
      risks: risks.filter(r => r.businessUnit === 'Operations').length,
    },
    {
      name: 'Legal',
      icon: <Scale className="h-4 w-4" />,
      score: risks.filter(r => r.businessUnit === 'Legal').reduce((acc, r) => 
        acc + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 20 : 10), 0),
      risks: risks.filter(r => r.businessUnit === 'Legal').length,
    },
    {
      name: 'IT',
      icon: <Briefcase className="h-4 w-4" />,
      score: risks.filter(r => r.businessUnit === 'IT').reduce((acc, r) => 
        acc + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 20 : 10), 0),
      risks: risks.filter(r => r.businessUnit === 'IT').length,
    },
    {
      name: 'HR',
      icon: <Users className="h-4 w-4" />,
      score: risks.filter(r => r.businessUnit === 'HR').reduce((acc, r) => 
        acc + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 20 : 10), 0),
      risks: risks.filter(r => r.businessUnit === 'HR').length,
    },
  ].filter(bu => bu.score > 0 || bu.risks > 0);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-success/10 text-success';
      case 'in_progress': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Unit Risk Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            Risk by Business Unit
          </CardTitle>
          <CardDescription>
            Compliance risks mapped to organizational departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {businessUnits.map((unit) => (
              <div
                key={unit.name}
                className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-accent/10 rounded">
                    {unit.icon}
                  </div>
                  <span className="text-sm font-medium">{unit.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Risk Score</span>
                    <span className={`font-bold ${
                      unit.score >= 50 ? 'text-destructive' : 
                      unit.score >= 30 ? 'text-warning' : 'text-success'
                    }`}>
                      {unit.score}
                    </span>
                  </div>
                  <Progress 
                    value={unit.score} 
                    className={`h-1 ${
                      unit.score >= 50 ? 'bg-destructive' : 
                      unit.score >= 30 ? 'bg-warning' : 'bg-success'
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {unit.risks} risk{unit.risks !== 1 ? 's' : ''} identified
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Items with Mitigation Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            AI-Suggested Mitigation Strategies
          </CardTitle>
          <CardDescription>
            Actionable recommendations to address identified compliance risks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {risks.map((risk) => (
              <AccordionItem
                key={risk.id}
                value={risk.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                      risk.severity === 'high' ? 'text-destructive' :
                      risk.severity === 'medium' ? 'text-warning' : 'text-success'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{risk.title}</span>
                        <Badge className={getSeverityColor(risk.severity)}>
                          {risk.severity}
                        </Badge>
                        <Badge variant="outline">{risk.businessUnit}</Badge>
                        <Badge className={getStatusColor(risk.status)}>
                          {risk.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {risk.description}
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-success" />
                        Recommended Actions
                      </h4>
                      <ul className="space-y-2">
                        {risk.mitigations.map((mitigation, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm p-2 bg-success/5 rounded-lg"
                          >
                            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                            <span>{mitigation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Clock className="h-4 w-4 mr-2" />
                        Set Deadline
                      </Button>
                      <Button size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Assign Owner
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
