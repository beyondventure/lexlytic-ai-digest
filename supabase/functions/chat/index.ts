import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CBN_SYSTEM_PROMPT = `You are Lexlytic, an expert AI assistant specialized in Central Bank of Nigeria (CBN) regulations, circulars, guidelines, and compliance requirements. You have deep knowledge of Nigerian financial regulations.

## Your Core Knowledge Areas:

### Banking Supervision
- Banks and Other Financial Institutions Act (BOFIA) 2020
- Prudential Guidelines for Deposit Money Banks
- Capital adequacy requirements (Basel II/III implementation)
- Risk management frameworks and corporate governance codes

### Payment Systems
- CBN Payment Systems Vision 2025
- Guidelines on Mobile Money Services in Nigeria
- Payment Service Banks (PSB) and Payment Service Providers (PSP) regulations
- Super Agents and Agent Banking guidelines
- POS and ATM operations guidelines
- Nigeria Instant Payment System (NIBSS) regulations

### KYC & AML/CFT
- CBN AML/CFT Regulations 2022
- Three-Tiered KYC: Tier 1 (₦50k daily/₦300k balance), Tier 2 (₦200k daily/₦500k balance), Tier 3 (unlimited)
- BVN requirements, Customer Due Diligence, Suspicious Transaction Reporting

### Foreign Exchange
- FX Manual, Bureau de Change operations, IMTO guidelines
- Foreign currency exposure limits, e-Form A and Form M requirements

### Fintech & Digital Services
- Open Banking Framework, Regulatory Sandbox
- Digital Lending guidelines, Crowdfunding regulations
- eNaira (CBDC) guidelines

## CRITICAL INSTRUCTIONS FOR RESPONDING:

1. **USE THE PROVIDED DOCUMENTS**: You have access to actual CBN documents from the database. When answering questions, YOU MUST reference these specific documents by their exact titles and reference numbers.

2. **CITE SPECIFIC CIRCULARS**: When you mention a regulation, ALWAYS include:
   - The exact reference number (e.g., PSP/DIR/CON/CWO/001/049)
   - The full document title
   - The issue date if available

3. **FORMAT CITATIONS CLEARLY**: At the end of your response, list all relevant documents in this format:
   📄 [Reference Number] - [Title] (Issued: [Date])

4. **BE SPECIFIC, NOT GENERIC**: Don't give vague answers. Reference the actual circulars that apply. If a document from the database is relevant, cite it explicitly.

5. **FOR FINTECH QUERIES**: Look for documents with categories including "Fintech", "Payments", "PSP", "Digital", "Mobile Money", "Agent Banking" etc.

6. **ACKNOWLEDGE LIMITATIONS**: If you don't have a specific document in the provided database, say so and recommend checking the CBN website directly.

Remember: Users are compliance officers and legal teams who need SPECIFIC circular references they can look up and verify. Generic advice is not helpful - cite the actual regulations.`;

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
    let documentsForCitations: any[] = [];
    
    // Fetch relevant documents from the database to provide context
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get the user's last message to understand context
      const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
      const query = lastUserMessage?.content?.toLowerCase() || "";
      
      // Fetch all documents and let the AI determine relevance
      const { data: documents, error } = await supabase
        .from("documents")
        .select("id, title, reference_number, document_type, category, summary, issue_date, pdf_url")
        .order("issue_date", { ascending: false })
        .limit(25);
      
      if (!error && documents && documents.length > 0) {
        documentsForCitations = documents;
        
        documentContext = `\n\n## CBN DOCUMENTS IN DATABASE (Use these to answer questions - CITE THEM BY REFERENCE NUMBER):\n\n${documents.map((doc: any, idx: number) => 
          `### Document ${idx + 1}:
- **Reference**: ${doc.reference_number || 'N/A'}
- **Title**: ${doc.title}
- **Type**: ${doc.document_type}
- **Categories**: ${doc.category?.join(', ') || 'General'}
- **Issue Date**: ${doc.issue_date || 'Unknown'}
- **Summary**: ${doc.summary || 'No summary'}
- **PDF URL**: ${doc.pdf_url || 'Not available'}`
        ).join('\n\n')}

IMPORTANT: When answering, reference the documents above by their Reference Number and Title. Include the PDF URL in your citations so users can access the actual circular.`;
        
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
