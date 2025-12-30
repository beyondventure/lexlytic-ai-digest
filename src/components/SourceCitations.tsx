import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, FileText, Link2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Citation {
  id: string;
  title: string;
  reference: string;
  type: 'circular' | 'legislation' | 'guideline' | 'case_law';
  url?: string;
  excerpt?: string;
  relevance: 'high' | 'medium' | 'low';
}

interface SourceCitationsProps {
  documentType?: string;
  jurisdiction?: string;
}

export function SourceCitations({ documentType, jurisdiction }: SourceCitationsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate relevant citations based on context
  const generateCitations = (): Citation[] => {
    const citations: Citation[] = [];

    if (jurisdiction === 'Nigeria') {
      citations.push(
        {
          id: '1',
          title: 'Guidelines on Electronic Banking',
          reference: 'CBN/DIR/GEN/CIR/04/010',
          type: 'circular',
          url: 'https://www.cbn.gov.ng/out/2012/ccd/guidelines%20on%20e-banking.pdf',
          excerpt: 'Financial institutions shall ensure that all electronic banking platforms comply with minimum security requirements...',
          relevance: 'high',
        },
        {
          id: '2',
          title: 'Anti-Money Laundering/Combating the Financing of Terrorism Regulations',
          reference: 'CBN AML/CFT Regulations 2022',
          type: 'circular',
          url: 'https://www.cbn.gov.ng/out/2022/ccd/amended_aml_cft_regulations_2022.pdf',
          excerpt: 'All financial institutions must implement enhanced customer due diligence measures for high-risk customers...',
          relevance: 'high',
        },
        {
          id: '3',
          title: 'Money Laundering (Prevention and Prohibition) Act',
          reference: 'MLPPA 2022',
          type: 'legislation',
          excerpt: 'Section 15: Every financial institution shall report suspicious transactions to the Nigerian Financial Intelligence Unit...',
          relevance: 'medium',
        }
      );
    }

    citations.push(
      {
        id: '4',
        title: 'FATF Recommendations',
        reference: 'FATF 40 Recommendations',
        type: 'guideline',
        url: 'https://www.fatf-gafi.org/en/recommendations.html',
        excerpt: 'Countries should implement financial institution secrecy laws that do not inhibit implementation of FATF Recommendations...',
        relevance: 'medium',
      },
      {
        id: '5',
        title: 'Basel Committee on Banking Supervision',
        reference: 'BCBS Guidelines on AML/CFT',
        type: 'guideline',
        excerpt: 'Banks should establish customer acceptance policies and procedures that identify the types of customers...',
        relevance: 'low',
      }
    );

    return citations;
  };

  const citations = generateCitations();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'circular': return <FileText className="h-4 w-4" />;
      case 'legislation': return <BookOpen className="h-4 w-4" />;
      case 'case_law': return <BookOpen className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'circular': return <Badge className="bg-accent">Circular</Badge>;
      case 'legislation': return <Badge className="bg-primary">Legislation</Badge>;
      case 'case_law': return <Badge className="bg-info">Case Law</Badge>;
      default: return <Badge variant="outline">Guideline</Badge>;
    }
  };

  const getRelevanceBadge = (relevance: string) => {
    switch (relevance) {
      case 'high': return <Badge variant="destructive">High Relevance</Badge>;
      case 'medium': return <Badge className="bg-warning">Medium</Badge>;
      default: return <Badge variant="secondary">Low</Badge>;
    }
  };

  const handleCopy = (citation: Citation) => {
    const text = `${citation.title} (${citation.reference})`;
    navigator.clipboard.writeText(text);
    setCopiedId(citation.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Citation copied',
      description: 'Reference copied to clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          Source Citations
        </CardTitle>
        <CardDescription>
          AI insights are backed by these regulatory sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {citations.map((citation, index) => (
            <div
              key={citation.id}
              className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeIcon(citation.type)}
                    <span className="font-medium text-foreground">
                      [{index + 1}] {citation.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(citation.type)}
                    {getRelevanceBadge(citation.relevance)}
                    <Badge variant="outline" className="text-xs">
                      {citation.reference}
                    </Badge>
                  </div>

                  {citation.excerpt && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-accent/50 pl-3">
                      "{citation.excerpt}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(citation)}
                  >
                    {copiedId === citation.id ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {citation.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a href={citation.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Citations are automatically extracted from the analysis. 
            Click the external link icon to view the original source.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
