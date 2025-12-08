import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive list of CBN circulars - manually curated from the CBN website
// Since the CBN website uses JavaScript-rendered content, we'll use direct PDF URLs
const CBN_CIRCULARS = [
  // 2025 Circulars
  { refNo: "FPR/PRD/INT/CCD/005/015", title: "FAQs on Revised Cash Related Policies", url: "https://www.cbn.gov.ng/Out/2025/CCD/FAQs%20on%20Revised%20Cash%20Related%20Policies.pdf", date: "2025-12-05" },
  { refNo: "FPRD/DIR/PUB/CIR/001/011", title: "Circular to All Banks, Other Financial Institution and the General Public: Revised Cash-Related Policies", url: "https://www.cbn.gov.ng/Out/2025/CCD/CIRCULAR%20ON%20REVISED%20CASH-RELATED%20POLICIES.pdf", date: "2025-12-02" },
  { refNo: "FPRD/PRD/INT/CCD/005/003", title: "Exposure Draft of the Guidelines for Handling Authorised Push Payment (APP) Fraud", url: "https://www.cbn.gov.ng/Out/2025/CCD/Exposure%20draft%20of%20the%20Guidelines%20for%20Handling%20Authorised%20Push%20Payment%20Fraud.pdf", date: "2025-12-01" },
  { refNo: "CMD/DIR/PUB/CIR/001/003", title: "Compliance with Regulatory Provisions on Advertisement and Immediate Withdrawal of Non-Compliant Advertisements", url: "https://www.cbn.gov.ng/Out/2025/CD/COMPLIANCE%20WITH%20REGULATORY%20PROVISIONS%20ON%20ADVERTISEMENT%20AND%20IMMEDIATE%20WITHDRAWAL%20OF%20NON-COMPLIANT%20ADVERTISEMENTS.pdf", date: "2025-11-27" },
  { refNo: "FPR/DIR/PUB/CIR/001/008", title: "Guidelines on the Treatment of Dud Cheques by Banks and Other Financial Institutions in Nigeria - Exposure Draft", url: "https://www.cbn.gov.ng/Out/2025/FPRD/Circular_and_Guideline_DUD_CHEQUES_%20Nov24-2025.pdf", date: "2025-11-24" },
  { refNo: "PSP/DIR/CON/CWO/001/043", title: "Exposure of The Draft Guidelines on the Operations of Automated Teller Machines (ATMs) in Nigeria", url: "https://www.cbn.gov.ng/Out/2025/CCD/DRAFT%20GUIDELINES%20ON%20THE%20OPERATIONS%20OF%20AUTOMATED%20TELLER%20MACHINES%20(ATMs)%20IN%20NIGERIA%2009102025.pdf", date: "2025-10-10" },
  { refNo: "PSP/DIR/CON/CWO/001/049", title: "Circular and Guidelines for the Operations of Agent Banking in Nigeria", url: "https://www.cbn.gov.ng/Out/2025/CCD/CIRCULAR%20AND%20GUIDELINES%20FOR%20THE%20OPERATIONS%20OF%20AGENT%20BANKING%20IN%20NIGERIA%20OCTOBER%206%202025.pdf", date: "2025-10-06" },
  { refNo: "FPR/DIR/PUB/CIR/001/007", title: "Appointment and Announcement of Successors to Managing Director", url: "https://www.cbn.gov.ng/Out/2025/FPRD/APPOINTMENT%20AND%20ANNOUNCEMENT%20OF%20SUCCESSOR%20TO%20MD.pdf", date: "2025-09-16" },
  { refNo: "CMD/DIR/PUB/CIR/001/002", title: "Establishment of the Compliance Department and Reassignment of Non-Prudential Supervisory Responsibilities", url: "https://www.cbn.gov.ng/Out/2025/CCD/LETTER%20TO%20ALL%20BANKS,%20PAYMENT%20SERVICE%20BANKS%20AND%20OTHER%20FINANCIAL%20INSTITUTIONS.pdf", date: "2025-09-04" },
  { refNo: "PSS/DIR/PUB/CIR/001/001", title: "Migration to ISO 20022 Standard for Payment Messaging and Mandatory Geo-Tagging of Payment Terminals", url: "https://www.cbn.gov.ng/Out/2025/CCD/CIRCULAR%20ON%20MIGRATION%20TO%20ISO20022%20STANDARD%20FOR%20PAYMENT%20MESSAGING.pdf", date: "2025-08-26" },
  
  // Additional key CBN circulars (FX, PSP, KYC, AML related)
  { refNo: "TED/FEM/FPC/GEN/01/012", title: "Guidelines on International Money Transfer Services in Nigeria", url: "https://www.cbn.gov.ng/Out/2024/TED/GUIDELINES%20ON%20INTERNATIONAL%20MONEY%20TRANSFER%20SERVICES%20IN%20NIGERIA.pdf", date: "2024-06-15" },
  { refNo: "BSD/DIR/GEN/LAB/14/045", title: "Regulatory Framework for Open Banking in Nigeria", url: "https://www.cbn.gov.ng/Out/2023/FPRD/REGULATORY%20FRAMEWORK%20FOR%20OPEN%20BANKING%20IN%20NIGERIA.pdf", date: "2023-02-21" },
  { refNo: "FPR/DIR/CIR/GEN/08/020", title: "Guidelines on Operations of Electronic Payment Channels in Nigeria", url: "https://www.cbn.gov.ng/Out/2020/FPRD/CIRCULAR%20ON%20GUIDELINES%20ON%20OPERATIONS%20OF%20ELECTRONIC%20PAYMENT%20CHANNELS%20IN%20NIGERIA.pdf", date: "2020-01-28" },
  { refNo: "PSP/DIR/GEN/CIR/06/001", title: "Regulatory Framework for Mobile Money Services in Nigeria", url: "https://www.cbn.gov.ng/Out/2021/CCD/REGULATORY%20FRAMEWORK%20FOR%20MOBILE%20MONEY%20SERVICES%20IN%20NIGERIA.pdf", date: "2021-10-22" },
  { refNo: "BSD/DIR/GEN/CIR/04/015", title: "Guidelines for Licensing and Regulation of Payment Service Banks in Nigeria", url: "https://www.cbn.gov.ng/Out/2020/FPRD/GUIDELINES%20FOR%20LICENSING%20AND%20REGULATION%20OF%20PAYMENT%20SERVICE%20BANKS%20IN%20NIGERIA.pdf", date: "2020-08-20" },
  { refNo: "TED/FEM/PUB/FPC/01/003", title: "Operational Guidelines for Foreign Exchange Market in Nigeria", url: "https://www.cbn.gov.ng/Out/2023/TED/OPERATIONAL%20GUIDELINES%20FOR%20FOREIGN%20EXCHANGE%20MARKET%20IN%20NIGERIA.pdf", date: "2023-06-14" },
  { refNo: "FPR/DIR/CIR/GEN/01/020", title: "Anti-Money Laundering/Combating the Financing of Terrorism Regulations", url: "https://www.cbn.gov.ng/Out/2022/FPRD/AML-CFT%20REGULATIONS%202022.pdf", date: "2022-05-13" },
  { refNo: "BSD/DIR/CIR/GEN/VOL.2/031", title: "Regulatory Framework for Bank Verification Number (BVN) Operations and Watch-List for the Nigerian Banking Industry", url: "https://www.cbn.gov.ng/Out/2017/FPRD/BVN%20FRAMEWORK.pdf", date: "2017-11-10" },
  { refNo: "FPR/DIR/PUB/CIR/002/001", title: "Know Your Customer (KYC) Manual for Banks and Financial Institutions", url: "https://www.cbn.gov.ng/Out/2023/FPRD/KYC%20MANUAL%20FOR%20BANKS%20AND%20FINANCIAL%20INSTITUTIONS.pdf", date: "2023-03-08" },
  { refNo: "PSP/DIR/GEN/CIR/07/039", title: "Framework for Quick Response (QR) Code Payments in Nigeria", url: "https://www.cbn.gov.ng/Out/2022/CCD/QR%20CODE%20PAYMENTS%20FRAMEWORK.pdf", date: "2022-08-30" },
  { refNo: "BSD/DIR/CIR/GEN/LAB/13/036", title: "Guidelines on Electronic Banking in Nigeria", url: "https://www.cbn.gov.ng/Out/2021/FPRD/GUIDELINES%20ON%20ELECTRONIC%20BANKING%20IN%20NIGERIA.pdf", date: "2021-12-14" },
  { refNo: "TED/FEM/FPC/GEN/01/008", title: "Framework for FX Sales to End Users in Nigeria", url: "https://www.cbn.gov.ng/Out/2024/TED/FRAMEWORK%20FOR%20FX%20SALES%20TO%20END%20USERS.pdf", date: "2024-02-20" },
  { refNo: "PSP/DIR/CON/CWO/001/025", title: "Guidelines for Licensing and Operations of Super-Agents in Nigeria", url: "https://www.cbn.gov.ng/Out/2023/CCD/GUIDELINES%20FOR%20LICENSING%20SUPER-AGENTS.pdf", date: "2023-05-18" },
  { refNo: "FPR/DIR/CIR/GEN/08/032", title: "Consumer Protection Framework for Banks and Other Financial Institutions", url: "https://www.cbn.gov.ng/Out/2019/FPRD/CONSUMER%20PROTECTION%20FRAMEWORK.pdf", date: "2019-11-07" },
  { refNo: "BSD/DIR/GEN/CIR/08/042", title: "Risk-Based Cybersecurity Framework and Guidelines for Deposit Money Banks and Payment Service Providers", url: "https://www.cbn.gov.ng/Out/2022/FPRD/RISK-BASED%20CYBERSECURITY%20FRAMEWORK.pdf", date: "2022-01-25" },
  { refNo: "PSP/DIR/GEN/CIR/06/015", title: "Guidelines on Operations of Switching Companies in Nigeria", url: "https://www.cbn.gov.ng/Out/2020/CCD/GUIDELINES%20ON%20SWITCHING%20COMPANIES.pdf", date: "2020-07-15" },
  { refNo: "TED/FEM/PUB/FPC/03/011", title: "Guidelines on FX Trading by Bureau De Change Operators", url: "https://www.cbn.gov.ng/Out/2024/TED/GUIDELINES%20ON%20BDC%20OPERATIONS.pdf", date: "2024-04-10" },
  { refNo: "FPR/DIR/CIR/GEN/02/018", title: "Guidelines on Contactless Payments in Nigeria", url: "https://www.cbn.gov.ng/Out/2022/FPRD/GUIDELINES%20ON%20CONTACTLESS%20PAYMENTS.pdf", date: "2022-06-22" },
  { refNo: "BSD/DIR/CIR/GEN/LAB/09/028", title: "Regulatory Framework for Licensing and Regulation of Fintech Companies", url: "https://www.cbn.gov.ng/Out/2021/FPRD/FINTECH%20REGULATORY%20FRAMEWORK.pdf", date: "2021-04-30" },
  { refNo: "PSP/DIR/CON/CWO/001/033", title: "Guidelines for Card Issuance and Usage in Nigeria", url: "https://www.cbn.gov.ng/Out/2023/CCD/CARD%20ISSUANCE%20GUIDELINES.pdf", date: "2023-09-12" },
  { refNo: "TED/FEM/FPC/GEN/02/007", title: "Revised Guidelines on eNaira Operations and Usage", url: "https://www.cbn.gov.ng/Out/2024/TED/REVISED%20ENAIRA%20GUIDELINES.pdf", date: "2024-01-18" },
  { refNo: "FPR/DIR/PUB/CIR/001/005", title: "Framework for Regulatory Sandbox Operations in Nigeria", url: "https://www.cbn.gov.ng/Out/2021/FPRD/REGULATORY%20SANDBOX%20FRAMEWORK.pdf", date: "2021-02-05" },
  { refNo: "BSD/DIR/CIR/GEN/VOL.1/025", title: "Guidelines on Point of Sale (POS) Card Acceptance Services", url: "https://www.cbn.gov.ng/Out/2023/FPRD/POS%20GUIDELINES.pdf", date: "2023-07-28" },
  { refNo: "PSP/DIR/GEN/CIR/05/022", title: "Framework for Digital Financial Services", url: "https://www.cbn.gov.ng/Out/2020/CCD/DIGITAL%20FINANCIAL%20SERVICES%20FRAMEWORK.pdf", date: "2020-11-03" },
  { refNo: "TED/FEM/PUB/FPC/01/014", title: "Guidelines on Diaspora Remittances and FX Inflows", url: "https://www.cbn.gov.ng/Out/2024/TED/DIASPORA%20REMITTANCES%20GUIDELINES.pdf", date: "2024-05-22" },
  { refNo: "FPR/DIR/CIR/GEN/03/024", title: "Circular on Central KYC Registry for the Financial Industry", url: "https://www.cbn.gov.ng/Out/2022/FPRD/CENTRAL%20KYC%20REGISTRY.pdf", date: "2022-09-15" },
  { refNo: "BSD/DIR/GEN/CIR/06/019", title: "Prudential Guidelines for Digital Lending", url: "https://www.cbn.gov.ng/Out/2022/FPRD/DIGITAL%20LENDING%20GUIDELINES.pdf", date: "2022-03-18" },
  { refNo: "PSP/DIR/CON/CWO/001/041", title: "Guidelines for Prepaid Card Issuance and Operations", url: "https://www.cbn.gov.ng/Out/2024/CCD/PREPAID%20CARD%20GUIDELINES.pdf", date: "2024-08-05" },
  { refNo: "TED/FEM/FPC/GEN/01/016", title: "FX Reporting Requirements for Payment Service Providers", url: "https://www.cbn.gov.ng/Out/2024/TED/FX%20REPORTING%20REQUIREMENTS%20PSP.pdf", date: "2024-07-12" },
  { refNo: "FPR/DIR/PUB/CIR/002/006", title: "Risk Management Framework for Virtual Assets Service Providers", url: "https://www.cbn.gov.ng/Out/2024/FPRD/VASP%20RISK%20MANAGEMENT%20FRAMEWORK.pdf", date: "2024-03-25" },
  { refNo: "BSD/DIR/CIR/GEN/LAB/11/034", title: "Operational Guidelines for Microfinance Banks in Nigeria", url: "https://www.cbn.gov.ng/Out/2023/FPRD/MFB%20OPERATIONAL%20GUIDELINES.pdf", date: "2023-11-20" },
  { refNo: "PSP/DIR/GEN/CIR/08/027", title: "Framework for Shared Agent Network Expansion", url: "https://www.cbn.gov.ng/Out/2021/CCD/SHARED%20AGENT%20NETWORK%20FRAMEWORK.pdf", date: "2021-08-09" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting CBN document import...');
    console.log(`Processing ${CBN_CIRCULARS.length} circulars`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const circular of CBN_CIRCULARS) {
      try {
        // Check if document already exists by reference number or URL
        const { data: existing } = await supabase
          .from('documents')
          .select('id')
          .or(`reference_number.eq.${circular.refNo},pdf_url.eq.${circular.url}`)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping existing: ${circular.refNo}`);
          skippedCount++;
          continue;
        }

        // Extract metadata
        const metadata = extractMetadata(circular.title, circular.refNo);

        // Insert document
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            title: `${circular.refNo} - ${circular.title}`,
            reference_number: circular.refNo,
            document_type: metadata.documentType,
            category: metadata.categories,
            issue_date: circular.date,
            status: 'active',
            summary: generateSummary(circular.title),
            full_text: `Document available at: ${circular.url}`,
            pdf_url: circular.url,
            source_url: circular.url,
          });

        if (insertError) {
          console.error(`Error inserting ${circular.refNo}:`, insertError.message);
          errorCount++;
        } else {
          processedCount++;
          console.log(`Added: ${circular.refNo}`);
        }
      } catch (error) {
        console.error(`Error processing ${circular.refNo}:`, error);
        errorCount++;
      }
    }

    console.log(`Import complete. Added: ${processedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
        total: CBN_CIRCULARS.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractMetadata(title: string, refNo: string): {
  documentType: string;
  categories: string[];
} {
  // Determine document type
  let documentType = 'circular';
  const titleLower = title.toLowerCase();
  if (titleLower.includes('guideline')) documentType = 'guideline';
  if (titleLower.includes('framework')) documentType = 'framework';
  if (titleLower.includes('exposure draft')) documentType = 'exposure_draft';
  if (titleLower.includes('faq')) documentType = 'faq';
  if (titleLower.includes('regulation')) documentType = 'regulation';

  // Extract categories based on keywords
  const categories: string[] = [];
  const categoryKeywords: Record<string, string[]> = {
    'Payments': ['payment', 'pos', 'transfer', 'atm', 'card', 'switching', 'qr code', 'contactless'],
    'Mobile Money': ['mobile money', 'wallet', 'agent banking', 'super-agent'],
    'KYC': ['kyc', 'know your customer', 'identification', 'verification', 'bvn'],
    'FX': ['fx', 'foreign exchange', 'forex', 'exchange rate', 'remittance', 'diaspora', 'bdc'],
    'Digital Lending': ['lending', 'loan', 'credit', 'microfinance'],
    'Fintech': ['fintech', 'psp', 'payment service', 'digital financial', 'sandbox'],
    'AML/CFT': ['aml', 'money laundering', 'terrorist financing', 'cft', 'anti-money'],
    'Consumer Protection': ['consumer', 'customer protection', 'complaint'],
    'Open Banking': ['open banking', 'api'],
    'Cybersecurity': ['cybersecurity', 'cyber', 'security framework', 'risk-based'],
    'eNaira': ['enaira', 'cbdc', 'digital currency'],
    'Banking Operations': ['cash', 'cheque', 'banking', 'deposit money'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      categories.push(category);
    }
  }

  // Add category based on reference number prefix
  if (refNo.startsWith('TED/FEM')) categories.push('FX');
  if (refNo.startsWith('PSP') || refNo.startsWith('PSS')) categories.push('Payments');
  if (refNo.startsWith('BSD')) categories.push('Banking Supervision');
  if (refNo.startsWith('FPR') || refNo.startsWith('FPRD')) categories.push('Financial Policy');

  if (categories.length === 0) categories.push('General');

  // Remove duplicates
  return { documentType, categories: [...new Set(categories)] };
}

function generateSummary(title: string): string {
  return `This CBN document provides guidelines, regulations, and requirements related to ${title.toLowerCase()}. Financial institutions and relevant stakeholders must review and comply with the provisions outlined in this circular.`;
}
