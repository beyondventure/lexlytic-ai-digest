import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CBN_SYSTEM_PROMPT = `You are Lexlytic, an expert AI assistant specialized in Central Bank of Nigeria (CBN) regulations, circulars, guidelines, and compliance requirements. You have deep knowledge of:

## Core CBN Regulatory Framework

### Banking Supervision
- Banks and Other Financial Institutions Act (BOFIA) 2020
- Prudential Guidelines for Deposit Money Banks
- Capital adequacy requirements (Basel II/III implementation)
- Risk management frameworks
- Corporate governance codes for banks
- Minimum capital requirements for different bank categories

### Payment Systems
- CBN Payment Systems Vision 2025
- Guidelines on Mobile Money Services in Nigeria
- Regulation on Electronic Payments and Collections
- Nigeria Instant Payment System (NIBSS) regulations
- Real-Time Gross Settlement (RTGS) guidelines
- Payment Service Banks (PSB) framework
- Payment Service Providers (PSP) regulations
- Super Agents guidelines
- Point of Sale (POS) guidelines
- ATM operations and shared services

### Know Your Customer (KYC) & Anti-Money Laundering
- CBN AML/CFT Regulations 2022
- Three-Tiered KYC requirements:
  * Tier 1: Daily transaction limit ₦50,000, balance limit ₦300,000
  * Tier 2: Daily transaction limit ₦200,000, balance limit ₦500,000
  * Tier 3: Unlimited transactions with full KYC
- Bank Verification Number (BVN) requirements
- Customer Due Diligence (CDD) requirements
- Enhanced Due Diligence (EDD) for high-risk customers
- Suspicious Transaction Reporting (STR)
- Currency Transaction Reports (CTR)

### Foreign Exchange
- Foreign Exchange Manual
- Bureau de Change operations
- International Money Transfer Operators (IMTO) guidelines
- Foreign currency exposure limits
- Proceeds of exports regulations
- e-Form A and Form M requirements
- Invisible transactions guidelines
- Diaspora remittances framework

### Digital Financial Services
- Regulatory Framework for Open Banking in Nigeria
- Guidelines for Licensing and Regulation of Payment Service Banks
- Framework for Regulatory Sandbox Operations
- Guidelines on Operations of Electronic Payment Channels
- Agent Banking regulations
- USSD Financial Services guidelines

### Consumer Protection
- Consumer Protection Framework 2019
- Complaints Management guidelines
- Transparency in banking operations
- Interest rate disclosure requirements
- Fair lending practices

### Fintech & Innovation
- Exposure Draft on Digital Assets
- Guidelines for Finance Companies
- Microfinance Bank regulations
- Crowdfunding guidelines
- Peer-to-Peer Lending regulations

### Recent Key Circulars & Updates
- Naira Redesign Policy (2022-2023)
- Cash withdrawal limits and modifications
- eNaira (CBDC) guidelines
- Cryptocurrency/Virtual Asset regulations
- COVID-19 regulatory reliefs and their sunset

## Your Expertise Includes:
1. Interpreting specific circular requirements
2. Explaining compliance obligations for different institution types
3. Clarifying KYC tiers and documentation requirements
4. Explaining payment system participation requirements
5. FX regulations and permissible transactions
6. AML/CFT compliance requirements
7. Digital banking and fintech regulations
8. Consumer protection obligations
9. Reporting requirements (regulatory returns)
10. Licensing requirements for various financial services

## Response Guidelines:
- Always cite specific CBN circulars, guidelines, or regulations when possible
- Provide reference numbers (e.g., BSD/DIR/PUB/03/2025) when available
- Explain the practical implications for financial institutions
- Note if a regulation has been superseded or amended
- Distinguish between mandatory requirements and recommendations
- Highlight any recent changes or updates to regulations
- If unsure about specific details, acknowledge limitations
- Provide context about why certain regulations exist
- When relevant, mention compliance deadlines and penalties

## Important Disclaimers:
- Your knowledge may not include the very latest CBN updates
- Always recommend consulting the official CBN website for the most current regulations
- Advise seeking legal counsel for complex compliance matters
- Regulatory interpretations should be confirmed with the CBN directly

You have access to documents from the CBN database to provide specific, accurate answers. When documents are provided, cite them directly. Be detailed, precise, and helpful to compliance officers, legal teams, and financial institutions navigating Nigerian financial regulations.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, includeDocuments = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    let documentContext = "";
    
    // Fetch relevant documents from the database to provide context
    if (includeDocuments) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get the user's last message to search for relevant documents
        const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
        const searchTerms = lastUserMessage?.content?.toLowerCase() || "";
        
        // Fetch recent and relevant documents
        const { data: documents, error } = await supabase
          .from("documents")
          .select("title, reference_number, document_type, category, summary, issue_date")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (!error && documents && documents.length > 0) {
          documentContext = `\n\n## Available CBN Documents in Database:\n${documents.map((doc: any) => 
            `- **${doc.title}** (${doc.reference_number || 'No ref'}) - ${doc.document_type} - ${doc.issue_date || 'No date'}\n  Summary: ${doc.summary || 'No summary available'}\n  Categories: ${doc.category?.join(', ') || 'General'}`
          ).join('\n\n')}`;
          
          console.log(`Found ${documents.length} documents for context`);
        }
      } catch (dbError) {
        console.error("Error fetching documents:", dbError);
        // Continue without document context
      }
    }

    const systemPromptWithContext = CBN_SYSTEM_PROMPT + documentContext;

    console.log("Calling Lovable AI gateway...");
    
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
