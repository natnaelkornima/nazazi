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
    return {
      isValidTier: false,
      isCovered: false,
      matchedAmount: 0,
      matchedPlanNameAm: 'ያልተረጋገጠ የክፍያ መጠን',
      matchedPlanNameEn: 'Unverified Amount',
      error:
        'Verified payment amount was not found in the transaction record. Subscription amount must strictly be confirmed as 200, 600, or 1,000 ETB.',
      errorAm:
        'የትራንዛክሽኑ የክፍያ መጠን በባንክ ማረጋገጫ ውስጥ አልተገኘም። የአገልግሎት ክፍያ በትክክል 200፣ 600 ወይም 1,000 ብር መሆኑ መረጋገጥ አለበት።',
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

export const OFFICIAL_NAZAZI_ACCOUNTS = {
  cbe: {
    bank: 'cbe',
    accountNumber: '1000432169948',
    holder: 'Eyuel Habtamu Enyew',
  },
  telebirr: {
    bank: 'telebirr',
    accountNumber: '0953886865',
    normalizedPhone: '251953886865',
    holder: 'Abel Merga Gonder',
  },
} as const;

/**
 * Checks if an account or phone number (masked or unmasked) matches the official Telebirr account:
 * - 0953886865 / 251953886865 / +251953886865
 * - Masked formats: 2519****6865, 09****6865, 2519***6865, 2519XXXX6865, 095****6865, etc.
 */
export function isMatchingTelebirrAccount(account?: string): boolean {
  if (!account) return false;
  const str = account.trim();

  // 1. Direct digit match
  const digitsOnly = str.replace(/[^0-9]/g, '');
  if (
    digitsOnly === '0953886865' ||
    digitsOnly === '251953886865' ||
    digitsOnly.endsWith('953886865') ||
    digitsOnly.endsWith('53886865')
  ) {
    return true;
  }

  // 2. Masked phone matching (Telebirr standard output in SMS and API)
  const lower = str.toLowerCase();
  const endsWith6865 =
    lower.endsWith('6865') ||
    lower.endsWith('86865') ||
    lower.endsWith('886865');

  const startsWithTelebirrPrefix =
    lower.startsWith('2519') ||
    lower.startsWith('+2519') ||
    lower.startsWith('09') ||
    lower.startsWith('95') ||
    lower.startsWith('*') ||
    lower.startsWith('x');

  if (endsWith6865 && startsWithTelebirrPrefix) {
    return true;
  }

  // Regex pattern matching: e.g. 2519****6865, 09****6865, +2519****6865
  if (/^(?:\+?2519|095|09|\*)[\s*xX\-._]+(?:886865|86865|6865)$/.test(str)) {
    return true;
  }

  return false;
}

/**
 * Checks if an account number (masked or unmasked) matches the official CBE account:
 * - 1000432169948 / 432169948
 * - Masked formats: 1000****69948, 10004****9948, 1000******9948, 1000XXXX69948, etc.
 */
export function isMatchingCbeAccount(account?: string): boolean {
  if (!account) return false;
  const str = account.trim();

  // 1. Direct digit match
  const digitsOnly = str.replace(/[^0-9]/g, '');
  if (
    digitsOnly === '1000432169948' ||
    digitsOnly.endsWith('1000432169948') ||
    digitsOnly.endsWith('432169948')
  ) {
    return true;
  }

  // 2. Masked CBE account matching
  const lower = str.toLowerCase();
  const endsWithCbeSuffix =
    lower.endsWith('69948') ||
    lower.endsWith('9948') ||
    lower.endsWith('169948') ||
    lower.endsWith('2169948');

  const startsWith1000 =
    lower.startsWith('1000') ||
    lower.startsWith('10004') ||
    lower.startsWith('*') ||
    lower.startsWith('x');

  if (endsWithCbeSuffix && startsWith1000) {
    return true;
  }

  if (/^1000[0-9]*[\s*xX\-._]+(?:69948|9948)$/.test(str)) {
    return true;
  }

  return false;
}

export function isMatchingTelebirrHolder(name?: string): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    n.includes('abel') ||
    n.includes('merga') ||
    n.includes('gonder') ||
    n.includes('አቤል') ||
    n.includes('መርጋ') ||
    n.includes('ጎንደር') ||
    n.includes('nazazi') ||
    n.includes('ናዛዚ')
  );
}

export function isMatchingCbeHolder(name?: string): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    n.includes('eyuel') ||
    n.includes('eyu') ||
    n.includes('habtamu') ||
    n.includes('enyew') ||
    n.includes('እዩኤል') ||
    n.includes('ሀብታሙ') ||
    n.includes('እኘው') ||
    n.includes('እንየው') ||
    n.includes('nazazi') ||
    n.includes('ናዛዚ')
  );
}

export interface ReceiverValidationResult {
  isValidReceiver: boolean;
  matchedAccount?: string;
  matchedHolder?: string;
  error?: string;
  errorAm?: string;
}

/**
 * Validates that the transaction was made to the official accounts displayed on the website:
 * - CBE: 1000432169948 (Account Holder: Eyuel Habtamu Enyew)
 * - Telebirr: 0953886865 (Account Holder: Abel Merga Gonder)
 * 
 * Supports both full and masked numbers (e.g. 2519****6865 or 1000****69948) returned by banks.
 */
export function validatePaymentReceiver(
  verification: {
    receiverName?: string;
    receiverAccount?: string;
    settlementAccountMatch?: { matched?: boolean; ambiguous?: boolean; reason?: string };
    bank?: string;
  },
  fallbackBank?: string
): ReceiverValidationResult {
  const receiverAcc = (verification.receiverAccount || '').trim();
  const rawReceiverName = (verification.receiverName || '').trim().toLowerCase();
  const detectedBank = (verification.bank || fallbackBank || '').toLowerCase();

  const isCbeAcc = isMatchingCbeAccount(receiverAcc);
  const isTelebirrAcc = isMatchingTelebirrAccount(receiverAcc);

  const isCbeName = isMatchingCbeHolder(rawReceiverName);
  const isTelebirrName = isMatchingTelebirrHolder(rawReceiverName);

  const isBankCbe = detectedBank === 'cbe' || detectedBank.includes('commercial');
  const isBankTelebirr = detectedBank === 'telebirr';

  // 1. Account Number Validation
  // If an account number was returned, check if it matches official website accounts (full or masked e.g. 2519****6865)
  if (receiverAcc && receiverAcc.length >= 6) {
    if (!isCbeAcc && !isTelebirrAcc) {
      // It is confirmed to belong to a third party account
      return {
        isValidReceiver: false,
        error: `Payment was credited to account ${receiverAcc}, which does not match the official accounts (CBE 1000432169948 / Telebirr 0953886865).`,
        errorAm: `ክፍያው የተፈጸመው ወደ ${receiverAcc} ሲሆን ይህ በድረ-ገጹ ላይ ከተጠቀሰው የንግድ ባንክ (1000432169948) ወይም ቴሌብር (0953886865) ጋር አይዛመድም።`,
      };
    }
  }

  // 2. Settlement Account Match Check from Verify.et
  // Note: Only reject if Verify.et explicitly says false AND our account matcher also failed
  if (verification.settlementAccountMatch?.matched === false && !isCbeAcc && !isTelebirrAcc) {
    return {
      isValidReceiver: false,
      error:
        'Payment was not made to the official accounts. Payments must strictly be sent to CBE: 1000432169948 (Eyuel Habtamu Enyew) or Telebirr: 0953886865 (Abel Merga Gonder).',
      errorAm:
        'ክፍያው የተፈጸመው በድረ-ገጹ ላይ ወደተጠቀሰው አካውንት አይደለም። እባክዎ ወደ ንግድ ባንክ (1000432169948 - Eyuel Habtamu Enyew) ወይም ቴሌብር (0953886865 - Abel Merga Gonder) የተከፈለበትን ትክክለኛ ደረሰኝ ያስገቡ።',
    };
  }

  // 3. Name Validation (only if name is present and account wasn't already 100% matched)
  if (rawReceiverName && rawReceiverName.length >= 3) {
    let isValidName = false;

    if (isCbeAcc || isBankCbe) {
      isValidName = isCbeName || isTelebirrName || isCbeAcc;
    } else if (isTelebirrAcc || isBankTelebirr) {
      isValidName = isTelebirrName || isCbeName || isTelebirrAcc;
    } else {
      isValidName = isCbeName || isTelebirrName || isCbeAcc || isTelebirrAcc;
    }

    // Only reject on name if the account was NOT a confirmed match
    if (!isValidName && !isCbeAcc && !isTelebirrAcc) {
      return {
        isValidReceiver: false,
        error: `Payment was credited to "${verification.receiverName}". Payments must strictly be sent to the official accounts (CBE: Eyuel Habtamu Enyew / Telebirr: Abel Merga Gonder).`,
        errorAm: `ክፍያው የተፈጸመው ለ "${verification.receiverName}" ነው። ክፍያው በድረ-ገጹ ላይ ወደተጠቀሰው አካውንት (ንግድ ባንክ፡ Eyuel Habtamu Enyew ወይም ቴሌብር፡ Abel Merga Gonder) መፈጸም አለበት።`,
      };
    }
  }

  const matchedHolder =
    isCbeAcc || isCbeName
      ? 'Eyuel Habtamu Enyew'
      : isTelebirrAcc || isTelebirrName
      ? 'Abel Merga Gonder'
      : 'Eyuel Habtamu Enyew / Abel Merga Gonder';

  return {
    isValidReceiver: true,
    matchedAccount: isCbeAcc ? '1000432169948' : isTelebirrAcc ? '0953886865' : undefined,
    matchedHolder,
  };
}

/**
 * High-accuracy amount extractor for Ethiopian banking SMS.
 * Automatically avoids "current balance / ቀሪ ሂሳብ" numbers and focuses on the transferred fee.
 */
export function extractEthiopianSmsAmount(text: string): number | undefined {
  if (!text) return undefined;

  // 1. First priority: amounts explicitly tied to transfer/payment keywords
  // English: "transferred ETB 200.00", "transferred 200 ETB", "debited with ETB 200.00", "payment of ETB 200.00", "paid 200 Birr"
  // Amharic: "200.00 ብር ወደ ... አስተላልፈዋል", "200 ብር ተቀንሶ", "መጠን፡ 200", "ክፍያ 200 ብር"
  const priorityPatterns = [
    // "200.00 ብር ወደ", "200 ብር ወደ", "200.00 ETB to"
    /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:ETB|Birr|ብር)\s*(?:ወደ|ገቢ|ተላልፏል|አስተላልፈዋል|ለ|to)/i,
    // "transferred ETB 200.00", "transferred 200 ETB", "paid ETB 200", "payment of ETB 200"
    /(?:transferred|paid|payment(?:\s+of)?|debited(?:\s+with)?)\s*(?:ETB|Birr|ብር)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    // "ETB 200.00 transferred", "200.00 ETB transferred"
    /(?:ETB|Birr|ብር)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:transferred|paid|debited|ተላልፏል|ገቢ|ተቀንሷል)/i,
    // Amharic: "መጠን፡ 200 ብር", "የክፍያ መጠን 200"
    /(?:መጠን|ክፍያ)\s*[:\-ነው\s]*(?:ETB|Birr|ብር)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    // "ከሂሳብዎ 200 ብር"
    /(?:ከሂሳብዎ|ከአካውንትዎ)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:ETB|Birr|ብር)/i,
  ];

  for (const pat of priorityPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const val = extractNumericAmount(m[1]);
      if (val && val > 0) return val;
    }
  }

  // 2. Second priority: find any amount in text, explicitly ignoring balance
  const textWithoutBalance = text
    .replace(/(?:current\s+balance|balance|bal|ቀሪ\s*ሂሳብ|ቀሪ)\s*(?:is|ነው|:)?\s*(?:ETB|Birr|ብር)?\s*[0-9,.]+(?:\s*(?:ETB|Birr|ብር))?/gi, '');

  // Look for subscription tiers in textWithoutBalance: 1000, 600, 200
  const tierMatch = textWithoutBalance.match(/\b(1000|1,000|600|200)(?:\.00)?\s*(?:ETB|Birr|ብር)?\b/i);
  if (tierMatch && tierMatch[1]) {
    const val = extractNumericAmount(tierMatch[1]);
    if (val && [200, 600, 1000].includes(Math.round(val))) return val;
  }

  // Fallback: any ETB amount in textWithoutBalance
  const fallbackMatch = textWithoutBalance.match(/(?:ETB|Birr|ብር)\s*([0-9,.]+)|([0-9,.]+)\s*(?:ETB|Birr|ብር)/i);
  if (fallbackMatch) {
    const val = extractNumericAmount(fallbackMatch[1] || fallbackMatch[2]);
    if (val && val > 0) return val;
  }

  return undefined;
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
  const containsSmsKeywords = /(?:customer|transferred|debited|balance|receipt|ግብይት|ትራንዛክሽን|ደንበኛ|ደረሰኝ|ብር|etb|telebirr|cbe|ሂሳብ)/i.test(original);
  const isSms = hasMultipleWords || containsSmsKeywords;

  let detectedBank: ParsedPaymentInput['detectedBank'] = undefined;
  let reference = '';
  const extractedAmount = isSms ? extractEthiopianSmsAmount(original) : undefined;

  // 1. Bank detection keywords
  const lowerText = original.toLowerCase();
  if (
    lowerText.includes('telebirr') ||
    original.includes('ቴሌብር') ||
    original.includes('0953886865') ||
    original.includes('2519****6865') ||
    original.includes('251953886865') ||
    lowerText.includes('abel merga') ||
    lowerText.includes('abel gonder') ||
    original.includes('አቤል መርጋ')
  ) {
    detectedBank = 'telebirr';
  } else if (
    lowerText.includes('mbreciept') ||
    lowerText.includes('cbe.com.et') ||
    lowerText.includes('commercial bank') ||
    original.includes('ንግድ ባንክ') ||
    original.includes('1000432169948') ||
    original.includes('1000****69948') ||
    lowerText.includes('eyuel habtamu') ||
    lowerText.includes('habtamu enyew') ||
    original.includes('እዩኤል ሀብታሙ')
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

  // 2. Extract Reference / Transaction ID

  // A. Check for CBE Receipt URL (full URL or path)
  const cbeUrlMatch = original.match(/(?:https?:\/\/)?(?:www\.)?(?:mbreciept\.cbe\.com\.et|cbe\.com\.et)\/([a-zA-Z0-9_\-]{8,64})/i);
  if (cbeUrlMatch) {
    reference = `https://mbreciept.cbe.com.et/${cbeUrlMatch[1].replace(/[.,;:\s።]+$/, '').trim()}`;
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
  // Matches:
  // "Transaction number: CI72984X12"
  // "Transaction ID: CI72984X12"
  // "Txn Id: CI72984X12"
  // "የግብይት ቁጥር፡ CI72984X12"
  // "የግብይት ቁጥር CI72984X12"
  // "የትራንዛክሽን ቁጥር፡ CI72984X12"
  // "የደረሰኝ ቁጥር፡ b8e88ce8334411ee8a32"
  const keywordRegex = /(?:transaction\s*(?:number|no\.?|id|code)?|txn\s*(?:number|no\.?|id|code)?|receipt\s*(?:number|no\.?|id|code)?|reference\s*(?:number|no\.?|id|code)?|ref\b|የግብይት\s*(?:ቁጥር|መለያ)|የትራንዛክሽን\s*(?:ቁጥር|መለያ)|የደረሰኝ\s*(?:ቁጥር|መለያ)|መለያ\s*ቁጥር)\s*[:\-isነው\s]*([A-Za-z0-9_\-]{8,64})/i;
  const keywordMatch = original.match(keywordRegex);
  if (keywordMatch && keywordMatch[1]) {
    reference = keywordMatch[1].replace(/[.,;:\s።"'`]+$/, '').trim();
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
    reference = ftMatch[1].toUpperCase().replace(/[.,;:\s።]+$/, '');
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

  // E. Standalone token fallback (removes accidental spaces and punctuation)
  let clean = original.replace(/[.,;:\s።"'`]+$/, '').replace(/\s+/g, '');
  if (/^[A-Za-z0-9]{10}$/.test(clean)) {
    reference = clean.toUpperCase();
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
