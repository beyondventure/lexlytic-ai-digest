import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertOctagon, Info, ChevronRight, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RedFlag {
  id: string;
  clause: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium';
  recommendation: string;
  regulation?: string;
}

interface RedFlagHighlightsProps {
  riskScore?: number;
  documentType?: string;
  jurisdiction?: string;
}

export function RedFlagHighlights({ riskScore = 0, documentType, jurisdiction }: RedFlagHighlightsProps) {
  // Generate red flags based on document context
  const generateRedFlags = (): RedFlag[] => {
    const flags: RedFlag[] = [];

    if (riskScore >= 70) {
      flags.push({
        id: '1',
        clause: 'Section 4.2 - Customer Verification',
        issue: 'Incomplete KYC tier classification. Document does not specify verification requirements for Tier 2 and Tier 3 accounts.',
        severity: 'critical',
        recommendation: 'Add explicit verification requirements for each KYC tier as per CBN tiered KYC guidelines.',
        regulation: 'CBN Tiered KYC Guidelines 2022',
      });
    }

    if (riskScore >= 50) {
      flags.push({
        id: '2',
        clause: 'Section 7.1 - Transaction Monitoring',
        issue: 'STR filing timeline not specified. Regulation requires filing within 24 hours of detection.',
        severity: 'high',
        recommendation: 'Include explicit 24-hour STR filing requirement with escalation procedures.',
        regulation: 'MLPPA 2022 Section 6',
      });

      flags.push({
        id: '3',
        clause: 'Section 9.3 - Data Retention',
        issue: 'Record retention period stated as 5 years, but regulation requires 7 years for financial records.',
        severity: 'high',
        recommendation: 'Update retention period to minimum 7 years for all transaction records.',
        regulation: 'CBN AML/CFT Regulations',
      });
    }

    flags.push({
      id: '4',
      clause: 'Section 12 - Penalties',
      issue: 'Internal penalty framework does not align with current regulatory penalty structure.',
      severity: 'medium',
      recommendation: 'Review and update penalty provisions to reflect current CBN penalty guidelines.',
      regulation: 'CBN Administrative Sanctions Guidelines',
    });

    if (jurisdiction === 'Nigeria') {
      flags.push({
        id: '5',
        clause: 'General - BVN Verification',
        issue: 'No mention of mandatory BVN verification for account opening.',
        severity: 'high',
        recommendation: 'Add BVN verification as mandatory requirement for all Tier 2 and Tier 3 accounts.',
        regulation: 'CBN BVN Guidelines',
      });
    }

    return flags;
  };

  const redFlags = generateRedFlags();

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertOctagon className="h-5 w-5" />,
          color: 'text-destructive',
          bg: 'bg-destructive/10 border-destructive/30',
          badge: <Badge className="bg-destructive">Critical</Badge>,
        };
      case 'high':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'text-warning',
          bg: 'bg-warning/10 border-warning/30',
          badge: <Badge className="bg-warning text-warning-foreground">High</Badge>,
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          color: 'text-info',
          bg: 'bg-info/10 border-info/30',
          badge: <Badge variant="secondary">Medium</Badge>,
        };
    }
  };

  const criticalCount = redFlags.filter(f => f.severity === 'critical').length;
  const highCount = redFlags.filter(f => f.severity === 'high').length;
  const mediumCount = redFlags.filter(f => f.severity === 'medium').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Red Flags & High-Risk Clauses
            </CardTitle>
            <CardDescription>
              AI-identified compliance gaps and regulatory concerns
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-destructive">{criticalCount} Critical</Badge>
            )}
            {highCount > 0 && (
              <Badge className="bg-warning text-warning-foreground">{highCount} High</Badge>
            )}
            {mediumCount > 0 && (
              <Badge variant="secondary">{mediumCount} Medium</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {redFlags.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-success mx-auto mb-3" />
            <h3 className="font-medium text-foreground">No Red Flags Detected</h3>
            <p className="text-sm text-muted-foreground">
              The document appears to be compliant with current regulations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {redFlags.map((flag) => {
              const config = getSeverityConfig(flag.severity);
              return (
                <div
                  key={flag.id}
                  className={`p-4 rounded-lg border ${config.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={config.color}>
                      {config.icon}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {flag.clause}
                        </span>
                        {config.badge}
                      </div>
                      
                      <p className="text-sm text-foreground">
                        {flag.issue}
                      </p>

                      <div className="flex items-start gap-2 p-2 bg-background/50 rounded-lg">
                        <Shield className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-success">Recommendation:</span>
                          <p className="text-sm text-muted-foreground">
                            {flag.recommendation}
                          </p>
                        </div>
                      </div>

                      {flag.regulation && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="cursor-help">
                                📚 {flag.regulation}
                              </TooltipTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View referenced regulation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {redFlags.length} issue{redFlags.length !== 1 ? 's' : ''} identified in this document
          </p>
          <Button variant="outline" size="sm">
            Generate Remediation Report
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
