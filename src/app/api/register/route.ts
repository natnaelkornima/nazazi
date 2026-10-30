import { NextRequest, NextResponse } from 'next/server';
import { uploadPaymentImageToCloudinary } from '@/lib/cloudinaryServer';
import { saveRegistrationToSupabase } from '@/lib/supabaseServer';
import { validateFullName, validateStrict09Phone } from '@/lib/validation';
import { normalizePlanAndAmount } from '@/lib/planUtils';
import { isRegistrationClosed } from '@/lib/deadlineConfig';
import {
  verifyTransactionWithVerifyEt,
  parseEthiopianPaymentSms,
  validateSubscriptionAmount,
} from '@/lib/verifyEt';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

export async function POST(req: NextRequest) {
  try {
    // Automatically block new registrations once the set deadline passes
    if (isRegistrationClosed()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration is officially closed. No new registrations are being accepted at this time.',
          isClosed: true,
        },
        { status: 403 }
      );
    }

    let name: string | null = null;
    let phoneNumber: string | null = null;
    let paymentImage: unknown = null;
    
    // Extract plan & amount hints from query parameters & headers (crucial for Instagram WebViews)
    const { searchParams } = new URL(req.url);
    const queryPlan = searchParams.get('plan_name') || searchParams.get('plan') || searchParams.get('planName') || searchParams.get('tier');
    const queryAmount = searchParams.get('amount') || searchParams.get('price');
    const queryPlanId = searchParams.get('plan_id') || searchParams.get('planId');

    const headerPlan = req.headers.get('x-plan-name') ? decodeURIComponent(req.headers.get('x-plan-name') || '') : null;
    const headerAmount = req.headers.get('x-plan-amount') || req.headers.get('x-amount');
    const headerPlanId = req.headers.get('x-plan-id');

    let rawPlanName: string | null = queryPlan || headerPlan || null;
    let rawAmount: string | number | null = queryAmount || headerAmount || null;

    if (!rawPlanName && (queryPlanId === '6m' || headerPlanId === '6m')) {
      rawPlanName = '6 Months Access (1,000 Birr)';
      rawAmount = 1000;
    } else if (!rawPlanName && (queryPlanId === '3m' || headerPlanId === '3m')) {
      rawPlanName = '3 Months Access (600 Birr)';
      rawAmount = 600;
    } else if (!rawPlanName && (queryPlanId === '1m' || headerPlanId === '1m')) {
      rawPlanName = '1 Month Access (200 Birr)';
      rawAmount = 200;
    }

    const contentType = req.headers.get('content-type') || '';

    let transactionId: string | null = null;
    let bank: string | null = null;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      name = body.name || body.userName || body.payerName;
      phoneNumber = body.phone_number || body.phoneNumber || body.userPhone;
      paymentImage = body.payment_image || body.paymentImage || body.screenshotUrl || body.image;
      transactionId = body.transaction_id || body.transactionId || body.reference;
      bank = body.bank || null;
      if (body.plan_name || body.planName) rawPlanName = body.plan_name || body.planName;
      if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
        rawAmount = body.amount;
      }
    } else {
      const formData = await req.formData();
      name = (formData.get('name') || formData.get('userName') || formData.get('payerName')) as string | null;
      phoneNumber = (formData.get('phone_number') || formData.get('phoneNumber') || formData.get('userPhone')) as string | null;
      paymentImage = formData.get('payment_image') || formData.get('paymentImage') || formData.get('screenshotUrl');
      transactionId = (formData.get('transaction_id') || formData.get('transactionId') || formData.get('reference')) as string | null;
      bank = formData.get('bank') as string | null;
      const pName = formData.get('plan_name') || formData.get('planName');
      if (pName && typeof pName === 'string' && pName.trim()) {
        rawPlanName = pName.trim();
      }
      const amountStr = formData.get('amount') as string | null;
      if (amountStr && amountStr.trim()) {
        rawAmount = amountStr.trim();
      }
    }

    // Intelligently normalize the plan and amount (prevents dropping 600 / 1000 to 200)
    const { planName, amount } = normalizePlanAndAmount(rawPlanName, rawAmount);

    // 1. Validate Name
    const nameValidation = validateFullName(name || '');
    if (!nameValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: nameValidation.error || 'Please enter a valid full name (e.g. Abebe Kebede).',
        },
        { status: 400 }
      );
    }

    // 2. Validate Phone Number (Strict 09 format: 09XXXXXXXX)
    const phoneValidation = validateStrict09Phone(phoneNumber || '');
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: phoneValidation.error || 'Phone number must be in 09 format (10 digits, e.g. 0911234567).',
        },
        { status: 400 }
      );
    }

    const cleanPhone = phoneValidation.cleanPhone;

    // 3. Validate Transaction ID (Strictly required for Verify.et automated verification)
    if (!transactionId || !transactionId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter your Transaction Reference Number (Transaction ID from Telebirr or CBE).',
        },
        { status: 400 }
      );
    }

    let finalCloudinaryUrl = '';
    let uploadedToCloudinary = false;
    let uploadError: string | null = null;
    let cloudNameResult: string | null = null;

    // Optional: Only process payment image if one was explicitly passed
    if (paymentImage) {
      if (
        typeof paymentImage === 'string' &&
        (paymentImage.startsWith('https://') || paymentImage.startsWith('http://'))
      ) {
        finalCloudinaryUrl = paymentImage.trim();
        uploadedToCloudinary = true;
      } else {
        let buffer: Buffer | null = null;
        let mimeType = 'image/jpeg';

        if (typeof paymentImage === 'string') {
          if (paymentImage.startsWith('data:')) {
            const matches = paymentImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              mimeType = matches[1];
              buffer = Buffer.from(matches[2], 'base64');
            } else {
              const parts = paymentImage.split(',');
              buffer = Buffer.from(parts[1] || parts[0], 'base64');
            }
          } else {
            try {
              buffer = Buffer.from(paymentImage, 'base64');
            } catch {
              buffer = null;
            }
          }
        } else if (paymentImage instanceof Blob) {
          if (paymentImage.size <= MAX_FILE_SIZE) {
            mimeType = paymentImage.type || 'image/jpeg';
            const arrayBuffer = await paymentImage.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          }
        }

        if (buffer && buffer.length > 0) {
          const uploadRes = await uploadPaymentImageToCloudinary(buffer, mimeType);
          uploadedToCloudinary = uploadRes.uploadedToCloudinary;
          uploadError = uploadRes.error || null;
          cloudNameResult = uploadRes.cloudName || null;

          if (
            uploadedToCloudinary &&
            uploadRes.secure_url &&
            (uploadRes.secure_url.startsWith('https://') || uploadRes.secure_url.startsWith('http://'))
          ) {
            finalCloudinaryUrl = uploadRes.secure_url.trim();
          }
        }
      }
    }

    // 5. Automatic Verification via Verify.et if transaction reference is provided
    let isAutoApproved = false;
    let verifiedBank = bank || undefined;
    let verifiedRequestId: string | undefined = undefined;
    let verificationError: string | null = null;
    let verifiedDetails: any = null;

    if (transactionId) {
      try {
        const parsed = parseEthiopianPaymentSms(transactionId);
        const cleanRef = parsed.reference;
        const autoBank = (bank && bank !== 'auto' ? bank : parsed.detectedBank) as any;

        const verification = await verifyTransactionWithVerifyEt({
          reference: cleanRef,
          bank: autoBank,
          phoneNumber: cleanPhone,
          waitMs: 6000,
        });

        if (verification.verified && verification.status === 'success') {
          // Check payment amount (strictly 200, 600, or 1000 Birr)
          const paidAmount = verification.amount ?? parsed.extractedAmount;
          const amountValidation = validateSubscriptionAmount(paidAmount, amount);

          if (amountValidation.isValidTier && amountValidation.isCovered) {
            isAutoApproved = true;
            verifiedBank = verification.bank || autoBank || 'cbe';
            verifiedRequestId = verification.requestId;
            transactionId = verification.transactionNumber || cleanRef;
            verifiedDetails = {
              bank: verifiedBank,
              amount: amountValidation.matchedAmount,
              senderName: verification.senderName,
              receiverName: verification.receiverName,
              timestamp: verification.timestamp,
            };
          } else {
            verificationError = amountValidation.errorAm || amountValidation.error || 'Invalid payment amount';
          }
        } else if (verification.errorMessage) {
          verificationError = verification.errorMessage;
        }
      } catch (vErr) {
        console.warn('Verify.et auto-check error (will save as pending):', vErr);
      }
    }

    // 6. Store in Supabase / State (auto-approved if verified by Verify.et!)
    const { record, savedToSupabase, error: dbError } = await saveRegistrationToSupabase({
      name: name.trim(),
      phone_number: cleanPhone,
      payment_image_url: finalCloudinaryUrl,
      plan_name: planName,
      amount: isNaN(amount) ? 200 : amount,
      status: isAutoApproved ? 'approved' : 'pending',
      transaction_id: transactionId || undefined,
      bank: verifiedBank,
      verification_method: isAutoApproved ? 'verify_et' : 'manual',
      verified_at: isAutoApproved ? new Date().toISOString() : undefined,
      verify_request_id: verifiedRequestId,
    });

    return NextResponse.json(
      {
        success: true,
        verified: isAutoApproved,
        status: isAutoApproved ? 'approved' : 'pending',
        message: isAutoApproved
          ? 'ክፍያዎ በ Verify.ET በራስ-ሰር ተረጋግጧል! የአገልግሎት ምዝገባዎ ወዲያውኑ ገቢር ሆኗል (Auto-approved via Verify.ET).'
          : savedToSupabase
          ? 'Registration stored in Supabase database successfully.'
          : 'Registration processed locally.',
        savedToSupabase,
        uploadedToCloudinary,
        cloudinaryError: uploadError || null,
        verificationError: verificationError || null,
        verificationDetails: verifiedDetails,
        cloudName: cloudNameResult || null,
        dbError: dbError || null,
        registration: record,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration processing error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

