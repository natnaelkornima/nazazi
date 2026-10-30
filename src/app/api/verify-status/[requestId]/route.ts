import { NextRequest, NextResponse } from 'next/server';
import { checkVerifyEtStatus, validateSubscriptionAmount } from '@/lib/verifyEt';
import { updateRegistrationStatus } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const verification = await checkVerifyEtStatus(requestId);

    if (verification.verified && verification.status === 'success') {
      const amountValidation = validateSubscriptionAmount(verification.amount);
      if (!amountValidation.isValidTier) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            status: 'failed',
            error: amountValidation.errorAm || amountValidation.error,
            amount: verification.amount,
          },
          { status: 422 }
        );
      }

      // If registration ID was provided in query or phone, we can update status
      const { searchParams } = new URL(req.url);
      const regId = searchParams.get('regId');
      const phone = searchParams.get('phone');

      if (regId || phone) {
        await updateRegistrationStatus(regId || '', 'approved', phone || undefined);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        status: 'approved',
        message: 'Payment verified successfully by Verify.ET',
        details: {
          bank: verification.bank,
          amount: amountValidation.matchedAmount,
          senderName: verification.senderName,
          receiverName: verification.receiverName,
          timestamp: verification.timestamp,
          transactionNumber: verification.transactionNumber,
        },
      });
    }

    return NextResponse.json({
      success: true,
      verified: false,
      status: verification.status,
      processingStatus: verification.processingStatus,
      errorMessage: verification.errorMessage,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
