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
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // URLs to scrape from African legal resources
    const sources = [
      {
        url: "https://africanlii.org/countries",
        jurisdiction: "Pan-African",
        type: "Index"
      },
      {
        url: "https://lawsofnigeria.placng.org/laws/",
        jurisdiction: "Nigeria",
        type: "Legislation"
      }
    ];

    const results = [];

    for (const source of sources) {
      console.log(`Scraping: ${source.url}`);
      
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: source.url,
            formats: ['markdown', 'links'],
            onlyMainContent: true,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to scrape ${source.url}:`, await response.text());
          continue;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          results.push({
            source: source.url,
            jurisdiction: source.jurisdiction,
            type: source.type,
            content: data.data.markdown?.substring(0, 5000),
            links: data.data.links?.slice(0, 50),
          });

          // Parse and store regulatory alerts from the content
          if (data.data.markdown) {
            // Extract potential regulation titles
            const titleMatches = data.data.markdown.match(/#{1,3}\s+(.+)/g) || [];
            
            for (const match of titleMatches.slice(0, 5)) {
              const title = match.replace(/#{1,3}\s+/, '').trim();
              if (title.length > 10 && title.length < 200) {
                // Insert as regulatory alert
                await supabase.from('regulatory_alerts').upsert({
                  title: title,
                  jurisdiction: source.jurisdiction,
                  description: `Scraped from ${source.url}`,
                  severity: 'medium',
                  source_url: source.url,
                }, { onConflict: 'title' }).select();
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error scraping ${source.url}:`, err);
      }
    }

    // Also add some hardcoded African law resources
    const sampleAlerts = [
      {
        title: "Nigeria Data Protection Act 2023",
        jurisdiction: "Nigeria",
        description: "Comprehensive data protection legislation establishing the Nigeria Data Protection Commission (NDPC) with powers to regulate processing of personal data.",
        severity: "high",
        source_url: "https://africanlii.org",
        sector: "Data Protection"
      },
      {
        title: "Kenya Data Protection Act 2019",
        jurisdiction: "Kenya",
        description: "Establishes the Office of the Data Protection Commissioner and sets out principles for processing personal data in Kenya.",
        severity: "high",
        source_url: "https://africanlii.org",
        sector: "Data Protection"
      },
      {
        title: "South Africa POPIA Regulations 2021",
        jurisdiction: "South Africa",
        description: "Protection of Personal Information Act regulations governing the processing of personal information by public and private bodies.",
        severity: "high",
        source_url: "https://africanlii.org",
        sector: "Data Protection"
      },
      {
        title: "CBN Cybersecurity Guidelines for Financial Institutions",
        jurisdiction: "Nigeria",
        description: "Central Bank of Nigeria guidelines on cybersecurity risk management framework for all financial institutions.",
        severity: "high",
        source_url: "https://www.cbn.gov.ng",
        sector: "Banking"
      },
      {
        title: "Ghana Anti-Money Laundering Act 2020",
        jurisdiction: "Ghana",
        description: "Updated AML legislation with enhanced due diligence requirements and suspicious transaction reporting obligations.",
        severity: "medium",
        source_url: "https://africanlii.org",
        sector: "Banking"
      },
      {
        title: "EAC Competition Act 2006",
        jurisdiction: "East Africa",
        description: "Regional competition law for the East African Community member states.",
        severity: "medium",
        source_url: "https://africanlii.org",
        sector: "Competition"
      },
      {
        title: "OHADA Uniform Act on Commercial Companies",
        jurisdiction: "OHADA",
        description: "Harmonized business law for 17 African countries covering company formation and governance.",
        severity: "medium",
        source_url: "https://www.ohada.org",
        sector: "Corporate"
      },
      {
        title: "Nigeria Finance Act 2023",
        jurisdiction: "Nigeria",
        description: "Annual finance legislation introducing changes to tax rates, exemptions, and compliance requirements.",
        severity: "medium",
        source_url: "https://africanlii.org",
        sector: "Tax"
      },
      {
        title: "Rwanda Data Protection Law 2021",
        jurisdiction: "Rwanda",
        description: "Comprehensive data protection framework for the Republic of Rwanda.",
        severity: "medium",
        source_url: "https://africanlii.org",
        sector: "Data Protection"
      },
      {
        title: "ECOWAS Banking Directive",
        jurisdiction: "West Africa",
        description: "Regional banking regulations for Economic Community of West African States member countries.",
        severity: "medium",
        source_url: "https://africanlii.org",
        sector: "Banking"
      }
    ];

    for (const alert of sampleAlerts) {
      await supabase.from('regulatory_alerts').upsert(alert, { 
        onConflict: 'title',
        ignoreDuplicates: false 
      });
    }

    console.log(`Scraping completed. Processed ${results.length} sources.`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Scraped ${results.length} sources and added sample African law data`,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Scraping failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
