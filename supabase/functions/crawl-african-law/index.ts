import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawlResult {
  url: string;
  title?: string;
  description?: string;
  jurisdiction?: string;
  category?: string;
  resourceType?: string;
}

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

    // Sites to crawl
    const sites = [
      {
        url: "https://www.openlawafrica.org/african-law-index",
        name: "Open Law Africa"
      },
      {
        url: "https://africanlii.org/en/",
        name: "African Legal Information Institute"
      }
    ];

    const allResults: CrawlResult[] = [];

    for (const site of sites) {
      console.log(`Mapping site: ${site.url}`);
      
      try {
        // Use Firecrawl Map to discover all URLs on the site
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: site.url,
            limit: 5000, // Get as many URLs as possible
            includeSubdomains: true,
          }),
        });

        if (!mapResponse.ok) {
          console.error(`Failed to map ${site.url}:`, await mapResponse.text());
          continue;
        }

        const mapData = await mapResponse.json();
        const urls = mapData.links || mapData.data?.links || [];
        
        console.log(`Found ${urls.length} URLs on ${site.name}`);

        // Process each URL
        for (const url of urls) {
          // Extract metadata from URL path
          const result = parseUrlMetadata(url, site.name);
          allResults.push(result);
        }

        // Also scrape the main page to get additional links and context
        console.log(`Scraping main page: ${site.url}`);
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: site.url,
            formats: ['markdown', 'links'],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const additionalLinks = scrapeData.data?.links || scrapeData.links || [];
          
          console.log(`Found ${additionalLinks.length} additional links from scrape`);
          
          for (const link of additionalLinks) {
            // Filter for relevant legal resource links
            if (isRelevantLegalLink(link)) {
              const result = parseUrlMetadata(link, site.name);
              // Check if not already in results
              if (!allResults.some(r => r.url === result.url)) {
                allResults.push(result);
              }
            }
          }
        }

      } catch (err) {
        console.error(`Error processing ${site.url}:`, err);
      }
    }

    console.log(`Total resources found: ${allResults.length}`);

    // Insert resources into database
    let insertedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize).map(r => ({
        url: r.url,
        title: r.title || extractTitleFromUrl(r.url),
        description: r.description,
        source_site: r.url.includes('openlawafrica') ? 'Open Law Africa' : 
                     r.url.includes('africanlii') ? 'African LII' : 'Other',
        resource_type: r.resourceType || categorizeResourceType(r.url),
        jurisdiction: r.jurisdiction || extractJurisdiction(r.url),
        category: r.category || categorizeResource(r.url),
      }));

      const { error } = await supabase
        .from('african_law_resources')
        .upsert(batch, { 
          onConflict: 'url',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error inserting batch ${i / batchSize}:`, error);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`Successfully inserted/updated ${insertedCount} resources`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Crawled ${sites.length} sites, found ${allResults.length} resources, stored ${insertedCount}`,
      totalResources: allResults.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Crawl error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Crawling failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseUrlMetadata(url: string, sourceName: string): CrawlResult {
  const result: CrawlResult = {
    url,
    title: extractTitleFromUrl(url),
    jurisdiction: extractJurisdiction(url),
    category: categorizeResource(url),
    resourceType: categorizeResourceType(url),
  };
  return result;
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\.html?$/i, '')
        .replace(/\.pdf$/i, ' (PDF)')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return urlObj.hostname;
  } catch {
    return url;
  }
}

function extractJurisdiction(url: string): string {
  const urlLower = url.toLowerCase();
  
  const jurisdictions: Record<string, string> = {
    'nigeria': 'Nigeria',
    'kenya': 'Kenya',
    'south-africa': 'South Africa',
    'southafrica': 'South Africa',
    'ghana': 'Ghana',
    'uganda': 'Uganda',
    'tanzania': 'Tanzania',
    'rwanda': 'Rwanda',
    'ethiopia': 'Ethiopia',
    'zambia': 'Zambia',
    'zimbabwe': 'Zimbabwe',
    'botswana': 'Botswana',
    'namibia': 'Namibia',
    'malawi': 'Malawi',
    'mozambique': 'Mozambique',
    'mauritius': 'Mauritius',
    'seychelles': 'Seychelles',
    'lesotho': 'Lesotho',
    'eswatini': 'Eswatini',
    'swaziland': 'Eswatini',
    'angola': 'Angola',
    'cameroon': 'Cameroon',
    'senegal': 'Senegal',
    'ivory-coast': 'Ivory Coast',
    'cote-divoire': 'Ivory Coast',
    'mali': 'Mali',
    'niger': 'Niger',
    'burkina-faso': 'Burkina Faso',
    'benin': 'Benin',
    'togo': 'Togo',
    'liberia': 'Liberia',
    'sierra-leone': 'Sierra Leone',
    'gambia': 'Gambia',
    'guinea': 'Guinea',
    'drc': 'DR Congo',
    'congo': 'Congo',
    'egypt': 'Egypt',
    'morocco': 'Morocco',
    'algeria': 'Algeria',
    'tunisia': 'Tunisia',
    'libya': 'Libya',
    'sudan': 'Sudan',
    'south-sudan': 'South Sudan',
    'somalia': 'Somalia',
    'eritrea': 'Eritrea',
    'djibouti': 'Djibouti',
    'ecowas': 'ECOWAS',
    'eac': 'East African Community',
    'sadc': 'SADC',
    'ohada': 'OHADA',
    'comesa': 'COMESA',
    'african-union': 'African Union',
    'au': 'African Union',
  };

  for (const [key, value] of Object.entries(jurisdictions)) {
    if (urlLower.includes(key)) {
      return value;
    }
  }
  
  return 'Pan-African';
}

function categorizeResource(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('constitution')) return 'Constitution';
  if (urlLower.includes('legislation') || urlLower.includes('act') || urlLower.includes('law')) return 'Legislation';
  if (urlLower.includes('case') || urlLower.includes('judgment') || urlLower.includes('ruling')) return 'Case Law';
  if (urlLower.includes('regulation') || urlLower.includes('directive')) return 'Regulations';
  if (urlLower.includes('treaty') || urlLower.includes('convention') || urlLower.includes('protocol')) return 'Treaties';
  if (urlLower.includes('gazette')) return 'Government Gazette';
  if (urlLower.includes('bill')) return 'Bills';
  if (urlLower.includes('policy')) return 'Policy Documents';
  if (urlLower.includes('guideline')) return 'Guidelines';
  
  return 'Legal Document';
}

function categorizeResourceType(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.endsWith('.pdf')) return 'PDF';
  if (urlLower.includes('/search')) return 'Search Page';
  if (urlLower.includes('/index') || urlLower.includes('/list')) return 'Index';
  if (urlLower.includes('/about') || urlLower.includes('/contact')) return 'Information';
  
  return 'Web Page';
}

function isRelevantLegalLink(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  // Exclude non-legal pages
  const excludePatterns = [
    'login', 'signup', 'register', 'cart', 'checkout',
    'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com',
    'mailto:', 'tel:', 'javascript:', '#',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
    '.css', '.js', '.json', '.xml',
  ];
  
  for (const pattern of excludePatterns) {
    if (urlLower.includes(pattern)) {
      return false;
    }
  }
  
  // Include if from target domains
  return (
    urlLower.includes('africanlii.org') ||
    urlLower.includes('openlawafrica.org') ||
    urlLower.includes('lawsofnigeria') ||
    urlLower.includes('kenyalaw') ||
    urlLower.includes('saflii') ||
    urlLower.includes('ulii') ||
    urlLower.includes('tanzlii') ||
    urlLower.includes('zimlii') ||
    urlLower.includes('lesotholii') ||
    urlLower.includes('namiblii') ||
    urlLower.includes('malawilii') ||
    urlLower.includes('seylii') ||
    urlLower.includes('eswatinilii') ||
    urlLower.includes('swaziland') ||
    urlLower.includes('ghalii') ||
    urlLower.includes('sierralii') ||
    urlLower.includes('liberlii') ||
    urlLower.includes('gambia') ||
    urlLower.includes('lawreports')
  );
}
