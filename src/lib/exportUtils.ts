import jsPDF from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, ExternalHyperlink } from 'docx';
import { saveAs } from 'file-saver';

interface Citation {
  title: string;
  url: string;
  relevance?: string;
}

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
  citations?: string[] | Citation[];
}

// Helper to wrap text properly for PDF with better line breaks
function splitTextToLines(text: string, maxWidth: number, fontSize: number): string[] {
  if (!text) return [];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const charWidth = fontSize * 0.42; // more accurate char width
  const maxChars = Math.floor(maxWidth / charWidth);
  
  for (const word of words) {
    // Handle words that are too long
    if (word.length > maxChars) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
      // Split long word
      for (let i = 0; i < word.length; i += maxChars - 1) {
        lines.push(word.slice(i, i + maxChars - 1) + (i + maxChars - 1 < word.length ? '-' : ''));
      }
      continue;
    }
    
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
  const footerHeight = 15;
  const maxContentY = pageHeight - footerHeight - margin;
  let yPos = margin;

  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > maxContentY) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0], indent = 0) => {
    if (!text) return;
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const effectiveWidth = contentWidth - indent;
    const lines = splitTextToLines(text, effectiveWidth, fontSize);
    const lineHeight = fontSize * 0.45;
    
    for (const line of lines) {
      checkPageBreak(lineHeight + 2);
      pdf.text(line, margin + indent, yPos);
      yPos += lineHeight;
    }
    yPos += 2;
  };

  const addSection = (title: string, items: string[], titleColor: [number, number, number] = [30, 64, 175]) => {
    checkPageBreak(25);
    addText(title, 13, true, titleColor);
    yPos += 2;
    
    for (const item of items) {
      if (!item) continue;
      checkPageBreak(15);
      addText(`• ${item}`, 10, false, [50, 50, 50], 5);
    }
    yPos += 6;
  };

  // Header
  pdf.setFillColor(30, 64, 175);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LEXLYTIC', margin, 18);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Regulatory Intelligence Report', margin, 27);
  
  yPos = 45;
  pdf.setTextColor(0, 0, 0);

  // Title and metadata
  addText(data.title, 16, true);
  yPos += 2;
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${data.date}`, margin, yPos);
  yPos += 4;
  
  if (data.jurisdiction) {
    pdf.text(`Jurisdiction: ${data.jurisdiction}`, margin, yPos);
    yPos += 4;
  }
  
  if (data.documentType) {
    pdf.text(`Document Type: ${data.documentType}`, margin, yPos);
    yPos += 4;
  }
  
  yPos += 6;

  // Score boxes side by side
  if ((data.complianceScore !== null && data.complianceScore !== undefined) || data.riskScore !== undefined) {
    checkPageBreak(35);
    let xOffset = margin;
    
    if (data.complianceScore !== null && data.complianceScore !== undefined) {
      const scoreColor: [number, number, number] = data.complianceScore >= 80 
        ? [34, 197, 94] 
        : data.complianceScore >= 60 
          ? [234, 179, 8] 
          : [239, 68, 68];
      
      pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.roundedRect(xOffset, yPos, 55, 22, 3, 3, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${data.complianceScore}%`, xOffset + 8, yPos + 14);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Compliance', xOffset + 60, yPos + 10);
      pdf.text('Score', xOffset + 60, yPos + 15);
      
      xOffset += 85;
    }

    if (data.riskScore !== undefined) {
      const riskColor: [number, number, number] = data.riskScore >= 70 
        ? [239, 68, 68] 
        : data.riskScore >= 50 
          ? [234, 179, 8] 
          : [34, 197, 94];
      
      pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
      pdf.roundedRect(xOffset, yPos, 55, 22, 3, 3, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${data.riskScore}/100`, xOffset + 5, yPos + 14);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Risk', xOffset + 60, yPos + 10);
      pdf.text('Score', xOffset + 60, yPos + 15);
    }
    
    yPos += 32;
    pdf.setTextColor(0, 0, 0);
  }

  // Summary
  if (data.summary) {
    checkPageBreak(30);
    addText('Executive Summary', 13, true, [30, 64, 175]);
    yPos += 2;
    addText(data.summary, 10, false, [50, 50, 50]);
    yPos += 8;
  }

  // Red Flags Section
  if (data.redFlags && data.redFlags.length > 0) {
    checkPageBreak(25);
    
    // Red background box for header
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(margin, yPos - 2, contentWidth, 10, 2, 2, 'F');
    
    addText('Red Flags Identified', 13, true, [185, 28, 28]);
    yPos += 4;
    
    for (const flag of data.redFlags) {
      if (!flag) continue;
      checkPageBreak(12);
      addText(`⚠ ${flag}`, 10, false, [153, 27, 27], 3);
    }
    yPos += 8;
  }

  // Content sections
  for (const section of data.content) {
    if (section.items && section.items.length > 0) {
      addSection(section.section, section.items);
    }
  }

  // Obligations
  if (data.obligations && data.obligations.length > 0) {
    checkPageBreak(25);
    addText('Key Obligations', 13, true, [30, 64, 175]);
    yPos += 2;
    for (const item of data.obligations) {
      const text = typeof item === 'string' ? item : (item.title || item.description || '');
      if (text) {
        checkPageBreak(15);
        addText(`• ${text}`, 10, false, [50, 50, 50], 3);
      }
    }
    yPos += 8;
  }

  // Penalties
  if (data.penalties && data.penalties.length > 0) {
    checkPageBreak(25);
    addText('Penalties & Enforcement', 13, true, [185, 28, 28]);
    yPos += 2;
    for (const item of data.penalties) {
      const text = typeof item === 'string' ? item : (item.title || item.description || '');
      if (text) {
        checkPageBreak(15);
        addText(`• ${text}`, 10, false, [120, 50, 50], 3);
      }
    }
    yPos += 8;
  }

  // Mitigation Suggestions
  if (data.mitigationSuggestions && data.mitigationSuggestions.length > 0) {
    checkPageBreak(25);
    
    // Green background box for header
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, yPos - 2, contentWidth, 10, 2, 2, 'F');
    
    addText('Recommended Actions', 13, true, [22, 101, 52]);
    yPos += 4;
    
    for (const suggestion of data.mitigationSuggestions) {
      if (!suggestion) continue;
      checkPageBreak(15);
      addText(`✓ ${suggestion}`, 10, false, [22, 101, 52], 3);
    }
    yPos += 8;
  }

  // Citations with URLs
  if (data.citations && data.citations.length > 0) {
    checkPageBreak(25);
    addText('Source Citations & References', 13, true, [30, 64, 175]);
    yPos += 4;
    
    for (let i = 0; i < data.citations.length; i++) {
      checkPageBreak(18);
      const citation = data.citations[i];
      
      if (typeof citation === 'string') {
        addText(`[${i + 1}] ${citation}`, 9, false, [80, 80, 80], 3);
      } else {
        // Citation with title and URL
        addText(`[${i + 1}] ${citation.title}`, 9, true, [50, 50, 50], 3);
        if (citation.url) {
          pdf.setFontSize(8);
          pdf.setTextColor(30, 64, 175);
          pdf.textWithLink(citation.url, margin + 8, yPos, { url: citation.url });
          yPos += 4;
        }
        if (citation.relevance) {
          addText(`    ${citation.relevance}`, 8, false, [100, 100, 100], 6);
        }
      }
      yPos += 2;
    }
  }

  // Footer on each page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);
    
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 8
    );
    pdf.text(
      `Generated by Lexlytic | ${data.date}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
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
      if (!flag) continue;
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
    if (section.items && section.items.length > 0) {
      children.push(
        new Paragraph({
          text: section.section,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      for (const item of section.items) {
        if (!item) continue;
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
      if (text) {
        children.push(
          new Paragraph({
            text: `• ${text}`,
            spacing: { after: 100 },
          })
        );
      }
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
      if (text) {
        children.push(
          new Paragraph({
            text: `• ${text}`,
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  // Mitigation Suggestions
  if (data.mitigationSuggestions && data.mitigationSuggestions.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Recommended Actions', bold: true, color: '22C55E' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    for (const suggestion of data.mitigationSuggestions) {
      if (!suggestion) continue;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `✓ ${suggestion}`, color: '166534' })],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Citations with hyperlinks
  if (data.citations && data.citations.length > 0) {
    children.push(
      new Paragraph({
        text: 'Source Citations & References',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      })
    );
    
    for (let i = 0; i < data.citations.length; i++) {
      const citation = data.citations[i];
      
      if (typeof citation === 'string') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `[${i + 1}] ${citation}`, size: 18, color: '666666' })],
            spacing: { after: 80 },
          })
        );
      } else {
        // Citation with title and hyperlink
        const citationChildren: (TextRun | ExternalHyperlink)[] = [
          new TextRun({ text: `[${i + 1}] ${citation.title}`, size: 20, bold: true }),
        ];
        
        if (citation.url) {
          citationChildren.push(
            new TextRun({ text: '\n' }),
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: citation.url,
                  color: '1E40AF',
                  size: 18,
                  underline: {},
                }),
              ],
              link: citation.url,
            })
          );
        }
        
        if (citation.relevance) {
          citationChildren.push(
            new TextRun({ text: `\n${citation.relevance}`, size: 18, color: '666666', italics: true })
          );
        }
        
        children.push(
          new Paragraph({
            children: citationChildren,
            spacing: { after: 150 },
          })
        );
      }
    }
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '\n\n---\nGenerated by Lexlytic | ' + data.date + '\nThis report is for informational purposes only and does not constitute legal advice.',
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
