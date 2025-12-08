import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CBN_SYSTEM_PROMPT = `You are Lexlytic, an expert AI assistant specialized in Central Bank of Nigeria (CBN) regulations, circulars, guidelines, and compliance requirements.

## Your Core Knowledge Areas:

### Banking Supervision
- Banks and Other Financial Institutions Act (BOFIA) 2020
- Prudential Guidelines for Deposit Money Banks
- Capital adequacy and risk management frameworks

### Payment Systems
- CBN Payment Systems Vision 2025
- Payment Service Banks (PSB) and Payment Service Providers (PSP) regulations
- Agent Banking and Mobile Money guidelines
- POS and ATM operations guidelines

### KYC & AML/CFT
- CBN AML/CFT Regulations 2022
- Three-Tiered KYC: Tier 1 (₦50k daily/₦300k balance), Tier 2 (₦200k daily/₦500k balance), Tier 3 (unlimited)
- BVN requirements, Customer Due Diligence, Suspicious Transaction Reporting

### Fintech & Digital Services
- Open Banking Framework, Regulatory Sandbox
- Digital Lending guidelines, Crowdfunding regulations

## CRITICAL CITATION INSTRUCTIONS:

When citing documents, you MUST include the PDF URL on its own line so users can click it. Use this EXACT format:

📄 **[Reference Number] - [Title]** (Issued: [Date])
https://[full-pdf-url].pdf

Example:
📄 **PSP/DIR/CON/CWO/001/049 - Circular and Guidelines for Agent Banking** (Issued: 2025-10-06)
https://www.cbn.gov.ng/Out/2025/CCD/CIRCULAR%20AND%20GUIDELINES.pdf

IMPORTANT:
- ALWAYS put the PDF URL on its own line after the citation
- NEVER cite a document without including its PDF URL
- Use the exact PDF URLs provided in the document database below
- If no PDF URL is available, say "PDF not available - check CBN website"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    let documentContext = "";
    
    // Fetch relevant documents from the database to provide context
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Fetch all documents with PDF URLs
      const { data: documents, error } = await supabase
        .from("documents")
        .select("id, title, reference_number, document_type, category, summary, issue_date, pdf_url")
        .order("issue_date", { ascending: false })
        .limit(25);
      
      if (!error && documents && documents.length > 0) {
        documentContext = `\n\n## CBN DOCUMENTS DATABASE (Include PDF URLs in your citations!):\n\n${documents.map((doc: any, idx: number) => 
          `### Document ${idx + 1}:
- Reference: ${doc.reference_number || 'N/A'}
- Title: ${doc.title}
- Type: ${doc.document_type}
- Categories: ${doc.category?.join(', ') || 'General'}
- Issue Date: ${doc.issue_date || 'Unknown'}
- PDF URL: ${doc.pdf_url || 'Not available'}
- Summary: ${doc.summary || 'No summary'}`
        ).join('\n\n')}`;
        
        console.log(`Found ${documents.length} documents for context`);
      } else {
        console.log("No documents found or error:", error);
        documentContext = "\n\n[NOTE: No CBN documents currently in database. Recommend syncing from CBN website.]";
      }
    } catch (dbError) {
      console.error("Error fetching documents:", dbError);
    }

    const systemPromptWithContext = CBN_SYSTEM_PROMPT + documentContext;

    console.log("Calling Lovable AI gateway with document context...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPromptWithContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("Streaming response from AI gateway...");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
