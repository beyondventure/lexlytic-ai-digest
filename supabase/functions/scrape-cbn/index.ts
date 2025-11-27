import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting CBN website scraping...');

    // Fetch the CBN circulars page
    const circularsPageResponse = await fetch('https://www.cbn.gov.ng/Documents/circulars.html');
    const circularsHtml = await circularsPageResponse.text();

    // Parse HTML to extract document links
    const documentLinks = extractDocumentLinks(circularsHtml);
    console.log(`Found ${documentLinks.length} documents`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each document
    for (const link of documentLinks.slice(0, 10)) { // Limit to 10 for initial scrape
      try {
        // Check if document already exists
        const { data: existing } = await supabase
          .from('documents')
          .select('id')
          .eq('source_url', link.url)
          .maybeSingle();

        if (existing) {
          console.log(`Document already exists: ${link.title}`);
          continue;
        }

        // Download PDF and extract text
        let fullText = '';
        try {
          const pdfResponse = await fetch(link.url);
          if (pdfResponse.ok) {
            // For now, we'll store the PDF URL and extract text later
            // Full PDF text extraction would require additional processing
            fullText = `Document available at: ${link.url}`;
          }
        } catch (pdfError) {
          console.error(`Error downloading PDF: ${pdfError}`);
        }

        // Generate summary (in a real implementation, use AI to generate this)
        const summary = generateSummary(link.title);

        // Extract metadata from title
        const metadata = extractMetadata(link.title);

        // Insert document into database
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            title: link.title,
            reference_number: metadata.referenceNumber,
            document_type: metadata.documentType,
            category: metadata.categories,
            issue_date: link.date || new Date().toISOString(),
            status: 'active',
            summary: summary,
            full_text: fullText,
            pdf_url: link.url,
            source_url: link.url,
          });

        if (insertError) {
          console.error(`Error inserting document: ${insertError.message}`);
          errorCount++;
        } else {
          processedCount++;
          console.log(`Processed: ${link.title}`);
        }
      } catch (error) {
        console.error(`Error processing document ${link.title}:`, error);
        errorCount++;
      }
    }

    console.log(`Scraping complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        total: documentLinks.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractDocumentLinks(html: string): Array<{ title: string; url: string; date?: string }> {
  const links: Array<{ title: string; url: string; date?: string }> = [];
  
  // Extract table rows - CBN uses a table structure for documents
  const tableRowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const tableRows = html.match(tableRowPattern) || [];
  console.log(`Found ${tableRows.length} table rows`);
  
  for (const row of tableRows) {
    // Extract PDF link and title from each row
    const linkMatch = row.match(/<a[^>]*href="([^"]+\.pdf)"[^>]*>([^<]+)<\/a>/i);
    if (linkMatch) {
      const url = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.cbn.gov.ng${linkMatch[1]}`;
      const title = linkMatch[2].trim();
      
      // Extract date from the row (format: DD/MM/YYYY)
      const dateMatch = row.match(/(\d{2}\/\d{2}\/\d{4})/);
      const date = dateMatch ? dateMatch[1] : undefined;
      
      // Extract reference number
      const refMatch = row.match(/>([A-Z0-9\/]+)<\/td>/);
      const refNumber = refMatch ? refMatch[1].trim() : null;
      
      if (title && url) {
        links.push({
          title: refNumber ? `${refNumber} - ${title}` : title,
          url: url,
          date: date,
        });
      }
    }
  }

  return links;
}

function extractMetadata(title: string): {
  referenceNumber: string | null;
  documentType: string;
  categories: string[];
} {
  // Extract reference number (e.g., BSD/DIR/PUB/03/2025)
  const refMatch = title.match(/([A-Z]+\/[A-Z]+\/[A-Z]+\/\d+\/\d+)/);
  const referenceNumber = refMatch ? refMatch[1] : null;

  // Determine document type
  let documentType = 'circular';
  if (title.toLowerCase().includes('guideline')) documentType = 'guideline';
  if (title.toLowerCase().includes('framework')) documentType = 'framework';
  if (title.toLowerCase().includes('exposure draft')) documentType = 'exposure_draft';

  // Extract categories based on keywords
  const categories: string[] = [];
  const categoryKeywords = {
    'Payments': ['payment', 'wallet', 'atm', 'pos', 'transfer'],
    'KYC': ['kyc', 'know your customer', 'identification', 'verification'],
    'FX': ['fx', 'foreign exchange', 'forex', 'exchange rate'],
    'Digital Lending': ['lending', 'loan', 'credit'],
    'Fintech': ['fintech', 'psp', 'payment service'],
    'AML': ['aml', 'money laundering', 'terrorist financing'],
    'Consumer Protection': ['consumer', 'customer', 'protection'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => title.toLowerCase().includes(keyword))) {
      categories.push(category);
    }
  }

  if (categories.length === 0) categories.push('General');

  return { referenceNumber, documentType, categories };
}

function generateSummary(title: string): string {
  // Simple summary generation based on title
  // In production, use AI to generate proper summaries
  return `This document provides guidelines and regulations related to ${title.toLowerCase()}. It outlines the requirements, procedures, and compliance standards that must be followed by relevant financial institutions and stakeholders.`;
}
