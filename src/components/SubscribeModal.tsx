'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { GlassFolderUploader } from './ui/GlassFolderUploader';
import { usePayment } from '../context/PaymentContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentSubmission } from '../types';
import { compressImage } from '../lib/imageCompressor';
import { validateFullName, validateEthiopianPhone } from '../lib/validation';
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
  Upload,
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
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotTouched, setScreenshotTouched] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingWithBank, setIsVerifyingWithBank] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Real-time validation
  const nameValidation = validateFullName(name, isAmharic);
  const phoneValidation = validateEthiopianPhone(phone, isAmharic);

  const nameError = nameTouched && !nameValidation.isValid ? nameValidation.error : undefined;
  const nameSuccess = nameTouched && nameValidation.isValid ? (isAmharic ? 'ትክክለኛ ስም' : 'Looks good') : undefined;

  const phoneError = phoneTouched && !phoneValidation.isValid ? phoneValidation.error : undefined;
  const phoneSuccess = phoneTouched && phoneValidation.isValid ? (isAmharic ? 'ትክክለኛ ስልክ ቁጥር' : 'Valid phone number') : undefined;

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setDirection(1);
      setNameTouched(false);
      setPhoneTouched(false);
      setScreenshotTouched(false);
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

    if (!cleanRef && !screenshotDataUrl) {
      error(
        isAmharic ? 'የትራንዛክሽን ቁጥር ወይም ደረሰኝ ያስፈልጋል' : 'Transaction ID or receipt required',
        isAmharic
          ? 'እባክዎ ከባንክ ወይም ከቴሌብር የደረሰዎትን የትራንዛክሽን ቁጥር (Transaction ID) ወይም የደረሰኝ ፎቶ ያስገቡ'
          : 'Please enter your bank/Telebirr transaction reference number or upload a screenshot.'
      );
      return;
    }

    setIsSubmitting(true);
    if (cleanRef) {
      setIsVerifyingWithBank(true);
    }

    try {
      // 1. If transaction ID is provided, verify directly with Verify.et!
      if (cleanRef) {
        const verifyRes = await verifyPaymentOnline({
          reference: cleanRef,
          bank: selectedBank !== 'auto' ? selectedBank : undefined,
          name: name.trim(),
          phone: phone.trim(),
          planName: selectedPlan,
          amount: planAmount,
          screenshotUrl: screenshotDataUrl || undefined,
        });

        if (verifyRes.success && verifyRes.verified && verifyRes.submission) {
          success(
            isAmharic ? '✅ ክፍያዎ በ Verify.ET ተረጋግጧል!' : '✅ Payment Verified via Verify.ET!',
            isAmharic
              ? 'የደንበኝነት ምዝገባዎ ወዲያውኑ ገቢር ሆኗል (ራስ-ሰር ማረጋገጫ ተጠናቋል)'
              : 'Your subscription is now active! Auto-approval complete.'
          );

          setName('');
          setPhone('');
          setTransactionId('');
          setScreenshotDataUrl(null);
          setScreenshotFile(null);
          setCurrentStep(1);

          onClose();
          onSuccess(verifyRes.submission);
          return;
        } else if (verifyRes.success && verifyRes.submission) {
          // Queued in background
          info(
            isAmharic ? 'የክፍያ ማረጋገጫ በሂደት ላይ ነው' : 'Verification In Progress',
            verifyRes.message || (isAmharic ? 'ከባንክ ጋር በማረጋገጥ ላይ ነው። ጥቂት ሰከንዶች ውስጥ ይፀድቃል።' : 'Checking with bank.')
          );

          setName('');
          setPhone('');
          setTransactionId('');
          setScreenshotDataUrl(null);
          setScreenshotFile(null);
          setCurrentStep(1);

          onClose();
          onSuccess(verifyRes.submission);
          return;
        } else if (!screenshotDataUrl) {
          error(
            isAmharic ? 'የክፍያ ማረጋገጫ አልተሳካም' : 'Verification Failed',
            verifyRes.error ||
              (isAmharic
                ? 'የተጠቀሰው የትራንዛክሽን ቁጥር በባንክ አልተገኘም። እባክዎ በትክክል ያረጋግጡ።'
                : 'Transaction reference not found in bank records.')
          );
          setIsSubmitting(false);
          setIsVerifyingWithBank(false);
          return;
        }
      }

      // 2. Fallback: upload screenshot to /api/register
      let imageToUpload: File | string = screenshotFile || screenshotDataUrl || '';
      if (screenshotDataUrl) {
        try {
          const compressed = await compressImage(screenshotFile || screenshotDataUrl, 1400, 0.82);
          imageToUpload = compressed.file;
        } catch (compErr) {
          console.warn('Compression skipped:', compErr);
        }
      }

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone_number', phone.trim());
      formData.append('plan_name', selectedPlan);
      formData.append('amount', String(planAmount));
      if (cleanRef) formData.append('transaction_id', cleanRef);
      if (selectedBank !== 'auto') formData.append('bank', selectedBank);

      if (imageToUpload instanceof File) {
        formData.append('payment_image', imageToUpload);
      } else if (typeof imageToUpload === 'string' && imageToUpload) {
        formData.append('payment_image', String(imageToUpload));
      }

      const registerUrl = new URL('/api/register', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      registerUrl.searchParams.set('plan_name', selectedPlan);
      registerUrl.searchParams.set('amount', String(planAmount));
      registerUrl.searchParams.set('plan_id', selectedPlanId);

      const response = await fetch(registerUrl.toString(), {
        method: 'POST',
        headers: {
          'X-Plan-Name': encodeURIComponent(selectedPlan),
          'X-Plan-Amount': String(planAmount),
          'X-Plan-Id': selectedPlanId,
        },
        body: formData,
      });

      let result: Record<string, any> | null = null;
      try {
        const text = await response.text();
        if (text) {
          result = JSON.parse(text);
        }
      } catch (parseErr) {
        console.warn('Could not parse server response text as JSON:', parseErr);
      }

      if (!response.ok || (result && result.success === false)) {
        const errorMsg =
          result?.error ||
          (response.status === 413
            ? 'The image file is too large for upload. Please try a smaller receipt screenshot.'
            : `Server returned error (${response.status})`);
        throw new Error(errorMsg);
      }

      const reg = result?.registration;
      const isAutoApproved = Boolean(result?.verified);

      const newSub = await submitPayment({
        id: reg?.id,
        userName: reg?.name || name.trim(),
        userPhone: reg?.phone_number || phone.trim(),
        planName: selectedPlan,
        amount: planAmount,
        payerName: reg?.name || name.trim(),
        transactionId: cleanRef || reg?.transaction_id || `TXN-${Date.now().toString().slice(-6)}`,
        screenshotUrl: reg?.payment_image_url || screenshotDataUrl || '',
        status: isAutoApproved ? 'approved' : 'pending',
        verificationMethod: isAutoApproved ? 'verify_et' : 'manual',
        bank: selectedBank !== 'auto' ? selectedBank : undefined,
      });

      success(
        isAutoApproved
          ? (isAmharic ? '✅ ክፍያዎ በ Verify.ET ተረጋግጧል!' : '✅ Payment Verified via Verify.ET!')
          : (isAmharic ? 'ምዝገባዎ በተሳካ ሁኔታ ተጠናቋል!' : 'Registration Submitted!'),
        isAutoApproved
          ? (isAmharic ? 'የደንበኝነት አገልግሎትዎ ወዲያውኑ ገቢር ሆኗል' : 'Your subscription is now active.')
          : (isAmharic ? 'ስም፣ ስልክ ቁጥር እና ደረሰኝ ተመዝግቧል' : 'Your name, phone and payment receipt have been saved.')
      );

      setName('');
      setNameTouched(false);
      setPhone('');
      setPhoneTouched(false);
      setTransactionId('');
      setTransactionIdTouched(false);
      setScreenshotDataUrl(null);
      setScreenshotFile(null);
      setScreenshotTouched(false);
      setCurrentStep(1);

      onClose();
      onSuccess(newSub);
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
    <Modal isOpen={isOpen} onClose={onClose} title="" description="" maxWidth="xl">
      <div className="text-zinc-900 dark:text-zinc-100 max-h-[85vh] overflow-y-auto px-1 sm:px-3 py-1">
        {isClosed ? (
          /* ================= REGISTRATION CLOSED STATE ================= */
          <div className="py-6 sm:py-8 px-2 sm:px-4 text-center space-y-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center mx-auto text-zinc-900 dark:text-white shadow-xs">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                {isAmharic ? 'ምዝገባው ተጠናቋል' : 'Registration Closed'}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {isAmharic ? 'የዚህ ዙር ምዝገባ በይፋ ተጠናቋል' : 'Registration is Officially Closed'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {isAmharic
                  ? 'ለዚህ ዙር የተዘጋጀው ምዝገባ ቀነ-ገደብ አልፏል። አዲስ ምዝገባ በአሁኑ ወቅት አይቻልም። ቀድመው የተመዘገቡ አባላት የአባልነት ማረጋገጫቸውን በስልክ ቁጥር ማረጋገጥ ይችላሉ።'
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
                  <span>{isAmharic ? 'የአባልነት ማረጋገጫ በስልክ' : 'Verify Approval Status'}</span>
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
        <div className="pb-3.5 mb-4 border-b border-zinc-150 dark:border-zinc-800 pr-9 sm:pr-10">
          <div className="flex items-center justify-between gap-3">
            {/* Step Tabs with Visual Connecting Line */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2) goToPrevStep();
                }}
                className={`flex items-center gap-2 text-left transition-all ${
                  currentStep === 1
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer'
                }`}
                title={currentStep === 2 ? (isAmharic ? 'ወደ ደረጃ 1 ተመለስ' : 'Return to Step 1') : undefined}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    currentStep === 1
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs ring-2 ring-zinc-900/10 dark:ring-white/20'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentStep === 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                </span>
                <span className="text-xs font-bold whitespace-nowrap">
                  {isAmharic ? '1. እቅድና ክፍያ' : '1. Plan & Transfer'}
                </span>
              </button>

              {/* Progress Connecting Line */}
              <div className="flex-1 max-w-[40px] sm:max-w-[70px] h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                <div
                  className="h-full bg-zinc-900 dark:bg-white transition-all duration-300"
                  style={{ width: currentStep === 2 ? '100%' : '0%' }}
                />
              </div>

              {/* Step 2 Pill */}
              <div className="flex items-center gap-2 text-left">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    currentStep === 2
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs ring-2 ring-zinc-900/10 dark:ring-white/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  2
                </span>
                <span
                  className={`text-xs font-bold whitespace-nowrap ${
                    currentStep === 2
                      ? 'text-zinc-900 dark:text-white'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {isAmharic ? '2. መረጃና ማረጋገጫ' : '2. Details & Verification'}
                </span>
              </div>
            </div>

            {/* Selected Amount Pill */}
            <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0 border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs">
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
              className="space-y-4 pt-1"
            >
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {isAmharic ? 'የአገልግሎት እቅድ እና የክፍያ አካውንቶች' : 'Select Plan & Transfer'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {isAmharic
                    ? 'የሚፈልጉትን እቅድ ይምረጡና ክፍያውን ከታች ወዳሉት አካውንቶች ያስተላልፉ'
                    : 'Choose your plan and transfer the amount to one of the accounts below'}
                </p>
              </div>

              {/* Plan Choice Pills */}
              <div className="grid grid-cols-3 gap-2">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlan(p.id as '1m' | '3m' | '6m')}
                      className={`relative p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs ring-1 ring-zinc-900 dark:ring-white'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {p.tag && (
                        <span
                          className={`absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            isSelected
                              ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white'
                              : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                          }`}
                        >
                          {p.tag}
                        </span>
                      )}
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-sm font-extrabold font-mono mt-0.5">
                        {p.price}{' '}
                        <span className="text-[10px] font-normal opacity-80">
                          {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Squared Bank Account Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {isAmharic ? 'የክፍያ አካውንቶች (CBE እና Telebirr)' : 'Official Payment Accounts'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc.key}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-xs ${
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
                        className="shrink-0 p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all cursor-pointer shadow-2xs"
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
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
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
                  size="sm"
                  onClick={goToNextStep}
                  className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-xs px-5 cursor-pointer"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {isAmharic ? 'ቀጣይ፡ መረጃ አስገባ' : 'Next: Enter Details'}
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
              className="space-y-4 pt-1"
            >
              {/* Cohesive Selected Plan Summary & Breadcrumb */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                    {isAmharic ? 'የተመረጠ እቅድ፡' : 'Selected Plan:'}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white truncate">
                    {planLabel} • <span className="font-mono">{planAmount}</span> {isAmharic ? 'ብር' : 'ETB'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white underline underline-offset-2 cursor-pointer shrink-0"
                >
                  {isAmharic ? 'እቅድ ቀይር' : 'Change Plan'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Subscriber Name & Phone (Single clean row) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label={isAmharic ? 'ሙሉ ስም' : 'Full Name'}
                    placeholder={isAmharic ? 'ስምዎን ያስገቡ' : 'Your full name'}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!nameTouched) setNameTouched(true);
                    }}
                    onBlur={() => setNameTouched(true)}
                    error={nameError}
                    success={nameSuccess}
                    leftIcon={<User className="w-3.5 h-3.5 text-zinc-400" />}
                    required
                  />

                  <Input
                    label={isAmharic ? 'የስልክ ቁጥር' : 'Phone Number'}
                    placeholder={isAmharic ? '0911234567 ወይም 07...' : '0911234567 or 07...'}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (!phoneTouched) setPhoneTouched(true);
                    }}
                    onBlur={() => setPhoneTouched(true)}
                    error={phoneError}
                    success={phoneSuccess}
                    helperText={
                      !phoneError && !phoneSuccess
                        ? (isAmharic ? 'የዕለቱ መልእክት የሚላክበት ስልክ ቁጥር' : 'SMS delivery phone number')
                        : undefined
                    }
                    leftIcon={<Smartphone className="w-3.5 h-3.5 text-zinc-400" />}
                    required
                  />
                </div>

                {/* 2. Eye-Catching Shadcn-Style Verify.ET Bank Verification Card */}
                <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Clean Header with Verified Live Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-2xs">
                        <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                          {isAmharic ? 'ፈጣን የባንክ ማረጋገጫ' : 'Automated Bank Verification'}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {isAmharic ? 'ያለ ሰው እጅ በ2 ሰከንድ ውስጥ በቀጥታ ይረጋገጣል' : 'Instant check directly with bank'}
                        </p>
                      </div>
                    </div>

                    {/* Live Pulse Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Verify.ET Live</span>
                    </div>
                  </div>

                  {/* Shadcn Segmented Tab Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {isAmharic ? 'የከፈሉበት ዘዴ' : 'Payment Method'}
                      </label>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {selectedBank === 'auto'
                          ? (isAmharic ? 'በራሱ የሚለይ' : 'Auto detection')
                          : selectedBank === 'telebirr'
                          ? 'Telebirr SMS'
                          : 'CBE Mobile'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/60 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedBank('auto')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                          selectedBank === 'auto'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-bold'
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        <span>{isAmharic ? 'ራስ-ሰር ለይ' : 'Auto'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBank('cbe')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                          selectedBank === 'cbe'
                            ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-2xs font-bold'
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>CBE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBank('telebirr')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                          selectedBank === 'telebirr'
                            ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold'
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>Telebirr</span>
                      </button>
                    </div>
                  </div>

                  {/* Transaction ID Input with Inline Paste / Clear Action */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {isAmharic ? 'የትራንዛክሽን ቁጥር (Transaction ID)' : 'Transaction ID / Reference'}
                      </label>
                      {transactionId && (
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                          {transactionId.length} {isAmharic ? 'ቁምፊ' : 'chars'}
                        </span>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
                        <Zap className="w-4 h-4" />
                      </div>

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
                            ? (isAmharic ? 'ምሳሌ፡ CI72984X12 (ከSMS)' : 'e.g. CI72984X12 (from SMS)')
                            : selectedBank === 'cbe'
                            ? (isAmharic ? 'ምሳሌ፡ fHCxyTV... ወይም ደረሰኝ ሊንክ' : 'e.g. fHCxyTV... or receipt link')
                            : (isAmharic ? 'ምሳሌ፡ CI72984X12 ወይም fHCxyTV...' : 'e.g. CI72984X12 or receipt link')
                        }
                        className="w-full h-11 pl-10 pr-20 text-xs sm:text-sm font-mono font-medium rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 shadow-2xs transition-all placeholder:text-zinc-400 placeholder:font-sans"
                      />

                      {/* Right Action: Clear or One-Tap Paste */}
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

                    {/* Clean contextual hint without duplicate repetition */}
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                      <span>
                        {selectedBank === 'telebirr'
                          ? (isAmharic ? 'ከቴሌብር በደረሰዎት አጭር የጽሁፍ መልእክት (SMS) ላይ የሚገኝ ኮድ' : 'Code from your Telebirr SMS notification')
                          : selectedBank === 'cbe'
                          ? (isAmharic ? 'የንግድ ባንክ ደረሰኝ ኮድ ወይም የድረ-ገጽ ሊንክ (URL)' : 'CBE receipt reference code or web link')
                          : (isAmharic ? 'ከባንክ ወይም ከቴሌብር የደረሰዎትን አጭር ኮድ ወይም የደረሰኝ ሊንክ እዚህ ያስገቡ' : 'Paste your bank SMS code or receipt URL to verify')}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Optional Screenshot Attachment Toggle */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(!showImageUpload)}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer underline underline-offset-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {showImageUpload
                      ? (isAmharic ? 'የደረሰኝ ፎቶ መጫኛን ደብቅ' : 'Hide receipt screenshot uploader')
                      : (isAmharic ? '+ የደረሰኝ ፎቶ (Screenshot) ማያያዝ ይፈልጋሉ? (አማራጭ)' : '+ Attach receipt screenshot (Optional)')}
                  </button>

                  {showImageUpload && (
                    <div className="mt-2.5">
                      <GlassFolderUploader
                        label={isAmharic ? 'የክፍያ ደረሰኝ ምስል (አማራጭ)' : 'Payment Image Screenshot (Optional)'}
                        selectedImageUrl={screenshotDataUrl}
                        onFileSelect={(dataUrl, file) => {
                          setScreenshotDataUrl(dataUrl);
                          setScreenshotFile(file);
                        }}
                        onClear={() => {
                          setScreenshotDataUrl(null);
                          setScreenshotFile(null);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Actions - Matched styling with Step 1 */}
                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
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
                    size="sm"
                    isLoading={isSubmitting}
                    className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-xs px-5 cursor-pointer"
                    rightIcon={
                      isVerifyingWithBank ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {isVerifyingWithBank
                      ? (isAmharic ? 'በ Verify.ET በማረጋገጥ ላይ...' : 'Verifying via Verify.ET...')
                      : isSubmitting
                      ? (isAmharic ? 'በመመዝገብ ላይ...' : 'Submitting...')
                      : (isAmharic ? 'ወዲያውኑ አረጋግጥ እና አግብር ⚡' : 'Verify & Activate Instantly ⚡')}
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
