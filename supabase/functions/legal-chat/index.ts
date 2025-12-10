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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Lexlytic AI, an expert legal assistant specializing in African regulatory law and compliance. You have comprehensive knowledge of:

## African Legal Frameworks:
- Nigeria: CBN regulations, NDPC (Data Protection), NFIU (AML), SEC regulations, FIRS tax laws
- Kenya: CBK regulations, ODPC (Data Protection), FRC (AML), CMA regulations
- South Africa: SARB regulations, POPIA (Data Protection), FICA (AML), FSCA regulations
- Ghana: BoG regulations, Data Protection Act, Financial Intelligence Centre
- Other African jurisdictions: OHADA, EAC regulations, ECOWAS directives

## Key Regulatory Areas:
1. Banking & Financial Services
2. Data Protection & Privacy
3. Anti-Money Laundering (AML/CFT)
4. Securities & Capital Markets
5. Consumer Protection
6. Cybersecurity
7. Tax & Revenue
8. Corporate Governance

## Resources Referenced:
- Open Law Africa (openlawafrica.org)
- AfricanLII (africanlii.org)
- National law gazettes and official government publications
- Central bank circulars and guidelines

## Your Responsibilities:
1. Provide accurate, up-to-date information on African regulations
2. Cite specific laws, sections, and regulatory authorities when possible
3. Explain complex legal concepts in plain language
4. Compare requirements across jurisdictions when relevant
5. Highlight compliance obligations and penalties
6. Note when information may be outdated and recommend verification

Always be helpful, accurate, and professional. If you're unsure about something, say so and recommend consulting official sources or legal counsel.`;

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
          ...messages,
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Legal chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
