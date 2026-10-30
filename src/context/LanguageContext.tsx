'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'am';

export const translations = {
  en: {
    // Header & Nav
    'header.title': 'Nazazi',
    'header.subtitle': 'Spiritual encouragement & SMS platform',
    'nav.landing': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin Console',
    'nav.messages': 'Messages',
    'nav.payments': 'Payments',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.auth': 'Sign In',
    'nav.features': 'Features & Pricing',

    // Actions
    'action.signIn': 'Sign In',
    'action.signUp': 'Sign Up',
    'action.signOut': 'Sign Out',
    'action.search': 'Search...',
    'action.notifications': 'Notifications',
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.getStarted': 'Get Started',
    'action.uploadReceipt': 'Upload Bank Receipt',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.sendSMS': 'Send Message',
    'action.copyKey': 'Copy API Key',
    'action.createKey': 'Generate Key',
    'action.lightMode': 'Light Mode',
    'action.darkMode': 'Dark Mode',
    'action.switchLang': 'አማ',

    // Hero Section
    'landing.heroTitle': 'A Beacon of Hope for Times of Spiritual Weariness.',
    'landing.heroSubtitle': 'Comforting spiritual scripture and uplifting SMS delivered directly to your mobile phone.',
    'landing.ctaRegister': 'Receive Hope & Spiritual Renewal',
    'landing.ctaSubtitle': 'Register your phone number to receive comforting spiritual SMS messages.',

    // Features Section
    'landing.featureOutreachTitle': 'Spiritual Outreach',
    'landing.featureOutreachSubtitle': 'Direct SMS encouragement.',
    'landing.featureOutreachDesc': 'Uplifting scripture delivered straight to your phone.',

    'landing.featureDirectTitle': 'Direct SMS Delivery',
    'landing.featureDirectDesc': 'Scripture delivered directly to your mobile phone.',

    'landing.featureContinuousTitle': 'Daily Spiritual Renewal',
    'landing.featureContinuousDesc': 'Daily messages of hope and scripture tailored for encouragement.',

    'landing.featurePrivacyTitle': 'Privacy & Trust',
    'landing.featurePrivacyDesc': 'Your details are kept strictly private.',

    'landing.featureUnfailingTitle': 'Reliable Delivery',
    'landing.featureUnfailingDesc': 'Reliable delivery across all mobile networks.',
    'landing.featureAlwaysOn': 'Always On',

    // Pricing Section
    'landing.pricingHeaderTitle': 'Transparent Pricing',
    'landing.pricingHeaderSubtitle': 'Simple, predictable pricing plans.',
    'landing.pricingSubText': 'Simple, transparent plans for spiritual SMS encouragement.',

    'landing.plan1Name': '1 Month Access',
    'landing.plan1Badge': 'Flexible Plan',
    'landing.plan1Price': '200 Birr / 1 Month',
    'landing.plan1Cta': 'Register for 1 Month',
    'landing.incCapabilities': 'Included Capabilities',

    'landing.plan2Name': '3 Months Access',
    'landing.plan2Badge': 'Popular Choice',
    'landing.plan2Price': '600 Birr / 3 Months',
    'landing.plan2Cta': 'Register for 3 Months',

    'landing.plan3Name': '6 Months Access',
    'landing.plan3Badge': 'Best Value • Save 200 Birr',
    'landing.plan3Price': '1000 Birr / 6 Months',
    'landing.plan3OriginalPrice': '1200 Birr',
    'landing.plan3Cta': 'Register for 6 Months',

    // Testimonial
    'landing.testimonialQuote': '"Receiving a timely Nazazi text was a true lifeline during a weary season. Comfort delivered right when I needed it."',
    'landing.testimonialAuthor': 'Ephrem T.',
    'landing.testimonialRole': 'Registered Member',

    // FAQ Section
    'landing.faqTitle': 'Frequently Asked Questions',
    'landing.faqQ1': 'What does Nazazi mean and what is its mission?',
    'landing.faqA1': 'Nazazi means "Hope". We deliver uplifting spiritual messages and scripture via SMS to encourage and comfort you.',
    'landing.faqQ2': 'How do registered members receive messages?',
    'landing.faqA2': 'Once registered with your phone number, you receive encouraging SMS messages directly on your mobile phone.',
    'landing.faqQ3': 'How do I manage my subscription or account?',
    'landing.faqA3': 'You can check subscription status, update your phone number, and view message archives in your member dashboard.',
    'landing.faqQ4': 'Is my phone number kept secure and private?',
    'landing.faqA4': 'Yes. Member data is strictly protected and used exclusively to send your spiritual messages.',

    // Footer Links & Titles
    'footer.brandDesc': 'Spiritual encouragement, uplifting Bible verses, and daily inspirational SMS delivered directly to your mobile phone to build your faith.',
    'footer.servicesTitle': 'Services',
    'footer.service1': 'Daily Verse SMS',
    'footer.service2': 'Encouragement Messages',
    'footer.service3': 'Subscription Plans',
    'footer.service4': 'Payment Verification',

    'footer.accountTitle': 'Account',
    'footer.account1': 'Member Dashboard',
    'footer.account2': 'Profile & Phone Number',
    'footer.account3': 'Admin SMS Console',
    'footer.account4': 'SMS Preferences',

    'footer.connectTitle': 'Connect',
    'footer.connect1': 'Telegram Channel',
    'footer.connect2': 'Support & Contact',
    'footer.connect3': 'Privacy Policy',
    'footer.connect4': 'Terms of Service',
    'footer.copyright': '© 2026 NAZAZI Inc. All rights reserved.',

    // UI & Dashboard
    'ui.welcome': 'Welcome',
    'ui.systemStatus': 'System Operational',
    'ui.searchPlaceholder': 'Search commands or pages... (Cmd + K)',
    'ui.notifications': 'Notifications',
    'ui.noData': 'No records found.',
    'ui.roleUser': 'User Mode',
    'ui.roleAdmin': 'Admin',
  },
  am: {
    // Header & Nav
    'header.title': 'ናዛዚ',
    'header.subtitle': 'የዕለት መንፈሳዊ ስንቅ በSMS',
    'nav.landing': 'መነሻ',
    'nav.dashboard': 'ዳሽቦርድ',
    'nav.admin': 'የአድሚን SMS ኮንሶል',
    'nav.messages': 'መልእክቶች',
    'nav.payments': 'ክፍያዎች',
    'nav.profile': 'ፕሮፋይል',
    'nav.settings': 'የSMS ምርጫዎች',
    'nav.auth': 'ይግቡ',
    'nav.features': 'የአገልግሎት አማራጮች',

    // Actions
    'action.signIn': 'ይግቡ',
    'action.signUp': 'ይመዝገቡ',
    'action.signOut': 'ይውጡ',
    'action.search': 'ይፈልጉ...',
    'action.notifications': 'ማስታወቂያዎች',
    'action.save': 'ለውጦችን ያስቀምጡ',
    'action.cancel': 'ይቅር',
    'action.getStarted': 'ይጀምሩ',
    'action.uploadReceipt': 'የክፍያ ደረሰኝ ያስገቡ',
    'action.approve': 'አጽድቅ',
    'action.reject': 'ውድቅ አድርግ',
    'action.sendSMS': 'መልእክት ላክ',
    'action.copyKey': 'ኤፒአይ ቁልፍ ቅዳ',
    'action.createKey': 'አዲስ ቁልፍ አውጣ',
    'action.lightMode': 'ብርሃናማ',
    'action.darkMode': 'ጨለማ',
    'action.switchLang': 'English',

    // Hero Section
    'landing.heroTitle': 'ለዛለች ነፍስ እረፍት፣ ለየዕለቱ ተስፋና ብርታት',
    'landing.heroSubtitle': 'ልብን የሚያጽናኑ እና መንፈስን የሚያድሱ የመጽሐፍ ቅዱስ ጥቅሶች በየማለዳው በቀጥታ ወደ ስልክዎ በSMS ይላካሉ። ምንም አካውንት መክፈት ሳያስፈልግ በስልክ ቁጥርዎ ብቻ ይጀምሩ።',
    'landing.ctaRegister': 'የአገልግሎት እቅድ ይምረጡ',
    'landing.ctaSubtitle': 'የአባልነት ሁኔታዎን ያረጋግጡ',

    // Features Section
    'landing.featureOutreachTitle': 'ቀጥታ በSMS የሚደርስ (ኢንተርኔት አይጠይቅም)',
    'landing.featureOutreachSubtitle': 'አካውንትና ፓስወርድ አያስፈልግም',
    'landing.featureOutreachDesc': 'በቴሌብር እና በንግድ ባንክ (CBE) ቀላል ክፍያ',

    'landing.featureDirectTitle': 'ቀጥታ የSMS ስርጭት',
    'landing.featureDirectDesc': 'ያለ ኢንተርኔት በማንኛውም ስልክ የሚሰራ።',

    'landing.featureContinuousTitle': 'የዕለቱ ቃል',
    'landing.featureContinuousDesc': 'የመንፈስ እረፍትና ብርታት የሚሰጥ የዕለት ቃል።',

    'landing.featurePrivacyTitle': 'ታማኝነታችንና እና የእርሶ ደህንነት',
    'landing.featurePrivacyDesc': 'የስልክ ቁጥርዎ ደህንነቱ የተጠበቀ ነው።',

    'landing.featureUnfailingTitle': 'ማለዳ 12:30',
    'landing.featureUnfailingDesc': 'በየዕለቱ ሳይዛነፍ በሰዓቱ የሚደርስ።',
    'landing.featureAlwaysOn': 'ሁልጊዜም ዝግጁ',

    // Pricing Section
    'landing.pricingHeaderTitle': 'ግልጽ እና ተመጣጣኝ ክፍያ',
    'landing.pricingHeaderSubtitle': 'የአገልግሎት አማራጮች',
    'landing.pricingSubText': 'ምንም የተደበቀ ተጨማሪ ክፍያ የለም። ለእርስዎ ወይም ለወዳጅ ዘመድዎ የሚስማማውን የአገልግሎት ጊዜ ይምረጡ።',

    'landing.plan1Name': 'የ1 ወር አገልግሎት',
    'landing.plan1Badge': 'ለሙከራ ተስማሚ',
    'landing.plan1Price': '200 ብር / ለ1 ወር (30 ቀናት)',
    'landing.plan1Cta': 'ለ1 ወር ይመዝገቡ',
    'landing.incCapabilities': 'የሚያካትታቸው አገልግሎቶች:',

    'landing.plan2Name': 'የ3 ወር አገልግሎት',
    'landing.plan2Badge': 'የብዙዎች ምርጫ',
    'landing.plan2Price': '600 ብር / ለ3 ወራት',
    'landing.plan2Cta': 'ለ3 ወር ይመዝገቡ',

    'landing.plan3Name': 'የ6 ወር አገልግሎት',
    'landing.plan3Badge': 'ከፍተኛ ቅናሽ (ምርጥ አማራጭ)',
    'landing.plan3Price': '1,000 ብር / ለ6 ወራት',
    'landing.plan3OriginalPrice': '1,200 ብር',
    'landing.plan3Cta': 'ለ6 ወር ይመዝገቡ',

    // Testimonial
    'landing.testimonialQuote': '«በየማለዳው 12:30 በመደበኛዋ የኪስ ስልኬ ላይ የሚገባው የእግዚአብሔር ቃል ቀኔን በሰላምና በምስጋና እንድጀምር ብርታት ሆኖኛል።»',
    'landing.testimonialAuthor': 'አባ ተስፋዬ ገ/ማሪያም',
    'landing.testimonialRole': 'ጡረተኛ መምህር • አዲስ አበባ',

    // FAQ Section
    'landing.faqTitle': 'ተደጋጋሚ ጥያቄዎች',
    'landing.faqQ1': '«ናዛዚ» ማለት ምን ማለት ነው? ዓላማውስ ምንድን ነው?',
    'landing.faqA1': '«ናዛዚ» ማለት በግዕዝ «አጽናኝ» ወይም «ተስፋ ሰጪ» ማለት ነው። ዓላማችን በዕለት ተዕለት የሕይወት ውጣ ውረድ ውስጥ ለደከሙና መንፈሳዊ ብርታትን ለሚሹ ወገኖች፣ በየማለዳው የሚያጽናኑና የሚያንፁ የመጽሐፍ ቅዱስ ጥቅሶችን በቀጥታ በSMS ማድረስ ነው።',
    'landing.faqQ2': 'ለመመዝገብ አካውንት መክፈት ወይም ኢሜይል ያስፈልጋል?',
    'landing.faqA2': 'አያስፈልግም። ምንም ዓይነት ኢሜይል፣ ፓስወርድ ወይም አካውንት መክፈት ሳይጠበቅብዎት መልእክቱ እንዲደርስዎት የሚፈልጉበትን የስልክ ቁጥር ብቻ በማስገባት መመዝገብ ይችላሉ። ለወላጆችዎ ወይም ለወዳጅዎም የእነሱን ስልክ ቁጥር በማስገባት በቀላሉ መመዝገብ ይችላሉ።',
    'landing.faqQ3': 'የከፈልኩት ክፍያ መጽደቁን እንዴት ማረጋገጥ እችላለሁ?',
    'landing.faqA3': 'በቴሌብር ወይም በንግድ ባንክ (CBE) ክፍያዎን እንደፈጸሙ ሲስተሙ ወዲያውኑ በራሱ ያረጋግጣል። በተጨማሪም ድረ-ገጹ ላይ ያለውን «የአባልነት ሁኔታዎን ያረጋግጡ» የሚለውን በመጫንና ስልክ ቁጥርዎን በማስገባት በማንኛውም ሰዓት ማረጋገጥ ይችላሉ።',
    'landing.faqQ4': 'የስልክ ቁጥሬ ደህንነት የተጠበቀ እና ምስጢራዊ ነው?',
    'landing.faqA4': 'አዎ፣ በሚገባ የተጠበቀ ነው። ስልክ ቁጥርዎ የዕለቱን የመጽሐፍ ቅዱስ ቃል ለመላክ ብቻ ጥቅም ላይ ይውላል። ለማንኛውም ሶስተኛ ወገን ወይም ለማስታወቂያ ድርጅቶች አሳልፈን አንሰጥም።',

    // Footer Links & Titles
    'footer.brandDesc': 'ለዛለች ነፍስ እረፍት፣ ለየዕለቱ ተስፋና ብርታት። የሚያንፁ የመጽሐፍ ቅዱስ ጥቅሶች በየማለዳው በSMS በቀጥታ ወደ ስልክዎ ይላካሉ። ምንም አካውንት መክፈት አይጠበቅብዎትም።',
    'footer.servicesTitle': 'አገልግሎት',
    'footer.service1': 'የዕለቱ ጥቅስ SMS',
    'footer.service2': 'የሚያበረታቱ መልእክቶች',
    'footer.service3': 'የአገልግሎት አማራጮች',
    'footer.service4': 'የክፍያ ማረጋገጫ',

    'footer.accountTitle': 'አባልነት',
    'footer.account1': 'የአባልነት ሁኔታዎን ያረጋግጡ',
    'footer.account2': 'የስልክ ቁጥር ማስተካከያ',
    'footer.account3': 'የአድሚን SMS ኮንሶል',
    'footer.account4': 'የSMS ምርጫዎች',

    'footer.connectTitle': 'ይገናኙ',
    'footer.connect1': 'የቴሌግራም ቻናል',
    'footer.connect2': 'ድጋፍ እና ግንኙነት',
    'footer.connect3': 'የግላዊነት ፖሊሲ',
    'footer.connect4': 'የአገልግሎት ውሎች',
    'footer.copyright': '© 2026 ናዛዚ (NAZAZI). መብቱ በህግ የተጠበቀ ነው።',

    // UI & Dashboard
    'ui.welcome': 'እንኳን ደህና መጡ',
    'ui.systemStatus': 'ስርዓቱ በስራ ላይ ነው',
    'ui.searchPlaceholder': 'ይፈልጉ ወይም ትዕዛዝ ይፃፉ... (Cmd + K)',
    'ui.notifications': 'ማስታወቂያዎች',
    'ui.noData': 'ምንም መረጃ አልተገኘም።',
    'ui.roleUser': 'የተጠቃሚ ሁነታ',
    'ui.roleAdmin': 'አስተዳዳሪ',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('am');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nazazi-lang');
      if (saved === 'am' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    if (language === 'am') {
      root.classList.add('lang-am');
      document.body.classList.add('lang-am');
    } else {
      root.classList.remove('lang-am');
      document.body.classList.remove('lang-am');
    }
    try {
      localStorage.setItem('nazazi-lang', language);
    } catch {
      // ignore
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[language];
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
