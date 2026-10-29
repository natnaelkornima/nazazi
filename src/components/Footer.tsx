'use client';

import React from 'react';
import { NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ArrowUpRight, Lock, Smartphone } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenVerifyModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenVerifyModal }) => {
  const { language } = useLanguage();
  const isAmharic = language === 'am';

  const handleNavClick = (hash: string) => {
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('landing');
      setTimeout(() => {
        const target = document.querySelector(hash);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleVerifyClick = () => {
    if (onOpenVerifyModal) {
      onOpenVerifyModal();
    } else {
      onNavigate('landing');
    }
  };

  return (
    <footer className="w-full bg-[#F3EFEA] dark:bg-[#0E0D0C] border-t border-[#E8E4DF] dark:border-[#2C2825] text-[#706A65] dark:text-[#A8A19A] text-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#981C00] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                N
              </div>
              <span className="font-bela-bereka text-2xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5] leading-none">
                ናዛዚ
              </span>
            </div>
            <p className="text-xs text-[#706A65] dark:text-[#A8A19A] max-w-sm leading-relaxed">
              {isAmharic
                ? 'ለደከመች ነፍስ የዕለት ተስፋ እና ማጽናኛ። የሚያንፁ የመጽሐፍ ቅዱስ ቃላቶች እና መንፈሳዊ መልእክቶች በSMS በቀጥታ በስልክዎ ይደርስዎታል። ምንም መለያ መክፈት አይጠበቅብዎትም።'
                : 'Spiritual encouragement, uplifting Bible verses, and inspirational SMS delivered directly to your mobile phone. No account or password required.'}
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="font-bold text-[11px] uppercase tracking-wider text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'አገልግሎት' : 'Service'}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleNavClick('#how-it-works')}
                  className="hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors cursor-pointer text-left"
                >
                  {isAmharic ? 'እንዴት ይሰራል?' : 'How It Works'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('#pricing')}
                  className="hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors cursor-pointer text-left"
                >
                  {isAmharic ? 'የደንበኝነት እቅዶች' : 'Subscription Plans'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('#trust')}
                  className="hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors cursor-pointer text-left"
                >
                  {isAmharic ? 'እምነት እና ደህንነት' : 'Trust & Privacy'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('#testimonials')}
                  className="hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors cursor-pointer text-left"
                >
                  {isAmharic ? 'የተጠቃሚዎች ምስክርነት' : 'Testimonials'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('#faq')}
                  className="hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors cursor-pointer text-left"
                >
                  {isAmharic ? 'ተደጋጋሚ ጥያቄዎች' : 'FAQ'}
                </button>
              </li>
            </ul>
          </div>

          {/* Verification & Help */}
          <div className="md:col-span-4 space-y-3">
            <p className="font-bold text-[11px] uppercase tracking-wider text-[#24211F] dark:text-[#FAF8F5]">
              {isAmharic ? 'ማረጋገጫ እና ድጋፍ' : 'Verification & Support'}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={handleVerifyClick}
                  className="inline-flex items-center gap-1.5 hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors cursor-pointer text-left font-medium"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isAmharic ? 'የአባልነት ማረጋገጫ በስልክ ቁጥር' : 'Check Approval Status'}</span>
                </button>
              </li>
              <li>
                <a
                  href="https://t.me/nazazisms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors"
                >
                  <span>{isAmharic ? 'ይፋዊ የቴሌግራም ቻናል' : 'Official Telegram'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Discrete Admin Entry */}
        <div className="pt-8 border-t border-[#E8E4DF] dark:border-[#2C2825] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A8A19A] dark:text-[#706A65]">
          <p>© {new Date().getFullYear()} NAZAZI. {isAmharic ? 'መብቱ በህግ የተጠበቀ ነው።' : 'All rights reserved.'}</p>
          
          {/* Discrete, unobtrusive administrator access separate from customer flows */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-1 text-[11px] text-[#706A65] dark:text-[#A8A19A] hover:text-[#24211F] dark:hover:text-[#FAF8F5] transition-colors opacity-75 hover:opacity-100 cursor-pointer"
              title="Admin Portal"
            >
              <Lock className="w-3 h-3" />
              <span>{isAmharic ? 'የአስተዳዳሪ መግቢያ' : 'Admin Portal'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
