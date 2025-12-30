import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LegalDocument {
  id: string;
  title: string;
  summary: string | null;
  source_url: string | null;
  document_type: string;
  category: string[] | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents, jurisdiction } = await req.json();
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No documents provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client to fetch real laws
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Analyzing ${documents.length} documents for due diligence`);

    // Fetch relevant laws from the database for context
    const { data: platformLaws, error: lawsError } = await supabase
      .from('documents')
      .select('id, title, summary, source_url, document_type, category')
      .limit(50);

    if (lawsError) {
      console.error('Error fetching platform laws:', lawsError);
    }

    const lawsContext = platformLaws && platformLaws.length > 0
      ? platformLaws.map((law: LegalDocument) => ({
          id: law.id,
          title: law.title,
          summary: law.summary,
          source_url: law.source_url,
          document_type: law.document_type,
          category: law.category,
        }))
      : [];

    console.log(`Found ${lawsContext.length} platform laws for reference`);

    // Build regulatory context string for the AI
    const regulatoryContextStr = lawsContext.length > 0
      ? `\n\nREFERENCE REGULATIONS FROM LEXLYTIC DATABASE:\n${lawsContext.map((law: LegalDocument, i: number) => 
          `${i + 1}. ${law.title} (${law.document_type})${law.category ? ` - Categories: ${law.category.join(', ')}` : ''}\n   Summary: ${law.summary || 'No summary available'}\n   Source: ${law.source_url || 'N/A'}`
        ).join('\n\n')}`
      : '';

    const results = [];
    const allCitations: Array<{title: string; url: string; relevance: string}> = [];

    for (const doc of documents) {
      const { name, content } = doc;
      
      if (!content || content.trim().length === 0) {
        results.push({
          name,
          riskScore: 50,
          redFlags: ['Unable to extract document content'],
          summary: 'Document content could not be analyzed.',
          obligations: [],
          recommendations: ['Please ensure the document is readable and try again.'],
          citations: []
        });
        continue;
      }

      const truncatedContent = content.slice(0, 25000);

      const analysisPrompt = `You are an expert legal due diligence analyst for Lexlytic, a regulatory intelligence platform. Analyze the following document against the reference regulations provided.

DOCUMENT TO ANALYZE:
Name: ${name}
Content:
${truncatedContent}
${regulatoryContextStr}

INSTRUCTIONS:
1. Analyze the document for legal risks, compliance gaps, and red flags
2. Cross-reference with the Lexlytic database regulations above where relevant
3. Provide specific citations to relevant regulations with their source URLs
4. Identify key legal obligations and compliance requirements
5. Provide actionable recommendations

Respond with ONLY valid JSON in this exact format:
{
  "riskScore": <number 0-100, higher = more risk>,
  "redFlags": ["<specific red flag 1>", "<specific red flag 2>"],
  "summary": "<2-3 sentence executive summary of findings>",
  "obligations": ["<legal obligation 1>", "<legal obligation 2>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>"],
  "jurisdiction": "<identified jurisdiction or 'Nigeria' if unclear>",
  "documentType": "<contract/policy/regulation/agreement/other>",
  "keyTerms": ["<important term 1>", "<important term 2>"],
  "citations": [
    {"title": "<regulation title from database>", "url": "<source_url>", "relevance": "<why this regulation is relevant>"}
  ]
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: "You are a legal due diligence expert for Lexlytic. Always respond with valid JSON only. Reference specific regulations from the database when applicable and include their source URLs as citations." 
            },
            { role: "user", content: analysisPrompt }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("Rate limit exceeded");
          results.push({
            name,
            riskScore: 50,
            redFlags: ['Rate limit exceeded - try again later'],
            summary: 'Analysis temporarily unavailable due to rate limits.',
            obligations: [],
            recommendations: ['Please wait a moment and try again.'],
            citations: []
          });
          continue;
        }
        const errorText = await response.text();
        console.error(`AI gateway error for ${name}:`, response.status, errorText);
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices?.[0]?.message?.content || '';
      
      console.log(`Raw analysis for ${name}:`, analysisText.slice(0, 500));

      let analysis;
      try {
        let jsonStr = analysisText;
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.split('```json')[1].split('```')[0];
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.split('```')[1].split('```')[0];
        }
        analysis = JSON.parse(jsonStr.trim());
      } catch (parseError) {
        console.error(`Failed to parse analysis for ${name}:`, parseError);
        analysis = {
          riskScore: 45,
          redFlags: ['Analysis parsing error - manual review recommended'],
          summary: analysisText.slice(0, 500),
          obligations: [],
          recommendations: ['Please review the document manually'],
          citations: []
        };
      }

      // Collect citations
      if (analysis.citations && Array.isArray(analysis.citations)) {
        allCitations.push(...analysis.citations);
      }

      results.push({
        name,
        riskScore: analysis.riskScore || 50,
        redFlags: analysis.redFlags || [],
        summary: analysis.summary || 'Analysis completed.',
        obligations: analysis.obligations || [],
        recommendations: analysis.recommendations || [],
        jurisdiction: analysis.jurisdiction || 'Nigeria',
        documentType: analysis.documentType || 'Unknown',
        keyTerms: analysis.keyTerms || [],
        citations: analysis.citations || []
      });
    }

    // Calculate overall analysis
    const avgRisk = Math.round(
      results.reduce((acc, r) => acc + r.riskScore, 0) / results.length
    );

    const allRedFlags = [...new Set(results.flatMap(r => r.redFlags))];
    const allObligations = [...new Set(results.flatMap(r => r.obligations))];
    const allRecommendations = [...new Set(results.flatMap(r => r.recommendations))];

    // Deduplicate citations
    const uniqueCitations = allCitations.reduce((acc: Array<{title: string; url: string; relevance: string}>, citation) => {
      if (!acc.find(c => c.title === citation.title)) {
        acc.push(citation);
      }
      return acc;
    }, []);

    // Generate overall summary with regulatory context
    const overallSummaryPrompt = `Based on analyzing ${results.length} legal documents with an average risk score of ${avgRisk}/100:

Key findings:
- Red flags: ${allRedFlags.slice(0, 5).join('; ')}
- Key obligations: ${allObligations.slice(0, 3).join('; ')}

Referenced regulations: ${uniqueCitations.slice(0, 5).map(c => c.title).join(', ')}

Generate a 3-4 sentence executive summary for a due diligence report. Be specific about risks and regulatory implications. Provide only the summary text, no JSON.`;

    let overallSummary = `Analysis of ${results.length} document${results.length > 1 ? 's' : ''} reveals ${avgRisk >= 60 ? 'significant' : avgRisk >= 40 ? 'moderate' : 'minimal'} compliance risks based on cross-referencing with ${uniqueCitations.length} relevant regulations in the Lexlytic database.`;

    try {
      const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: overallSummaryPrompt }
          ],
        }),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        overallSummary = summaryData.choices?.[0]?.message?.content || overallSummary;
      }
    } catch (e) {
      console.error("Failed to generate overall summary:", e);
    }

    const response_data = {
      success: true,
      documents: results,
      overall: {
        riskScore: avgRisk,
        summary: overallSummary,
        redFlags: allRedFlags.slice(0, 15),
        obligations: allObligations.slice(0, 15),
        recommendations: allRecommendations.slice(0, 15),
        citations: uniqueCitations.slice(0, 20)
      }
    };

    console.log("Due diligence analysis complete with", uniqueCitations.length, "citations");

    return new Response(JSON.stringify(response_data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Due diligence error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
