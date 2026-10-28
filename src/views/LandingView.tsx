'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationTab, PaymentSubmission } from '../types';
import { SubscribeModal } from '../components/SubscribeModal';
import { SubscriptionStatusModal } from '../components/SubscriptionStatusModal';
import { useRegistrationDeadline } from '../hooks/useRegistrationDeadline';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Smartphone,
  Lock,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenVerifyModal?: (submission?: PaymentSubmission | null) => void;
  isVerifyModalOpen?: boolean;
  onCloseVerifyModal?: () => void;
}

interface SampleVerse {
  reference: string;
  verse: string;
  reflection: string;
  time: string;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenVerifyModal,
  isVerifyModalOpen = false,
  onCloseVerifyModal,
}) => {
  const { language, t } = useLanguage();
  const { isClosed } = useRegistrationDeadline();
  const isAmharic = language === 'am';

  // Modal states
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedPlanForSubscribe, setSelectedPlanForSubscribe] = useState<string>('');

  // Internal verify status modal state if opened locally without parent prop
  const [localVerifyModalOpen, setLocalVerifyModalOpen] = useState(false);
  const [verifySubmission, setVerifySubmission] = useState<PaymentSubmission | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Phone Mockup Active Verse Preview State
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(0);

  const sampleVerses: SampleVerse[] = isAmharic
    ? [
        {
          reference: 'መዝሙር 46:1',
          verse: '«እግዚአብሔር መጠጊያችንና ኃይላችን፥ በሚደርስብን መከራ ሁሉ ታላቅ ረዳታችን ነው።»',
          reflection: 'ሰላም ወዳጄ፤ የዛሬው ቀን የድካም ሳይሆን የእግዚአብሔር አዲስ ምሕረት የሚገለጥበት የተስፋ ቀን ይሁንልዎ።',
          time: 'ዛሬ 12:30 ጥዋት',
        },
        {
          reference: 'ኢሳይያስ 40:29',
          verse: '«ለደከመው ኃይልን ይሰጣል፥ ጉልበት ለሌለውም ብርታትን ይጨምራል።»',
          reflection: 'በሚያስጨንቅዎት ነገር ሁሉ ጌታ ከጎንዎ ነው። በሰላሙ ልብዎን ያሳርፈው።',
          time: 'ዛሬ 12:30 ጥዋት',
        },
        {
          reference: 'ማቴዎስ 11:28',
          verse: '«እናንተ ደካሞች ሸክማችሁ የከበደ ሁሉ፥ ወደ እኔ ኑ፥ እኔም አሳርፋችኋለሁ።»',
          reflection: 'ከእግዚአብሔር ጋር የተጀመረ ቀን በበረከት እና በዕረፍት ይጠናቀቃል። ናዛዚ',
          time: 'ዛሬ 12:30 ጥዋት',
        },
      ]
    : [
        {
          reference: 'Psalm 46:1',
          verse: '"God is our refuge and strength, an ever-present help in trouble."',
          reflection: 'Good morning friend; may today bring renewed peace and spiritual strength to your spirit.',
          time: 'Today 6:30 AM',
        },
        {
          reference: 'Isaiah 40:29',
          verse: '"He gives strength to the weary and increases the power of the weak."',
          reflection: 'Whatever weight you carry today, God walks right beside you. Stand in courage.',
          time: 'Today 6:30 AM',
        },
        {
          reference: 'Matthew 11:28',
          verse: '"Come to me, all you who are weary and burdened, and I will give you rest."',
          reflection: 'Begin this day in peace and confidence. Nazazi Daily Encouragement.',
          time: 'Today 6:30 AM',
        },
      ];

  // URL query params handler for direct campaigns (?plan=6m, ?subscribe=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const planParam = params.get('plan') || params.get('plan_name') || params.get('tier');
        const subscribeParam = params.get('subscribe') || params.get('register');

        if (planParam) {
          const lower = planParam.toLowerCase();
          if (lower.includes('1m') || lower.includes('200')) {
            sessionStorage.setItem('nazazi_selected_plan_id', '1m');
            localStorage.setItem('nazazi_selected_plan_id', '1m');
            setSelectedPlanForSubscribe('1 Month Access (200 Birr)');
          } else if (lower.includes('3m') || lower.includes('600')) {
            sessionStorage.setItem('nazazi_selected_plan_id', '3m');
            localStorage.setItem('nazazi_selected_plan_id', '3m');
            setSelectedPlanForSubscribe('3 Months Access (600 Birr)');
          } else if (lower.includes('6m') || lower.includes('1000') || lower.includes('1,000')) {
            sessionStorage.setItem('nazazi_selected_plan_id', '6m');
            localStorage.setItem('nazazi_selected_plan_id', '6m');
            setSelectedPlanForSubscribe('6 Months Access (1,000 Birr)');
          }
        }

        if (subscribeParam === 'true' || subscribeParam === '1') {
          setIsSubscribeModalOpen(true);
        }
      } catch {}
    }
  }, []);

  const handleOpenSubscribe = (planName?: string, price?: string | number) => {
    if (planName && price) {
      const planStr = `${planName} (${price} Birr)`;
      setSelectedPlanForSubscribe(planStr);
      const lower = String(price).toLowerCase();
      if (typeof window !== 'undefined') {
        const planId = lower.includes('600') ? '3m' : lower.includes('1000') || lower.includes('1,000') ? '6m' : '1m';
        try {
          sessionStorage.setItem('nazazi_selected_plan_id', planId);
          localStorage.setItem('nazazi_selected_plan_id', planId);
        } catch {}
      }
    } else {
      setSelectedPlanForSubscribe('');
    }
    setIsSubscribeModalOpen(true);
  };

  const scrollToPricing = () => {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      handleOpenSubscribe();
    }
  };

  const handleTriggerVerifyModal = (sub?: PaymentSubmission | null) => {
    if (onOpenVerifyModal) {
      onOpenVerifyModal(sub || null);
    } else {
      setVerifySubmission(sub || null);
      setLocalVerifyModalOpen(true);
    }
  };

  const handleCloseVerify = () => {
    if (onCloseVerifyModal) {
      onCloseVerifyModal();
    }
    setLocalVerifyModalOpen(false);
    setVerifySubmission(null);
  };

  const pricingPlans = isAmharic
    ? [
        {
          id: '1m',
          name: 'የ1 ወር አገልግሎት',
          price: '200',
          originalPrice: null,
          period: 'ለ1 ወር',
          badge: 'ተለዋዋጭ',
          savingsBadge: null,
          recommended: false,
          cta: 'ለ1 ወር ይመዝገቡ',
          features: [
            'የየዕለቱ የሚያጽናና SMS መልእክት',
            'ቀጥታ ወደ ሞባይል ስልክ የሚላክ',
            'ፈጣን የስልክ ቁጥር ማረጋገጫ',
          ],
        },
        {
          id: '3m',
          name: 'የ3 ወር አገልግሎት',
          price: '600',
          originalPrice: null,
          period: 'ለ3 ወራት',
          badge: 'ተወዳጅ',
          savingsBadge: null,
          recommended: false,
          cta: 'ለ3 ወር ይመዝገቡ',
          features: [
            'የየዕለቱ የሚያጽናና SMS መልእክት',
            'ያለማቋረጥ ለ3 ወራት የሚላክ',
            'የቅድሚያ SMS ስርጭት',
          ],
        },
        {
          id: '6m',
          name: 'የ6 ወር አገልግሎት',
          price: '1,000',
          originalPrice: '1,200',
          period: 'ለ6 ወራት',
          badge: 'እጅግ ተመራጭ',
          savingsBadge: '200 ብር ቅናሽ',
          recommended: true,
          cta: 'ለ6 ወር ይመዝገቡ',
          features: [
            'የየዕለቱ የሚያጽናና SMS መልእክት',
            'ያለማቋረጥ ለ6 ወራት የሚላክ',
            'የ200 ብር ቅናሽ እና ቅድሚያ ድጋፍ',
          ],
        },
      ]
    : [
        {
          id: '1m',
          name: '1 Month Access',
          price: '200',
          originalPrice: null,
          period: '1 Month',
          badge: 'Flexible',
          savingsBadge: null,
          recommended: false,
          cta: 'Register for 1 Month',
          features: [
            'Daily spiritual SMS encouragement',
            'Direct mobile phone delivery',
            'Instant phone status lookup',
          ],
        },
        {
          id: '3m',
          name: '3 Months Access',
          price: '600',
          originalPrice: null,
          period: '3 Months',
          badge: 'Popular',
          savingsBadge: null,
          recommended: false,
          cta: 'Register for 3 Months',
          features: [
            'Daily spiritual SMS encouragement',
            '3 months continuous broadcasts',
            'Priority queue dispatch',
          ],
        },
        {
          id: '6m',
          name: '6 Months Access',
          price: '1,000',
          originalPrice: '1,200',
          period: '6 Months',
          badge: 'Best Value',
          savingsBadge: 'Save 200 ETB',
          recommended: true,
          cta: 'Register for 6 Months',
          features: [
            'Daily spiritual SMS encouragement',
            '6 months continuous broadcasts',
            'Save 200 ETB & priority support',
          ],
        },
      ];

  const faqs = isAmharic
    ? [
        {
          q: 'ናዛዚ ማለት ምን ማለት ነው? ተልዕኮውስ ምንድን ነው?',
          a: 'ናዛዚ ማለት "አጽናኝ ወይም ተስፋ ሰጪ" ማለት ነው። ተልዕኮአችን በሕይወት ውጣ ውረድ ውስጥ ለደከሙና መጽናናትን ለሚሹ ክርስቲያኖች በየዕለቱ የሚያበረቱና የሚያንፁ የመጽሐፍ ቅዱስ ቃላትን በቀጥታ በSMS ማድረስ ነው።',
        },
        {
          q: 'ለመመዝገብ መለያ (Account) መክፈት ወይም ኢሜይል ያስፈልጋል?',
          a: 'አይ! ምንም ዓይነት መለያ፣ የተጠቃሚ ስም ወይም የይለፍ ቃል መፍጠር አያስፈልግዎትም። ስምዎንና ስልክ ቁጥርዎን በማስገባት እና የከፈሉበትን ደረሰኝ በማያያዝ በቀላሉ በደቂቃዎች ውስጥ ይመዘገባሉ።',
        },
        {
          q: 'የከፈልኩት ክፍያ መጽደቁን እንዴት ማረጋገጥ እችላለሁ?',
          a: 'በድረ-ገጹ አናት ወይም ግርጌ ላይ የሚገኘውን "የአባልነት ማረጋገጫ" የሚለውን በመጫን የስልክ ቁጥርዎን በማስገባት የክፍያዎን ወቅታዊ ሁኔታ (በመጠባበቅ ላይ፣ የጸደቀ) ወዲያውኑ ማየት ይችላሉ።',
        },
        {
          q: 'የስልክ ቁጥሬ በጥንቃቄ የተጠበቀ እና ሚስጥራዊ ነው?',
          a: 'አዎ። የአባላት መረጃ በጥብቅ ሚስጥራዊነቱ ተጠብቆ የሚቆይ ሲሆን፣ ለተመረጠው የናዛዚ መንፈሳዊ SMS አገልግሎት ብቻ ጥቅም ላይ ይውላል። ለማንም ሶስተኛ ወገን አይተላለፍም።',
        },
        {
          q: 'መልእክቶቹ በምን ሰዓት ነው ወደ ስልኬ የሚደርሱኝ?',
          a: 'መልእክቶቹ በየዕለቱ ጥዋት ወደ ስልክዎ ይላካሉ። ቀኑን በእግዚአብሔር ቃል፣ በተስፋ እና በሰላም ለመጀመር እንዲያስችል ታስቦ የተዘጋጀ ነው።',
        },
      ]
    : [
        {
          q: 'What does Nazazi mean and what is its mission?',
          a: 'Nazazi means "Comforter" or "Encourager". Our mission is to deliver uplifting Bible verses and Christian spiritual encouragement directly to your mobile phone every morning.',
        },
        {
          q: 'Do I need to create an account or provide a password?',
          a: 'No. No password, username, or login account is required. Simply provide your name, phone number, and a screenshot of your bank transfer receipt.',
        },
        {
          q: 'How do I check if my payment has been approved?',
          a: 'You can verify anytime by clicking "Verify Status" in the header or footer, then entering your registered Ethiopian phone number to view your real-time approval status.',
        },
        {
          q: 'Is my phone number kept private and safe?',
          a: 'Yes. Subscriber information is handled with strict confidentiality and is used exclusively for Nazazi spiritual SMS broadcasts. We never share your contact details.',
        },
        {
          q: 'What time of day are the SMS messages delivered?',
          a: 'Messages are broadcast every morning directly to your phone, helping you begin each day rooted in peace, hope, and God\'s Word.',
        },
      ];

  const currentVerse = sampleVerses[activeVerseIndex];

  return (
    <div className="space-y-24 sm:space-y-36 pb-20 sm:pb-32 overflow-hidden">
      {/* ========================================================
          1. HERO SECTION
          Editorial, calm, high-contrast, uncluttered.
          Includes authentic SMS preview inside realistic phone.
          ======================================================== */}
      <section className="pt-8 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Hero Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
            {/* Spiritual Category Definition */}
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#981C00] dark:bg-[#C43214]" />
              <span>{isAmharic ? 'የዕለት መንፈሳዊ ማጽናኛ SMS' : 'Daily Spiritual Encouragement SMS'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5] leading-[1.12]">
              {isAmharic ? (
                <>
                  ለደከመች ነፍስ የዕለት <span className="font-bela-bereka text-[#981C00] dark:text-[#C43214]">ተስፋ</span> እና ማጽናኛ
                </>
              ) : (
                <>
                  Daily Spiritual <span className="text-[#981C00] dark:text-[#C43214]">Comfort</span> for the Weary Soul
                </>
              )}
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-[#706A65] dark:text-[#A8A19A] leading-relaxed max-w-xl font-normal">
              {isAmharic
                ? 'የሚያጽናኑ እና የሚያበረቱ የመጽሐፍ ቅዱስ ቃላቶች በየዕለቱ በቀጥታ በስልክዎ በSMS ይደርስዎታል። ምንም መለያ መክፈት አያስፈልግም፤ በስልክ ቁጥርዎ ብቻ ይቀላቀሉ።'
                : 'Uplifting Bible scriptures and spiritual encouragement delivered directly to your mobile phone every morning. No account or password required.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={isClosed ? () => setIsSubscribeModalOpen(true) : scrollToPricing}
                className="px-6 py-3.5 rounded-md bg-[#981C00] hover:bg-[#7A1D28] text-white text-sm font-bold tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {isClosed ? (
                  <span className="inline-flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>{isAmharic ? 'የምዝገባ ጊዜ ተጠናቋል' : 'Registration Closed'}</span>
                  </span>
                ) : (
                  <>
                    <span>{isAmharic ? 'የአገልግሎት እቅድ ይምረጡ' : 'Choose Subscription Plan'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={() => handleTriggerVerifyModal(null)}
                className="px-5 py-3.5 rounded-md bg-[#FFFFFF] dark:bg-[#1D1A18] hover:bg-[#F3EFEA] dark:hover:bg-[#25221F] border border-[#E8E4DF] dark:border-[#2C2825] text-sm font-semibold text-[#24211F] dark:text-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-[#706A65] dark:text-[#A8A19A]" />
                <span>{isAmharic ? 'የአባልነት ማረጋገጫ በስልክ' : 'Check Approval Status'}</span>
              </button>
            </div>

            {/* Trust Micro-note */}
            <div className="pt-2 flex items-center gap-4 text-xs text-[#706A65] dark:text-[#A8A19A]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] stroke-[3]" />
                {isAmharic ? 'ቀጥታ በSMS የሚላክ' : 'Direct SMS Delivery'}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] stroke-[3]" />
                {isAmharic ? 'ምንም መለያ አያስፈልግም' : 'No Account Needed'}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] stroke-[3]" />
                {isAmharic ? 'በCBE እና በTelebirr' : 'CBE & Telebirr'}
              </span>
            </div>
          </div>

          {/* Hero Right Column: Authentic SMS Phone Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Phone Device Frame */}
            <div className="w-full max-w-[340px] sm:max-w-[360px] rounded-[38px] p-3.5 bg-[#E8E4DF] dark:bg-[#2C2825] border border-[#DCD6CE] dark:border-[#38332F] shadow-xl">
              <div className="rounded-[30px] bg-[#FAF8F5] dark:bg-[#181615] overflow-hidden border border-[#D8D2CA] dark:border-[#2A2623] flex flex-col">
                {/* Phone Status Bar */}
                <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-semibold text-[#706A65] dark:text-[#A8A19A] border-b border-[#EFECE6] dark:border-[#221F1D]">
                  <span>ethio telecom 4G</span>
                  <div className="w-12 h-3.5 rounded-full bg-[#E0DAD1] dark:bg-[#2A2623]" />
                  <span>12:30</span>
                </div>

                {/* SMS Conversation Header */}
                <div className="px-5 py-3.5 bg-[#FFFFFF] dark:bg-[#1D1A18] border-b border-[#E8E4DF] dark:border-[#2C2825] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#981C00] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    N
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5] truncate">
                        ናዛዚ • NAZAZI
                      </p>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </div>
                    <p className="text-[10px] text-[#706A65] dark:text-[#A8A19A]">
                      {isAmharic ? 'የተረጋገጠ መንፈሳዊ SMS' : 'Verified Spiritual SMS'}
                    </p>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="p-4 space-y-3.5 min-h-[290px] flex flex-col justify-end">
                  <div className="text-center">
                    <span className="text-[10px] px-2.5 py-1 rounded bg-[#EFECE6] dark:bg-[#221F1D] text-[#706A65] dark:text-[#A8A19A] font-medium">
                      {currentVerse.time}
                    </span>
                  </div>

                  {/* Message Bubble: The Bible Verse */}
                  <div className="bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] rounded-2xl rounded-tl-xs p-4 shadow-xs space-y-2">
                    <p className="text-[11px] font-bold text-[#981C00] dark:text-[#C43214] tracking-wide">
                      {currentVerse.reference}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#24211F] dark:text-[#FAF8F5] leading-relaxed font-medium">
                      {currentVerse.verse}
                    </p>
                  </div>

                  {/* Message Bubble: The Reflection / Comfort Note */}
                  <div className="bg-[#FAF4F2] dark:bg-[#251A18] border border-[#E8DCD9] dark:border-[#382622] rounded-2xl rounded-tl-xs p-3.5 shadow-2xs">
                    <p className="text-xs text-[#7A1D28] dark:text-[#E89382] leading-relaxed font-normal">
                      {currentVerse.reflection}
                    </p>
                  </div>
                </div>

                {/* Phone SMS Input Bar */}
                <div className="px-4 py-3 bg-[#FFFFFF] dark:bg-[#1D1A18] border-t border-[#E8E4DF] dark:border-[#2C2825] flex items-center justify-between text-xs text-[#A8A19A]">
                  <span className="text-[11px] text-[#706A65] dark:text-[#A8A19A]">
                    {isAmharic ? 'ናዛዚ የዕለት አገልግሎት' : 'Nazazi Daily Service'}
                  </span>
                  <span className="text-[10px] font-mono">SMS</span>
                </div>
              </div>
            </div>

            {/* Interactive Preview Switcher: Allows visitor to preview sample verses */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] text-[#706A65] dark:text-[#A8A19A] font-medium">
                {isAmharic ? 'የናሙና ጥቅሶች ይቀይሩ:' : 'Sample verses:'}
              </span>
              <div className="flex items-center gap-1.5">
                {sampleVerses.map((v, i) => (
                  <button
                    key={v.reference}
                    onClick={() => setActiveVerseIndex(i)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      activeVerseIndex === i
                        ? 'bg-[#981C00] text-white'
                        : 'bg-[#EAE5DF] dark:bg-[#25221F] text-[#706A65] dark:text-[#A8A19A] hover:text-[#24211F]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. HOW IT WORKS SECTION (#how-it-works)
          Clear 3-step numbered journey reflecting real product facts.
          ======================================================== */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] pt-14 space-y-12">
          {/* Section Header */}
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              {isAmharic ? 'ቀላል አሰራር' : 'Simple 3-Step Process'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'እንዴት እንደሚሰራ' : 'How Nazazi Works'}
            </h2>
            <p className="text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
              {isAmharic
                ? 'ምንም የተወሳሰበ ቅጽ ወይም አካውንት መክፈት አይጠበቅብዎትም። በ3 ቀላል እርምጃዎች አገልግሎቱን ይጀምሩ።'
                : 'No complex registrations or accounts. Begin receiving daily encouragement in 3 simple steps.'}
            </p>
          </div>

          {/* 3 Step Editorial Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {/* Step 1 */}
            <div className="space-y-3.5 p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825]">
              <div className="w-8 h-8 rounded-md bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] flex items-center justify-center font-black text-sm border border-[#E8DCD9] dark:border-[#3A2420]">
                1
              </div>
              <h3 className="text-base font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                {isAmharic ? 'የደንበኝነት እቅድ ይምረጡ' : 'Choose a Plan'}
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                {isAmharic
                  ? 'የ1 ወር (200 ብር)፣ የ3 ወር (600 ብር) ወይም የ6 ወር (1,000 ብር) አገልግሎት በመምረጥ ሂደቱን ይጀምሩ።'
                  : 'Select a 1-month (200 ETB), 3-month (600 ETB), or 6-month (1,000 ETB) subscription option.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3.5 p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825]">
              <div className="w-8 h-8 rounded-md bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] flex items-center justify-center font-black text-sm border border-[#E8DCD9] dark:border-[#3A2420]">
                2
              </div>
              <h3 className="text-base font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                {isAmharic ? 'ይመዝገቡና ክፍያዎን ያረጋግጡ' : 'Register & Upload Receipt'}
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                {isAmharic
                  ? 'ስምዎንና ስልክ ቁጥርዎን ያስገቡ፤ በCBE ወይም በTelebirr የከፈሉበትን ደረሰኝ ፎቶ በቀላሉ ያያይዙ።'
                  : 'Enter your name and mobile number, then attach a screenshot of your CBE or Telebirr transfer.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3.5 p-6 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825]">
              <div className="w-8 h-8 rounded-md bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] flex items-center justify-center font-black text-sm border border-[#E8DCD9] dark:border-[#3A2420]">
                3
              </div>
              <h3 className="text-base font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                {isAmharic ? 'በስልክዎ መልእክቶችን ይቀበሉ' : 'Receive Daily SMS'}
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                {isAmharic
                  ? 'ክፍያዎ እንደተረጋገጠ፣ በየዕለቱ የሚያንፁ እና የሚያጽናኑ የመጽሐፍ ቅዱስ ቃላቶች በSMS መድረስ ይጀምራሉ።'
                  : 'Once payment is approved, daily comforting verses and messages arrive right on your phone.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SUBSCRIPTION PRICING SECTION (#pricing)
          Real plans: 1m (200), 3m (600), 6m (1000 - discount from 1200)
          ======================================================== */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] pt-14 space-y-10">
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              {isAmharic ? 'ግልጽ እና ተመጣጣኝ ዋጋ' : 'Transparent Pricing'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'የደንበኝነት እቅዶች' : 'Subscription Plans'}
            </h2>
            <p className="text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
              {isAmharic
                ? 'ምንም የተደበቀ ወጪ የለም። ለእርሶ የሚስማማውን የአገልግሎት ጊዜ ይምረጡ።'
                : 'No hidden fees or subscriptions traps. Choose the duration that suits you best.'}
            </p>
          </div>

          {/* Registration Deadline Alert (if closed) */}
          {isClosed && (
            <div className="max-w-lg mx-auto p-4 rounded-xl bg-[#FAF4F2] dark:bg-[#251A18] border border-[#E8DCD9] dark:border-[#382622] text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#981C00] dark:text-[#C43214]">
                <Lock className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የምዝገባ ጊዜ ተጠናቋል' : 'Registration Closed'}</span>
              </div>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A]">
                {isAmharic
                  ? 'ለዚህ ዙር የተዘጋጀው ምዝገባ ተጠናቋል። የተመዘገቡ አባላት የአባልነት ማረጋገጫቸውን በስልክ ቁጥር ማየት ይችላሉ።'
                  : 'Registration for this cohort is closed. Members can verify their approval status below.'}
              </p>
              <div>
                <button
                  onClick={() => handleTriggerVerifyModal(null)}
                  className="px-3.5 py-1.5 rounded text-xs font-bold bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] text-[#24211F] dark:text-[#FAF8F5] cursor-pointer"
                >
                  {isAmharic ? 'የአባልነት ማረጋገጫ በስልክ' : 'Verify Status'}
                </button>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-all ${
                  plan.recommended
                    ? 'bg-[#FFFFFF] dark:bg-[#1D1A18] border-2 border-[#981C00] dark:border-[#C43214] shadow-md'
                    : 'bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] shadow-xs'
                }`}
              >
                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#981C00] text-white shadow-2xs">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                      {plan.name}
                    </h3>
                    {!plan.recommended && (
                      <span className="text-[10px] font-semibold text-[#706A65] dark:text-[#A8A19A] px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#141211] border border-[#E8E4DF] dark:border-[#2C2825]">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Price Block */}
                  <div className="space-y-1">
                    {plan.originalPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#A8A19A] line-through">
                          {plan.originalPrice} {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                        {plan.savingsBadge && (
                          <span className="text-[10px] font-bold text-[#981C00] dark:text-[#C43214] bg-[#FAF4F2] dark:bg-[#2A1D1A] px-1.5 py-0.5 rounded">
                            {plan.savingsBadge}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-xs font-semibold text-[#706A65] dark:text-[#A8A19A]">
                        {isAmharic ? 'ብር' : 'ETB'} / {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Feature Bullets */}
                  <div className="space-y-2.5 pt-4 border-t border-[#E8E4DF] dark:border-[#2C2825]">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-xs text-[#24211F] dark:text-[#FAF8F5]">
                        <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] stroke-[3] shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action Button */}
                <div className="pt-6 mt-4">
                  <button
                    onClick={() => handleOpenSubscribe(plan.name, plan.price)}
                    disabled={isClosed}
                    className={`w-full py-2.5 px-4 rounded-md text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isClosed
                        ? 'bg-[#EAE5DF] text-[#706A65] cursor-not-allowed'
                        : plan.recommended
                        ? 'bg-[#981C00] hover:bg-[#7A1D28] text-white shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-[#EAE5DF] dark:bg-[#141211] dark:hover:bg-[#25221F] text-[#24211F] dark:text-[#FAF8F5] border border-[#E8E4DF] dark:border-[#2C2825]'
                    }`}
                  >
                    {isClosed ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isAmharic ? 'ምዝገባ ተጠናቋል' : 'Closed'}</span>
                      </span>
                    ) : (
                      <span>{plan.cta}</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. TRUST & PRIVACY SECTION (#trust)
          Real, verifiable facts without fake marketing hype.
          ======================================================== */}
      <section id="trust" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] pt-14 space-y-10">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              {isAmharic ? 'ደህንነት እና ግልጽነት' : 'Trust & Reliability'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'እምነት እና ምስጢራዊነት' : 'Built on Trust & Respect'}
            </h2>
            <p className="text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
              {isAmharic
                ? 'የግል መረጃዎ ክብር እና ጥበቃ ይገባዋል። ናዛዚ ግልጽ በሆነ ስርዓት የተደራጀ ነው።'
                : 'Your contact details and trust are sacred. Nazazi is designed with clear privacy and simplicity.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-5 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] space-y-2.5">
              <UserCheck className="w-5 h-5 text-[#981C00] dark:text-[#C43214]" />
              <h3 className="text-sm font-bold text-[#24211F] dark:text-[#FAF8F5]">
                {isAmharic ? 'ምንም መለያ አያስፈልግም' : 'No Account Needed'}
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                {isAmharic
                  ? 'ኢሜይል፣ የተጠቃሚ ስም ወይም የይለፍ ቃል ሳያስፈልግ በስልክ ቁጥርዎ ብቻ ይመዝገቡ።'
                  : 'No account registration or passwords to manage. Sign up with your phone number alone.'}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] space-y-2.5">
              <ShieldCheck className="w-5 h-5 text-[#981C00] dark:text-[#C43214]" />
              <h3 className="text-sm font-bold text-[#24211F] dark:text-[#FAF8F5]">
                {isAmharic ? 'የስልክ ቁጥር ምስጢራዊነት' : 'Phone Number Privacy'}
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                {isAmharic
                  ? 'ስልክ ቁጥርዎ ለናዛዚ መንፈሳዊ መልእክት ብቻ ይውላል። ለማንም ሶስተኛ ወገን አይተላለፍም።'
                  : 'Your phone number is strictly guarded and used exclusively for your spiritual SMS.'}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] space-y-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#981C00] dark:text-[#C43214]" />
              <h3 className="text-sm font-bold text-[#24211F] dark:text-[#FAF8F5]">
                {isAmharic ? 'ቀጥታ ማረጋገጫ' : 'Direct Status Verification'}
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                {isAmharic
                  ? 'ክፍያዎን ከፈጸሙ በኋላ በስልክ ቁጥርዎ ብቻ የክፍያዎን ሁኔታ በማንኛውም ሰዓት ያረጋግጡ።'
                  : 'Check whether your payment has been approved anytime with a simple phone number lookup.'}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] space-y-2.5">
              <MessageSquare className="w-5 h-5 text-[#981C00] dark:text-[#C43214]" />
              <h3 className="text-sm font-bold text-[#24211F] dark:text-[#FAF8F5]">
                {isAmharic ? 'ቀጥተኛ ድጋፍ' : 'Direct Support'}
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                {isAmharic
                  ? 'ለሚገጥምዎት ማንኛውም ጥያቄ በይፋዊው የቴሌግራም ቻናላችን ፈጣን ምላሽ ያገኛሉ።'
                  : 'Reach out through our official Telegram channel for prompt and friendly assistance.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. FAQ SECTION (#faq)
          Clean, accessible accordion with keyboard navigation.
          ======================================================== */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] pt-14 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              FAQ
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'ተደጋግመው የሚጠየቁ ጥያቄዎች' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FFFFFF] dark:bg-[#1D1A18] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm font-bold text-[#24211F] dark:text-[#FAF8F5] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#25221F] transition-colors"
                  >
                    <span className="pr-4 leading-snug">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#706A65] dark:text-[#A8A19A] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed border-t border-[#E8E4DF]/60 dark:border-[#2C2825]/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FINAL CALL TO ACTION
          Restrained, editorial, conversion-focused banner.
          ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-2xl bg-[#981C00] text-white text-center space-y-6 shadow-md">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isAmharic ? 'ተስፋን እና መንፈሳዊ ማጽናኛን ይቀበሉ' : 'Receive Daily Hope & Encouragement'}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
              {isAmharic
                ? 'ለነፍስዎ ብርታት የሚሆኑ የእግዚአብሔር ቃላቶች በየዕለቱ በስልክዎ እንዲደርስዎ አሁኑኑ ይመዝገቡ።'
                : 'Subscribe today to begin receiving uplifting Bible verses and spiritual words directly to your phone.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={isClosed ? () => setIsSubscribeModalOpen(true) : scrollToPricing}
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-white text-[#981C00] hover:bg-zinc-100 text-xs sm:text-sm font-bold tracking-tight transition-colors cursor-pointer shadow-xs"
            >
              {isClosed ? (
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'ምዝገባ ተጠናቋል' : 'Closed'}</span>
                </span>
              ) : (
                isAmharic ? 'አሁኑኑ ይመዝገቡ' : 'Subscribe Now'
              )}
            </button>
            <button
              onClick={() => handleTriggerVerifyModal(null)}
              className="w-full sm:w-auto px-5 py-3 rounded-md bg-transparent hover:bg-black/10 border border-white/40 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {isAmharic ? 'የአባልነት ማረጋገጫ በስልክ ቁጥር' : 'Check Approval Status'}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. MODAL REGISTRATION & VERIFICATION DIALOGS
          Kept fully functional with existing application logic.
          ======================================================== */}
      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        initialPlan={selectedPlanForSubscribe}
        onOpenVerifyModal={() => handleTriggerVerifyModal(null)}
        onSuccess={(sub) => {
          if (onOpenVerifyModal) {
            onOpenVerifyModal(sub);
          } else {
            setVerifySubmission(sub);
            setLocalVerifyModalOpen(true);
          }
        }}
      />

      {/* Phone Number Verification Status Popup Modal */}
      {!onOpenVerifyModal && (
        <SubscriptionStatusModal
          isOpen={localVerifyModalOpen}
          onClose={handleCloseVerify}
          submission={verifySubmission}
          onResubmit={() => setIsSubscribeModalOpen(true)}
        />
      )}
    </div>
  );
};
