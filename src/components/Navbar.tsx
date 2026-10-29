'use client';

import React, { useState, useEffect } from 'react';
import { NavigationTab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Smartphone,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';

interface NavbarProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenVerifyModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onOpenVerifyModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAmharic = language === 'am';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (hash: string) => {
    setMobileMenuOpen(false);
    if (activeTab !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleVerifyClick = () => {
    setMobileMenuOpen(false);
    if (onOpenVerifyModal) {
      onOpenVerifyModal();
    } else {
      onNavigate('landing');
    }
  };

  const handleSubscribeClick = () => {
    setMobileMenuOpen(false);
    handleNavClick('#pricing');
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
        scrolled
          ? 'bg-[#FAF8F5]/95 dark:bg-[#141211]/95 backdrop-blur-md border-[#E8E4DF] dark:border-[#2C2825] shadow-xs'
          : 'bg-[#FAF8F5] dark:bg-[#141211] border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Mark and Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981C00] rounded-sm"
            aria-label="ናዛዚ መነሻ ገጽ"
          >
            {/* Minimal Spiritual Cross & Lettermark Emblem */}
            <div className="w-8 h-8 rounded-xl bg-[#981C00] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:bg-[#7A1D28] transition-colors shrink-0">
              <span>N</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bela-bereka text-2xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5] leading-none pt-0.5">
                ናዛዚ
              </span>
              <span className="text-[10px] text-[#706A65] dark:text-[#A8A19A] tracking-wider uppercase font-semibold leading-none pt-1">
                {isAmharic ? 'የመንፈስ ማጽናኛ SMS' : 'Spiritual SMS'}
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="ዋና አሰሳ"
          className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#706A65] dark:text-[#A8A19A]"
        >
          <button
            onClick={() => handleNavClick('#how-it-works')}
            className="hover:text-[#24211F] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer py-1"
          >
            {isAmharic ? 'እንዴት ይሰራል?' : 'How It Works'}
          </button>
          <button
            onClick={() => handleNavClick('#pricing')}
            className="hover:text-[#24211F] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer py-1"
          >
            {isAmharic ? 'የደንበኝነት እቅዶች' : 'Plans & Pricing'}
          </button>
          <button
            onClick={() => handleNavClick('#trust')}
            className="hover:text-[#24211F] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer py-1"
          >
            {isAmharic ? 'እምነት እና ደህንነት' : 'Trust & Privacy'}
          </button>
          <button
            onClick={() => handleNavClick('#testimonials')}
            className="hover:text-[#24211F] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer py-1"
          >
            {isAmharic ? 'ምስክርነቶች' : 'Testimonials'}
          </button>
          <button
            onClick={() => handleNavClick('#faq')}
            className="hover:text-[#24211F] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer py-1"
          >
            {isAmharic ? 'ጥያቄዎች' : 'FAQ'}
          </button>
        </nav>

        {/* Actions & Utilities */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Verify Approval Status Link */}
          <button
            onClick={handleVerifyClick}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#24211F] dark:text-[#FAF8F5] hover:bg-[#EAE5DF] dark:hover:bg-[#25221F] transition-colors cursor-pointer flex items-center gap-1.5"
            title={isAmharic ? 'የአባልነት ማረጋገጫ በስልክ ቁጥር' : 'Check approval status'}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#706A65] dark:text-[#A8A19A]" />
            <span>{isAmharic ? 'የአባልነት ማረጋገጫ' : 'Verify Status'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-[#706A65] dark:text-[#A8A19A] hover:text-[#24211F] dark:hover:text-[#FAF8F5] hover:bg-[#EAE5DF] dark:hover:bg-[#25221F] transition-colors cursor-pointer"
            aria-label={isAmharic ? 'ወደ እንግሊዝኛ ቀይር' : 'Switch to Amharic'}
          >
            {isAmharic ? 'EN' : 'አማርኛ'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#706A65] dark:text-[#A8A19A] hover:text-[#24211F] dark:hover:text-[#FAF8F5] hover:bg-[#EAE5DF] dark:hover:bg-[#25221F] transition-colors cursor-pointer"
            aria-label={theme === 'light' ? 'ወደ ጨለማ ገጽታ ቀይር' : 'ወደ ብርሃን ገጽታ ቀይር'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Primary CTA Button */}
          <button
            onClick={handleSubscribeClick}
            className="ml-1 px-4 py-2 rounded-xl bg-[#981C00] hover:bg-[#7A1D28] text-white text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>{isAmharic ? 'ይመዝገቡ' : 'Subscribe'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          {/* Quick Language Toggle on Mobile */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#706A65] dark:text-[#A8A19A] hover:bg-[#EAE5DF] dark:hover:bg-[#25221F]"
          >
            {isAmharic ? 'EN' : 'አማርኛ'}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#24211F] dark:text-[#FAF8F5] hover:bg-[#EAE5DF] dark:hover:bg-[#25221F] transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label="ዋና ማውጫ"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] px-5 py-5 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-[#24211F] dark:text-[#FAF8F5]">
            <button
              onClick={() => handleNavClick('#how-it-works')}
              className="text-left py-1.5 hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors"
            >
              {isAmharic ? 'እንዴት ይሰራል?' : 'How It Works'}
            </button>
            <button
              onClick={() => handleNavClick('#pricing')}
              className="text-left py-1.5 hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors"
            >
              {isAmharic ? 'የደንበኝነት እቅዶች' : 'Plans & Pricing'}
            </button>
            <button
              onClick={() => handleNavClick('#trust')}
              className="text-left py-1.5 hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors"
            >
              {isAmharic ? 'እምነት እና ደህንነት' : 'Trust & Privacy'}
            </button>
            <button
              onClick={() => handleNavClick('#testimonials')}
              className="text-left py-1.5 hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors"
            >
              {isAmharic ? 'የተጠቃሚዎች ምስክርነት' : 'Testimonials'}
            </button>
            <button
              onClick={() => handleNavClick('#faq')}
              className="text-left py-1.5 hover:text-[#981C00] dark:hover:text-[#C43214] transition-colors"
            >
              {isAmharic ? 'ተደጋግመው የሚጠየቁ ጥያቄዎች' : 'FAQ'}
            </button>
          </nav>

          <div className="pt-3 border-t border-[#E8E4DF] dark:border-[#2C2825] space-y-2.5">
            <button
              onClick={handleVerifyClick}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FFFFFF] dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] text-xs font-bold text-[#24211F] dark:text-[#FAF8F5] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#981C00] dark:text-[#C43214]" />
              <span>{isAmharic ? 'የአባልነት ማረጋገጫ በስልክ ቁጥር' : 'Verify Approval Status'}</span>
            </button>

            <button
              onClick={handleSubscribeClick}
              className="w-full py-2.5 px-4 rounded-xl bg-[#981C00] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#7A1D28] transition-colors"
            >
              <span>{isAmharic ? 'አሁኑኑ ይመዝገቡ' : 'Subscribe Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-between pt-2 px-1 text-xs text-[#706A65] dark:text-[#A8A19A]">
              <span className="font-medium">{isAmharic ? 'የገጽታ ቀለም' : 'Theme Mode'}</span>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-xl hover:bg-[#EAE5DF] dark:hover:bg-[#25221F] text-[#24211F] dark:text-[#FAF8F5]"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
