'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { GlassFolderUploader } from '../components/ui/GlassFolderUploader';
import { SubscriptionStatusModal } from '../components/SubscriptionStatusModal';
import { usePayment } from '../context/PaymentContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentSubmission } from '../types';
import { validateFullName, validateEthiopianPhone } from '../lib/validation';
import { parseEthiopianPaymentSms } from '../lib/smsParser';
import {
  CreditCard,
  Check,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Clock,
  Search,
  Upload,
  ArrowRight,
  FileCheck,
  Building2,
  Copy,
  Info,
  Loader2,
  Zap,
  ClipboardPaste,
  X,
} from 'lucide-react';

export const PaymentView: React.FC = () => {
  const { user } = useAuth();
  const {
    submitPayment,
    verifyPaymentOnline,
    getSubmissionByPhone,
    checkStatusLive,
    selectedPlanForCheckout,
    setSelectedPlanForCheckout,
    submissions,
  } = usePayment();
  const { success, error, info } = useToast();
  const { language, t } = useLanguage();
  const isAmharic = language === 'am';

  // Form states
  const [plan, setPlan] = useState<string>(
    selectedPlanForCheckout || (isAmharic ? 'የ6 ወር አገልግሎት (1000 ብር)' : '6 Months Access Plan (1000 Birr)')
  );
  const [payerName, setPayerName] = useState(user?.name || '');
  const [userPhone, setUserPhone] = useState(user?.phone || '0911234567');
  const [transactionId, setTransactionId] = useState('');
  const [selectedBank, setSelectedBank] = useState<'auto' | 'cbe' | 'telebirr'>('auto');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingWithBank, setIsVerifyingWithBank] = useState(false);

  // Phone Lookup State
  const [phoneQuery, setPhoneQuery] = useState(user?.phone || '0911234567');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [lookedUpSubmission, setLookedUpSubmission] = useState<PaymentSubmission | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    if (selectedPlanForCheckout) {
      setPlan(selectedPlanForCheckout);
    }
  }, [selectedPlanForCheckout]);

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phoneQuery.trim();
    if (!trimmed) {
      error(isAmharic ? 'እባክዎ የስልክ ቁጥር ያስገቡ' : 'Please enter a phone number', 'Type your registered phone number to check status.');
      return;
    }

    const phoneVal = validateEthiopianPhone(trimmed, isAmharic);
    if (!phoneVal.isValid) {
      error(isAmharic ? 'ልክ ያልሆነ ስልክ ቁጥር' : 'Invalid Phone Number', phoneVal.error);
      return;
    }

    setIsSearchingPhone(true);
    try {
      const found = await checkStatusLive(trimmed);
      setLookedUpSubmission(found || null);
      setIsStatusModalOpen(true);
    } catch {
      const foundLocal = getSubmissionByPhone(trimmed);
      setLookedUpSubmission(foundLocal || null);
      setIsStatusModalOpen(true);
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const handleProcessTransactionInput = (rawText: string) => {
    const trimmed = (rawText || '').trim();
    if (!trimmed) {
      setTransactionId('');
      return;
    }

    const parsed = parseEthiopianPaymentSms(trimmed);
    if (parsed.isSms && parsed.reference) {
      setTransactionId(parsed.reference);
      if (parsed.detectedBank && (parsed.detectedBank === 'cbe' || parsed.detectedBank === 'telebirr')) {
        setSelectedBank(parsed.detectedBank);
      }
      if (parsed.extractedAmount && [200, 600, 1000].includes(parsed.extractedAmount)) {
        if (parsed.extractedAmount === 1000) {
          setPlan(isAmharic ? 'የ6 ወር አገልግሎት (1000 ብር)' : '6 Months Access Plan (1000 Birr)');
        } else if (parsed.extractedAmount === 600) {
          setPlan(isAmharic ? 'የ3 ወር አገልግሎት (600 ብር)' : '3 Months Access Plan (600 Birr)');
        } else if (parsed.extractedAmount === 200) {
          setPlan(isAmharic ? 'የ1 ወር አገልግሎት (200 ብር)' : '1 Month Access Plan (200 Birr)');
        }
      }
      info(
        isAmharic ? 'ከ SMS የትራንዛክሽን ቁጥር ተለይቷል' : 'Extracted from SMS',
        `${parsed.reference} (${parsed.detectedBank === 'cbe' ? 'CBE' : parsed.detectedBank === 'telebirr' ? 'Telebirr' : 'Bank'}${parsed.extractedAmount ? ` • ${parsed.extractedAmount} ETB` : ''})`
      );
    } else {
      setTransactionId(trimmed);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleProcessTransactionInput(text);
        }
      }
    } catch {
      // Clipboard access blocked
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameVal = validateFullName(payerName, isAmharic);
    if (!nameVal.isValid) {
      error(isAmharic ? 'የከፋይ ስም ያስፈልጋል' : 'Payer name required', nameVal.error);
      return;
    }

    const phoneVal = validateEthiopianPhone(userPhone, isAmharic);
    if (!phoneVal.isValid) {
      error(isAmharic ? 'ልክ ያልሆነ ስልክ ቁጥር' : 'Invalid phone number', phoneVal.error);
      return;
    }

    const cleanRef = transactionId.trim();

    if (!cleanRef && !screenshotDataUrl) {
      error(
        isAmharic ? 'የትራንዛክሽን ቁጥር ወይም ደረሰኝ ያስፈልጋል' : 'Transaction ID or receipt required',
        isAmharic
          ? 'እባክዎ ከባንክ ወይም ከቴሌብር የደረሰዎትን የትራንዛክሽን ቁጥር (Transaction ID) ያስገቡ።'
          : 'Please enter your bank/Telebirr transaction reference number.'
      );
      return;
    }

    setIsSubmitting(true);
    if (cleanRef) setIsVerifyingWithBank(true);

    try {
      const isSixMonth = plan.includes('6 Month') || plan.includes('የ6 ወር') || plan.includes('1000');
      const isOneMonth = plan.includes('1 Month') || plan.includes('የ1 ወር') || plan.includes('200');
      const amount = isSixMonth ? 1000 : isOneMonth ? 200 : 600;

      // 1. If transaction ID is provided, verify online directly with Verify.ET!
      if (cleanRef) {
        const verifyRes = await verifyPaymentOnline({
          reference: cleanRef,
          bank: selectedBank !== 'auto' ? selectedBank : undefined,
          name: payerName.trim(),
          phone: phoneVal.cleanPhone,
          planName: plan,
          amount,
          screenshotUrl: screenshotDataUrl || undefined,
        });

        if (verifyRes.success && verifyRes.verified && verifyRes.submission) {
          setSelectedPlanForCheckout(null);
          setLookedUpSubmission(verifyRes.submission);
          setIsStatusModalOpen(true);
          success(
            isAmharic ? '✅ ክፍያዎ በ Verify.ET ተረጋግጧል!' : '✅ Payment Verified via Verify.ET!',
            isAmharic ? 'የአገልግሎት ምዝገባዎ ወዲያውኑ ገቢር ሆኗል (ራስ-ሰር ማረጋገጫ ተጠናቋል)' : 'Your subscription has been activated immediately!'
          );
          return;
        } else if (verifyRes.success && verifyRes.submission) {
          // Queued
          setSelectedPlanForCheckout(null);
          setLookedUpSubmission(verifyRes.submission);
          setIsStatusModalOpen(true);
          info(
            isAmharic ? 'ክፍያዎ በማረጋገጥ ላይ ይገኛል' : 'Verification In Progress',
            verifyRes.message || (isAmharic ? 'የባንክ ማረጋገጫ በሂደት ላይ ነው።' : 'Verification is processing.')
          );
          return;
        } else if (!screenshotDataUrl) {
          error(
            isAmharic ? 'የክፍያ ማረጋገጫ አልተሳካም' : 'Verification Failed',
            verifyRes.error || (isAmharic ? 'የትራንዛክሽን ቁጥሩ በባንክ አልተገኘም። እባክዎ በትክክል ያረጋግጡ።' : 'Transaction was not found in bank records.')
          );
          return;
        }
      }

      // 2. Fallback submit
      const newSub = await submitPayment({
        userId: user?.id || 'usr_guest',
        userName: payerName.trim(),
        userEmail: user?.email || 'member@nazazi.io',
        userPhone: phoneVal.cleanPhone,
        planName: plan,
        amount: amount,
        payerName: payerName.trim(),
        transactionId: cleanRef || undefined,
        screenshotUrl: screenshotDataUrl || '',
        bank: selectedBank !== 'auto' ? selectedBank : undefined,
      });

      setSelectedPlanForCheckout(null);
      setLookedUpSubmission(newSub);
      setIsStatusModalOpen(true);
      success(
        isAmharic ? 'የክፍያ መረጃ ተልኳል!' : 'Payment Submitted!',
        isAmharic ? 'የማረጋገጫ ሁኔታ፡ በማረጋገጥ ላይ' : 'Status set to Pending Approval.'
      );
    } catch (err) {
      console.error(err);
      error(isAmharic ? 'ስህተት ተከስቷል' : 'Error', 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
      setIsVerifyingWithBank(false);
    }
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    info(isAmharic ? 'ተቀድቷል' : `Copied ${title}`, text);
  };

  // Find latest user submission
  const userSubmission = user ? getSubmissionByPhone(user.phone) : undefined;

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            {isAmharic ? 'የክፍያ እና ደንበኝነት ማረጋገጫ' : 'Subscription & Payment Verification'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isAmharic ? 'የክፍያ ደረሰኝ ፎቶ ይላኩ፣ የትራንዛክሽን ቁጥር ያረጋግጡ እና የአገልግሎት ሁኔታን ይመልከቱ።' : 'Submit payment receipt screenshots, verify transaction IDs, and check active phone status.'}
          </p>
        </div>

        {/* Quick Phone Status Checker Widget */}
        <form onSubmit={handlePhoneLookup} className="flex items-center gap-2">
          <Input
            placeholder={isAmharic ? 'ስልክ ቁጥር ያስገቡ...' : 'Enter phone number...'}
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            leftIcon={<Smartphone className="w-3.5 h-3.5 text-zinc-400" />}
            className="w-48 sm:w-56 h-9 text-xs"
          />
          <Button type="submit" size="sm" variant="secondary" className="font-bold text-xs shrink-0">
            {isAmharic ? 'ሁኔታ አረጋግጥ' : 'Check Status'}
          </Button>
        </form>
      </div>

      {/* If user already has an approved or pending submission, highlight status banner */}
      {userSubmission && (
        <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {isAmharic ? `${userSubmission.userPhone} የኤስኤምኤስ ሁኔታ` : `Current Phone Status for ${userSubmission.userPhone}`}
                </h3>
                {userSubmission.status === 'pending' && <Badge variant="amber">{isAmharic ? 'በማረጋገጥ ላይ' : 'Pending Approval'}</Badge>}
                {userSubmission.status === 'approved' && <Badge variant="emerald">{isAmharic ? 'የተረጋገጠ እና ንቁ' : 'Approved & Active'}</Badge>}
                {userSubmission.status === 'rejected' && <Badge variant="danger">{isAmharic ? 'ተቀባይነት አላገኘም' : 'Rejected'}</Badge>}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {userSubmission.status === 'pending' && (isAmharic ? 'ክፍያዎ በአድሚን በማረጋገጥ ላይ ይገኛል።' : 'Your payment is undergoing admin verification.')}
                {userSubmission.status === 'approved' && (isAmharic ? 'የሚያጽናኑ የኤስኤምኤስ መልእክቶች በስራ ላይ ናቸው።' : 'SMS encouraging messages are active and delivering.')}
                {userSubmission.status === 'rejected' && (isAmharic ? 'የላኩት ደረሰኝ አልተቀበለም። እባክዎ እንደገና ይላኩ።' : 'Previous receipt was rejected. Please resubmit below.')}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setLookedUpSubmission(userSubmission);
              setIsStatusModalOpen(true);
            }}
            variant="outline"
            className="shrink-0 text-xs font-bold"
          >
            {isAmharic ? 'ሙሉ መረጃ ይመልከቱ' : 'View Full Status Modal'}
          </Button>
        </Card>
      )}

      {/* Main Payment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Bank Accounts & Plan Selection */}
        <div className="lg:col-span-5 space-y-6">
          {/* Plan Selector */}
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              {isAmharic ? '1. የአገልግሎት አማራጭ ይምረጡ' : '1. Select Subscription Plan'}
            </h2>

            <div className="space-y-3">
              {/* 6 Months Plan */}
              <div
                onClick={() => setPlan(isAmharic ? 'የ6 ወር አገልግሎት (1000 ብር)' : '6 Months Access Plan (1000 Birr)')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  plan.includes('6 Month') || plan.includes('የ6 ወር')
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                } flex items-center justify-between`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{isAmharic ? 'የ6 ወር አገልግሎት' : '6 Months Plan'}</p>
                    <Badge variant="emerald">{isAmharic ? 'እጅግ ተመራጭ • 200 ብር ቅናሽ' : 'Best Value • Save 200'}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-zinc-400 line-through decoration-zinc-400 decoration-1">
                      1200 {isAmharic ? 'ብር' : 'ETB'}
                    </span>
                    <span className="text-xs text-zinc-500">• {isAmharic ? '1000 ብር / ለ6 ወር' : '1000 Birr total'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">1000</span>
                  <span className="text-xs text-zinc-400 ml-1">{isAmharic ? 'ብር' : 'ETB'}</span>
                </div>
              </div>

              {/* 3 Months Plan */}
              <div
                onClick={() => setPlan(isAmharic ? 'የ3 ወር አገልግሎት (600 ብር)' : '3 Months Access Plan (600 Birr)')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  (plan.includes('3 Months') || plan.includes('የ3 ወር')) && !plan.includes('6')
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                } flex items-center justify-between`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{isAmharic ? 'የ3 ወር አገልግሎት' : '3 Months Plan'}</p>
                    <Badge variant="zinc">{isAmharic ? 'ተወዳጅ አማራጭ' : 'Popular'}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{isAmharic ? '600 ብር / ለ3 ወር' : '600 Birr total / 3 Months'}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">600</span>
                  <span className="text-xs text-zinc-400 ml-1">{isAmharic ? 'ብር' : 'ETB'}</span>
                </div>
              </div>

              {/* 1 Month Plan */}
              <div
                onClick={() => setPlan(isAmharic ? 'የ1 ወር አገልግሎት (200 ብር)' : '1 Month Access Plan (200 Birr)')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  plan.includes('1 Month') || plan.includes('የ1 ወር')
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                } flex items-center justify-between`}
              >
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{isAmharic ? 'የ1 ወር አገልግሎት' : '1 Month Plan'}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{isAmharic ? '200 ብር / በወር • ለሙከራ ተስማሚ' : '200 Birr / month • Flexible'}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">200</span>
                  <span className="text-xs text-zinc-400 ml-1">{isAmharic ? 'ብር' : 'ETB'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Bank Payment Instructions */}
          <Card className="p-6 space-y-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> 2. Official Payment Accounts
              </span>
              <Badge variant="amber">Direct Bank Transfer</Badge>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Transfer <strong className="text-white">
                {plan.includes('6 Month') || plan.includes('የ6 ወር') ? '1000 Birr' : plan.includes('1 Month') || plan.includes('የ1 ወር') ? '200 Birr' : '600 Birr'}
              </strong> to any of the official accounts below, then upload your payment screenshot:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* CBE */}
              <div className="p-3.5 rounded-lg bg-zinc-800/90 border border-zinc-700/80 space-y-1.5 shadow-2xs hover:border-zinc-600 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-amber-500" />
                    <span className="font-bold text-amber-400">CBE (ንግድ ባንክ)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('1000432169948', 'CBE Account Number')}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors cursor-pointer"
                    title="Copy Account Number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-mono text-sm font-extrabold tracking-wider text-white select-all">1000432169948</p>
                <p className="text-[11px] text-zinc-400">Account: Nazazi</p>
              </div>

              {/* Telebirr */}
              <div className="p-3.5 rounded-lg bg-zinc-800/90 border border-zinc-700/80 space-y-1.5 shadow-2xs hover:border-zinc-600 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                    <span className="font-bold text-emerald-400">Telebirr (ቴሌብር)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('0953886865', 'Telebirr Phone Number')}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors cursor-pointer"
                    title="Copy Phone Number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-mono text-sm font-extrabold tracking-wider text-white select-all">0953886865</p>
                <p className="text-[11px] text-zinc-400">Account: Nazazi</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Payment Verification Upload Form */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 space-y-6 bg-white dark:bg-zinc-900 border-zinc-200/90 dark:border-zinc-800 shadow-xl">
            <div className="space-y-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-500" /> 3. Automated Bank Verification (Verify.ET)
              </span>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {isAmharic ? 'ፈጣን የክፍያ ማረጋገጫ ፎርም' : 'Instant Payment Verification'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isAmharic
                  ? 'የትራንዛክሽን ቁጥር በማስገባት በ Verify.ET አማካኝነት ወዲያውኑ አገልግሎትዎን በራስ-ሰር ያግብሩ።'
                  : 'Enter your transaction ID to verify directly with Ethiopian banks via Verify.ET with zero admin delay.'}
              </p>
            </div>

            {/* Instant Verification Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                <span className="font-bold">
                  {isAmharic ? 'ራስ-ሰር ማረጋገጫ (No Manual Admin Check)' : 'Automatic Bank Verification'}
                </span>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {isAmharic
                    ? 'ክፍያዎ በ Verify.ET ከኢትዮጵያ ንግድ ባንክ ወይም ቴሌብር ጋር በቀጥታ ተገናኝቶ ይረጋገጣል። ምንም የስክሪንሾት መጠበቅ አያስፈልግም!'
                    : 'Your transaction connects directly with CBE or Telebirr for real-time verification — no manual admin review needed!'}
                </p>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              {/* Payer Name */}
              <Input
                label="Payer Account Name"
                placeholder="Name as it appears on bank receipt (e.g. Korni Mah)"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                required
              />

              {/* Bank Selector & Transaction ID */}
              <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {isAmharic ? 'የክፍያ ዘዴ' : 'Bank / Method'}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedBank('auto')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        selectedBank === 'auto'
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                          : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {isAmharic ? 'ራስ-ሰር' : 'Auto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBank('cbe')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        selectedBank === 'cbe' ? 'bg-amber-600 text-white' : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      CBE
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBank('telebirr')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        selectedBank === 'telebirr' ? 'bg-emerald-600 text-white' : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      Telebirr
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {isAmharic ? 'የትራንዛክሽን ቁጥር ወይም ሙሉ የ SMS መልእክት' : 'Transaction ID / Reference or Full Payment SMS'}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 18 && parseEthiopianPaymentSms(val).isSms) {
                          handleProcessTransactionInput(val);
                        } else {
                          setTransactionId(val);
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData?.getData('text');
                        if (text && (parseEthiopianPaymentSms(text).isSms || text.length > 25)) {
                          e.preventDefault();
                          handleProcessTransactionInput(text);
                        }
                      }}
                      placeholder={
                        selectedBank === 'telebirr'
                          ? (isAmharic ? 'ምሳሌ፡ CI72984X12 ወይም ሙሉ የቴሌብር SMS እዚህ ይለጥፉ' : 'e.g. CI72984X12 or paste Telebirr SMS')
                          : selectedBank === 'cbe'
                          ? (isAmharic ? 'ምሳሌ፡ fHCxyTV... ወይም የደረሰኝ ሊንክ/SMS' : 'e.g. fHCxyTV... or CBE receipt link/SMS')
                          : (isAmharic ? 'የትራንዛክሽን ቁጥር ወይም ሙሉ SMS እዚህ ይለጥፉ...' : 'Enter Transaction ID or paste full bank SMS...')
                      }
                      className="w-full h-11 px-3.5 pr-20 text-xs sm:text-sm font-mono font-medium rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all placeholder:text-zinc-400 placeholder:font-sans"
                      required
                    />

                    {/* Inline Clear or Paste Action */}
                    <div className="absolute right-2 flex items-center">
                      {transactionId ? (
                        <button
                          type="button"
                          onClick={() => setTransactionId('')}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title={isAmharic ? 'አጽዳ' : 'Clear'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-750 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300/60 dark:border-zinc-650 transition-all cursor-pointer shadow-2xs"
                          title={isAmharic ? 'ከክሊፕቦርድ ለጥፍ' : 'Paste from clipboard'}
                        >
                          <ClipboardPaste className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />
                          <span className="text-[11px]">{isAmharic ? 'ለጥፍ' : 'Paste'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>
                      {isAmharic
                        ? 'ከባንክ ወይም ከቴሌብር የደረሰዎትን ሙሉ የ SMS መልእክት እዚህ መለጠፍ ይችላሉ። የትራንዛክሽን ቁጥሩ በራስ-ሰር ይለያል።'
                        : 'You can paste your entire bank SMS here — the transaction ID is extracted automatically.'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Optional Glass Folder File Upload */}
              <GlassFolderUploader
                label="Optional: Attach Receipt Screenshot (አማራጭ የደረሰኝ ፎቶ)"
                selectedImageUrl={screenshotDataUrl}
                onFileSelect={(dataUrl) => setScreenshotDataUrl(dataUrl)}
                onClear={() => setScreenshotDataUrl(null)}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md rounded-xl py-3 text-sm cursor-pointer"
                rightIcon={
                  isVerifyingWithBank ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )
                }
              >
                {isVerifyingWithBank
                  ? (isAmharic ? 'በ Verify.ET ከባንክ ጋር በማረጋገጥ ላይ...' : 'Verifying with Bank via Verify.ET...')
                  : isSubmitting
                  ? (isAmharic ? 'በመላክ ላይ...' : 'Submitting...')
                  : (isAmharic ? 'በ Verify.ET ወዲያውኑ አረጋግጥ እና አግብር ⚡' : 'Verify & Activate Instantly via Verify.ET ⚡')}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Subscription Status Modal Popup */}
      <SubscriptionStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        submission={lookedUpSubmission}
        searchedPhone={phoneQuery}
      />
    </div>
  );
};
