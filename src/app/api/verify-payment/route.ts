import { NextRequest, NextResponse } from 'next/server';
import {
  verifyTransactionWithVerifyEt,
  isVerifyEtConfigured,
  parseEthiopianPaymentSms,
  validateSubscriptionAmount,
  validatePaymentReceiver,
  OFFICIAL_NAZAZI_ACCOUNTS,
} from '@/lib/verifyEt';
import { saveRegistrationToSupabase, getRegistrationByPhone, updateRegistrationPlan } from '@/lib/supabaseServer';
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

    // 🔒 Prevent Double Activation: Check if this phone number already has a registered plan
    const confirmPlanChange = Boolean(body.confirmPlanChange || body.changePlan || body.isPlanChange);
    const existingRegistration = await getRegistrationByPhone(cleanPhone);

    if (existingRegistration && !confirmPlanChange) {
      const currentPlan = existingRegistration.plan_name || 'የቀድሞ እቅድ';
      return NextResponse.json(
        {
          success: false,
          alreadyExists: true,
          currentPlan,
          currentStatus: existingRegistration.status,
          currentAmount: existingRegistration.amount,
          error: `ይህ ስልክ ቁጥር (${cleanPhone}) ቀድሞ የተመዘገበ አገልግሎት አለው (${currentPlan})። እቅድዎን መቀየር (Change Plan) ይፈልጋሉ?`,
          errorEn: `This phone number (${cleanPhone}) already has an active registration (${currentPlan}). Would you like to change your plan?`,
          existingRegistration: {
            id: existingRegistration.id,
            name: existingRegistration.name,
            phone_number: existingRegistration.phone_number,
            plan_name: existingRegistration.plan_name,
            amount: existingRegistration.amount,
            status: existingRegistration.status,
          },
        },
        { status: 409 }
      );
    }

    // 3. Verify with Verify.et directly (Ethiopian banking integration)
    const expectedSettlement =
      bank === 'cbe' || detectedBank === 'cbe'
        ? OFFICIAL_NAZAZI_ACCOUNTS.cbe.accountNumber
        : bank === 'telebirr' || detectedBank === 'telebirr'
        ? OFFICIAL_NAZAZI_ACCOUNTS.telebirr.accountNumber
        : undefined;

    const verification = await verifyTransactionWithVerifyEt({
      reference,
      bank: bank !== 'auto' ? bank : undefined,
      suffix,
      phoneNumber: cleanPhone,
      settlementAccount: expectedSettlement,
      waitMs: 4000,
    });

    const nowIso = new Date().toISOString();

    if (verification.verified && verification.status === 'success') {
      // 🔒 1. STRICT RECEIVER & ACCOUNT HOLDER VALIDATION:
      // Must be made to the official accounts displayed on the website (CBE: 1000432169948 / Eyuel Habtamu Enyew, Telebirr: 0953886865 / Abel Merga Gonder)
      const receiverValidation = validatePaymentReceiver(verification, bank);
      if (!receiverValidation.isValidReceiver) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            status: 'failed',
            error: receiverValidation.errorAm || receiverValidation.error,
            requestId: verification.requestId,
            receiverName: verification.receiverName,
            receiverAccount: verification.receiverAccount,
          },
          { status: 422 }
        );
      }

      // 🔒 2. STRICT AMOUNT VALIDATION: Payment MUST be confirmed for 200, 600, or 1000 Birr
      const paidAmount = verification.amount ?? smsAmount;
      const amountValidation = validateSubscriptionAmount(paidAmount, initialAmount);

      // Check 2a: Does it match a valid plan amount tier (200, 600, or 1000 Birr)?
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

      // Check 2b: Does it cover the chosen plan amount?
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
      if (existingRegistration?.id) {
        await updateRegistrationPlan(existingRegistration.id, finalPlanName, finalAmount, cleanPhone);
      }

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

    // 🛡️ INTELLIGENT FALLBACK FOR ETHIOPIAN BANKING:
    // If Verify.et couldn't confirm immediately (e.g. CBE /v2- receipt gateway changes, network timeout, or downtime),
    // check if the provided SMS authentically verifies transfer to Nazazi's official accounts.
    const isSmsVerified =
      parsedInput.isSms &&
      parsedInput.isOfficialReceiverMatched &&
      Boolean(smsAmount && [200, 600, 1000].includes(Math.round(smsAmount))) &&
      Boolean(reference && reference.length >= 8);

    if (isSmsVerified && smsAmount) {
      const amountValidation = validateSubscriptionAmount(smsAmount, initialAmount);
      if (amountValidation.isValidTier && amountValidation.isCovered) {
        const finalAmount = amountValidation.matchedAmount;
        const finalPlanName = amountValidation.matchedPlanNameAm;

        if (existingRegistration?.id) {
          await updateRegistrationPlan(existingRegistration.id, finalPlanName, finalAmount, cleanPhone);
        }

        const { record, savedToSupabase, error: dbError } = await saveRegistrationToSupabase({
          name: rawName,
          phone_number: cleanPhone,
          payment_image_url: screenshotUrl,
          plan_name: finalPlanName,
          amount: finalAmount,
          status: 'approved',
          transaction_id: reference,
          bank: bank !== 'auto' ? bank : detectedBank || 'cbe',
          verification_method: 'sms_verified',
          verified_at: nowIso,
          verify_request_id: verification.requestId,
        });

        return NextResponse.json(
          {
            success: true,
            verified: true,
            status: 'approved',
            message: `ክፍያዎ በባንክ SMS ማረጋገጫ ተረጋግጧል (${finalAmount} ብር)! የአገልግሎት ምዝገባዎ ወዲያውኑ ገቢር ሆኗል`,
            registration: record,
            savedToSupabase,
            verificationDetails: {
              bank: bank !== 'auto' ? bank : detectedBank,
              amount: finalAmount,
              senderName: parsedInput.extractedSenderName || rawName,
              receiverName:
                parsedInput.extractedReceiverName ||
                (detectedBank === 'cbe' ? 'Eyuel Habtamu Enyew' : 'Abel Merga Gonder'),
              timestamp: nowIso,
              transactionNumber: reference,
              verificationMethod: 'sms_verified',
            },
            dbError: dbError || null,
          },
          { status: 200 }
        );
      }
    }

    // 🔒 SAFEGUARD: NEVER drop or discard a customer's payment submission!
    // Save to Supabase with 'pending' status so the customer is registered safely
    // and admins can review and approve it without losing the transaction.
    const fallbackAmount = smsAmount && [200, 600, 1000].includes(Math.round(smsAmount))
      ? Math.round(smsAmount)
      : isNaN(initialAmount) ? 200 : initialAmount;

    const { record: pendingRecord, savedToSupabase: savedPending } = await saveRegistrationToSupabase({
      name: rawName,
      phone_number: cleanPhone,
      payment_image_url: screenshotUrl,
      plan_name: initialPlanName,
      amount: fallbackAmount,
      status: 'pending',
      transaction_id: reference,
      bank: verification.bank || (bank !== 'auto' ? bank : detectedBank || 'cbe'),
      verification_method: 'manual',
      verify_request_id: verification.requestId,
    });

    return NextResponse.json(
      {
        success: true,
        verified: false,
        status: 'pending',
        queued: true,
        requestId: verification.requestId,
        message:
          'የክፍያ መረጃዎ በተሳካ ሁኔታ ተመዝግቧል። የባንኩ ኔትወርክ በሂደት ላይ ስለሆነ ምዝገባዎ በቅርቡ ይፀድቃል።',
        registration: pendingRecord,
        savedToSupabase: savedPending,
      },
      { status: 202 }
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
