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
  storagePath?: string;
}

// Timeout wrapper for fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_RUNTIME_MS = 50000; // 50 seconds max to leave buffer

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let downloadAllPdfs = true;
    try {
      const body = await req.json();
      if (body.downloadAllPdfs !== undefined) downloadAllPdfs = body.downloadAllPdfs;
    } catch {
      // No body provided, use default
    }

    // Helper to check if we should continue or stop due to timeout
    const shouldContinue = () => (Date.now() - startTime) < MAX_RUNTIME_MS;

    // Reduced site list - focus on sites that work well
    const sites = [
      {
        url: "https://africanlii.org/en/",
        name: "African LII",
        mapUrl: "https://africanlii.org"
      },
      {
        url: "https://nigerialii.org/en/",
        name: "Nigerian LII",
        mapUrl: "https://nigerialii.org"
      }
    ];
    
    // Helper to check if URL is a PDF
    const isPdfUrl = (url: string) => {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('saflii.org')) return false;
      return lowerUrl.endsWith('.pdf') || 
             lowerUrl.includes('/source.pdf') ||
             lowerUrl.includes('format=pdf') ||
             lowerUrl.includes('download/pdf') ||
             lowerUrl.includes('/pdf/') ||
             lowerUrl.includes('/akn/') && lowerUrl.includes('source');
    };

    const allResults: CrawlResult[] = [];
    let pdfDownloadCount = 0;

    for (const site of sites) {
      if (!shouldContinue()) {
        console.log('Stopping early due to time limit');
        break;
      }

      console.log(`Mapping site: ${site.url}`);
      
      try {
        // Use Firecrawl Map to discover URLs
        const mapResponse = await fetchWithTimeout('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: site.url,
            limit: 500, // Reduced limit for faster processing
            includeSubdomains: true,
          }),
        }, 15000);

        if (!mapResponse.ok) {
          console.error(`Failed to map ${site.url}:`, await mapResponse.text());
          continue;
        }

        const mapData = await mapResponse.json();
        const urls = mapData.links || mapData.data?.links || [];
        
        console.log(`Found ${urls.length} URLs on ${site.name}`);

        // Process URLs - limit PDF downloads to prevent timeout
        let pdfDownloadsThisSite = 0;
        const maxPdfsPerSite = 10;

        for (const url of urls) {
          if (!shouldContinue()) break;

          const result = parseUrlMetadata(url, site.name);
          
          // Download PDF if it's a PDF and we haven't hit limit
          if (isPdfUrl(url) && downloadAllPdfs && pdfDownloadsThisSite < maxPdfsPerSite) {
            console.log(`Attempting to download PDF: ${url}`);
            const storagePath = await downloadAndStorePdf(supabase, url);
            if (storagePath) {
              result.storagePath = storagePath;
              pdfDownloadCount++;
              pdfDownloadsThisSite++;
              console.log(`PDF stored (${pdfDownloadCount}): ${storagePath}`);
            }
          }
          
          allResults.push(result);
        }

        // Scrape main page for additional context
        if (shouldContinue()) {
          console.log(`Scraping main page: ${site.url}`);
          const scrapeResponse = await fetchWithTimeout('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: site.url,
              formats: ['links'],
              onlyMainContent: true,
            }),
          }, 10000);

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const additionalLinks = scrapeData.data?.links || scrapeData.links || [];
            
            console.log(`Found ${additionalLinks.length} additional links from scrape`);
            
            for (const link of additionalLinks) {
              if (!shouldContinue()) break;
              if (isRelevantLegalLink(link)) {
                const result = parseUrlMetadata(link, site.name);
                if (!allResults.some(r => r.url === result.url)) {
                  allResults.push(result);
                }
              }
            }
          }
        }

      } catch (err) {
        console.error(`Error processing ${site.url}:`, err);
      }
    }

    console.log(`Total resources found: ${allResults.length}, PDFs stored: ${pdfDownloadCount}`);

    // Insert resources into database
    let insertedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < allResults.length; i += batchSize) {
      if (!shouldContinue()) break;

      const batch = allResults.slice(i, i + batchSize).map(r => ({
        url: r.url,
        title: r.title || extractTitleFromUrl(r.url),
        description: r.description,
        source_site: r.url.includes('openlawafrica') ? 'Open Law Africa' : 
                     r.url.includes('africanlii') ? 'African LII' : 
                     r.url.includes('nigerialii') ? 'Nigerian LII' : 
                     r.url.includes('saflii') ? 'SAFLII' : 'Other',
        resource_type: r.resourceType || categorizeResourceType(r.url),
        jurisdiction: r.jurisdiction || extractJurisdiction(r.url),
        category: r.category || categorizeResource(r.url),
        storage_path: r.storagePath || null,
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

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`Completed in ${elapsed}s. Inserted/updated ${insertedCount} resources`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Crawled ${sites.length} sites in ${elapsed}s, found ${allResults.length} resources, stored ${insertedCount}, PDFs downloaded: ${pdfDownloadCount}`,
      totalResources: allResults.length,
      pdfsStored: pdfDownloadCount,
      elapsedSeconds: elapsed,
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

async function downloadAndStorePdf(
  supabase: any,
  pdfUrl: string
): Promise<string | null> {
  try {
    if (pdfUrl.includes('saflii.org') || pdfUrl.includes('kenyalaw.org')) {
      console.log(`Skipping URL due to known issues: ${pdfUrl}`);
      return null;
    }

    const response = await fetchWithTimeout(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
      },
    }, 8000);

    if (!response.ok) {
      console.error(`Failed to download PDF: ${response.status} - ${pdfUrl}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const isLikelyPdf = contentType.includes('pdf') || 
                        contentType.includes('octet-stream') || 
                        pdfUrl.toLowerCase().endsWith('.pdf');
    
    if (!isLikelyPdf) {
      console.log(`Skipping non-PDF content: ${contentType}`);
      return null;
    }

    const pdfBlob = await response.blob();
    const pdfBuffer = await pdfBlob.arrayBuffer();
    
    if (pdfBuffer.byteLength < 1000) {
      console.log(`Skipping small file (${pdfBuffer.byteLength} bytes)`);
      return null;
    }
    
    const urlObj = new URL(pdfUrl);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    const fileName = pathParts[pathParts.length - 1] || 'document.pdf';
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
    
    const folder = pdfUrl.includes('africanlii') ? 'africanlii' : 
                   pdfUrl.includes('nigerialii') ? 'nigerialii' : 'other';
    const storagePath = `${folder}/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('regulatory-pdfs')
      .upload(storagePath, new Uint8Array(pdfBuffer), {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload PDF:`, error.message);
      return null;
    }

    console.log(`Stored PDF: ${storagePath} (${Math.round(pdfBuffer.byteLength / 1024)}KB)`);
    return data.path;
  } catch (error) {
    console.error(`Error downloading PDF:`, error);
    return null;
  }
}

function parseUrlMetadata(url: string, sourceName: string): CrawlResult {
  return {
    url,
    title: extractTitleFromUrl(url),
    jurisdiction: extractJurisdiction(url),
    category: categorizeResource(url),
    resourceType: categorizeResourceType(url),
  };
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
    'ghana': 'Ghana',
    'uganda': 'Uganda',
    'tanzania': 'Tanzania',
    'rwanda': 'Rwanda',
    'zambia': 'Zambia',
    'zimbabwe': 'Zimbabwe',
    'botswana': 'Botswana',
    'namibia': 'Namibia',
    'malawi': 'Malawi',
    'mauritius': 'Mauritius',
    'lesotho': 'Lesotho',
    'ecowas': 'ECOWAS',
    'eac': 'East African Community',
    'sadc': 'SADC',
    'african-union': 'African Union',
    'AfCHPR': 'Pan-African',
    'ECOWASCJ': 'ECOWAS',
  };

  for (const [key, value] of Object.entries(jurisdictions)) {
    if (urlLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return 'Pan-African';
}

function categorizeResource(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('/judgment') || urlLower.includes('/case')) return 'Case Law';
  if (urlLower.includes('/act') || urlLower.includes('/legislation')) return 'Legislation';
  if (urlLower.includes('/regulation')) return 'Regulation';
  if (urlLower.includes('/constitution')) return 'Constitution';
  if (urlLower.includes('/treaty') || urlLower.includes('/protocol')) return 'Treaty';
  if (urlLower.includes('/gazette')) return 'Gazette';
  if (urlLower.includes('/policy') || urlLower.includes('/guideline')) return 'Policy';
  
  return 'Legal Document';
}

function categorizeResourceType(url: string): string {
  if (url.toLowerCase().endsWith('.pdf') || url.includes('/source.pdf')) return 'PDF';
  if (url.toLowerCase().endsWith('.doc') || url.toLowerCase().endsWith('.docx')) return 'Word Document';
  return 'Web Page';
}

function isRelevantLegalLink(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  const excludePatterns = [
    'twitter.com', 'facebook.com', 'linkedin.com', 'youtube.com',
    'login', 'signup', 'register', 'cart', 'checkout',
    '.css', '.js', '.png', '.jpg', '.gif', '.svg', '.ico',
    'mailto:', 'tel:', '#',
  ];
  
  for (const pattern of excludePatterns) {
    if (urlLower.includes(pattern)) return false;
  }
  
  const includePatterns = [
    '/act', '/judgment', '/case', '/legislation', '/law',
    '/regulation', '/treaty', '/protocol', '/constitution',
    '/gazette', '/policy', '/guideline', '/statute',
    '.pdf', '/akn/',
  ];
  
  for (const pattern of includePatterns) {
    if (urlLower.includes(pattern)) return true;
  }
  
  return urlLower.includes('africanlii') || 
         urlLower.includes('nigerialii') || 
         urlLower.includes('openlawafrica');
}
