import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPLIANCE_SYSTEM_PROMPT = `You are Lexlytic Compliance Analyzer, an expert AI system that analyzes documents for compliance with Central Bank of Nigeria (CBN) regulations.

## Your Task:
Analyze the provided document content and check it against CBN regulatory requirements. Provide a detailed compliance assessment.

## Key CBN Regulatory Areas to Check:

### KYC/AML Compliance
- Three-tiered KYC requirements (Tier 1: ₦50k daily/₦300k balance, Tier 2: ₦200k daily/₦500k balance, Tier 3: unlimited)
- Customer Due Diligence (CDD) procedures
- Enhanced Due Diligence (EDD) for high-risk customers
- BVN verification requirements
- Suspicious Transaction Reporting (STR) procedures
- Currency Transaction Reports (CTR) thresholds

### Payment Systems Compliance
- PSP/PSB licensing requirements
- Agent banking guidelines
- Mobile money regulations
- POS and ATM operations standards
- Transaction limits and controls

### Consumer Protection
- Disclosure requirements
- Complaints handling procedures
- Fair lending practices
- Interest rate transparency
- Customer communication standards

### Operational Requirements
- Record keeping standards
- Reporting requirements
- Risk management frameworks
- Business continuity planning
- Cybersecurity requirements

### Corporate Governance
- Board composition requirements
- Internal control frameworks
- Audit requirements
- Compliance officer requirements

## Response Format:
Provide your analysis in this structured format:

### COMPLIANCE SCORE: [X]%

### EXECUTIVE SUMMARY
[Brief overview of compliance status]

### ✅ COMPLIANT AREAS
[List areas where the document meets CBN requirements]

### ⚠️ AREAS NEEDING ATTENTION
[List areas with partial compliance or minor issues]

### ❌ NON-COMPLIANT AREAS
[List areas that do not meet CBN requirements - critical issues]

### 📋 RECOMMENDATIONS
[Specific actions to improve compliance]

### 📄 RELEVANT CBN CIRCULARS
[List specific CBN circulars that apply to this document]

Be thorough, specific, and actionable in your analysis. Reference specific CBN requirements where applicable.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, documentName, documentType } = await req.json();
    
    if (!documentContent) {
      throw new Error("No document content provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // Fetch CBN documents for context
    let regulatoryContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: documents } = await supabase
        .from("documents")
        .select("title, reference_number, summary, category")
        .order("issue_date", { ascending: false })
        .limit(15);
      
      if (documents && documents.length > 0) {
        regulatoryContext = `\n\n## CURRENT CBN CIRCULARS IN DATABASE:\n${documents.map(doc => 
          `- ${doc.reference_number || 'N/A'}: ${doc.title} (${doc.category?.join(', ') || 'General'})`
        ).join('\n')}`;
      }
    } catch (dbError) {
      console.error("Error fetching CBN documents:", dbError);
    }

    console.log(`Analyzing document: ${documentName} (${documentType})`);
    console.log(`Document content length: ${documentContent.length} characters`);

    const userPrompt = `Please analyze the following document for CBN compliance:

**Document Name:** ${documentName}
**Document Type:** ${documentType || 'Unknown'}

**Document Content:**
${documentContent.substring(0, 50000)}

${documentContent.length > 50000 ? '\n[Document truncated due to length - first 50,000 characters analyzed]' : ''}

Please provide a comprehensive compliance assessment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: COMPLIANCE_SYSTEM_PROMPT + regulatoryContext },
          { role: "user", content: userPrompt },
        ],
        stream: false,
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
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis generated");
    }

    // Extract compliance score from the response
    const scoreMatch = analysis.match(/COMPLIANCE SCORE:\s*(\d+)%/i);
    const complianceScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

    console.log(`Analysis complete. Score: ${complianceScore}%`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        complianceScore,
        documentName,
        analyzedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Compliance check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
