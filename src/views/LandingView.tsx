'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationTab, PaymentSubmission } from '../types';
import { SubscribeModal } from '../components/SubscribeModal';
import { SubscriptionStatusModal } from '../components/SubscriptionStatusModal';
import { IntegrationBeam } from '../components/ui/IntegrationBeam';
import { NotchedProjectCard } from '../components/ui/notched-project-card';
import { GoogleIcon } from '../components/ui/google-icon';
import { useRegistrationDeadline } from '../hooks/useRegistrationDeadline';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Smartphone,
  Lock,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  Mic,
  Info,
  Star,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenVerifyModal?: (submission?: PaymentSubmission | null) => void;
  isVerifyModalOpen?: boolean;
  onCloseVerifyModal?: () => void;
}

interface SampleVerse {
  day: string;
  reference: string;
  verse: string;
  reflection: string;
  signoff: string;
  time: string;
}

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  city: string;
  plan: string;
  quote: string;
  favoriteVerse: string;
  avatarBg: string;
  avatarInitials: string;
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
        day: 'ሰኞ',
        reference: 'መዝሙር 46:1',
        verse: '«እግዚአብሔር መጠጊያችንና ኃይላችን፥ በሚደርስብን መከራ ሁሉ ታላቅ ረዳታችን ነው።»',
        reflection: 'ሰላም ወዳጄ፤ የዛሬው ቀን የድካም ሳይሆን የእግዚአብሔር አዲስ ምሕረት የሚገለጥበት የተስፋ ቀን ይሁንልዎ።',
        signoff: 'ናዛዚ የዕለት አገልግሎት',
        time: '12:30 ጥዋት',
      },
      {
        day: 'ማክሰኞ',
        reference: 'ኢሳይያስ 40:29',
        verse: '«ለደከመው ኃይልን ይሰጣል፥ ጉልበት ለሌለውም ብርታትን ይጨምራል።»',
        reflection: 'ሰላም ወዳጄ፤ በሚያስጨንቅዎት ነገር ሁሉ ጌታ ከጎንዎ ነው። በሰላሙ ልብዎን ያሳርፈው።',
        signoff: 'ናዛዚ የዕለት አገልግሎት',
        time: '12:30 ጥዋት',
      },
      {
        day: 'ረቡዕ',
        reference: 'ማቴዎስ 11:28',
        verse: '«እናንተ ደካሞች ሸክማችሁ የከበደ ሁሉ፥ ወደ እኔ ኑ፥ እኔም አሳርፋችኋለሁ።»',
        reflection: 'ሰላም ወዳጄ፤ ከእግዚአብሔር ጋር የተጀመረ ቀን በበረከት እና በዕረፍት ይጠናቀቃል።',
        signoff: 'ናዛዚ የዕለት አገልግሎት',
        time: '12:30 ጥዋት',
      },
    ]
    : [
      {
        day: 'Monday',
        reference: 'Psalm 46:1',
        verse: '"God is our refuge and strength, an ever-present help in trouble."',
        reflection: 'Good morning friend; may today bring renewed peace and spiritual strength to your spirit.',
        signoff: 'Nazazi Daily Ministry',
        time: '6:30 AM',
      },
      {
        day: 'Tuesday',
        reference: 'Isaiah 40:29',
        verse: '"He gives strength to the weary and increases the power of the weak."',
        reflection: 'Good morning friend; whatever weight you carry today, God walks right beside you.',
        signoff: 'Nazazi Daily Ministry',
        time: '6:30 AM',
      },
      {
        day: 'Wednesday',
        reference: 'Matthew 11:28',
        verse: '"Come to me, all you who are weary and burdened, and I will give you rest."',
        reflection: 'Good morning friend; begin this day in peace and confidence.',
        signoff: 'Nazazi Daily Ministry',
        time: '6:30 AM',
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
      } catch { }
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
        } catch { }
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
        period: 'ለ30 ቀናት',
        badge: 'የ30 ቀናት ጅማሮ',
        durationSubtitle: '30 ተከታታይ ማለዳዎች',
        savingsBadge: null,
        recommended: false,
        cta: 'የ1 ወር አገልግሎት ጀምር',
        description:
          'ቀንዎን በየማለዳው በሚደርሱ የእግዚአብሔር ቃላት በሰላም ለመጀመር የሚያስችል የመነሻ እቅድ።',
        monthlyBreakdown: '200 ብር / በወር',
        features: [
          'በየማለዳው የሚደርስ የእለቱ የመጽሐፍ ቅዱስ ቃል',
          'ያለ ኢንተርኔት በቀጥታ በማንኛውም ስልክ በ SMS',
          'ቀጥተኛ የቴሌብር ወይም የንግድ ባንክ ክፍያ',
          'ምንም መለያ ወይም የይለፍ ቃል (Password) አይጠይቅም',
          'ፈጣን የክፍያ እና የስልክ ቁጥር ማረጋገጫ',
        ],
      },
      {
        id: '3m',
        name: 'የ3 ወር አገልግሎት',
        price: '600',
        originalPrice: null,
        period: 'ለ90 ቀናት',
        badge: 'የሩብ ዓመት ጉዞ',
        durationSubtitle: '90 ተከታታይ ማለዳዎች',
        savingsBadge: null,
        recommended: false,
        cta: 'የ3 ወር አገልግሎት ጀምር',
        description:
          'ለተከታታይ ሩብ ዓመት ማለዳዎን በእግዚአብሔር ቃል ለመክፈትና መንፈሳዊ ብርታትን ሳይቋረጥ ለማግኘት።',
        monthlyBreakdown: 'በወር 200 ብር',
        features: [
          'ለ90 ተከታታይ ቀናት የማያቋርጥ የጠዋት ቃል',
          'ያለ ኢንተርኔት በማንኛውም ስልክ በ SMS',
          'የስልክ ቁጥር መቀየር ቢያስፈልግ ፈጣን ማስተካከያ',
          'በማንኛውም ጊዜ የቀሪ ቀናት ሁኔታን በስልክ የማረጋገጥ እድል',
          'ቀጥተኛ የደንበኞች ድጋፍ',
        ],
      },
      {
        id: '6m',
        name: 'የ6 ወር አገልግሎት',
        price: '1,000',
        originalPrice: '1,200',
        period: 'ለ180 ቀናት',
        badge: 'የግማሽ ዓመት ምርጫ',
        durationSubtitle: '180 ተከታታይ ማለዳዎች',
        savingsBadge: 'የ200 ብር ቅናሽ ያካተተ',
        recommended: true,
        cta: 'የ6 ወር አገልግሎት ጀምር',
        description:
          'ለግማሽ ዓመት ለራስዎ ወይም ለቤተሰብዎ የዕለት ተስፋና መንፈሳዊ ብርታትን የሚያበረክቱበት የተሟላ እቅድ።',
        monthlyBreakdown: 'በወር ~166 ብር ብቻ',
        features: [
          'ለ180 ተከታታይ ቀናት በየማለዳው የሚላክ መንፈሳዊ ቃል',
          'የ200 ብር ቅናሽ (ከ1,200 ብር ወደ 1,000 ብር ዝቅ ያለ)',
          'ቀጥተኛ የደንበኞች ድጋፍ አገልግሎት',
          'የአገልግሎት ጊዜው ሊጠናቀቅ ሲል አስቀድሞ የሚላክ ማስታወሻ',
          'በማንኛውም ጊዜ የቀሪ ቀናት ሁኔታን በስልክ ማረጋገጥ',
        ],
      },
    ]
    : [
      {
        id: '1m',
        name: '1 Month Access',
        price: '200',
        originalPrice: null,
        period: 'for 30 days',
        badge: '30-Day Starter',
        durationSubtitle: '30 consecutive mornings',
        savingsBadge: null,
        recommended: false,
        cta: 'Start 1 Month',
        description:
          'Start each morning centered in peace and daily Scripture, delivered quietly to your mobile phone.',
        monthlyBreakdown: '200 ETB / month',
        features: [
          'Daily morning Scripture verse via SMS',
          'Direct mobile phone delivery — zero data needed',
          'Instant phone approval status check',
          'No password or registration account required',
          'Simple CBE or Telebirr bank transfer',
        ],
      },
      {
        id: '3m',
        name: '3 Months Access',
        price: '600',
        originalPrice: null,
        period: 'for 90 days',
        badge: 'Quarterly Walk',
        durationSubtitle: '90 consecutive mornings',
        savingsBadge: null,
        recommended: false,
        cta: 'Start 3 Months',
        description:
          'A steady 90-day spiritual walk to keep your mornings rooted in encouragement and God’s Word.',
        monthlyBreakdown: '200 ETB / month',
        features: [
          '90 consecutive mornings of Scripture via SMS',
          'Uninterrupted morning broadcast delivery',
          'Quick assistance if your phone number changes',
          'Real-time remaining subscription check anytime',
          'Direct subscriber support',
        ],
      },
      {
        id: '6m',
        name: '6 Months Access',
        price: '1,000',
        originalPrice: '1,200',
        period: 'for 180 days',
        badge: 'Half-Year Choice',
        durationSubtitle: '180 consecutive mornings',
        savingsBadge: 'Save 200 ETB',
        recommended: true,
        cta: 'Start 6 Months',
        description:
          'Our most dedicated plan. Half a year of peaceful morning Scripture for you or a loved one.',
        monthlyBreakdown: 'Only ~166 ETB / month',
        features: [
          '180 consecutive mornings of Scripture via SMS',
          'Built-in 200 ETB savings (1,000 vs 1,200 ETB)',
          'Advance renewal reminder before expiration',
          'Direct priority subscriber assistance',
          'Real-time remaining subscription check anytime',
        ],
      },
    ];

  const faqs = isAmharic
    ? [
      {
        q: '«ናዛዚ» ማለት ምን ማለት ነው? ዓላማውስ ምንድን ነው?',
        a: '«ናዛዚ» ማለት በግዕዝ «አጽናኝ» ወይም «ተስፋ ሰጪ» ማለት ነው። ዓላማችን በዕለት ተዕለት የሕይወት ውጣ ውረድ ውስጥ ለደከሙና መንፈሳዊ ብርታትን ለሚሹ ወገኖች፣ በየማለዳው የሚያጽናኑና የሚያንፁ የመጽሐፍ ቅዱስ ጥቅሶችን በቀጥታ በSMS ማድረስ ነው።',
      },
      {
        q: 'ለመመዝገብ አካውንት መክፈት ወይም ኢሜይል ያስፈልጋል?',
        a: 'አያስፈልግም። ምንም ዓይነት ኢሜይል፣ ፓስወርድ ወይም አካውንት መክፈት ሳይጠበቅብዎት መልእክቱ እንዲደርስዎት የሚፈልጉበትን የስልክ ቁጥር ብቻ በማስገባት መመዝገብ ይችላሉ። ለወላጆችዎ ወይም ለወዳጅዎም የእነሱን ስልክ ቁጥር በማስገባት በቀላሉ መመዝገብ ይችላሉ።',
      },
      {
        q: 'የከፈልኩት ክፍያ መጽደቁን እንዴት ማረጋገጥ እችላለሁ?',
        a: 'በቴሌብር ወይም በንግድ ባንክ (CBE) ክፍያዎን እንደፈጸሙ ሲስተሙ ወዲያውኑ በራሱ ያረጋግጣል። በተጨማሪም ድረ-ገጹ ላይ ያለውን «የአባልነት ሁኔታዎን ያረጋግጡ» የሚለውን በመጫንና ስልክ ቁጥርዎን በማስገባት በማንኛውም ሰዓት ማረጋገጥ ይችላሉ።',
      },
      {
        q: 'የስልክ ቁጥሬ ደህንነት የተጠበቀ እና ምስጢራዊ ነው?',
        a: 'አዎ፣ በሚገባ የተጠበቀ ነው። ስልክ ቁጥርዎ የዕለቱን የመጽሐፍ ቅዱስ ቃል ለመላክ ብቻ ጥቅም ላይ ይውላል። ለማንኛውም ሶስተኛ ወገን ወይም ለማስታወቂያ ድርጅቶች አሳልፈን አንሰጥም።',
      },
      {
        q: 'መልእክቶቹ በምን ሰዓት ነው ወደ ስልኬ የሚደርሱኝ?',
        a: 'መልእክቶቹ በየዕለቱ ማለዳ ልክ ከጠዋቱ 12:30 ሰዓት (በኢትዮጵያ አቆጣጠር) ወደ ስልክዎ ይላካሉ። ኢንተርኔት ስለማይጠይቅ በማንኛውም የሞባይል ስልክ ላይ ይደርስዎታል።',
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

  const testimonials: TestimonialItem[] = isAmharic
    ? [
      {
        id: 'tesfaye',
        name: 'አባ ተስፋዬ ገ/ማሪያም',
        role: 'ጡረተኛ መምህር',
        city: 'አዲስ አበባ',
        plan: 'የ1 ወር አባል',
        quote: '«በየማለዳው 12:30 በመደበኛዋ የኪስ ስልኬ ላይ የሚገባው የእግዚአብሔር ቃል ቀኔን በሰላምና በምስጋና እንድጀምር ብርታት ሆኖኛል።»',
        favoriteVerse: 'መዝሙር 46:1',
        avatarBg: 'from-[#981C00] to-[#7A1D28]',
        avatarInitials: 'ተገ',
      },
      {
        id: 'yonas',
        name: 'ዮናስ ታደሰ',
        role: 'ከውጭ ሀገር ለእናቱ ያስመዘገበ',
        city: 'ባህር ዳር',
        plan: 'የ6 ወር አባል',
        quote: '«ለእናቴ በቴሌብር የ6 ወር ምዝገባ አድርጌላት ነበር። በየሳምንቱ ስንደዋወል ጥቅሶቹ እንዴት እንደሚያጽናኗት በደስታ ትነግረኛለች።»',
        favoriteVerse: 'ኢሳይያስ 40:31',
        avatarBg: 'from-[#B45309] to-[#92400E]',
        avatarInitials: 'ዮታ',
      },
      {
        id: 'selamawit',
        name: 'ዶ/ር ሰላማዊት አበበ',
        role: 'የሕክምና ባለሙያ',
        city: 'ሐዋሳ',
        plan: 'የ6 ወር አባል',
        quote: '«ከሆስፒታል የሌሊት ፈረቃዬ በኋላ በጠዋት የሚደርሰኝ ቃል ለነፍሴ እረፍት ይሰጣል። አጭር፣ ግልጽ እና ልብ የሚነካ ነው።»',
        favoriteVerse: 'ፊልጵስዩስ 4:6-7',
        avatarBg: 'from-[#0F766E] to-[#115E59]',
        avatarInitials: 'ሰአ',
      },
      {
        id: 'martha',
        name: 'ማርታ ኃይሌ',
        role: 'የዩኒቨርሲቲ ተማሪ',
        city: 'አዲስ አበባ',
        plan: 'የ3 ወር አባል',
        quote: '«በፈተና ወቅት ማለዳዬን በእግዚአብሔር ቃል መጀመሬ ውስጣዊ መረጋጋትን ሰጥቶኛል። ያለ ኢንተርኔት በSMS መምጣቱ ለተማሪዎች በጣም አመቺ ነው።»',
        favoriteVerse: 'ማቴዎስ 11:28',
        avatarBg: 'from-[#7C3AED] to-[#5B21B6]',
        avatarInitials: 'ማኃ',
      },
      {
        id: 'dawit',
        name: 'ቀሲስ ዳዊት ወ/ሚካኤል',
        role: 'የመንፈሳዊ ትምህርት አገልጋይ',
        city: 'አዳማ',
        plan: 'የ6 ወር አባል',
        quote: '«የሚላኩት ጥቅሶች በጥሞና የተመረጡ፣ መንፈስን የሚያድሱ እና የዕለት ውሏችንን በጸሎት እንድንመራ የሚያነሳሱ ናቸው።»',
        favoriteVerse: 'መዝሙር 23:1',
        avatarBg: 'from-[#981C00] to-[#5A1200]',
        avatarInitials: 'ዳወ',
      },
      {
        id: 'birhanu',
        name: 'ብርሃኑ አሰፋ',
        role: 'ነጋዴ',
        city: 'አዲስ አበባ፣ መርካቶ',
        plan: 'የ6 ወር አባል',
        quote: '«ጠዋት ወደ ሥራዬ ስወጣ ቀኔን በፈጣሪ ቃል መክፈት ልማዴ ሆኗል። ሁሌም ልክ 12:30 ላይ ሳይዛነፍ መድረሱ ያስመሰግናል።»',
        favoriteVerse: 'ምሳሌ 3:5-6',
        avatarBg: 'from-[#C2410C] to-[#9A3412]',
        avatarInitials: 'ብአ',
      },
    ]
    : [
      {
        id: 'tesfaye',
        name: 'Aba Tesfaye G/Mariam',
        role: 'Retired Teacher',
        city: 'Addis Ababa',
        plan: '1-Year Member',
        quote: '"The 6:30 AM Scripture on my simple phone helps me start each day anchored in God’s peace."',
        favoriteVerse: 'Psalm 46:1',
        avatarBg: 'from-[#981C00] to-[#7A1D28]',
        avatarInitials: 'TG',
      },
      {
        id: 'yonas',
        name: 'Yonas Tadesse',
        role: 'Diaspora (Gift for Mother)',
        city: 'Bahir Dar',
        plan: '1-Year Member',
        quote: '"I subscribed for my mother via Telebirr. Every week, she happily shares how the verses encourage her."',
        favoriteVerse: 'Isaiah 40:31',
        avatarBg: 'from-[#B45309] to-[#92400E]',
        avatarInitials: 'YT',
      },
      {
        id: 'selamawit',
        name: 'Dr. Selamawit Abebe',
        role: 'Physician',
        city: 'Hawassa',
        plan: '6-Month Member',
        quote: '"Coming off overnight hospital shifts, the morning verse brings true rest to my weary spirit."',
        favoriteVerse: 'Philippians 4:6-7',
        avatarBg: 'from-[#0F766E] to-[#115E59]',
        avatarInitials: 'SA',
      },
      {
        id: 'martha',
        name: 'Martha Haile',
        role: 'University Student',
        city: 'Addis Ababa',
        plan: '3-Month Member',
        quote: '"Starting mornings with Scripture during exams gives me calm focus. Reaching me via SMS without data is perfect."',
        favoriteVerse: 'Matthew 11:28',
        avatarBg: 'from-[#7C3AED] to-[#5B21B6]',
        avatarInitials: 'MH',
      },
      {
        id: 'dawit',
        name: 'Kesis Dawit W/Michael',
        role: 'Ministry Worker',
        city: 'Adama',
        plan: '1-Year Member',
        quote: '"Carefully chosen with spiritual reverence, these verses anchor everyday life in quiet prayer."',
        favoriteVerse: 'Psalm 23:1',
        avatarBg: 'from-[#981C00] to-[#5A1200]',
        avatarInitials: 'DW',
      },
      {
        id: 'birhanu',
        name: 'Birhanu Assefa',
        role: 'Merchant',
        city: 'Merkato',
        plan: '6-Month Member',
        quote: '"Opening my day in the market with God’s Word has become my anchor. Its punctual delivery is admirable."',
        favoriteVerse: 'Proverbs 3:5-6',
        avatarBg: 'from-[#C2410C] to-[#9A3412]',
        avatarInitials: 'BA',
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
              <span>{isAmharic ? 'የዕለት መንፈሳዊ ስንቅ በSMS' : 'Daily Spiritual Encouragement SMS'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5] leading-[1.12]">
              {isAmharic ? (
                <>
                  ለዛለች ነፍስ እረፍት፣ ለየዕለቱ <span className="font-bela-bereka text-[#981C00] dark:text-[#C43214]">ተስፋና</span> ብርታት
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
                ? 'ልብን የሚያጽናኑ እና መንፈስን የሚያድሱ የመጽሐፍ ቅዱስ ጥቅሶች በየማለዳው በቀጥታ ወደ ስልክዎ በSMS ይላካሉ። ምንም አካውንት መክፈት ሳያስፈልግ በስልክ ቁጥርዎ ብቻ ይጀምሩ።'
                : 'Uplifting Bible scriptures and spiritual encouragement delivered directly to your mobile phone every morning. No account or password required.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={isClosed ? () => setIsSubscribeModalOpen(true) : scrollToPricing}
                className="h-11 px-6 rounded-[15px] bg-[#981C00] hover:bg-[#7A1D28] text-white text-sm font-bold tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
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
                className="h-11 px-5 rounded-[15px] bg-[#FFFFFF] dark:bg-[#1D1A18] hover:bg-[#F3EFEA] dark:hover:bg-[#25221F] border border-[#E8E4DF] dark:border-[#2C2825] text-sm font-semibold text-[#24211F] dark:text-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-[#706A65] dark:text-[#A8A19A]" />
                <span>{isAmharic ? 'የአባልነት ሁኔታዎን ያረጋግጡ' : 'Check Approval Status'}</span>
              </button>
            </div>

            {/* Trust Micro-note */}
            <div className="pt-2 flex items-center gap-4 text-xs text-[#706A65] dark:text-[#A8A19A]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] stroke-[3]" />
                {isAmharic ? 'በቀጥታ በSMS የሚደርስ (ኢንተርኔት አይጠይቅም)' : 'Direct SMS Delivery'}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] stroke-[3]" />
                {isAmharic ? 'አካውንትና ፓስወርድ አያስፈልግም' : 'No Account Needed'}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] stroke-[3]" />
                {isAmharic ? 'በቴሌብር እና በንግድ ባንክ (CBE) ቀላል ክፍያ' : 'CBE & Telebirr'}
              </span>
            </div>
          </div>

          {/* Hero Right Column: Authentic Physical Smartphone & SMS Messages App Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Physical Smartphone Chassis with Slim Bezel & Spacious Width */}
            <div className="relative w-full max-w-[365px] sm:max-w-[415px] lg:max-w-[440px]">
              {/* Soft Ambient Ground Shadow */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-10 bg-black/40 blur-2xl rounded-full pointer-events-none" />

              {/* Outer Phone Aluminum/Titanium Frame - Sleek Ultra-Thin Bezel */}
              <div className="relative rounded-[50px] p-[3.5px] sm:p-[4.5px] bg-gradient-to-b from-[#44414C] via-[#24232A] to-[#131217] shadow-[0_36px_85px_-15px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,0.45)]">
                {/* Physical Hardware Buttons */}
                {/* Left Silent / Action Switch */}
                <div className="absolute -left-[2.5px] top-24 w-[2.5px] h-7 bg-[#323038] rounded-l-xs shadow-xs border-y border-l border-white/20" />
                {/* Left Volume Up */}
                <div className="absolute -left-[2.5px] top-36 w-[2.5px] h-12 bg-[#323038] rounded-l-xs shadow-xs border-y border-l border-white/20" />
                {/* Left Volume Down */}
                <div className="absolute -left-[2.5px] top-51 w-[2.5px] h-12 bg-[#323038] rounded-l-xs shadow-xs border-y border-l border-white/20" />
                {/* Right Power Button */}
                <div className="absolute -right-[2.5px] top-34 w-[2.5px] h-16 bg-[#323038] rounded-r-xs shadow-xs border-y border-r border-white/20" />

                {/* Top Speaker Ear-piece Micro Slit embedded in bezel */}
                <div className="absolute top-[1.5px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-[#0F0E13] rounded-full z-30 opacity-80" />

                {/* Inner Screen Display (Spacious Proportions & Ultra-Thin Bezel) */}
                <div className="w-full aspect-[9/18.2] rounded-[46px] overflow-hidden bg-[#FFFFFF] dark:bg-[#000000] border border-black/30 relative flex flex-col justify-between select-none shadow-inner">
                  {/* Glass Sheen / Specular Light Reflection */}
                  <div className="absolute inset-0 pointer-events-none rounded-[46px] bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.08] z-30" />

                  {/* Top iOS Status Bar */}
                  <div className="relative pt-2.5 px-5 pb-1 flex items-center justify-between text-[#000000] dark:text-[#FFFFFF] text-[11px] font-semibold tracking-tight z-20">
                    {/* Time & Carrier */}
                    <div className="flex items-center gap-1.5 z-10">
                      <span className="font-bold text-[11.5px] tracking-tight">{isAmharic ? '12:30' : '9:41'}</span>
                      <span className="text-[9.5px] font-medium text-[#71717A] dark:text-[#A1A1AA] tracking-tight">ethio telecom</span>
                    </div>

                    {/* Dynamic Island Notch - Perfectly Centered */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-24 h-6 bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm z-30 pointer-events-none">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#16161a] border border-[#27272a]/70 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#0a0a14]" />
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#09090b]" />
                    </div>

                    {/* Carrier Signal, 4G & Battery Icons */}
                    <div className="flex items-center gap-1.5 text-current z-10">
                      <span className="text-[9.5px] font-bold leading-none tracking-tight">4G</span>

                      {/* Signal Bars */}
                      <div className="flex items-end gap-[1.5px] h-2.5">
                        <span className="w-[2px] h-1 bg-current rounded-[0.5px]" />
                        <span className="w-[2px] h-1.5 bg-current rounded-[0.5px]" />
                        <span className="w-[2px] h-2 bg-current rounded-[0.5px]" />
                        <span className="w-[2px] h-2.5 bg-current rounded-[0.5px]" />
                      </div>

                      {/* Battery Pill */}
                      <div className="w-5 h-2.5 rounded-[15px] border border-current p-[1px] flex items-center relative ml-0.5">
                        <div className="w-[85%] h-full bg-current rounded-[1px]" />
                        <div className="w-0.5 h-1 bg-current rounded-r-[0.5px] absolute -right-1 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Messages App Navigation Bar - Centered Nazazi Text Profile */}
                  <div className="relative px-4 py-2 bg-[#F9F9FB]/95 dark:bg-[#161618]/95 backdrop-blur-md border-b border-[#D1D1D6] dark:border-[#2C2C2E] flex items-center justify-center z-10">
                    {/* Left Back Arrow */}
                    <div className="absolute left-3.5 flex items-center text-[#007AFF] dark:text-[#0A84FF]">
                      <ChevronLeft className="w-5 h-5 -ml-1 stroke-[2.5]" />
                    </div>

                    {/* Centered Contact Profile */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-b from-[#7A1D28] to-[#981C00] text-white flex items-center justify-center font-bold text-xs shadow-xs mb-1 ring-1 ring-black/5 dark:ring-white/10">
                        N
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-bold text-[#000000] dark:text-[#FFFFFF] leading-none tracking-tight">
                          Nazazi Text
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#007AFF] fill-[#007AFF] text-white inline-block shrink-0" />
                      </div>
                    </div>

                    {/* Right Info Action */}
                    <div className="absolute right-3.5 flex items-center text-[#007AFF] dark:text-[#0A84FF]">
                      <Info className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Real SMS Conversation Thread Canvas */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-end space-y-3 bg-[#FFFFFF] dark:bg-[#000000] overflow-hidden">
                    {/* Previous Day Contextual SMS */}
                    <div className="opacity-75 flex flex-col items-start max-w-[88%] space-y-1 mb-1">
                      <div className="bg-[#E9E9EB] dark:bg-[#26252A] text-[#1C1C1E] dark:text-[#E5E5EA] rounded-2xl rounded-bl-[4px] p-2.5 text-[11px] leading-relaxed shadow-2xs font-amharic">
                        <span className="font-semibold text-[#981C00] dark:text-[#E89382] mr-1 block text-[10.5px]">
                          {isAmharic ? 'ትናንት • ኢሳይያስ 26:4' : 'Yesterday • Isaiah 26:4'}
                        </span>
                        {isAmharic
                          ? '«በእግዚአብሔር ለዘላለም ታመኑ፥ እግዚአብሔር አምላክ የዘላለም አለት ነውና።»'
                          : '"Trust in the LORD forever, for the LORD GOD is an everlasting rock."'}
                      </div>
                      <span className="text-[8.5px] text-[#8E8E93] pl-2">
                        {isAmharic ? 'ትናንት 12:30 ጥዋት' : 'Yesterday 6:30 AM'}
                      </span>
                    </div>

                    {/* Centered Date Badge */}
                    <div className="text-center my-0.5">
                      <span className="text-[10px] font-semibold text-[#8E8E93] bg-[#E5E5EA]/75 dark:bg-[#2C2C2E]/75 px-3 py-0.5 rounded-full shadow-2xs">
                        {isAmharic ? `ዛሬ ${currentVerse.time}` : `Today ${currentVerse.time}`}
                      </span>
                    </div>

                    {/* Text Message Divider */}
                    <div className="text-center pb-0.5">
                      <span className="text-[8.5px] uppercase tracking-wider text-[#8E8E93] font-bold">
                        {isAmharic ? 'የጽሑፍ መልእክት • SMS' : 'Text Message • SMS'}
                      </span>
                    </div>

                    {/* Single Authentic Received SMS Message Bubble */}
                    <div className="flex flex-col items-start max-w-[95%] space-y-1">
                      <div className="relative bg-[#E9E9EB] dark:bg-[#26252A] text-[#000000] dark:text-[#FFFFFF] rounded-2xl rounded-bl-[4px] p-3.5 sm:p-4 shadow-xs border border-black/5 dark:border-white/5 space-y-2">
                        {/* Scripture Reference Header */}
                        <div className="flex items-center justify-between border-b border-black/6 dark:border-white/10 pb-1.5">
                          <span className="text-[12px] font-bold text-[#981C00] dark:text-[#E89382] tracking-wide font-sans">
                            {currentVerse.reference}
                          </span>
                          <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#8E8E93] bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded">
                            SMS
                          </span>
                        </div>

                        {/* Scripture Verse Quote */}
                        <p className="text-[13px] leading-[1.6] text-[#000000] dark:text-[#FFFFFF] font-semibold font-amharic">
                          {currentVerse.verse}
                        </p>

                        {/* Pastoral Encouragement */}
                        <p className="text-[12px] leading-[1.65] text-[#2C2C2E] dark:text-[#E5E5EA] font-normal font-amharic">
                          {currentVerse.reflection}
                        </p>

                        {/* Ministry Sign-off */}
                        <div className="pt-2 border-t border-black/6 dark:border-white/10 flex items-center justify-between text-[10.5px] text-[#636366] dark:text-[#A1A1A6] font-medium font-amharic">
                          <span>{currentVerse.signoff}</span>
                          <span className="text-[8.5px] font-bold text-[#8E8E93]">SMS</span>
                        </div>
                      </div>

                      {/* Delivery Status Metadata */}
                      <div className="flex items-center gap-1.5 pl-2 pt-0.5 text-[9.5px] text-[#8E8E93] font-medium">
                        <span>{isAmharic ? `ዛሬ ${currentVerse.time}` : `Today ${currentVerse.time}`}</span>
                        <span>•</span>
                        <span>{isAmharic ? 'በSMS ደርሷል' : 'Delivered via SMS'}</span>
                        <Check className="w-2.5 h-2.5 text-[#34C759] stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* Messages Compose Bar & Bottom Home Indicator */}
                  <div className="bg-[#F9F9FB] dark:bg-[#161618] border-t border-[#D1D1D6] dark:border-[#2C2C2E] px-3.5 pt-2.5 pb-2.5">
                    <div className="flex items-center gap-2">
                      {/* Plus icon */}
                      <div className="w-7 h-7 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93] shrink-0">
                        <Plus className="w-4 h-4" />
                      </div>

                      {/* Text Input Pill */}
                      <div className="flex-1 h-8 px-3.5 rounded-full border border-[#D1D1D6] dark:border-[#3A3A3C] bg-white dark:bg-black flex items-center justify-between text-xs text-[#8E8E93]">
                        <span className="text-[11px] truncate">
                          {isAmharic ? 'የጽሑፍ መልእክት (SMS)...' : 'Text Message (SMS)...'}
                        </span>
                        <Mic className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />
                      </div>
                    </div>

                    {/* Bottom Home Swipe Bar */}
                    <div className="w-32 h-1 bg-[#1C1C1E] dark:bg-[#FFFFFF] rounded-full mx-auto mt-2.5 opacity-35" />
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Day/Verse Switcher Controls */}
            <div className="mt-5 flex flex-col items-center gap-2">
              <span className="text-xs text-[#706A65] dark:text-[#A8A19A] font-semibold">
                {isAmharic ? 'የናሙና መልእክቶችን ይመልከቱ:' : 'Preview daily morning messages:'}
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#EAE5DF] dark:bg-[#25221F] border border-[#DCD6CE] dark:border-[#332E2A]">
                {sampleVerses.map((v, i) => (
                  <button
                    key={v.reference}
                    onClick={() => setActiveVerseIndex(i)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${activeVerseIndex === i
                      ? 'bg-[#981C00] text-white shadow-xs'
                      : 'text-[#706A65] dark:text-[#A8A19A] hover:text-[#24211F] dark:hover:text-[#FAF8F5]'
                      }`}
                  >
                    <span>{v.day}</span>
                    <span className="ml-1 opacity-80 text-[10px]">({v.reference.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. HOW IT WORKS SECTION (#how-it-works)
          Clear 3-step journey with generous breathing room and rich descriptions.
          ======================================================== */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825] py-20 sm:py-24 space-y-12 sm:space-y-16">
          {/* Section Header with Generous White Space */}
          <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[15px] text-xs font-bold uppercase tracking-wider bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] border border-[#E8DCD9] dark:border-[#3A2420]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#981C00] dark:bg-[#C43214]" />
              <span>{isAmharic ? 'በ3 ቀላል ደረጃዎች' : 'Simple 3-Step Process'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'ናዛዚ እንዴት ይሰራል?' : 'How Nazazi Works'}
            </h2>
            <p className="text-sm sm:text-base text-[#706A65] dark:text-[#A8A19A] leading-relaxed max-w-xl mx-auto">
              {isAmharic
                ? 'ምንም የተወሳሰበ ቅጽ መሙላት ወይም አካውንት መክፈት አይጠበቅብዎትም። በ3 ቀላል እርምጃዎች የዕለቱን መንፈሳዊ ስንቅ መቀበል ይጀምሩ።'
                : 'No complex registrations, passwords, or accounts required. Begin receiving daily comforting Scripture verses right on your phone in three simple steps.'}
            </p>
          </div>

          {/* Side-by-side: Integration Beam (Left) & Vertical 3 Steps (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left: Interactive Integration Beam Scene */}
            <div className="lg:col-span-7 relative rounded-[15px] p-4 sm:p-7 md:p-8 bg-gradient-to-b from-[#FAF4F2]/70 via-white/90 to-[#FAF4F2]/50 dark:from-[#211A18]/70 dark:via-[#1D1A18]/90 dark:to-[#211A18]/50 border border-[#E8DCD9] dark:border-[#382622] shadow-[0_20px_50px_-20px_rgba(152,28,0,0.08)] backdrop-blur-xs flex items-center justify-center">
              <IntegrationBeam isAmharic={isAmharic} />
            </div>

            {/* Right: Vertical 3-Step Simple Guide */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-3.5 sm:gap-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-[15px] bg-white/70 dark:bg-[#1D1A18]/70 border border-[#E8E4DF] dark:border-[#2C2825] transition-colors hover:border-[#981C00]/30 dark:hover:border-[#C43214]/40 shadow-xs">
                <span className="font-mono text-xs font-bold text-[#981C00] dark:text-[#C43214] bg-[#FAF4F2] dark:bg-[#2A1D1A] px-2.5 py-1 rounded-[15px] border border-[#E8DCD9] dark:border-[#3A2420] shrink-0 mt-0.5">
                  01
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                    {isAmharic ? 'እቅድ ይምረጡ' : 'Choose a Plan'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                    {isAmharic
                      ? 'የ1፣ 3 ወይም የ6 ወር ተመጣጣኝ እቅድ ይምረጡ።'
                      : 'Select a flexible 1, 3, or 6-month subscription.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-[15px] bg-white/70 dark:bg-[#1D1A18]/70 border border-[#E8E4DF] dark:border-[#2C2825] transition-colors hover:border-[#981C00]/30 dark:hover:border-[#C43214]/40 shadow-xs">
                <span className="font-mono text-xs font-bold text-[#981C00] dark:text-[#C43214] bg-[#FAF4F2] dark:bg-[#2A1D1A] px-2.5 py-1 rounded-[15px] border border-[#E8DCD9] dark:border-[#3A2420] shrink-0 mt-0.5">
                  02
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                    {isAmharic ? 'ይመዝገቡና ይክፈሉ' : 'Register & Pay'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                    {isAmharic
                      ? 'በCBE ወይም በቴሌብር ይክፈሉ፤ ወዲያውኑ ይረጋገጣል።'
                      : 'Pay via CBE or Telebirr with instant verification.'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-[15px] bg-white/70 dark:bg-[#1D1A18]/70 border border-[#E8E4DF] dark:border-[#2C2825] transition-colors hover:border-[#981C00]/30 dark:hover:border-[#C43214]/40 shadow-xs">
                <span className="font-mono text-xs font-bold text-[#981C00] dark:text-[#C43214] bg-[#FAF4F2] dark:bg-[#2A1D1A] px-2.5 py-1 rounded-[15px] border border-[#E8DCD9] dark:border-[#3A2420] shrink-0 mt-0.5">
                  03
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                    {isAmharic ? 'የዕለቱን ቃል ይቀበሉ' : 'Receive Daily SMS'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                    {isAmharic
                      ? 'በየማለዳው 12:30 የሚያጽናና ጥቅስ በSMS ይደርስዎታል።'
                      : 'Receive daily comforting Scripture via SMS at 12:30 AM.'}
                  </p>
                </div>
              </div>

              {/* Bottom Callout to Pricing */}
              <div className="pt-1">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[15px] text-xs font-bold bg-[#FAF4F2] hover:bg-[#F2EAE7] dark:bg-[#251A18] dark:hover:bg-[#2E201D] text-[#981C00] dark:text-[#C43214] border border-[#E8DCD9] dark:border-[#382622] transition-all duration-200 cursor-pointer shadow-2xs group"
                >
                  <span>{isAmharic ? 'የአገልግሎት አማራጮችን ይመልከቱ' : 'Explore Subscription Plans'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SUBSCRIPTION PRICING SECTION (#pricing)
          Real plans: 1m (200), 3m (600), 6m (1000 - discount from 1200)
          ======================================================== */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825] py-20 sm:py-24 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#981C00] dark:bg-[#C43214]" />
              <span>{isAmharic ? 'ግልጽ እና ተመጣጣኝ ክፍያ' : 'Transparent Pricing'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'የአገልግሎት አማራጮች' : 'Subscription Plans'}
            </h2>
            <p className="text-sm sm:text-base text-[#706A65] dark:text-[#A8A19A] leading-relaxed max-w-xl mx-auto">
              {isAmharic
                ? 'ምንም የተደበቀ ተጨማሪ ክፍያ የለም። ለእርስዎ ወይም ለወዳጅ ዘመድዎ የሚስማማውን የአገልግሎት ጊዜ ይምረጡ።'
                : 'No hidden fees or unexpected charges. Choose the duration that suits you best.'}
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
                  ? 'ለዚህ ዙር የተዘጋጀው ምዝገባ ተጠናቋል። የተመዘገቡ አባላት የአባልነት ሁኔታቸውን በስልክ ቁጥር ማየት ይችላሉ።'
                  : 'Registration for this cohort is closed. Members can verify their approval status below.'}
              </p>
              <div>
                <button
                  onClick={() => handleTriggerVerifyModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] text-[#24211F] dark:text-[#FAF8F5] cursor-pointer shadow-xs"
                >
                  {isAmharic ? 'የአባልነት ሁኔታዎን ያረጋግጡ' : 'Verify Status'}
                </button>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch pt-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-colors ${plan.recommended
                  ? 'bg-[#FAF7F2] dark:bg-[#1F1A17] border-2 border-[#981C00] dark:border-[#C43214]'
                  : 'bg-[#FFFFFF] dark:bg-[#181513] border border-[#E4DFD7] dark:border-[#2C2723]'
                  }`}
              >
                <div className="space-y-4">
                  {/* Card Header: Title & Integrated Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#ECE7E1] dark:border-[#2C2723]">
                    <h3 className="text-lg font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                      {plan.name}
                    </h3>
                    {plan.recommended ? (
                      <span className="text-[11px] font-semibold text-[#8F2B14] dark:text-[#E89382] bg-[#FAF0ED] dark:bg-[#321C18] px-2.5 py-0.5 rounded-md border border-[#F3D5CD] dark:border-[#4A2620]">
                        {plan.badge}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#706A65] dark:text-[#A8A19A] bg-[#F2EDE7] dark:bg-[#25201C] px-2 py-0.5 rounded-md">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Plan Description */}
                  <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed min-h-[38px]">
                    {plan.description}
                  </p>

                  {/* Price Block */}
                  <div className="pt-1 pb-1 space-y-1">
                    {plan.originalPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8A847E] dark:text-[#918B84] line-through tabular-nums">
                          {plan.originalPrice} {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                        {plan.savingsBadge && (
                          <span className="text-[10.5px] font-semibold text-[#8F2B14] dark:text-[#E89382] bg-[#FAF0ED] dark:bg-[#321C18] px-2 py-0.5 rounded-md">
                            {plan.savingsBadge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-5" />
                    )}

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight tabular-nums font-sans">
                        {plan.price}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#24211F] dark:text-[#FAF8F5] leading-none">
                          {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                        <span className="text-[11px] text-[#706A65] dark:text-[#A8A19A] pt-0.5">
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    {/* Monthly Breakdown Value Tag */}
                    <div className="text-[11px] font-medium text-[#8F2B14] dark:text-[#E89382] pt-0.5">
                      {plan.monthlyBreakdown}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="pt-4 border-t border-[#ECE7E1] dark:border-[#2C2723] space-y-2.5">
                    <p className="text-[11px] font-semibold text-[#706A65] dark:text-[#A8A19A]">
                      {isAmharic ? 'የሚያካትታቸው አገልግሎቶች:' : 'What is included:'}
                    </p>
                    <div className="space-y-2">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-xs text-[#24211F] dark:text-[#FAF8F5]">
                          <Check className="w-3.5 h-3.5 text-[#8F2B14] dark:text-[#E89382] shrink-0 mt-0.5 stroke-[2.25]" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Plan Action Button */}
                <div className="pt-6 mt-2">
                  <button
                    onClick={() => handleOpenSubscribe(plan.name, plan.price)}
                    disabled={isClosed}
                    className={`w-full h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-tight transition-colors cursor-pointer flex items-center justify-center gap-2 ${isClosed
                      ? 'bg-[#EAE5DF] text-[#706A65] cursor-not-allowed'
                      : plan.recommended
                        ? 'bg-[#981C00] hover:bg-[#801800] text-white'
                        : 'bg-[#F2EDE7] hover:bg-[#E7E1D8] dark:bg-[#25201C] dark:hover:bg-[#2F2925] text-[#24211F] dark:text-[#FAF8F5] border border-[#DDD7CE] dark:border-[#352F2B]'
                      }`}
                  >
                    {isClosed ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isAmharic ? 'ምዝገባ ተጠናቋል' : 'Closed'}</span>
                      </span>
                    ) : (
                      <>
                        <span>{plan.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Assurance Bar */}
          <div className="pt-8 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#706A65] dark:text-[#A8A19A] border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
            <div className="flex items-center gap-2">
              <GoogleIcon name="verified_user" size={16} className="text-[#981C00] dark:text-[#C43214]" />
              <span>{isAmharic ? 'በራሱ ጊዜ ከሂሳብዎ የሚቆርጥ (Auto-renewal) አይደለም — ለመረጡት ጊዜ አንድ ጊዜ ብቻ ይከፍላሉ' : 'One-time payment — no auto-debit renewals'}</span>
            </div>
            <div className="flex items-center gap-2">
              <GoogleIcon name="phone_iphone" size={16} className="text-[#981C00] dark:text-[#C43214]" />
              <span>{isAmharic ? 'በቴሌብር እና በንግድ ባንክ (CBE) የተሳለጠ ክፍያ' : 'Pay seamlessly with Telebirr & CBE'}</span>
            </div>
            <div className="flex items-center gap-2">
              <GoogleIcon name="how_to_reg" size={16} className="text-[#981C00] dark:text-[#C43214]" />
              <span>{isAmharic ? 'ቅጽበታዊ የአባልነት ሁኔታ ማረጋገጫ' : 'Instant phone approval status check'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. TRUST & PRIVACY SECTION (#trust)
          Real, verifiable facts without fake marketing hype.
          ======================================================== */}
      <section id="trust" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825] py-20 sm:py-24 space-y-12">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              {isAmharic ? 'ግልጽነት እና ጥንቃቄ' : 'Trust & Reliability'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'ታማኝነት እና ምስጢራዊነት' : 'Built on Trust & Respect'}
            </h2>
            <p className="text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
              {isAmharic
                ? 'የግል መረጃዎ ክብርና ጥበቃ ይገባዋል። ናዛዚ ግልጽ፣ ቀላል እና አስተማማኝ በሆነ ስርዓት የተዘጋጀ ነው።'
                : 'Your contact details and trust are sacred. Nazazi is designed with clear privacy and simplicity.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {/* Pillar 1 */}
            <NotchedProjectCard
              badge="01"
              title={isAmharic ? 'ምንም ውጣ ውረድ የለውም' : 'No Account Needed'}
              description={
                isAmharic
                  ? 'ኢሜይል፣ የተጠቃሚ ስም (Username) ወይም ፓስወርድ ሳያስፈልግ በስልክ ቁጥርዎ ብቻ በሰከንዶች ውስጥ ይመዘገባሉ።'
                  : 'No account registration or passwords to manage. Sign up with your phone number alone.'
              }
              image="/images/trust/pillar-1-no-account.png"
              imageAlt={isAmharic ? 'ምንም ውጣ ውረድ የለውም - ቀላል ምዝገባ' : 'No Account Needed - Instant Signup'}
              icon="how_to_reg"
              tags={isAmharic ? ['ቀላል ምዝገባ', 'ያለ ፓስወርድ'] : ['Instant Signup', 'No Password']}
              accent="#981C00"
              accentForeground="#FFFFFF"
              surface="var(--bg-primary, #FAF8F5)"
            />

            {/* Pillar 2 */}
            <NotchedProjectCard
              badge="02"
              title={isAmharic ? 'የስልክ ቁጥርዎ ምስጢራዊነት' : 'Phone Number Privacy'}
              description={
                isAmharic
                  ? 'ስልክ ቁጥርዎ የዕለቱን መንፈሳዊ መልእክት ለመላክ ብቻ ይውላል። ለማንኛውም ሶስተኛ ወገን ወይም ለማስታወቂያ አሳልፈን አንሰጥም።'
                  : 'Your phone number is strictly guarded and used exclusively for your spiritual SMS.'
              }
              image="/images/trust/pillar-2-privacy.png"
              imageAlt={isAmharic ? 'የስልክ ቁጥርዎ ምስጢራዊነት' : 'Phone Number Privacy'}
              icon="verified_user"
              tags={isAmharic ? ['100% ምስጢራዊ', 'ያለ ማስታወቂያ'] : ['Strict Privacy', 'Zero Spam']}
              accent="#981C00"
              accentForeground="#FFFFFF"
              surface="var(--bg-primary, #FAF8F5)"
            />

            {/* Pillar 3 */}
            <NotchedProjectCard
              badge="03"
              title={isAmharic ? 'ቅጽበታዊ ማረጋገጫ' : 'Direct Status Verification'}
              description={
                isAmharic
                  ? 'ክፍያዎን ከፈጸሙ በኋላ ስልክ ቁጥርዎን ብቻ በማስገባት የአገልግሎትዎን ሁኔታና ቀሪ ቀናት በማንኛውም ሰዓት ማየት ይችላሉ።'
                  : 'Check whether your payment has been approved anytime with a simple phone number lookup.'
              }
              image="/images/trust/pillar-3-verification.png"
              imageAlt={isAmharic ? 'ቅጽበታዊ ማረጋገጫ' : 'Direct Status Verification'}
              icon="task_alt"
              tags={isAmharic ? ['ቀጥተኛ ማረጋገጫ', 'የቀሪ ቀናት ሁኔታ'] : ['Direct Lookup', 'CBE & Telebirr']}
              onClick={() => handleTriggerVerifyModal(null)}
              accent="#981C00"
              accentForeground="#FFFFFF"
              surface="var(--bg-primary, #FAF8F5)"
            />

            {/* Pillar 4 */}
            <NotchedProjectCard
              badge="04"
              title={isAmharic ? 'ፈጣን የደንበኞች ድጋፍ' : 'Direct Support'}
              description={
                isAmharic
                  ? 'ማንኛውም ጥያቄ ወይም እገዛ ቢያስፈልግዎት በይፋዊው የቴሌግራም አድራሻችን ፈጣን ምላሽ ያገኛሉ።'
                  : 'Reach out through our official Telegram channel for prompt and friendly assistance.'
              }
              image="/images/trust/pillar-4-support.png"
              imageAlt={isAmharic ? 'ፈጣን የደንበኞች ድጋፍ' : 'Direct Support'}
              icon="support_agent"
              tags={isAmharic ? ['በቴሌግራም', 'ቀጥተኛ እገዛ'] : ['Telegram Support', 'Friendly Help']}
              href="https://t.me/nazazisupport"
              accent="#981C00"
              accentForeground="#FFFFFF"
              surface="var(--bg-primary, #FAF8F5)"
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          TESTIMONIALS SECTION (#testimonials)
          Clean, minimal moving carousel that pauses on hover
          ======================================================== */}
      <section id="testimonials" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825] py-20 sm:py-24 space-y-8">
          {/* Minimal Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
                {isAmharic ? 'ከተጠቃሚዎቻችን አንደበት' : 'Testimonials'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
                {isAmharic ? 'የደንበኞቻችን ድምፅ' : 'Loved by Daily Readers'}
              </h2>
              <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A]">
                {isAmharic
                  ? 'በየማለዳው በSMS ከሚደርሳቸው የእግዚአብሔር ቃል ያገኙት ብርታትና ሰላም'
                  : 'Heartfelt words from subscribers who start each day with morning Scripture.'}
              </p>
            </div>

            {/* Compact Star Rating */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[15px] bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] shadow-2xs self-start sm:self-auto shrink-0">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">4.9 / 5</span>
            </div>
          </div>

          {/* Moving Carousel (Marquee) with Gradient Side Masks */}
          <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
            {/* Left Edge Gradient Fade */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#FAF8F5] dark:from-[#141211] to-transparent z-10" />

            {/* Moving Track - Duplicated for infinite continuous loop */}
            <div className="animate-marquee flex items-stretch gap-4 sm:gap-6 py-2 cursor-grab active:cursor-grabbing">
              {[...testimonials, ...testimonials].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="w-[320px] sm:w-[380px] shrink-0 rounded-[15px] bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-2xs hover:border-[#981C00]/40 dark:hover:border-[#C43214]/40 hover:shadow-sm transition-all duration-200"
                >
                  {/* Quote & Verse with Uncluttered Editorial Typography */}
                  <div className="space-y-3.5">
                    <p className="text-sm text-[#24211F] dark:text-[#FAF8F5] leading-relaxed">
                      {item.quote}
                    </p>

                    <div className="text-xs font-medium text-[#981C00] dark:text-[#E89382]">
                      — {item.favoriteVerse}
                    </div>
                  </div>

                  {/* Clean, Grounded Author Attribution */}
                  <div className="pt-4 border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[15px] bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#E89382] border border-[#E8DCD9] dark:border-[#3A2420] flex items-center justify-center font-bold text-xs shrink-0">
                      {item.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-[#24211F] dark:text-[#FAF8F5] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A] truncate">
                        {item.role} • {item.city}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Edge Gradient Fade */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#FAF8F5] dark:from-[#141211] to-transparent z-10" />
          </div>

          {/* Micro pause indicator */}
          <div className="text-center pt-1">
            <span className="text-[10.5px] text-[#706A65]/70 dark:text-[#A8A19A]/70">
              {isAmharic ? '• ለማንበብ ካርዱ ላይ ይጫኑ' : '• Hover over any card to pause'}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. FAQ SECTION (#faq)
          Clean, accessible accordion with keyboard navigation.
          ======================================================== */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825] py-20 sm:py-24 space-y-8">
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
                  className="rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FFFFFF] dark:bg-[#1D1A18] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm font-bold text-[#24211F] dark:text-[#FAF8F5] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#25221F] transition-colors"
                  >
                    <span className="pr-4 leading-snug">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#706A65] dark:text-[#A8A19A] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed border-t border-dashed border-[#DDD7CF]/70 dark:border-[#2C2825]/70">
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
        <div className="p-8 sm:p-12 rounded-[15px] bg-[#981C00] text-white text-center space-y-6 shadow-md">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isAmharic ? 'ቀንዎን በተስፋ እና በእግዚአብሔር ቃል ይጀምሩ' : 'Receive Daily Hope & Encouragement'}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
              {isAmharic
                ? 'ለነፍስዎ ብርታት የሚሆኑ የመጽሐፍ ቅዱስ ቃላት በየማለዳው ወደ ስልክዎ እንዲላኩ አሁኑኑ ይመዝገቡ።'
                : 'Subscribe today to begin receiving uplifting Bible verses and spiritual words directly to your phone.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={isClosed ? () => setIsSubscribeModalOpen(true) : scrollToPricing}
              className="w-full sm:w-auto h-11 px-6 rounded-[15px] bg-white text-[#981C00] hover:bg-zinc-100 text-xs sm:text-sm font-bold tracking-tight transition-colors cursor-pointer shadow-xs flex items-center justify-center"
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
              className="w-full sm:w-auto h-11 px-5 rounded-[15px] bg-transparent hover:bg-black/10 border border-white/40 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center"
            >
              {isAmharic ? 'የአባልነት ሁኔታዎን ያረጋግጡ' : 'Check Approval Status'}
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
