import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, File, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF, exportToDOCX } from '@/lib/exportUtils';

interface ExportData {
  title: string;
  date: string;
  complianceScore?: number | null;
  content: {
    section: string;
    items: string[];
  }[];
  summary?: string;
  jurisdiction?: string;
  documentType?: string;
  riskScore?: number;
  obligations?: Array<{ title?: string; description?: string; section?: string } | string>;
  penalties?: Array<{ title?: string; description?: string; section?: string } | string>;
  definitions?: Array<{ term?: string; definition?: string } | string>;
  redFlags?: string[];
  mitigationSuggestions?: string[];
  citations?: string[];
}

interface ExportButtonProps {
  data: ExportData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({ data, variant = 'outline', size = 'default' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        await exportToPDF(data);
        toast({
          title: 'PDF exported successfully',
          description: 'Your document has been downloaded.',
        });
      } else {
        await exportToDOCX(data);
        toast({
          title: 'DOCX exported successfully',
          description: 'Your document has been downloaded.',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your document.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <File className="h-4 w-4 mr-2 text-destructive" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('docx')}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Export as DOCX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
