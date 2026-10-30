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

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTransactionId(text.trim());
          setTransactionIdTouched(true);
          info(isAmharic ? 'የትራንዛክሽን ኮድ ተለጥፏል' : 'Pasted from clipboard', text.trim());
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
      holder: 'Nazazi',
    },
    {
      key: 'telebirr',
      name: isAmharic ? 'Telebirr (ቴሌብር)' : 'Telebirr',
      shortName: 'Telebirr',
      accountNumber: '0953886865',
      holder: 'Nazazi',
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

                {/* 2. Streamlined Transaction ID Input */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {isAmharic ? 'የትራንዛክሽን ቁጥር (Transaction ID)' : 'Transaction ID / Reference'}
                    </label>

                    {/* Method Selector Pills */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px]">
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

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => {
                        setTransactionId(e.target.value);
                        if (!transactionIdTouched) setTransactionIdTouched(true);
                      }}
                      onBlur={() => setTransactionIdTouched(true)}
                      placeholder={
                        selectedBank === 'telebirr'
                          ? (isAmharic ? 'ምሳሌ፡ CI72984X12' : 'e.g. CI72984X12')
                          : selectedBank === 'cbe'
                          ? (isAmharic ? 'ምሳሌ፡ fHCxyTV... ወይም ሊንክ' : 'e.g. fHCxyTV... or link')
                          : (isAmharic ? 'ምሳሌ፡ CI72984X12 ወይም fHCxyTV...' : 'e.g. CI72984X12 or link')
                      }
                      className="w-full h-11 px-3.5 pr-20 text-xs sm:text-sm font-mono font-medium rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 shadow-2xs transition-all placeholder:text-zinc-400 placeholder:font-sans"
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
