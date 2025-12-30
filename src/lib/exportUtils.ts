import jsPDF from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, PageBreak } from 'docx';
import { saveAs } from 'file-saver';

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

// Helper to wrap text properly for PDF
function splitTextToLines(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const charWidth = fontSize * 0.45; // approximate char width
  const maxChars = Math.floor(maxWidth / charWidth);
  
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

export async function exportToPDF(data: ExportData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const lines = splitTextToLines(text, contentWidth, fontSize);
    const lineHeight = fontSize * 0.5;
    
    for (const line of lines) {
      checkPageBreak(lineHeight);
      pdf.text(line, margin, yPos);
      yPos += lineHeight;
    }
    yPos += 2;
  };

  const addSection = (title: string, items: string[]) => {
    checkPageBreak(20);
    addText(title, 14, true, [30, 64, 175]);
    yPos += 2;
    
    for (const item of items) {
      checkPageBreak(15);
      addText(`• ${item}`, 10, false);
    }
    yPos += 5;
  };

  // Header
  pdf.setFillColor(30, 64, 175);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LEXLYTIC', margin, 20);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Regulatory Intelligence Report', margin, 30);
  
  yPos = 50;
  pdf.setTextColor(0, 0, 0);

  // Title and metadata
  addText(data.title, 18, true);
  yPos += 3;
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${data.date}`, margin, yPos);
  yPos += 5;
  
  if (data.jurisdiction) {
    pdf.text(`Jurisdiction: ${data.jurisdiction}`, margin, yPos);
    yPos += 5;
  }
  
  if (data.documentType) {
    pdf.text(`Document Type: ${data.documentType}`, margin, yPos);
    yPos += 5;
  }
  
  yPos += 5;

  // Compliance/Risk Score Box
  if (data.complianceScore !== null && data.complianceScore !== undefined) {
    checkPageBreak(30);
    const scoreColor: [number, number, number] = data.complianceScore >= 80 
      ? [34, 197, 94] 
      : data.complianceScore >= 60 
        ? [234, 179, 8] 
        : [239, 68, 68];
    
    pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.roundedRect(margin, yPos, 60, 25, 3, 3, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${data.complianceScore}%`, margin + 10, yPos + 15);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Compliance Score', margin + 65, yPos + 15);
    
    yPos += 35;
    pdf.setTextColor(0, 0, 0);
  }

  if (data.riskScore !== undefined) {
    checkPageBreak(30);
    const riskColor: [number, number, number] = data.riskScore >= 70 
      ? [239, 68, 68] 
      : data.riskScore >= 50 
        ? [234, 179, 8] 
        : [34, 197, 94];
    
    pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    pdf.roundedRect(margin, yPos, 60, 25, 3, 3, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${data.riskScore}/100`, margin + 8, yPos + 15);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Risk Score', margin + 65, yPos + 15);
    
    yPos += 35;
  }

  // Summary
  if (data.summary) {
    checkPageBreak(30);
    addText('Executive Summary', 14, true, [30, 64, 175]);
    yPos += 2;
    addText(data.summary, 10, false);
    yPos += 8;
  }

  // Red Flags Section
  if (data.redFlags && data.redFlags.length > 0) {
    checkPageBreak(25);
    addText('⚠️ Red Flags Identified', 14, true, [239, 68, 68]);
    yPos += 2;
    for (const flag of data.redFlags) {
      checkPageBreak(12);
      addText(`• ${flag}`, 10, false, [180, 50, 50]);
    }
    yPos += 8;
  }

  // Content sections
  for (const section of data.content) {
    if (section.items.length > 0) {
      addSection(section.section, section.items);
    }
  }

  // Obligations
  if (data.obligations && data.obligations.length > 0) {
    checkPageBreak(25);
    addText('Key Obligations', 14, true, [30, 64, 175]);
    yPos += 2;
    for (const item of data.obligations) {
      checkPageBreak(15);
      const text = typeof item === 'string' ? item : (item.title || item.description || '');
      addText(`• ${text}`, 10, false);
    }
    yPos += 8;
  }

  // Penalties
  if (data.penalties && data.penalties.length > 0) {
    checkPageBreak(25);
    addText('Penalties & Enforcement', 14, true, [239, 68, 68]);
    yPos += 2;
    for (const item of data.penalties) {
      checkPageBreak(15);
      const text = typeof item === 'string' ? item : (item.title || item.description || '');
      addText(`• ${text}`, 10, false);
    }
    yPos += 8;
  }

  // Mitigation Suggestions
  if (data.mitigationSuggestions && data.mitigationSuggestions.length > 0) {
    checkPageBreak(25);
    addText('Recommended Mitigation Strategies', 14, true, [34, 197, 94]);
    yPos += 2;
    for (const suggestion of data.mitigationSuggestions) {
      checkPageBreak(15);
      addText(`✓ ${suggestion}`, 10, false, [34, 120, 94]);
    }
    yPos += 8;
  }

  // Citations
  if (data.citations && data.citations.length > 0) {
    checkPageBreak(25);
    addText('Source Citations', 14, true, [30, 64, 175]);
    yPos += 2;
    for (let i = 0; i < data.citations.length; i++) {
      checkPageBreak(12);
      addText(`[${i + 1}] ${data.citations[i]}`, 9, false, [80, 80, 80]);
    }
    yPos += 8;
  }

  // Footer on each page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${pageCount} | Generated by Lexlytic | ${data.date}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  const filename = `${data.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

export async function exportToDOCX(data: ExportData): Promise<void> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'LEXLYTIC',
          bold: true,
          size: 32,
          color: '1E40AF',
        }),
      ],
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      text: 'Regulatory Intelligence Report',
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    })
  );

  // Document Title
  children.push(
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Generated: ${data.date}`, color: '666666', size: 20 }),
      ],
      spacing: { after: 100 },
    })
  );

  if (data.jurisdiction) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Jurisdiction: ${data.jurisdiction}`, color: '666666', size: 20 }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  if (data.documentType) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Document Type: ${data.documentType}`, color: '666666', size: 20 }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Scores
  if (data.complianceScore !== null && data.complianceScore !== undefined) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Compliance Score: ${data.complianceScore}%`,
            bold: true,
            size: 28,
            color: data.complianceScore >= 80 ? '22C55E' : data.complianceScore >= 60 ? 'EAB308' : 'EF4444',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  if (data.riskScore !== undefined) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Risk Score: ${data.riskScore}/100`,
            bold: true,
            size: 28,
            color: data.riskScore >= 70 ? 'EF4444' : data.riskScore >= 50 ? 'EAB308' : '22C55E',
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // Summary
  if (data.summary) {
    children.push(
      new Paragraph({
        text: 'Executive Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    children.push(
      new Paragraph({
        text: data.summary,
        spacing: { after: 300 },
      })
    );
  }

  // Red Flags
  if (data.redFlags && data.redFlags.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '⚠️ Red Flags Identified', bold: true, color: 'EF4444' }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    for (const flag of data.redFlags) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${flag}`, color: 'B91C1C' }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Content sections
  for (const section of data.content) {
    if (section.items.length > 0) {
      children.push(
        new Paragraph({
          text: section.section,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      for (const item of section.items) {
        children.push(
          new Paragraph({
            text: `• ${item}`,
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  // Obligations
  if (data.obligations && data.obligations.length > 0) {
    children.push(
      new Paragraph({
        text: 'Key Obligations',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    for (const item of data.obligations) {
      const text = typeof item === 'string' ? item : (item.title || item.description || '');
      children.push(
        new Paragraph({
          text: `• ${text}`,
          spacing: { after: 100 },
        })
      );
    }
  }

  // Penalties
  if (data.penalties && data.penalties.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Penalties & Enforcement', bold: true, color: 'EF4444' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    for (const item of data.penalties) {
      const text = typeof item === 'string' ? item : (item.title || item.description || '');
      children.push(
        new Paragraph({
          text: `• ${text}`,
          spacing: { after: 100 },
        })
      );
    }
  }

  // Mitigation Suggestions
  if (data.mitigationSuggestions && data.mitigationSuggestions.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Recommended Mitigation Strategies', bold: true, color: '22C55E' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    for (const suggestion of data.mitigationSuggestions) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `✓ ${suggestion}`, color: '166534' })],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Citations
  if (data.citations && data.citations.length > 0) {
    children.push(
      new Paragraph({
        text: 'Source Citations',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    for (let i = 0; i < data.citations.length; i++) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `[${i + 1}] ${data.citations[i]}`, size: 18, color: '666666' })],
          spacing: { after: 50 },
        })
      );
    }
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `\n\n---\nGenerated by Lexlytic | ${data.date}`,
          size: 18,
          color: '999999',
        }),
      ],
      spacing: { before: 400 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${data.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, filename);
}
