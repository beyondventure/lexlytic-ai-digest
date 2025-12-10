import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const languageNames: Record<string, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
  pt: "Portuguese",
  sw: "Swahili",
  ha: "Hausa",
  yo: "Yoruba",
  zu: "Zulu",
  am: "Amharic",
  es: "Spanish",
  de: "German",
  zh: "Chinese",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sourceLanguage = languageNames[sourceLang] || sourceLang;
    const targetLanguage = languageNames[targetLang] || targetLang;

    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`);

    const systemPrompt = `You are a specialized legal translator with expertise in African legal terminology. Your task is to translate legal text while:

1. Preserving legal terminology and their precise meanings
2. Maintaining the structure and formatting of the original text
3. Keeping defined terms (words in quotes or capitalized legal terms) in their original form or providing standardized translations
4. Ensuring that obligations, prohibitions, and penalties are accurately conveyed
5. Using appropriate legal register in the target language

For African languages (Swahili, Hausa, Yoruba, Zulu, Amharic), use commonly accepted legal terminology where it exists, and provide clear translations where no standard term exists.

IMPORTANT: Only output the translation, no explanations or notes.`;

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
          { role: "user", content: `Translate the following legal text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}` }
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
    const translatedText = aiResponse.choices?.[0]?.message?.content;

    if (!translatedText) {
      throw new Error("No translation received");
    }

    console.log("Translation completed successfully");

    return new Response(JSON.stringify({ 
      translatedText,
      sourceLang,
      targetLang,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Translation failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
