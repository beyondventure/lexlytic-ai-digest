import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, documentContent, documentTitle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing document: ${documentId}`);

    const systemPrompt = `You are a legal document analyst specializing in regulatory compliance. Analyze the provided legal document and extract:

1. **Summary**: A plain-language summary (2-3 paragraphs) explaining what this document is about, who it applies to, and its main purpose.

2. **Key Obligations**: List the main obligations, requirements, or duties imposed by this document. Format as a JSON array of objects with "title" and "description" fields.

3. **Key Penalties**: List any penalties, fines, or consequences for non-compliance. Format as a JSON array of objects with "type", "amount" (if applicable), and "description" fields.

4. **Key Definitions**: Extract important defined terms. Format as a JSON array of objects with "term" and "definition" fields.

5. **Risk Score**: Provide a risk score from 1-100 based on the severity of penalties, compliance complexity, and regulatory importance.

6. **Tags**: Suggest relevant tags for categorization. Format as a JSON array of strings.

Respond in valid JSON format with these fields: summary, key_obligations, key_penalties, key_definitions, risk_score, tags`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Document Title: ${documentTitle}\n\nDocument Content:\n${documentContent.substring(0, 50000)}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Fallback: use the content as summary
      analysis = {
        summary: content,
        key_obligations: [],
        key_penalties: [],
        key_definitions: [],
        risk_score: 50,
        tags: []
      };
    }

    // Update the document with analysis results
    const { error: updateError } = await supabase
      .from("legal_documents")
      .update({
        summary: analysis.summary,
        key_obligations: analysis.key_obligations || [],
        key_penalties: analysis.key_penalties || [],
        key_definitions: analysis.key_definitions || [],
        risk_score: analysis.risk_score || null,
        tags: analysis.tags || [],
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    console.log(`Document ${documentId} analysis completed`);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      documentId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summarize document error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
