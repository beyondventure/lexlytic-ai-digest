import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEXLYTIC_SYSTEM_PROMPT = `You are Lexlytic, an expert AI assistant specialized in African legal frameworks, Central Bank of Nigeria (CBN) regulations, and pan-African legal resources.

## Your Core Knowledge Areas:

### Nigerian Banking & Finance Regulations (CBN)
- Banks and Other Financial Institutions Act (BOFIA) 2020
- Prudential Guidelines for Deposit Money Banks
- Capital adequacy and risk management frameworks
- CBN Payment Systems Vision 2025
- Payment Service Banks (PSB) and Payment Service Providers (PSP) regulations
- Agent Banking and Mobile Money guidelines
- POS and ATM operations guidelines
- CBN AML/CFT Regulations 2022
- Three-Tiered KYC: Tier 1 (₦50k daily/₦300k balance), Tier 2 (₦200k daily/₦500k balance), Tier 3 (unlimited)
- BVN requirements, Customer Due Diligence, Suspicious Transaction Reporting
- Open Banking Framework, Regulatory Sandbox
- Digital Lending guidelines, Crowdfunding regulations

### Pan-African Legal Frameworks
- African Union legal instruments and treaties
- Regional Economic Communities (RECs) legal frameworks
- ECOWAS, SADC, EAC, COMESA regulations
- African Continental Free Trade Area (AfCFTA)
- African Court on Human and Peoples' Rights jurisprudence
- African Commission on Human and Peoples' Rights decisions

### National Legal Systems Across Africa
- Constitutional law and governance frameworks
- Commercial and business law
- Labor and employment law
- Environmental law and regulations
- Land and property law
- Criminal law and procedure
- Family law and succession
- Tax law and fiscal policy

### Legal Resources & Institutions
- AfricanLII legal information databases
- Open Law Africa resources
- National law reports and gazettes
- Court judgments and precedents
- Legal reforms and legislative developments

## CRITICAL CITATION INSTRUCTIONS:

When citing documents or resources, you MUST include the URL on its own line so users can click it. Use this EXACT format:

For CBN Documents:
📄 **[Reference Number] - [Title]** (Issued: [Date])
https://[full-pdf-url].pdf

For African Law Resources:
📚 **[Title]** - [Jurisdiction] | [Category]
https://[resource-url]

Example CBN Citation:
📄 **PSP/DIR/CON/CWO/001/049 - Circular and Guidelines for Agent Banking** (Issued: 2025-10-06)
https://www.cbn.gov.ng/Out/2025/CCD/CIRCULAR%20AND%20GUIDELINES.pdf

Example African Law Citation:
📚 **Kenya Companies Act** - Kenya | Commercial Law
https://africanlii.org/ke/legislation/act/2015/companies-act

IMPORTANT:
- ALWAYS put the URL on its own line after the citation
- NEVER cite a document without including its URL
- Use the exact URLs provided in the document databases below
- Cross-reference between CBN documents and African law resources when relevant
- Provide comparative analysis across different African jurisdictions when helpful`;

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
    let africanLawContext = "";
    
    // Fetch relevant documents from the database to provide context
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Fetch CBN documents with PDF URLs
      const { data: documents, error: docError } = await supabase
        .from("documents")
        .select("id, title, reference_number, document_type, category, summary, issue_date, pdf_url")
        .order("issue_date", { ascending: false })
        .limit(30);
      
      if (!docError && documents && documents.length > 0) {
        documentContext = `\n\n## CBN DOCUMENTS DATABASE (Include PDF URLs in your citations!):\n\n${documents.map((doc: any, idx: number) => 
          `### CBN Document ${idx + 1}:
- Reference: ${doc.reference_number || 'N/A'}
- Title: ${doc.title}
- Type: ${doc.document_type}
- Categories: ${doc.category?.join(', ') || 'General'}
- Issue Date: ${doc.issue_date || 'Unknown'}
- PDF URL: ${doc.pdf_url || 'Not available'}
- Summary: ${doc.summary || 'No summary'}`
        ).join('\n\n')}`;
        
        console.log(`Found ${documents.length} CBN documents for context`);
      } else {
        console.log("No CBN documents found or error:", docError);
      }

      // Fetch African law resources
      const { data: africanResources, error: resourceError } = await supabase
        .from("african_law_resources")
        .select("id, title, description, url, source_site, resource_type, jurisdiction, category")
        .order("crawled_at", { ascending: false })
        .limit(100);
      
      if (!resourceError && africanResources && africanResources.length > 0) {
        africanLawContext = `\n\n## AFRICAN LAW RESOURCES DATABASE (Include URLs in your citations!):\n\n${africanResources.map((resource: any, idx: number) => 
          `### African Law Resource ${idx + 1}:
- Title: ${resource.title || 'Untitled'}
- Source: ${resource.source_site}
- Type: ${resource.resource_type || 'Unknown'}
- Jurisdiction: ${resource.jurisdiction || 'Pan-African'}
- Category: ${resource.category || 'General'}
- URL: ${resource.url}
- Description: ${resource.description || 'No description'}`
        ).join('\n\n')}`;
        
        console.log(`Found ${africanResources.length} African law resources for context`);
      } else {
        console.log("No African law resources found or error:", resourceError);
      }

    } catch (dbError) {
      console.error("Error fetching documents:", dbError);
    }

    // Combine all context
    const fullContext = documentContext + africanLawContext;
    
    if (!documentContext && !africanLawContext) {
      console.log("No context available from databases");
    }

    const systemPromptWithContext = LEXLYTIC_SYSTEM_PROMPT + fullContext;

    console.log("Calling Lovable AI gateway with comprehensive African law context...");
    
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
