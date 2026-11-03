'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { usePayment } from '../context/PaymentContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentSubmission } from '../types';
import { validateFullName, validateStrict09Phone } from '../lib/validation';
import { parseEthiopianPaymentSms } from '../lib/smsParser';
import {
  User,
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Zap,
  ShieldCheck,
  Loader2,
  Sparkles,
  Building2,
  ClipboardPaste,
  X,
  MessageSquare,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import { useRegistrationDeadline } from '../hooks/useRegistrationDeadline';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: string;
  onSuccess: (submission: PaymentSubmission) => void;
  onOpenVerifyModal?: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  initialPlan,
  onSuccess,
  onOpenVerifyModal,
}) => {
  const { submitPayment, verifyPaymentOnline } = usePayment();
  const { error, info, success } = useToast();
  const { language } = useLanguage();
  const { isClosed } = useRegistrationDeadline();
  const isAmharic = language === 'am';

  const getPlanIdFromStr = (str?: string): '1m' | '3m' | '6m' => {
    if (!str) {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('nazazi_selected_plan_id') || localStorage.getItem('nazazi_selected_plan_id');
        if (stored === '1m' || stored === '3m' || stored === '6m') {
          return stored;
        }
      }
      return '6m';
    }
    const lower = str.toLowerCase();
    if (lower.includes('1 month') || lower.includes('የ1 ወር') || lower === '1m' || lower.includes('200')) return '1m';
    if (lower.includes('3 month') || lower.includes('የ3 ወር') || lower === '3m' || lower.includes('600')) return '3m';
    if (lower.includes('6 month') || lower.includes('የ6 ወር') || lower === '6m' || lower.includes('1000') || lower.includes('1,000')) return '6m';
    return '6m';
  };

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [selectedPlanId, setSelectedPlanId] = useState<'1m' | '3m' | '6m'>(() => getPlanIdFromStr(initialPlan));

  const handleSelectPlan = (planId: '1m' | '3m' | '6m') => {
    setSelectedPlanId(planId);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('nazazi_selected_plan_id', planId);
        localStorage.setItem('nazazi_selected_plan_id', planId);
      } catch {}
    }
  };
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [transactionIdTouched, setTransactionIdTouched] = useState(false);
  const [selectedBank, setSelectedBank] = useState<'cbe' | 'telebirr' | 'auto'>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingWithBank, setIsVerifyingWithBank] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [extractedFromSms, setExtractedFromSms] = useState<{
    reference: string;
    bank?: string;
    amount?: number;
  } | null>(null);
  const [inputMode, setInputMode] = useState<'sms' | 'manual'>('sms');
  const [rawSmsText, setRawSmsText] = useState('');
  const [existingPlanPrompt, setExistingPlanPrompt] = useState<{
    phone: string;
    currentPlan: string;
    currentStatus?: string;
  } | null>(null);

  // Phone input handler enforcing strict 09 format
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    // If user starts by typing '9', auto-prepend '0' -> '09'
    if (digits === '9') digits = '09';
    // If user pastes a number starting with 2519...
    if (digits.startsWith('2519') && digits.length > 4) {
      digits = '09' + digits.slice(4);
    }
    // Limit to exactly 10 digits
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }
    setPhone(digits);
    if (!phoneTouched) setPhoneTouched(true);
  };

  // Real-time validation
  const nameValidation = validateFullName(name, isAmharic);
  const phoneValidation = validateStrict09Phone(phone, isAmharic);

  const nameError = nameTouched && !nameValidation.isValid ? nameValidation.error : undefined;
  const nameSuccess = nameTouched && nameValidation.isValid ? (isAmharic ? 'ትክክለኛ ስም' : 'Looks good') : undefined;

  const phoneError = phoneTouched && !phoneValidation.isValid ? phoneValidation.error : undefined;
  const phoneSuccess = phoneTouched && phoneValidation.isValid ? (isAmharic ? 'ትክክለኛ ስልክ ቁጥር' : 'Valid 09 number') : undefined;

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setDirection(1);
      setNameTouched(false);
      setPhoneTouched(false);
      setTransactionIdTouched(false);
      setExtractedFromSms(null);
      setRawSmsText('');
      setInputMode('sms');
      if (initialPlan) {
        setSelectedPlanId(getPlanIdFromStr(initialPlan));
      }
    }
  }, [isOpen, initialPlan]);

  const copyToClipboard = (text: string, title: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    info(isAmharic ? 'ተቀድቷል' : `Copied ${title}`, text);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleProcessTransactionInput = (rawText: string) => {
    const trimmed = (rawText || '').trim();
    if (!trimmed) {
      setTransactionId('');
      setExtractedFromSms(null);
      return;
    }

    const parsed = parseEthiopianPaymentSms(trimmed);
    if (parsed.isSms && parsed.reference) {
      setTransactionId(parsed.reference);
      setExtractedFromSms({
        reference: parsed.reference,
        bank: parsed.detectedBank,
        amount: parsed.extractedAmount,
      });
      if (parsed.detectedBank && (parsed.detectedBank === 'cbe' || parsed.detectedBank === 'telebirr')) {
        setSelectedBank(parsed.detectedBank);
      }
      if (parsed.extractedAmount && [200, 600, 1000].includes(parsed.extractedAmount)) {
        if (parsed.extractedAmount === 1000) handleSelectPlan('6m');
        else if (parsed.extractedAmount === 600) handleSelectPlan('3m');
        else if (parsed.extractedAmount === 200) handleSelectPlan('1m');
      }
      info(
        isAmharic ? 'ከ SMS የትራንዛክሽን ቁጥር ተለይቷል' : 'Extracted from SMS',
        `${parsed.reference} (${parsed.detectedBank === 'cbe' ? 'CBE' : parsed.detectedBank === 'telebirr' ? 'Telebirr' : 'Bank'}${parsed.extractedAmount ? ` • ${parsed.extractedAmount} ETB` : ''})`
      );
    } else {
      setTransactionId(trimmed);
      setExtractedFromSms(null);
    }
    setTransactionIdTouched(true);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawSmsText(text);
          setInputMode('sms');
          handleProcessTransactionInput(text);
        }
      }
    } catch {
      // Browsers may block clipboard read if permission is not granted
    }
  };

  const planAmount = selectedPlanId === '6m' ? 1000 : selectedPlanId === '3m' ? 600 : 200;
  const selectedPlan = selectedPlanId === '6m'
    ? (isAmharic ? 'የ6 ወር አገልግሎት (1000 ብር)' : '6 Months Access (1,000 Birr)')
    : selectedPlanId === '3m'
    ? (isAmharic ? 'የ3 ወር አገልግሎት (600 ብር)' : '3 Months Access (600 Birr)')
    : (isAmharic ? 'የ1 ወር አገልግሎት (200 ብር)' : '1 Month Access (200 Birr)');

  const planLabel = selectedPlanId === '6m'
    ? (isAmharic ? 'የ6 ወር አገልግሎት' : '6 Months Access')
    : selectedPlanId === '1m'
      ? (isAmharic ? 'የ1 ወር አገልግሎት' : '1 Month Access')
      : (isAmharic ? 'የ3 ወር አገልግሎት' : '3 Months Access');

  const plans = [
    {
      id: '1m',
      name: isAmharic ? 'የ1 ወር' : '1 Month',
      price: '200',
      fullPlan: isAmharic ? 'የ1 ወር አገልግሎት (200 ብር)' : '1 Month Access (200 ETB)',
    },
    {
      id: '3m',
      name: isAmharic ? 'የ3 ወር' : '3 Months',
      price: '600',
      fullPlan: isAmharic ? 'የ3 ወር አገልግሎት (600 ብር)' : '3 Months Access (600 ETB)',
    },
    {
      id: '6m',
      name: isAmharic ? 'የ6 ወር' : '6 Months',
      price: '1,000',
      tag: isAmharic ? 'ተመራጭ' : 'Popular',
      fullPlan: isAmharic ? 'የ6 ወር አገልግሎት (1000 ብር)' : '6 Months Access (1000 ETB)',
    },
  ];

  const bankAccounts = [
    {
      key: 'cbe',
      name: isAmharic ? 'CBE (ንግድ ባንክ)' : 'Commercial Bank of Ethiopia (CBE)',
      shortName: 'CBE',
      accountNumber: '1000432169948',
      holder: 'Eyuel Habtamu Enyew',
    },
    {
      key: 'telebirr',
      name: isAmharic ? 'Telebirr (ቴሌብር)' : 'Telebirr',
      shortName: 'Telebirr',
      accountNumber: '0953886865',
      holder: 'Abel Merga Gonder',
    },
  ];

  const goToNextStep = () => {
    setDirection(1);
    setCurrentStep(2);
  };

  const goToPrevStep = () => {
    setDirection(-1);
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setNameTouched(true);
    setPhoneTouched(true);
    setTransactionIdTouched(true);

    if (!nameValidation.isValid) {
      error(
        isAmharic ? 'እባክዎ ስምዎን በትክክል ያስገቡ' : 'Invalid Name',
        nameValidation.error
      );
      return;
    }

    if (!phoneValidation.isValid) {
      error(
        isAmharic ? 'እባክዎ የስልክ ቁጥር በትክክል ያስገቡ' : 'Invalid Phone Number',
        phoneValidation.error
      );
      return;
    }

    const cleanRef = transactionId.trim();

    if (!cleanRef) {
      error(
        isAmharic ? 'የትራንዛክሽን ቁጥር ያስፈልጋል' : 'Transaction ID required',
        isAmharic
          ? 'እባክዎ ከባንክ ወይም ከቴሌብር የደረሰዎትን የትራንዛክሽን ቁጥር (Transaction ID) ያስገቡ'
          : 'Please enter your bank or Telebirr transaction reference number.'
      );
      return;
    }

    setIsSubmitting(true);
    setIsVerifyingWithBank(true);

    try {
      // Direct online verification with Verify.ET API
      const cleanPhone = phoneValidation.cleanPhone || phone.trim();
      const verifyRes = await verifyPaymentOnline({
        reference: cleanRef,
        bank: selectedBank !== 'auto' ? selectedBank : undefined,
        name: name.trim(),
        phone: cleanPhone,
        planName: selectedPlan,
        amount: planAmount,
      });

      if (verifyRes.alreadyExists) {
        setExistingPlanPrompt({
          phone: cleanPhone,
          currentPlan: verifyRes.currentPlan || (isAmharic ? 'የቀድሞ እቅድ' : 'Existing Plan'),
          currentStatus: verifyRes.currentStatus || 'approved',
        });
        info(
          isAmharic ? 'ስልክ ቁጥሩ ቀድሞውኑ ተመዝግቧል' : 'Phone Already Registered',
          isAmharic
            ? `ይህ ስልክ ቁጥር ቀድሞውኑ በ "${verifyRes.currentPlan || 'የቀድሞ እቅድ'}" ተመዝግቧል። እቅድዎን መቀየር ይፈልጋሉ?`
            : `This phone number is already registered with "${verifyRes.currentPlan || 'Current Plan'}". Would you like to change your plan?`
        );
        return;
      }

      if (verifyRes.success && verifyRes.submission) {
        if (verifyRes.verified) {
          success(
            isAmharic ? '✅ ክፍያዎ በ Verify.ET ተረጋግጧል!' : '✅ Payment Verified via Verify.ET!',
            isAmharic
              ? 'የአገልግሎት ምዝገባዎ ወዲያውኑ ገቢር ሆኗል (ራስ-ሰር ማረጋገጫ ተጠናቋል)'
              : 'Your subscription is now active! Auto-approval complete.'
          );
        } else {
          info(
            isAmharic ? 'የክፍያ ማረጋገጫ በሂደት ላይ ነው' : 'Verification In Progress',
            verifyRes.message || (isAmharic ? 'ከባንክ ጋር በማረጋገጥ ላይ ነው። ጥቂት ሰከንዶች ውስጥ ይፀድቃል።' : 'Checking with bank.')
          );
        }

        setName('');
        setNameTouched(false);
        setPhone('');
        setPhoneTouched(false);
        setTransactionId('');
        setTransactionIdTouched(false);
        setExtractedFromSms(null);
        setExistingPlanPrompt(null);
        setCurrentStep(1);

        onClose();
        onSuccess(verifyRes.submission);
        return;
      }

      // If verification failed explicitly with an error message
      error(
        isAmharic ? 'የክፍያ ማረጋገጫ አልተሳካም' : 'Verification Failed',
        verifyRes.error ||
          (isAmharic
            ? 'የተጠቀሰው የትራንዛክሽን ቁጥር በባንክ አልተገኘም። እባክዎ በትክክል ያረጋግጡ።'
            : 'Transaction reference could not be verified. Please check the code and try again.')
      );
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred during submission';
      error(isAmharic ? 'የምዝገባ ስህተት' : 'Submission Error', errMsg);
    } finally {
      setIsSubmitting(false);
      setIsVerifyingWithBank(false);
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!existingPlanPrompt) return;
    setIsSubmitting(true);
    setIsVerifyingWithBank(true);
    const cleanRef = transactionId.trim();

    try {
      const verifyRes = await verifyPaymentOnline({
        reference: cleanRef,
        bank: selectedBank !== 'auto' ? selectedBank : undefined,
        name: name.trim() || 'Valued Subscriber',
        phone: existingPlanPrompt.phone,
        planName: selectedPlan,
        amount: planAmount,
        confirmPlanChange: true,
      });

      if (verifyRes.success && verifyRes.submission) {
        success(
          isAmharic ? '✅ እቅድዎ በተሳካ ሁኔታ ተቀይሯል!' : '✅ Plan Successfully Changed!',
          isAmharic
            ? `አዲሱ እቅድዎ (${selectedPlan}) ገቢር ሆኗል`
            : `Your new plan (${selectedPlan}) is now active!`
        );
        setExistingPlanPrompt(null);
        setName('');
        setNameTouched(false);
        setPhone('');
        setPhoneTouched(false);
        setTransactionId('');
        setTransactionIdTouched(false);
        setExtractedFromSms(null);
        setCurrentStep(1);

        onClose();
        onSuccess(verifyRes.submission);
      } else {
        error(
          isAmharic ? 'እቅድ መቀየር አልተሳካም' : 'Plan Change Failed',
          verifyRes.error || (isAmharic ? 'እባክዎ በትክክል ያረጋግጡ።' : 'Could not change plan.')
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing plan';
      error(isAmharic ? 'ስህተት' : 'Error', msg);
    } finally {
      setIsSubmitting(false);
      setIsVerifyingWithBank(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" description="" maxWidth="lg">
      <div className="text-zinc-900 dark:text-zinc-100 max-h-[85vh] overflow-y-auto px-2 sm:px-4 py-2 sm:py-3">
        {isClosed ? (
          /* ================= REGISTRATION CLOSED STATE ================= */
          <div className="py-6 sm:py-8 px-2 sm:px-4 text-center space-y-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center mx-auto text-zinc-900 dark:text-white shadow-xs">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-block px-3 py-1 rounded-[15px] text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                {isAmharic ? 'ምዝገባው ተጠናቋል' : 'Registration Closed'}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {isAmharic ? 'የዚህ ዙር ምዝገባ በይፋ ተጠናቋል' : 'Registration is Officially Closed'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {isAmharic
                  ? 'ለዚህ ዙር የተዘጋጀው ምዝገባ ቀነ-ገደብ አልፏል። አዲስ ምዝገባ በአሁኑ ወቅት አይቻልም። ቀድመው የተመዘገቡ አባላት የአባልነት ሁኔታቸውን በስልክ ቁጥር ማረጋገጥ ይችላሉ።'
                  : 'The registration deadline for this cohort has concluded and no new sign-ups are being accepted. Previously registered members can verify their approval status anytime.'}
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
              {onOpenVerifyModal && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-auto font-bold text-xs py-2.5 px-4 cursor-pointer"
                  onClick={() => {
                    onClose();
                    onOpenVerifyModal();
                  }}
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isAmharic ? 'የአባልነት ሁኔታዎን ያረጋግጡ' : 'Verify Approval Status'}</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto font-semibold text-xs py-2.5 px-4 cursor-pointer"
                onClick={onClose}
              >
                {isAmharic ? 'ዝጋ' : 'Close Window'}
              </Button>
            </div>
          </div>
        ) : (
        <>
        {/* Connected Step-by-Step Progress Header */}
        <div className="pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-800 pr-10">
          <div className="flex items-center justify-between gap-4">
            {/* Step Tabs with Visual Connecting Line */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2) goToPrevStep();
                }}
                className={`flex items-center gap-2 text-left transition-all ${
                  currentStep === 1
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer'
                }`}
              >
                <span
                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
                    currentStep === 1
                      ? 'bg-[#981C00] text-white shadow-xs'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentStep === 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
                </span>
                <span className="text-xs font-bold whitespace-nowrap">
                  {isAmharic ? '1. ክፍያ' : '1. Transfer'}
                </span>
              </button>

              {/* Progress Line */}
              <div className="flex-1 max-w-[36px] sm:max-w-[56px] h-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                <div
                  className="h-full bg-[#981C00] transition-all duration-300"
                  style={{ width: currentStep === 2 ? '100%' : '0%' }}
                />
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-2 text-left">
                <span
                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ${
                    currentStep === 2
                      ? 'bg-[#981C00] text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  2
                </span>
                <span
                  className={`text-xs font-bold whitespace-nowrap ${
                    currentStep === 2
                      ? 'text-zinc-900 dark:text-white'
                      : 'text-zinc-400'
                  }`}
                >
                  {isAmharic ? '2. ማረጋገጫ' : '2. Verify'}
                </span>
              </div>
            </div>

            {/* Selected Amount Pill */}
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-[15px] bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shrink-0 border border-zinc-200/80 dark:border-zinc-700 shadow-2xs">
              {planAmount} {isAmharic ? 'ብር' : 'ETB'}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 1 ? (
            /* ================= STEP 1: SELECT PLAN & BANK ACCOUNT ================= */
            <motion.div
              key="step1"
              custom={direction}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 pt-1"
            >
              {/* Header */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {isAmharic ? 'ክፍያ ያስተላልፉ' : 'Transfer Payment'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isAmharic
                    ? 'የመረጡትን ክፍያ ወደ አንዱ አካውንት ይላኩ'
                    : 'Transfer the selected amount to either account'}
                </p>
              </div>

              {/* Plan Choice Pills */}
              <div className="grid grid-cols-3 gap-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlan(p.id as '1m' | '3m' | '6m')}
                      className={`relative p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#981C00] bg-[#981C00] text-white shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {p.tag && (
                        <span
                          className={`absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-[15px] uppercase tracking-wider ${
                            isSelected
                              ? 'bg-white text-[#981C00]'
                              : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                          }`}
                        >
                          {p.tag}
                        </span>
                      )}
                      <p className="text-xs font-semibold">{p.name}</p>
                      <p className="text-sm sm:text-base font-extrabold font-mono mt-1">
                        {p.price}{' '}
                        <span className="text-[10px] font-normal opacity-80">
                          {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Bank Account Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.key}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            acc.key === 'cbe' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          {acc.name}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-extrabold text-zinc-950 dark:text-white tracking-wider select-all">
                        {acc.accountNumber}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                        {isAmharic ? 'የአካውንት ስም፡ ' : 'Account: '}
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{acc.holder}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.accountNumber, acc.name, acc.key)}
                      className="shrink-0 p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all cursor-pointer shadow-2xs"
                      title={isAmharic ? 'ቁጥር ቅዳ' : 'Copy Number'}
                    >
                      {copiedKey === acc.key ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Bottom Actions with Breathing Room */}
              <div className="flex items-center justify-between gap-3 pt-5 border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-semibold px-4 cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={goToNextStep}
                  className="text-xs font-bold px-5 cursor-pointer shadow-xs"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {isAmharic ? 'ቀጣይ →' : 'Next →'}
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ================= STEP 2: SUBSCRIBER INFO & VERIFICATION ================= */
            <motion.div
              key="step2"
              custom={direction}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 pt-1"
            >
              {/* Minimal Plan Reminder */}
              <div className="flex items-center justify-between text-xs pb-1">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="font-bold text-zinc-900 dark:text-white">{planLabel}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="font-mono font-bold text-[#981C00] dark:text-rose-400">
                    {planAmount} {isAmharic ? 'ብር' : 'ETB'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {isAmharic ? 'ቀይር' : 'Change'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Subscriber Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label={isAmharic ? 'ሙሉ ስም' : 'Full Name'}
                    placeholder={isAmharic ? 'ስም' : 'Full name'}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!nameTouched) setNameTouched(true);
                    }}
                    onBlur={() => setNameTouched(true)}
                    error={nameError}
                    leftIcon={<User className="w-3.5 h-3.5 text-zinc-400" />}
                    required
                  />

                  <Input
                    label={isAmharic ? 'የስልክ ቁጥር (09...)' : 'Phone Number (09...)'}
                    placeholder="0911223344"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={() => setPhoneTouched(true)}
                    error={phoneError}
                    leftIcon={<Smartphone className="w-3.5 h-3.5 text-zinc-400" />}
                    maxLength={10}
                    type="tel"
                    inputMode="numeric"
                    required
                  />
                </div>

                {/* 2. Modern, Polished & Perfectly Aligned Payment Verification Input */}
                <div className="space-y-2.5 pt-1">
                  {/* Mode Selector Tabs & Bank Filter */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setInputMode('sms')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          inputMode === 'sms'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isAmharic ? 'ሙሉ SMS ለጥፍ' : 'Paste Full SMS'}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          {isAmharic ? 'ቀላል' : 'Easy'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInputMode('manual')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          inputMode === 'manual'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{isAmharic ? 'የትራንዛክሽን ቁጥር ብቻ' : 'Transaction ID Only'}</span>
                      </button>
                    </div>

                    {/* Bank Filter Pills */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-[11px] border border-zinc-200/60 dark:border-zinc-700/60">
                      {(['auto', 'cbe', 'telebirr'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            selectedBank === b
                              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-bold'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          {b === 'auto'
                            ? (isAmharic ? 'ራስ-ሰር' : 'Auto')
                            : b === 'cbe'
                            ? 'CBE'
                            : 'Telebirr'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {inputMode === 'sms' ? (
                    /* Mode A: Clean & Spacious Multi-line SMS Paste Box */
                    <div className="space-y-2.5">
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-3 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {isAmharic
                              ? 'ከቴሌብር ወይም ከንግድ ባንክ የደረሰዎትን ሙሉ መልእክት እዚህ ይለጥፉ'
                              : 'Paste the entire SMS message you received from Telebirr or CBE'}
                          </span>

                          <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                            title={isAmharic ? 'ከክሊፕቦርድ ለጥፍ' : 'Paste from clipboard'}
                          >
                            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{isAmharic ? 'ከክሊፕቦርድ ለጥፍ' : 'Paste'}</span>
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={rawSmsText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRawSmsText(val);
                            handleProcessTransactionInput(val);
                          }}
                          placeholder={
                            isAmharic
                              ? 'ለምሳሌ፡ "ውድ ደንበኛ፣ 200.00 ብር ወደ 2519****6865 (Abel Merga Gonder) አስተላልፈዋል። የግብይት ቁጥር፡ CI72984X12..."'
                              : 'e.g. "You have transferred ETB 200.00 to Abel Merga Gonder (2519****6865). Transaction number: CI72984X12..."'
                          }
                          className="w-full bg-transparent text-xs sm:text-sm font-sans text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      {/* Live Extracted Summary Card */}
                      {extractedFromSms && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 space-y-2 shadow-2xs animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              {isAmharic ? 'የክፍያ መረጃ በራስ-ሰር ተለይቷል' : 'Payment Data Extracted Successfully'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                              {extractedFromSms.bank === 'telebirr' ? 'Telebirr ቴሌብር' : 'CBE ንግድ ባንክ'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-emerald-500/20">
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{isAmharic ? 'የትራንዛክሽን ቁጥር' : 'Transaction ID'}</p>
                              <p className="font-mono font-extrabold text-zinc-950 dark:text-white truncate">{extractedFromSms.reference}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-emerald-500/20">
                              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{isAmharic ? 'የተከፈለው መጠን' : 'Detected Amount'}</p>
                              <p className="font-bold text-emerald-700 dark:text-emerald-400">
                                {extractedFromSms.amount ? `${extractedFromSms.amount} ብር (ETB)` : `${planAmount} ብር (ETB)`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode B: Direct Single Transaction ID Input */
                    <div className="space-y-2.5">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.length > 20 && parseEthiopianPaymentSms(val).isSms) {
                              setInputMode('sms');
                              setRawSmsText(val);
                              handleProcessTransactionInput(val);
                            } else {
                              setTransactionId(val);
                              if (!transactionIdTouched) setTransactionIdTouched(true);
                            }
                          }}
                          onPaste={(e) => {
                            const text = e.clipboardData?.getData('text');
                            if (text && (parseEthiopianPaymentSms(text).isSms || text.length > 25)) {
                              e.preventDefault();
                              setInputMode('sms');
                              setRawSmsText(text);
                              handleProcessTransactionInput(text);
                            }
                          }}
                          onBlur={() => setTransactionIdTouched(true)}
                          placeholder={
                            selectedBank === 'telebirr'
                              ? 'e.g. CI72984X12'
                              : selectedBank === 'cbe'
                              ? 'e.g. fHCxyTVljBclm6Yk4C or https://mbreciept.cbe.com.et/...'
                              : (isAmharic ? 'የትራንዛክሽን ቁጥር እዚህ ያስገቡ...' : 'Enter Transaction ID or Reference...')
                          }
                          className="w-full h-11 px-3.5 pr-20 text-xs sm:text-sm font-mono font-medium rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 shadow-2xs transition-all placeholder:text-zinc-400 placeholder:font-sans"
                        />

                        {/* Inline Action */}
                        <div className="absolute right-2 flex items-center">
                          {transactionId ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTransactionId('');
                                setExtractedFromSms(null);
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title={isAmharic ? 'አጽዳ' : 'Clear'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handlePasteFromClipboard}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700 transition-all cursor-pointer shadow-2xs"
                              title={isAmharic ? 'ከክሊፕቦርድ ለጥፍ' : 'Paste from clipboard'}
                            >
                              <ClipboardPaste className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="text-[11px]">{isAmharic ? 'ለጥፍ' : 'Paste'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🔒 Change Plan Prompt (Double Activation Prevention) */}
                {existingPlanPrompt && (
                  <div className="rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/95 dark:bg-amber-950/40 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          {isAmharic ? 'ይህ ስልክ ቁጥር ቀድሞውኑ ተመዝግቧል!' : 'Phone Number Already Registered!'}
                        </h4>
                        <p className="text-[12px] text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                          {isAmharic
                            ? `ይህ ስልክ ቁጥር (${existingPlanPrompt.phone}) ቀድሞውኑ በ "${existingPlanPrompt.currentPlan}" ተመዝግቧል። ተጨማሪ ክፍያ ሳያስፈልግዎት እቅድዎን ወደ ${selectedPlan} መቀየር ይፈልጋሉ?`
                            : `This phone number (${existingPlanPrompt.phone}) already has an active registration with "${existingPlanPrompt.currentPlan}". Would you like to change your plan to ${selectedPlan}?`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmPlanChange}
                        isLoading={isSubmitting}
                        className="bg-[#981C00] hover:bg-[#7A1600] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        {isAmharic ? 'አዎ፣ እቅዴን ቀይር ⚡' : 'Yes, Change My Plan ⚡'}
                      </Button>

                      {onOpenVerifyModal && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onClose();
                            onOpenVerifyModal();
                          }}
                          className="text-xs border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 bg-white dark:bg-amber-950/60 cursor-pointer"
                        >
                          {isAmharic ? 'ያለኝን አገልግሎት አሳይ' : 'View My Active Plan'}
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setExistingPlanPrompt(null);
                          setPhone('');
                          setPhoneTouched(false);
                          goToPrevStep();
                        }}
                        className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 underline ml-auto cursor-pointer"
                      >
                        {isAmharic ? 'ስልክ ቁጥር ቀይር' : 'Change phone number'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Actions with Breathing Room */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={goToPrevStep}
                    disabled={isSubmitting}
                    className="text-xs font-semibold px-4 cursor-pointer"
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  >
                    {isAmharic ? 'ተመለስ' : 'Back'}
                  </Button>

                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    isLoading={isSubmitting}
                    className="text-xs font-bold shadow-xs px-6 cursor-pointer"
                    rightIcon={
                      isVerifyingWithBank ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {isVerifyingWithBank
                      ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Verifying...')
                      : isSubmitting
                      ? (isAmharic ? 'በመመዝገብ ላይ...' : 'Submitting...')
                      : (isAmharic ? 'አረጋግጥ እና አግብር ⚡' : 'Verify & Activate ⚡')}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </div>
    </Modal>
  );
};
