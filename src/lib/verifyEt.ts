/**
 * Verify.et API Adapter for Nazazi
 * 
 * Provides automated verification for Ethiopian banking & mobile money:
 * - Commercial Bank of Ethiopia (CBE)
 * - Telebirr (Ethio Telecom)
 * - CBE Birr, Dashen Bank, Bank of Abyssinia, Awash Bank, M-Pesa
 * 
 * Secure: Keep all API keys server-side only. Never expose to client bundles.
 */

export interface VerifyEtParams {
  reference: string;
  bank?: 'cbe' | 'telebirr' | 'cbebirr' | 'dashen' | 'boa' | 'awash' | 'siinqee' | 'kaafiebirr' | 'mpesa' | 'auto';
  suffix?: string;
  phoneNumber?: string;
  idempotencyKey?: string;
  waitMs?: number;
}

export interface VerifyEtResult {
  success: boolean;
  verified: boolean;
  status: 'success' | 'pending' | 'not_found' | 'failed';
  processingStatus?: 'completed' | 'queued' | 'running' | 'failed';
  requestId?: string;
  bank?: string;
  amount?: number;
  senderName?: string;
  receiverName?: string;
  transactionNumber?: string;
  receiptNumber?: string;
  timestamp?: string;
  confirmedBefore?: boolean;
  errorMessage?: string;
  raw?: any;
}

const VERIFY_ET_BASE_URL = process.env.VERIFY_ET_BASE_URL || 'https://verify.et';

export function getVerifyEtApiKey(): string {
  const key =
    process.env.VERIFY_ET_API_KEY ||
    process.env.VERIFY_BANK_API_KEY ||
    process.env.VERIFY_BANK_ET_API_KEY ||
    '';
  return key.trim().replace(/^['"]|['"]$/g, '');
}

export function isVerifyEtConfigured(): boolean {
  const key = getVerifyEtApiKey();
  return Boolean(key && key.startsWith('VERIFY_BANK_ET_') && key.length > 20);
}

/**
 * Normalizes Ethiopian transaction references (removes accidental spaces, prefixes, etc.)
 */
export function normalizeTransactionReference(raw: string): { reference: string; detectedBank?: string } {
  let clean = (raw || '').trim();
  // Strip internal spaces/tabs
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = clean.replace(/\s+/g, '');
  }

  // Detect CBE receipt URL
  if (clean.includes('mbreciept.cbe.com.et') || clean.includes('cbe.com.et')) {
    return { reference: clean, detectedBank: 'cbe' };
  }

  // Detect Telebirr typical pattern (often 10 alphanumeric chars e.g. CI72984X12)
  if (/^[A-Za-z0-9]{10}$/.test(clean)) {
    return { reference: clean, detectedBank: 'telebirr' };
  }

  // Detect CBE Receipt ID (typically 12-32 chars alphanumeric)
  if (/^[A-Za-z0-9_-]{12,64}$/.test(clean) && !clean.startsWith('FT')) {
    return { reference: clean, detectedBank: 'cbe' };
  }

  return { reference: clean };
}

import https from 'node:https';
import { URL } from 'node:url';

/**
 * Robust HTTP client forcing IPv4 family (family: 4) to ensure instant,
 * reliable connections on Linux hosts without active IPv6 routes.
 */
function verifyEtHttpRequest(
  urlStr: string,
  options: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  },
  retryCount = 0
): Promise<{ status: number; ok: boolean; data: any }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const headers: Record<string, string> = {
        'User-Agent': 'Nazazi-Verifier/1.0',
        'Accept': 'application/json',
        ...options.headers,
      };

      if (options.body) {
        headers['Content-Length'] = String(Buffer.byteLength(options.body));
      }

      const req = https.request(
        parsedUrl,
        {
          method: options.method,
          family: 4, // Force IPv4 to prevent unreachable IPv6 connection hangs
          headers,
          timeout: options.timeoutMs || 15000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('end', () => {
            const rawBody = Buffer.concat(chunks).toString('utf8');
            let data: any = null;
            try {
              data = JSON.parse(rawBody);
            } catch {
              data = { raw: rawBody };
            }
            const status = res.statusCode || 500;
            resolve({
              status,
              ok: status >= 200 && status < 300,
              data,
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error('Verify.et connection timeout (15s)'));
      });

      req.on('error', (err: any) => {
        // Retry once on transient socket reset or timeout
        if (retryCount === 0 && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')) {
          setTimeout(() => {
            verifyEtHttpRequest(urlStr, options, retryCount + 1).then(resolve).catch(reject);
          }, 600);
          return;
        }
        reject(err);
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Verifies a transaction using Verify.et
 */
export async function verifyTransactionWithVerifyEt(params: VerifyEtParams): Promise<VerifyEtResult> {
  const apiKey = getVerifyEtApiKey();
  if (!apiKey) {
    return {
      success: false,
      verified: false,
      status: 'failed',
      errorMessage: 'Verify.et API key is not configured on server.',
    };
  }

  const { reference: cleanRef, detectedBank } = normalizeTransactionReference(params.reference);
  if (!cleanRef) {
    return {
      success: false,
      verified: false,
      status: 'failed',
      errorMessage: 'Transaction reference or receipt number is required.',
    };
  }

  const chosenBank = params.bank && params.bank !== 'auto' ? params.bank : detectedBank;
  const idempotencyKey =
    params.idempotencyKey ||
    `nazazi_${cleanRef.replace(/[^a-zA-Z0-9]/g, '').slice(-16)}_${Date.now()}`;
  const waitMs = params.waitMs ?? 7000;

  // Build payload
  const payload: Record<string, any> = {};
  if (chosenBank) {
    payload.bank = chosenBank;
  }
  payload.reference = cleanRef;
  if (params.suffix) {
    payload.suffix = params.suffix.trim();
  }
  if (params.phoneNumber) {
    payload.phoneNumber = params.phoneNumber.trim();
  }

  try {
    const url = `${VERIFY_ET_BASE_URL}/api/verify?waitMs=${waitMs}`;
    const response = await verifyEtHttpRequest(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeoutMs: Math.max(15000, waitMs + 6000),
    });

    const resJson = response.data;

    // If 200: Inline completion
    if (response.status === 200 && resJson) {
      return parseVerifyEtResponse(resJson);
    }

    // If 202: Queued, attempt quick poll before returning
    if (response.status === 202 && resJson?.requestId) {
      const requestId = resJson.requestId;
      // Poll up to 3 times with 1.2s delay
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const polled = await checkVerifyEtStatus(requestId);
        if (polled.processingStatus === 'completed' || polled.status === 'success' || polled.status === 'not_found') {
          return polled;
        }
      }

      // If still queued, return queued status
      return {
        success: true,
        verified: false,
        status: 'pending',
        processingStatus: 'queued',
        requestId,
        raw: resJson,
        errorMessage: 'Verification queued with Ethiopian bank network. Checking status...',
      };
    }

    // If 400 or other errors
    const errorMsg =
      resJson?.error?.message ||
      resJson?.errorMessage ||
      resJson?.message ||
      `Verification failed with HTTP status ${response.status}`;

    const isNotFound =
      resJson?.error?.code === 'not_found' ||
      resJson?.verification?.status === 'not_found' ||
      (errorMsg && errorMsg.toLowerCase().includes('not found'));

    return {
      success: false,
      verified: false,
      status: isNotFound ? 'not_found' : 'failed',
      errorMessage: errorMsg,
      requestId: resJson?.requestId,
      raw: resJson,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error communicating with Verify.et';
    console.error('Verify.et connection error:', err);
    return {
      success: false,
      verified: false,
      status: 'failed',
      errorMessage: message,
    };
  }
}

/**
 * Checks verification status for a given requestId
 */
export async function checkVerifyEtStatus(requestId: string): Promise<VerifyEtResult> {
  const apiKey = getVerifyEtApiKey();
  if (!apiKey) {
    return {
      success: false,
      verified: false,
      status: 'failed',
      errorMessage: 'Verify.et API key is missing.',
    };
  }

  try {
    const url = `${VERIFY_ET_BASE_URL}/api/verify/${encodeURIComponent(requestId)}`;
    const response = await verifyEtHttpRequest(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
      timeoutMs: 10000,
    });

    const resJson = response.data;
    if (!response.ok || !resJson) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        errorMessage: resJson?.message || `Status check failed with HTTP ${response.status}`,
      };
    }

    return parseVerifyEtResponse(resJson);
  } catch (err: unknown) {
    return {
      success: false,
      verified: false,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Failed to query Verify.et status',
    };
  }
}

/**
 * Parses raw Verify.et response into standardized VerifyEtResult
 */
function parseVerifyEtResponse(json: any): VerifyEtResult {
  const dataItem = Array.isArray(json?.data) ? json.data[0] : json?.data || {};
  const verification = json?.verification || {};
  const result = verification?.result || dataItem?.result || dataItem || {};

  const verified = Boolean(
    dataItem?.verified === true ||
    verification?.verified === true ||
    result?.verified === true ||
    dataItem?.status === 'success' ||
    verification?.status === 'success' ||
    result?.status === 'success'
  );

  const rawStatus = (
    verification?.status ||
    dataItem?.status ||
    result?.status ||
    (verified ? 'success' : 'pending')
  ).toLowerCase();

  const status: 'success' | 'pending' | 'not_found' | 'failed' =
    rawStatus === 'success' || verified
      ? 'success'
      : rawStatus === 'not_found'
      ? 'not_found'
      : rawStatus === 'failed'
      ? 'failed'
      : 'pending';

  const processingStatus = verification?.processingStatus || dataItem?.processingStatus || (verified ? 'completed' : 'running');

  const amount =
    typeof result?.amount === 'number'
      ? result.amount
      : typeof dataItem?.amount === 'number'
      ? dataItem.amount
      : typeof result?.amountValue === 'number'
      ? result.amountValue
      : undefined;

  const bank = result?.bank || dataItem?.bank || verification?.bank || undefined;
  const senderName = result?.senderName || dataItem?.senderName || undefined;
  const receiverName = result?.receiverName || dataItem?.receiverName || undefined;
  const transactionNumber =
    result?.transactionNumber ||
    result?.referenceNumber ||
    dataItem?.transactionNumber ||
    dataItem?.referenceNumber ||
    undefined;
  const receiptNumber = result?.receiptNumber || dataItem?.receiptNumber || undefined;
  const timestamp = result?.timestamp || dataItem?.timestamp || undefined;
  const confirmedBefore = Boolean(dataItem?.confirmationHistory?.confirmedBefore || result?.confirmationHistory?.confirmedBefore);

  const errorMessage =
    json?.error?.message ||
    verification?.errorMessage ||
    json?.errorMessage ||
    (!verified && status === 'not_found'
      ? 'የተጠቀሰው የክፍያ መረጃ በባንክ አልተገኘም። እባክዎ የትራንዛክሽን ቁጥር ወይም የደረሰኝ ሊንክ በትክክል ያስገቡ።'
      : undefined);

  return {
    success: verified || status === 'success' || processingStatus === 'queued' || processingStatus === 'running',
    verified,
    status,
    processingStatus,
    requestId: json?.requestId || verification?.requestId || dataItem?.requestId,
    bank,
    amount,
    senderName,
    receiverName,
    transactionNumber,
    receiptNumber,
    timestamp,
    confirmedBefore,
    errorMessage,
    raw: json,
  };
}
