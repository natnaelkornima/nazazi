/**
 * Ethiopian Banking & Mobile Money SMS Parser & Amount Validator
 * Pure utility functions safe for both client and server environments.
 */

export interface ParsedPaymentInput {
  reference: string;
  detectedBank?: 'cbe' | 'telebirr' | 'cbebirr' | 'dashen' | 'boa' | 'awash' | 'siinqee' | 'kaafiebirr' | 'mpesa' | 'auto';
  extractedAmount?: number;
  isSms: boolean;
  rawText: string;
}

export const VALID_SUBSCRIPTION_AMOUNTS = [200, 600, 1000] as const;

export function extractNumericAmount(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) return num;
  }
  return undefined;
}

/**
 * Validates whether an amount qualifies for a Nazazi subscription tier (strictly 200, 600, or 1,000 Birr)
 * and whether it covers the expected plan cost.
 */
export function validateSubscriptionAmount(
  verifiedAmount?: number,
  expectedPlanAmount: number = 200
): {
  isValidTier: boolean;
  isCovered: boolean;
  matchedAmount: number;
  matchedPlanNameAm: string;
  matchedPlanNameEn: string;
  error?: string;
  errorAm?: string;
} {
  if (typeof verifiedAmount !== 'number' || isNaN(verifiedAmount) || verifiedAmount <= 0) {
    // If no bank amount was returned, fallback to expected plan amount if it's a valid tier
    const validExpected = [200, 600, 1000].includes(expectedPlanAmount) ? expectedPlanAmount : 200;
    return {
      isValidTier: true,
      isCovered: true,
      matchedAmount: validExpected,
      matchedPlanNameAm:
        validExpected === 1000
          ? 'የ6 ወር አገልግሎት (1000 ብር)'
          : validExpected === 600
          ? 'የ3 ወር አገልግሎት (600 ብር)'
          : 'የ1 ወር አገልግሎት (200 ብር)',
      matchedPlanNameEn:
        validExpected === 1000
          ? '6 Months Access (1,000 Birr)'
          : validExpected === 600
          ? '3 Months Access (600 Birr)'
          : '1 Month Access (200 Birr)',
    };
  }

  const rounded = Math.round(verifiedAmount);

  // Check 1: Must be exactly 200, 600, or 1000 ETB
  if (![200, 600, 1000].includes(rounded)) {
    return {
      isValidTier: false,
      isCovered: false,
      matchedAmount: rounded,
      matchedPlanNameAm: `${rounded} ብር`,
      matchedPlanNameEn: `${rounded} ETB`,
      error: `Verified payment amount is ${verifiedAmount} ETB. Subscription fees are strictly 200, 600, or 1,000 ETB.`,
      errorAm: `የተረጋገጠው የክፍያ መጠን ${verifiedAmount} ብር ነው። የአገልግሎት ክፍያ በትክክል 200፣ 600 ወይም 1,000 ብር መሆን አለበት።`,
    };
  }

  // Check 2: Check underpayment against chosen plan
  if (rounded < expectedPlanAmount) {
    return {
      isValidTier: true,
      isCovered: false,
      matchedAmount: rounded,
      matchedPlanNameAm:
        rounded === 600 ? 'የ3 ወር አገልግሎት (600 ብር)' : 'የ1 ወር አገልግሎት (200 ብር)',
      matchedPlanNameEn:
        rounded === 600 ? '3 Months Access (600 Birr)' : '1 Month Access (200 Birr)',
      error: `Paid amount of ${rounded} ETB is insufficient for the selected plan (${expectedPlanAmount} ETB).`,
      errorAm: `የተረጋገጠው ክፍያ ${rounded} ብር ሲሆን ለመረጡት እቅድ (${expectedPlanAmount} ብር) በቂ አይደለም። እባክዎ ቀሪውን ይክፈሉ ወይም ተገቢውን እቅድ ይምረጡ።`,
    };
  }

  // Check 3: Valid and covered! Map to corresponding plan
  const planAm =
    rounded === 1000
      ? 'የ6 ወር አገልግሎት (1000 ብር)'
      : rounded === 600
      ? 'የ3 ወር አገልግሎት (600 ብር)'
      : 'የ1 ወር አገልግሎት (200 ብር)';

  const planEn =
    rounded === 1000
      ? '6 Months Access (1,000 Birr)'
      : rounded === 600
      ? '3 Months Access (600 Birr)'
      : '1 Month Access (200 Birr)';

  return {
    isValidTier: true,
    isCovered: true,
    matchedAmount: rounded,
    matchedPlanNameAm: planAm,
    matchedPlanNameEn: planEn,
  };
}

/**
 * Intelligent Ethiopian Banking & Mobile Money SMS Parser
 * 
 * Automatically detects and extracts:
 * 1. Transaction reference / Receipt number / Receipt URL
 * 2. Bank / Provider (Telebirr, CBE, CBE Birr, etc.)
 * 3. Payment amount (e.g. 200, 600, 1000 Birr)
 * 
 * Works for both raw transaction IDs and complete SMS messages in English or Amharic!
 */
export function parseEthiopianPaymentSms(raw: string): ParsedPaymentInput {
  const original = (raw || '').trim();
  if (!original) {
    return { reference: '', isSms: false, rawText: '' };
  }

  // Detect whether this is multi-word SMS text or a single token
  const hasMultipleWords = /\s{2,}|\n/.test(original) || original.split(/\s+/).length > 3;
  const containsSmsKeywords = /(?:customer|transferred|debited|balance|receipt|ግብይት|ትራንዛክሽን|ደንበኛ|ደረሰኝ|ብር|etb|telebirr|cbe)/i.test(original);
  const isSms = hasMultipleWords || containsSmsKeywords;

  let detectedBank: ParsedPaymentInput['detectedBank'] = undefined;
  let reference = '';
  let extractedAmount: number | undefined = undefined;

  // 1. Bank detection keywords
  const lowerText = original.toLowerCase();
  if (
    lowerText.includes('telebirr') ||
    original.includes('ቴሌብር') ||
    original.includes('0953886865')
  ) {
    detectedBank = 'telebirr';
  } else if (
    lowerText.includes('mbreciept') ||
    lowerText.includes('cbe.com.et') ||
    lowerText.includes('commercial bank') ||
    original.includes('ንግድ ባንክ') ||
    original.includes('1000432169948')
  ) {
    detectedBank = 'cbe';
  } else if (lowerText.includes('cbe birr') || lowerText.includes('cbebirr')) {
    detectedBank = 'cbebirr';
  } else if (lowerText.includes('dashen') || original.includes('ዳሸን')) {
    detectedBank = 'dashen';
  } else if (lowerText.includes('abyssinia') || lowerText.includes('boa') || original.includes('አቢሲኒያ')) {
    detectedBank = 'boa';
  } else if (lowerText.includes('awash') || original.includes('አዋሽ')) {
    detectedBank = 'awash';
  } else if (lowerText.includes('mpesa') || lowerText.includes('m-pesa')) {
    detectedBank = 'mpesa';
  }

  // 2. Extract Amount from SMS text if present
  // Matches: "ETB 200.00", "ETB 1,000", "200.00 ETB", "200 ብር", "ብር 200.00", "debited with ETB 200.00", "1,000.00 ብር"
  const amountPatterns = [
    /(?:ETB|Birr|ብር)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:ETB|Birr|ብር)/i,
    /(?:transferred|debited(?:\s+with)?|paid|መጠን|ክፍያ)\s*(?:ETB|Birr|ብር)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
  ];

  for (const pat of amountPatterns) {
    const match = original.match(pat);
    if (match && match[1]) {
      const parsed = extractNumericAmount(match[1]);
      if (parsed && parsed > 0) {
        extractedAmount = parsed;
        break;
      }
    }
  }

  // 3. Extract Reference / Transaction ID

  // A. Check for CBE Receipt URL (full URL or path)
  const cbeUrlMatch = original.match(/(?:https?:\/\/)?(?:www\.)?(?:mbreciept\.cbe\.com\.et|cbe\.com\.et)\/([a-zA-Z0-9_\-]{8,64})/i);
  if (cbeUrlMatch) {
    reference = `https://mbreciept.cbe.com.et/${cbeUrlMatch[1]}`;
    detectedBank = 'cbe';
    return {
      reference,
      detectedBank,
      extractedAmount,
      isSms,
      rawText: original,
    };
  }

  // B. Check for explicit keywords indicating the transaction ID in SMS
  // Examples:
  // "Transaction number: CI72984X12"
  // "Transaction ID: CI72984X12"
  // "Txn Id: CI72984X12"
  // "Receipt ID: fHCxyTVljBclm6Yk4C"
  // "የግብይት ቁጥር CI72984X12"
  // "የትራንዛክሽን ቁጥር: CI72984X12"
  // "የደረሰኝ ቁጥር፡ b8e88ce8334411ee8a32"
  // "Ref: CI72984X12"
  const keywordRegex = /(?:transaction\s*(?:number|no\.?|id|code)?|txn\s*(?:number|no\.?|id|code)?|receipt\s*(?:number|no\.?|id|code)?|reference\s*(?:number|no\.?|id|code)?|ref\b|የግብይት\s*ቁጥር|የትራንዛክሽን\s*(?:ቁጥር|መለያ)|የደረሰኝ\s*(?:ቁጥር|መለያ))\s*[:\-isነው\s]*([A-Za-z0-9_\-]{8,64})/i;
  const keywordMatch = original.match(keywordRegex);
  if (keywordMatch && keywordMatch[1]) {
    reference = keywordMatch[1].replace(/[.,;:\s።]+$/, '').trim();
    if (/^[A-Za-z0-9]{10}$/.test(reference)) {
      if (!detectedBank) detectedBank = 'telebirr';
    } else if (reference.length >= 12 && !detectedBank) {
      detectedBank = 'cbe';
    }
    return {
      reference,
      detectedBank,
      extractedAmount,
      isSms,
      rawText: original,
    };
  }

  // C. Check for legacy CBE FT Reference (e.g. FT24305XXXXX)
  const ftMatch = original.match(/\b(FT[0-9A-Za-z]{8,18})\b/i);
  if (ftMatch) {
    reference = ftMatch[1].toUpperCase();
    detectedBank = 'cbe';
    return {
      reference,
      detectedBank,
      extractedAmount,
      isSms,
      rawText: original,
    };
  }

  // D. Check for Telebirr 10-char alphanumeric transaction code (e.g. CI72984X12)
  const telebirrCodeMatch = original.match(/\b([A-Z]{1,2}[0-9A-Z]{8,9})\b/i);
  if (telebirrCodeMatch && telebirrCodeMatch[1].length === 10) {
    const candidate = telebirrCodeMatch[1].toUpperCase();
    if (/[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) {
      reference = candidate;
      if (!detectedBank) detectedBank = 'telebirr';
      return {
        reference,
        detectedBank,
        extractedAmount,
        isSms,
        rawText: original,
      };
    }
  }

  // E. Standalone token fallback (removes accidental spaces)
  let clean = original.replace(/\s+/g, '');
  if (/^[A-Za-z0-9]{10}$/.test(clean)) {
    reference = clean;
    if (!detectedBank) detectedBank = 'telebirr';
  } else if (/^[A-Za-z0-9_\-]{12,64}$/.test(clean) && !clean.startsWith('FT')) {
    reference = clean;
    if (!detectedBank) detectedBank = 'cbe';
  } else {
    reference = clean;
  }

  return {
    reference,
    detectedBank,
    extractedAmount,
    isSms,
    rawText: original,
  };
}

/**
 * Normalizes Ethiopian transaction references (removes accidental spaces, parses SMS if pasted)
 */
export function normalizeTransactionReference(raw: string): { reference: string; detectedBank?: string; extractedAmount?: number; isSms?: boolean } {
  const parsed = parseEthiopianPaymentSms(raw);
  return {
    reference: parsed.reference,
    detectedBank: parsed.detectedBank,
    extractedAmount: parsed.extractedAmount,
    isSms: parsed.isSms,
  };
}
