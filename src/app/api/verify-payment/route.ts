import { NextRequest, NextResponse } from 'next/server';
import {
  verifyTransactionWithVerifyEt,
  isVerifyEtConfigured,
  parseEthiopianPaymentSms,
  validateSubscriptionAmount,
} from '@/lib/verifyEt';
import { saveRegistrationToSupabase } from '@/lib/supabaseServer';
import { validateFullName, validateStrict09Phone } from '@/lib/validation';
import { normalizePlanAndAmount } from '@/lib/planUtils';
import { isRegistrationClosed } from '@/lib/deadlineConfig';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Check registration deadline
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

    const body = await req.json().catch(() => ({}));
    const rawReference = (body.reference || body.transactionId || body.transaction_id || body.receiptNumber || '').trim();
    const rawBank = body.bank || 'auto';
    const rawName = (body.name || body.userName || body.payerName || '').trim();
    const rawPhone = (body.phone || body.phoneNumber || body.userPhone || body.phone_number || '').trim();
    const rawPlan = body.planName || body.plan_name || body.plan;
    const rawAmount = body.amount;
    const screenshotUrl = body.screenshotUrl || body.payment_image_url || '';
    const suffix = body.suffix || undefined;

    // 2. Parse SMS or Transaction Reference intelligently
    const parsedInput = parseEthiopianPaymentSms(rawReference);
    const reference = parsedInput.reference;
    const detectedBank = parsedInput.detectedBank;
    const smsAmount = parsedInput.extractedAmount;
    const bank = rawBank !== 'auto' ? rawBank : (detectedBank || 'auto');

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          error: 'እባክዎ የትራንዛክሽን መለያ ቁጥር (Transaction ID / Reference Number) ወይም ከባንክ የደረሰዎትን ሙሉ SMS ያስገቡ።',
        },
        { status: 400 }
      );
    }

    const nameValidation = validateFullName(rawName);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: nameValidation.error || 'Please enter a valid full name.',
        },
        { status: 400 }
      );
    }

    const phoneValidation = validateStrict09Phone(rawPhone);
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
    const { planName: initialPlanName, amount: initialAmount } = normalizePlanAndAmount(rawPlan, rawAmount);

    // 3. Verify with Verify.et directly (Ethiopian banking integration)
    const verification = await verifyTransactionWithVerifyEt({
      reference,
      bank: bank !== 'auto' ? bank : undefined,
      suffix,
      phoneNumber: cleanPhone,
      waitMs: 8000,
    });

    const nowIso = new Date().toISOString();

    if (verification.verified && verification.status === 'success') {
      // 🔒 STRICT AMOUNT VALIDATION: Payment MUST be exactly 200, 600, or 1000 Birr
      const paidAmount = verification.amount ?? smsAmount;
      const amountValidation = validateSubscriptionAmount(paidAmount, initialAmount);

      // Check 1: Does it match a valid plan amount tier (200, 600, or 1000 Birr)?
      if (!amountValidation.isValidTier) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            status: 'failed',
            error: amountValidation.errorAm || amountValidation.error,
            requestId: verification.requestId,
            paidAmount,
            expectedAmount: initialAmount,
          },
          { status: 422 }
        );
      }

      // Check 2: Does it cover the chosen plan amount?
      if (!amountValidation.isCovered) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            status: 'failed',
            error: amountValidation.errorAm || amountValidation.error,
            requestId: verification.requestId,
            paidAmount,
            expectedAmount: initialAmount,
          },
          { status: 422 }
        );
      }

      // Match final plan name and amount based on verified payment
      const finalAmount = amountValidation.matchedAmount;
      const finalPlanName = amountValidation.matchedPlanNameAm;

      // ✅ AUTOMATIC APPROVAL: Payment verified by Ethiopian bank network for exact valid amount!
      const { record, savedToSupabase, error: dbError } = await saveRegistrationToSupabase({
        name: rawName,
        phone_number: cleanPhone,
        payment_image_url: screenshotUrl,
        plan_name: finalPlanName,
        amount: finalAmount,
        status: 'approved',
        transaction_id: verification.transactionNumber || reference,
        bank: verification.bank || (bank !== 'auto' ? bank : detectedBank || 'cbe'),
        verification_method: 'verify_et',
        verified_at: nowIso,
        verify_request_id: verification.requestId,
      });

      return NextResponse.json(
        {
          success: true,
          verified: true,
          status: 'approved',
          message: `ክፍያዎ በ Verify.ET ተረጋግጧል (${finalAmount} ብር)! የአገልግሎት ምዝገባዎ ወዲያውኑ ገቢር ሆኗል`,
          registration: record,
          savedToSupabase,
          verificationDetails: {
            bank: verification.bank || detectedBank,
            amount: finalAmount,
            senderName: verification.senderName,
            receiverName: verification.receiverName,
            timestamp: verification.timestamp,
            transactionNumber: verification.transactionNumber || reference,
            receiptNumber: verification.receiptNumber,
            confirmedBefore: verification.confirmedBefore,
          },
          dbError: dbError || null,
        },
        { status: 200 }
      );
    }

    if (verification.processingStatus === 'queued' || verification.status === 'pending') {
      // ⏳ QUEUED: Request received by bank workers, queued for completion
      const { record } = await saveRegistrationToSupabase({
        name: rawName,
        phone_number: cleanPhone,
        payment_image_url: screenshotUrl,
        plan_name: initialPlanName,
        amount: isNaN(initialAmount) ? 200 : initialAmount,
        status: 'pending',
        transaction_id: reference,
        bank: verification.bank || (bank !== 'auto' ? bank : detectedBank),
        verification_method: 'verify_et',
        verify_request_id: verification.requestId,
      });

      return NextResponse.json(
        {
          success: true,
          verified: false,
          status: 'pending',
          queued: true,
          requestId: verification.requestId,
          message: 'የክፍያ ማረጋገጫ በባንክ በማረጋገጥ ላይ ነው። እባክዎ ጥቂት ሰከንዶች ይጠብቁ...',
          registration: record,
        },
        { status: 202 }
      );
    }

    // ❌ NOT FOUND / INVALID REFERENCE
    return NextResponse.json(
      {
        success: false,
        verified: false,
        status: verification.status,
        error:
          verification.errorMessage ||
          'የተጠቀሰው የትራንዛክሽን ቁጥር በባንክ አልተገኘም። እባክዎ ከባንክ ወይም ከቴሌብር የደረሰዎትን ትክክለኛ የትራንዛክሽን ቁጥር (Transaction ID) ያስገቡ።',
        requestId: verification.requestId,
      },
      { status: 422 }
    );
  } catch (error: unknown) {
    console.error('Verify payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
