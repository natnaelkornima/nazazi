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
  ChevronLeft,
  Smartphone,
  Lock,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
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
          description:
            'የናዛዚን መንፈሳዊ አገልግሎት ለመሞከር እና በየዕለቱ ማለዳ በሚደርሱ የእግዚአብሔር ቃላት ለመጽናናት ተስማሚ የሆነ የመግቢያ እቅድ።',
          monthlyBreakdown: '200 ብር / በወር',
          features: [
            'የየዕለቱ የሚያጽናና SMS መልእክት',
            'ቀጥታ ወደ ሞባይል ስልክ የሚላክ (ኢትዮ ቴሌኮም)',
            'ፈጣን የስልክ ቁጥር ማረጋገጫ',
            'ምንም ዓይነት መለያ ወይም የይለፍ ቃል አያስፈልግም',
            'በCBE ወይም በTelebirr ቀላል ክፍያ',
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
          description:
            'ለተከታታይ 3 ወራት (90 ቀናት) ማለዳዎን በእግዚአብሔር ቃል ለመክፈትና መንፈሳዊ ብርታትን ያለማቋረጥ ለማግኘት ተመራጭ እቅድ።',
          monthlyBreakdown: '200 ብር / በወር',
          features: [
            'የየዕለቱ የሚያጽናና SMS መልእክት',
            'ያለማቋረጥ ለ3 ወራት (90 ቀናት) የሚላክ',
            'የቅድሚያ SMS ስርጭት ስርዓት',
            'የስልክ ቁጥር መቀየር ካለ ፈጣን ድጋፍ',
            'የአባልነት ሁኔታን በማንኛውም ጊዜ የማረጋገጥ ዕድል',
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
          description:
            'የላቀ የ200 ብር ቅናሽ ያካተተ፤ ለግማሽ ዓመት (180 ቀናት) ያለማቋረጥ የዕለት ተስፋ እና ማጽናኛን በቅድሚያ የሚያረጋግጥ ምርጥ እቅድ።',
          monthlyBreakdown: 'በወር 166 ብር ብቻ (200 ብር ቁጠባ)',
          features: [
            'የየዕለቱ የሚያጽናና SMS መልእክት',
            'ያለማቋረጥ ለ6 ወራት (180 ቀናት) የሚላክ',
            'የ200 ብር ቅናሽ (ከ1,200 ብር ወደ 1,000 ብር)',
            'ቅድሚያ የሚሰጠው የSMS ማሰራጫ ቅደም ተከተል',
            'ቀጥታ የቴሌግራም የደንበኞች ድጋፍ አገልግሎት',
            'የአገልግሎት ማጠናቀቂያ ማስታወሻ አስቀድሞ የሚላክ',
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
          description:
            'An ideal introductory plan to experience daily spiritual peace, uplifting scriptures, and comforting words on your mobile phone.',
          monthlyBreakdown: '200 ETB / month',
          features: [
            'Daily spiritual SMS encouragement',
            'Direct mobile phone delivery (ethio telecom)',
            'Instant phone approval status check',
            'No password or registration account required',
            'Seamless CBE or Telebirr bank transfer',
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
          description:
            'A continuous 90-day spiritual walk to keep your mornings rooted in encouragement, renewed hope, and God\'s Word.',
          monthlyBreakdown: '200 ETB / month',
          features: [
            'Daily spiritual SMS encouragement',
            '3 months (90 days) uninterrupted morning broadcasts',
            'Priority queue message dispatch',
            'Quick assistance if your phone number changes',
            'Real-time status lookup available anytime',
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
          description:
            'Our most dedicated plan with 200 ETB instant savings, ensuring half a year of uninterrupted morning spiritual nourishment.',
          monthlyBreakdown: 'Only 166 ETB / month (Save 200 ETB)',
          features: [
            'Daily spiritual SMS encouragement',
            '6 months (180 days) uninterrupted morning broadcasts',
            'Instant 200 ETB discount included',
            'Highest priority queue message dispatch',
            'Direct priority Telegram subscriber support',
            'Advance renewal notification before term concludes',
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

  const testimonials: TestimonialItem[] = isAmharic
    ? [
        {
          id: 'tesfaye',
          name: 'አባ ተስፋዬ ገ/ማሪያም',
          role: 'አባትና ጡረተኛ መምህር',
          city: 'አዲስ አበባ',
          plan: 'የ1 ዓመት አባል',
          quote: '«በየማለዳው 12:30 በትንሿ ባትሪ ስልኬ ላይ የሚመጣው የእግዚአብሔር ቃል ቀኔን በሰላም እንድጀምር ብርታት ይሆነኛል።»',
          favoriteVerse: 'መዝሙር 46:1',
          avatarBg: 'from-[#981C00] to-[#7A1D28]',
          avatarInitials: 'ተገ',
        },
        {
          id: 'yonas',
          name: 'ዮናስ ታደሰ',
          role: 'ዲያስፖራ (ለእናቱ ያስመዘገበ)',
          city: 'ባህር ዳር',
          plan: 'የ1 ዓመት አባል',
          quote: '«ለእናቴ በTelebirr የዓመት ምዝገባ አደረግኩላት። በየሳምንቱ ስንደዋወል ቃሉ እንዴት እንዳበረታት በደስታ ታካፍለኛለች።»',
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
          quote: '«ከሆስፒታል የሌሊት ፈረቃዬ በኋላ የሚደርሰኝ ቃል ልክ እንደ ነፍስ እረፍት ነው። አጭር እና ልብን የሚያጽናና።»',
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
          quote: '«በፈተና ወቅት ማለዳን በእግዚአብሔር ቃል መጀመሬ ውስጣዊ መረጋጋትን ሰጥቶኛል። ያለ ዳታ በSMS መድረሱ ለተማሪዎች ፍቱን ነው።»',
          favoriteVerse: 'ማቴዎስ 11:28',
          avatarBg: 'from-[#7C3AED] to-[#5B21B6]',
          avatarInitials: 'ማኃ',
        },
        {
          id: 'dawit',
          name: 'ቀሲስ ዳዊት ወ/ሚካኤል',
          role: 'የመንፈሳዊ ትምህርት አገልጋይ',
          city: 'አዳማ',
          plan: 'የ1 ዓመት አባል',
          quote: '«የሚመረጡት ጥቅሶች ጥልቅ መንፈሳዊ ጥንቃቄ ያለባቸው እና የዕለት ኑሮን በጸሎት ለመምራት የሚያነሳሱ ናቸው።»',
          favoriteVerse: 'መዝሙር 23:1',
          avatarBg: 'from-[#981C00] to-[#5A1200]',
          avatarInitials: 'ዳወ',
        },
        {
          id: 'birhanu',
          name: 'ብርሃኑ አሰፋ',
          role: 'የንግድ ሥራ ባለቤት',
          city: 'መርካቶ',
          plan: 'የ6 ወር አባል',
          quote: '«ጠዋት ወደ ንግድ ሥራዬ ስወጣ ቀኔን በፈጣሪ ቃል መክፈት ልማዴ ሆኗል። 12:30 ላይ በሰዓቱ መድረሱ የሚያስመሰግን ነው።»',
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
                className="px-6 py-3.5 rounded-xl bg-[#981C00] hover:bg-[#7A1D28] text-white text-sm font-bold tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
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
                className="px-5 py-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] hover:bg-[#F3EFEA] dark:hover:bg-[#25221F] border border-[#E8E4DF] dark:border-[#2C2825] text-sm font-semibold text-[#24211F] dark:text-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
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
                  <div className="pt-2.5 px-5 pb-1 flex items-center justify-between text-[#000000] dark:text-[#FFFFFF] text-[11px] font-semibold tracking-tight z-20">
                    {/* Time & Carrier */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11.5px] tracking-tight">{isAmharic ? '12:30' : '9:41'}</span>
                      <span className="text-[9.5px] font-medium text-[#71717A] dark:text-[#A1A1AA] tracking-tight">ethio telecom</span>
                    </div>

                    {/* Dynamic Island Notch */}
                    <div className="w-24 h-6 bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#16161a] border border-[#27272a]/70 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#0a0a14]" />
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#09090b]" />
                    </div>

                    {/* Carrier Signal, 4G & Battery Icons */}
                    <div className="flex items-center gap-1.5 text-current">
                      <span className="text-[9.5px] font-bold leading-none tracking-tight">4G</span>

                      {/* Signal Bars */}
                      <div className="flex items-end gap-[1.5px] h-2.5">
                        <span className="w-[2px] h-1 bg-current rounded-[0.5px]" />
                        <span className="w-[2px] h-1.5 bg-current rounded-[0.5px]" />
                        <span className="w-[2px] h-2 bg-current rounded-[0.5px]" />
                        <span className="w-[2px] h-2.5 bg-current rounded-[0.5px]" />
                      </div>

                      {/* Battery Pill */}
                      <div className="w-5 h-2.5 rounded-[3px] border border-current p-[1px] flex items-center relative ml-0.5">
                        <div className="w-[85%] h-full bg-current rounded-[1px]" />
                        <div className="w-0.5 h-1 bg-current rounded-r-[0.5px] absolute -right-1 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Messages App Navigation Bar */}
                  <div className="px-4 py-2.5 bg-[#F9F9FB]/95 dark:bg-[#161618]/95 backdrop-blur-md border-b border-[#D1D1D6] dark:border-[#2C2C2E] flex items-center justify-between z-10">
                    <div className="flex items-center gap-0.5 text-[#007AFF] dark:text-[#0A84FF] font-medium text-xs">
                      <ChevronLeft className="w-4 h-4 -ml-1 stroke-[2.5]" />
                      <span>{isAmharic ? 'መልእክቶች' : 'Messages'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 font-bold ml-0.5">
                        3
                      </span>
                    </div>

                    {/* Contact Profile in Center */}
                    <div className="flex flex-col items-center">
                      <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-b from-[#7A1D28] to-[#981C00] text-white flex items-center justify-center font-bold text-xs shadow-xs mb-0.5 ring-1 ring-black/5 dark:ring-white/10">
                        N
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[12.5px] font-bold text-[#000000] dark:text-[#FFFFFF] leading-none">
                          {isAmharic ? 'ናዛዚ • NAZAZI' : 'NAZAZI'}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#007AFF] fill-[#007AFF] text-white inline-block shrink-0" />
                      </div>
                      <span className="text-[9.5px] text-[#8E8E93] leading-none pt-0.5 font-medium">
                        {isAmharic ? 'የተረጋገጠ መንፈሳዊ SMS' : 'Verified Spiritual SMS'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[#007AFF] dark:text-[#0A84FF]">
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
                {isAmharic ? 'የቀናት የናሙና መልእክቶች ይቀይሩ:' : 'Preview daily morning messages:'}
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#EAE5DF] dark:bg-[#25221F] border border-[#DCD6CE] dark:border-[#332E2A]">
                {sampleVerses.map((v, i) => (
                  <button
                    key={v.reference}
                    onClick={() => setActiveVerseIndex(i)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeVerseIndex === i
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
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 scroll-mt-24">
        <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] pt-16 sm:pt-20 space-y-12 sm:space-y-16">
          {/* Section Header with Generous White Space */}
          <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] border border-[#E8DCD9] dark:border-[#3A2420]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#981C00] dark:bg-[#C43214]" />
              <span>{isAmharic ? 'ቀላል የ3-ደረጃ ሂደት' : 'Simple 3-Step Process'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'ናዛዚ እንዴት እንደሚሰራ' : 'How Nazazi Works'}
            </h2>
            <p className="text-sm sm:text-base text-[#706A65] dark:text-[#A8A19A] leading-relaxed max-w-xl mx-auto">
              {isAmharic
                ? 'ምንም የተወሳሰበ ቅጽ ወይም አካውንት መክፈት አይጠበቅብዎትም። በ3 ቀላል እና ፈጣን እርምጃዎች የዕለቱን መንፈሳዊ መጽናኛ ማግኘት ይጀምሩ።'
                : 'No complex registrations, passwords, or accounts required. Begin receiving daily comforting Scripture verses right on your phone in three simple steps.'}
            </p>
          </div>

          {/* 3 Step Editorial Cards with Ample Breathing Room */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-8 items-stretch">
            {/* Step 1 */}
            <div className="group relative flex flex-col justify-between p-7 sm:p-8 lg:p-9 rounded-[28px] bg-white dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] shadow-xs hover:shadow-lg hover:border-[#981C00]/30 dark:hover:border-[#C43214]/40 transition-all duration-300">
              <div className="space-y-5">
                {/* Header: Step Number & Icon */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] border border-[#E8DCD9] dark:border-[#3A2420]">
                    {isAmharic ? 'ደረጃ 01' : 'Step 01'}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] flex items-center justify-center border border-[#E8DCD9] dark:border-[#3A2420] group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                    {isAmharic ? 'የደንበኝነት እቅድ ይምረጡ' : 'Choose a Plan'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                    {isAmharic
                      ? 'ለእርሶ የሚስማማውን የአገልግሎት ጊዜ ይምረጡ። የ1 ወር (200 ብር)፣ ተወዳጁ የ3 ወር (600 ብር) ወይም የ200 ብር ቅናሽ ያለው የ6 ወር (1,000 ብር) ግልጽ አማራጮች አሉ።'
                      : 'Select the subscription length that best fits your spiritual journey. Pick from flexible 1-month (200 ETB), popular 3-month (600 ETB), or best-value 6-month (1,000 ETB) options.'}
                  </p>
                </div>
              </div>

              {/* Descriptive Highlights */}
              <ul className="space-y-2.5 pt-6 mt-6 border-t border-[#F0ECE6] dark:border-[#2A2522]">
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'የ1፣ 3 ወይም የ6 ወር ተለዋዋጭ አማራጮች' : 'Flexible 1, 3, or 6 month options'}</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'በ200 ብር ብቻ የሚጀምር ተመጣጣኝ ዋጋ' : 'Affordable pricing starting at 200 ETB'}</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'ምንም የተደበቀ ክፍያ ወይም ውል የሌለው' : 'No hidden fees or unexpected charges'}</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="group relative flex flex-col justify-between p-7 sm:p-8 lg:p-9 rounded-[28px] bg-white dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] shadow-xs hover:shadow-lg hover:border-[#981C00]/30 dark:hover:border-[#C43214]/40 transition-all duration-300">
              <div className="space-y-5">
                {/* Header: Step Number & Icon */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] border border-[#E8DCD9] dark:border-[#3A2420]">
                    {isAmharic ? 'ደረጃ 02' : 'Step 02'}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] flex items-center justify-center border border-[#E8DCD9] dark:border-[#3A2420] group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                    {isAmharic ? 'ይመዝገቡና ክፍያዎን ያረጋግጡ' : 'Register & Verify Payment'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                    {isAmharic
                      ? 'ስምዎንና ስልክ ቁጥርዎን ያስገቡ፤ በCBE ወይም በቴሌብር የከፈሉበትን የትራንዛክሽን ኮድ (Reference) በማስገባት በVerify.ET ወዲያውኑ ያረጋግጡ ወይም ደረሰኝ ያያይዙ።'
                      : 'Enter your name and mobile number. Send via CBE or Telebirr, then paste your transaction reference for instant automated Verify.ET confirmation or attach your receipt.'}
                  </p>
                </div>
              </div>

              {/* Descriptive Highlights */}
              <ul className="space-y-2.5 pt-6 mt-6 border-t border-[#F0ECE6] dark:border-[#2A2522]">
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'በCBE እና በቴሌብር ክፍያ የሚፈጸም' : 'CBE & Telebirr transfers supported'}</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'በVerify.ET ራስ-ሰር ፈጣን ማረጋገጫ' : 'Instant Verify.ET automated check'}</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'የአድሚን ፍተሻ መጠበቅ አያስፈልግም' : 'No long waiting or complex forms'}</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="group relative flex flex-col justify-between p-7 sm:p-8 lg:p-9 rounded-[28px] bg-white dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] shadow-xs hover:shadow-lg hover:border-[#981C00]/30 dark:hover:border-[#C43214]/40 transition-all duration-300">
              <div className="space-y-5">
                {/* Header: Step Number & Icon */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] border border-[#E8DCD9] dark:border-[#3A2420]">
                    {isAmharic ? 'ደረጃ 03' : 'Step 03'}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#C43214] flex items-center justify-center border border-[#E8DCD9] dark:border-[#3A2420] group-hover:scale-105 transition-transform">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                    {isAmharic ? 'የየዕለቱን የSMS በረከቶች ይቀበሉ' : 'Receive Daily SMS'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A] leading-relaxed">
                    {isAmharic
                      ? 'ምዝገባዎ እንደተጠናቀቀ፣ በየዕለቱ ጠዋት የሚያንፁ እና ልብን የሚያጽናኑ የመጽሐፍ ቅዱስ ቃላቶች በቀጥታ ወደ ስልክዎ በSMS መድረስ ይጀምራሉ። ምንም ኢንተርኔት አያስፈልግም።'
                      : 'Once verified, daily comforting Scripture verses and spiritual encouragement arrive right on your phone via standard SMS. No internet data or mobile apps needed.'}
                  </p>
                </div>
              </div>

              {/* Descriptive Highlights */}
              <ul className="space-y-2.5 pt-6 mt-6 border-t border-[#F0ECE6] dark:border-[#2A2522]">
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'ቀጥታ ወደ ማንኛውም ስልክ በSMS የሚላክ' : 'Standard SMS directly to your phone'}</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? '100% ያለ ኢንተርኔትና ያለ አፕ የሚሰራ' : '100% offline — works without mobile internet'}</span>
                </li>
                <li className="flex items-center gap-2 text-xs font-medium text-[#4D4742] dark:text-[#C9C2BA]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214] shrink-0" />
                  <span>{isAmharic ? 'የየዕለቱ የሚያጽናና መንፈሳዊ ስንቅ' : 'Daily comforting morning verse'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Callout to Pricing */}
          <div className="pt-2 text-center">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold bg-[#FAF4F2] hover:bg-[#F2EAE7] dark:bg-[#251A18] dark:hover:bg-[#2E201D] text-[#981C00] dark:text-[#C43214] border border-[#E8DCD9] dark:border-[#382622] transition-all duration-200 cursor-pointer shadow-2xs group"
            >
              <span>{isAmharic ? 'የደንበኝነት እቅዶችን ይመልከቱ' : 'Explore Subscription Plans'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SUBSCRIPTION PRICING SECTION (#pricing)
          Real plans: 1m (200), 3m (600), 6m (1000 - discount from 1200)
          ======================================================== */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] pt-16 sm:pt-20 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#981C00] dark:bg-[#C43214]" />
              <span>{isAmharic ? 'ግልጽ እና ተመጣጣኝ ዋጋ' : 'Transparent Pricing'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'የደንበኝነት እቅዶች' : 'Subscription Plans'}
            </h2>
            <p className="text-sm sm:text-base text-[#706A65] dark:text-[#A8A19A] leading-relaxed max-w-xl mx-auto">
              {isAmharic
                ? 'ምንም የተደበቀ ወጪ የለም። ለእርሶ የሚስማማውን የአገልግሎት ጊዜ ይምረጡ።'
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
                  ? 'ለዚህ ዙር የተዘጋጀው ምዝገባ ተጠናቋል። የተመዘገቡ አባላት የአባልነት ማረጋገጫቸውን በስልክ ቁጥር ማየት ይችላሉ።'
                  : 'Registration for this cohort is closed. Members can verify their approval status below.'}
              </p>
              <div>
                <button
                  onClick={() => handleTriggerVerifyModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] text-[#24211F] dark:text-[#FAF8F5] cursor-pointer shadow-xs"
                >
                  {isAmharic ? 'የአባልነት ማረጋገጫ በስልክ' : 'Verify Status'}
                </button>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch pt-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-7 sm:p-8 rounded-[28px] transition-all duration-200 ${
                  plan.recommended
                    ? 'bg-gradient-to-b from-[#FFFFFF] via-[#FAF6F2] to-[#F5EFE9] dark:from-[#201A18] dark:via-[#191513] dark:to-[#141110] border-2 border-[#981C00] dark:border-[#C43214] shadow-[0_20px_50px_-15px_rgba(152,28,0,0.18),0_1px_3px_rgba(0,0,0,0.06)] md:-translate-y-2'
                    : 'bg-[#FFFFFF] dark:bg-[#1A1715] border border-[#E2DDD5] dark:border-[#2C2723] hover:border-[#D1C9BE] dark:hover:border-[#3D3732] shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]'
                }`}
              >
                {/* Floating Recommended Luxury Badge */}
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#981C00] text-white shadow-md inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles className="w-3 h-3 text-[#FFD6A5]" />
                      <span>{plan.badge}</span>
                    </span>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Card Title & Top Indicator */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div>
                      <h3 className="text-xl font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                        {plan.name}
                      </h3>
                      {!plan.recommended && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-[#706A65] dark:text-[#A8A19A] px-2.5 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#141211] border border-[#E8E4DF] dark:border-[#2C2825]">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Substantive Plan Description */}
                  <p className="text-xs text-[#706A65] dark:text-[#A8A19A] leading-relaxed font-normal min-h-[44px]">
                    {plan.description}
                  </p>

                  {/* Price Block */}
                  <div className="pt-2 pb-1 space-y-1.5">
                    {plan.originalPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#A8A19A] line-through">
                          {plan.originalPrice} {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                        {plan.savingsBadge && (
                          <span className="text-[10.5px] font-bold text-[#981C00] dark:text-[#E89382] bg-[#FAF0ED] dark:bg-[#321C18] px-2 py-0.5 rounded-full border border-[#F3D5CD] dark:border-[#4A2620]">
                            {plan.savingsBadge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-5" />
                    )}

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black text-[#24211F] dark:text-[#FAF8F5] tracking-tight font-sans">
                        {plan.price}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5] uppercase tracking-wider leading-none">
                          {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                        <span className="text-[11px] font-medium text-[#706A65] dark:text-[#A8A19A] pt-0.5">
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    {/* Monthly Breakdown Value Tag */}
                    <div className="text-[11px] font-semibold text-[#981C00] dark:text-[#E89382] pt-0.5">
                      {plan.monthlyBreakdown}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="pt-5 border-t border-[#EAE5DF] dark:border-[#2C2723] space-y-3">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#A8A19A] dark:text-[#706A65]">
                      {isAmharic ? 'የሚያካትታቸው አገልግሎቶች:' : 'What is included:'}
                    </p>
                    <div className="space-y-2.5">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2.5 text-xs text-[#24211F] dark:text-[#FAF8F5]">
                          <div className="w-4 h-4 rounded-full bg-[#FAF0ED] dark:bg-[#2A1D1A] flex items-center justify-center shrink-0 mt-0.5 text-[#981C00] dark:text-[#E89382]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug font-normal">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Plan Action Button */}
                <div className="pt-8 mt-4">
                  <button
                    onClick={() => handleOpenSubscribe(plan.name, plan.price)}
                    disabled={isClosed}
                    className={`w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                      isClosed
                        ? 'bg-[#EAE5DF] text-[#706A65] cursor-not-allowed'
                        : plan.recommended
                        ? 'bg-[#981C00] hover:bg-[#7A1D28] text-white shadow-sm hover:shadow'
                        : 'bg-[#FAF8F5] hover:bg-[#EFEAE4] dark:bg-[#141211] dark:hover:bg-[#25221F] text-[#24211F] dark:text-[#FAF8F5] border border-[#DDD7CF] dark:border-[#2C2723]'
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
          <div className="pt-8 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#706A65] dark:text-[#A8A19A] border-t border-[#E8E4DF] dark:border-[#2C2825]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#981C00] dark:text-[#C43214]" />
              <span>{isAmharic ? 'ምንም አውቶማቲክ ቅነሳ የለም — አንድ ጊዜ ብቻ የሚከፈል' : 'One-time payment — no auto-debit renewals'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#981C00] dark:text-[#C43214]" />
              <span>{isAmharic ? 'በTelebirr እና በCBE ቀላል ክፍያ' : 'Pay seamlessly with Telebirr & CBE'}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#981C00] dark:text-[#C43214]" />
              <span>{isAmharic ? 'ፈጣን የአባልነት ሁኔታ ማረጋገጫ' : 'Instant phone approval status check'}</span>
            </div>
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
          TESTIMONIALS SECTION (#testimonials)
          Clean, minimal moving carousel that pauses on hover
          ======================================================== */}
      <section id="testimonials" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] pt-14 space-y-7">
          {/* Minimal Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#981C00] dark:text-[#C43214]">
                {isAmharic ? 'ምስክርነቶች' : 'Testimonials'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
                {isAmharic ? 'የተጠቃሚዎቻችን ድምፅ' : 'Loved by Daily Readers'}
              </h2>
              <p className="text-xs sm:text-sm text-[#706A65] dark:text-[#A8A19A]">
                {isAmharic
                  ? 'በየማለዳው በSMS ከሚደርሳቸው ቃል ያገኙት ብርታትና ሰላም'
                  : 'Heartfelt words from subscribers who start each day with morning Scripture.'}
              </p>
            </div>

            {/* Compact Star Rating */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] shadow-2xs self-start sm:self-auto shrink-0">
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
            <div className="animate-marquee flex items-stretch gap-4 sm:gap-5 py-2 cursor-grab active:cursor-grabbing">
              {[...testimonials, ...testimonials].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="w-[280px] sm:w-[320px] shrink-0 rounded-2xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] p-5 flex flex-col justify-between space-y-3 shadow-2xs hover:border-[#981C00]/40 dark:hover:border-[#C43214]/40 hover:shadow-sm transition-all duration-200"
                >
                  <div className="space-y-2.5">
                    {/* Stars & Plan */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10.5px] font-medium text-[#706A65] dark:text-[#A8A19A] px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#25221F] border border-[#E8E4DF]/60 dark:border-[#2C2825]">
                        {item.plan}
                      </span>
                    </div>

                    {/* Short Quote */}
                    <p className="text-xs text-[#24211F] dark:text-[#FAF8F5] leading-relaxed line-clamp-3">
                      {item.quote}
                    </p>

                    {/* Favorite Verse Tag */}
                    <div className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#981C00] dark:text-[#E89382]">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{item.favoriteVerse}</span>
                    </div>
                  </div>

                  {/* Author Meta */}
                  <div className="pt-3 border-t border-[#E8E4DF]/60 dark:border-[#2C2825]/60 flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${item.avatarBg} text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs`}
                    >
                      {item.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5] truncate">
                          {item.name}
                        </p>
                        <CheckCircle2 className="w-3 h-3 text-[#981C00] dark:text-[#C43214] shrink-0" />
                      </div>
                      <p className="text-[10px] text-[#706A65] dark:text-[#A8A19A] truncate">
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
              {isAmharic ? '• ካርዶቹን ለማቆም ማውዝዎን (cursor) በላያቸው ላይ ያሳርፉ' : '• Hover over any card to pause'}
            </span>
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
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#981C00] hover:bg-zinc-100 text-xs sm:text-sm font-bold tracking-tight transition-colors cursor-pointer shadow-xs"
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
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-transparent hover:bg-black/10 border border-white/40 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
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
