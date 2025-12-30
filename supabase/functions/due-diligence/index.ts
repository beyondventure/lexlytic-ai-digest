import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents } = await req.json();
    
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

    console.log(`Analyzing ${documents.length} documents for due diligence`);

    const results = [];

    for (const doc of documents) {
      const { name, content } = doc;
      
      if (!content || content.trim().length === 0) {
        results.push({
          name,
          riskScore: 50,
          redFlags: ['Unable to extract document content'],
          summary: 'Document content could not be analyzed.',
          obligations: [],
          recommendations: ['Please ensure the document is readable and try again.']
        });
        continue;
      }

      const truncatedContent = content.slice(0, 30000); // Limit content size

      const analysisPrompt = `You are an expert legal due diligence analyst. Analyze the following legal document and provide a comprehensive due diligence assessment.

Document Name: ${name}

Document Content:
${truncatedContent}

Provide your analysis in the following JSON format only (no other text):
{
  "riskScore": <number 0-100, where 0 is no risk and 100 is critical risk>,
  "redFlags": [<array of specific red flags or concerns found in the document>],
  "summary": "<concise executive summary of the document's legal implications>",
  "obligations": [<array of key legal obligations identified>],
  "recommendations": [<array of actionable recommendations for compliance>],
  "jurisdiction": "<identified jurisdiction if any>",
  "documentType": "<type of legal document: contract, regulation, policy, etc.>",
  "keyTerms": [<array of important legal terms or definitions found>]
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
            { role: "system", content: "You are a legal due diligence expert. Always respond with valid JSON only." },
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
            recommendations: ['Please wait a moment and try again.']
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

      // Parse the JSON response
      let analysis;
      try {
        // Extract JSON from the response (handle markdown code blocks)
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
          recommendations: ['Please review the document manually']
        };
      }

      results.push({
        name,
        riskScore: analysis.riskScore || 50,
        redFlags: analysis.redFlags || [],
        summary: analysis.summary || 'Analysis completed.',
        obligations: analysis.obligations || [],
        recommendations: analysis.recommendations || [],
        jurisdiction: analysis.jurisdiction,
        documentType: analysis.documentType,
        keyTerms: analysis.keyTerms || []
      });
    }

    // Calculate overall analysis
    const avgRisk = Math.round(
      results.reduce((acc, r) => acc + r.riskScore, 0) / results.length
    );

    const allRedFlags = [...new Set(results.flatMap(r => r.redFlags))];
    const allObligations = [...new Set(results.flatMap(r => r.obligations))];
    const allRecommendations = [...new Set(results.flatMap(r => r.recommendations))];

    // Generate overall summary
    const overallSummaryPrompt = `Based on analyzing ${results.length} legal documents with an average risk score of ${avgRisk}/100, summarize the overall due diligence findings in 2-3 sentences. Key red flags identified: ${allRedFlags.slice(0, 5).join(', ')}. Provide only the summary text, no JSON.`;

    let overallSummary = `Analysis of ${results.length} document${results.length > 1 ? 's' : ''} reveals ${avgRisk >= 60 ? 'significant' : avgRisk >= 40 ? 'moderate' : 'minimal'} compliance risks.`;

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
        redFlags: allRedFlags.slice(0, 10),
        obligations: allObligations.slice(0, 10),
        recommendations: allRecommendations.slice(0, 10)
      }
    };

    console.log("Due diligence analysis complete");

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
