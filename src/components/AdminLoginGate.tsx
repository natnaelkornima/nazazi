'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';

interface AdminLoginGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [shake, setShake] = useState(false);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutCountdown > 0) {
      timer = setInterval(() => {
        setLockoutCountdown((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setErrorMessage(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLocked || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Authentication failed' }));

      if (res.status === 429 || data.locked) {
        setIsLocked(true);
        setLockoutCountdown(data.remainingSec || 180);
        setErrorMessage(data.error || 'Console locked due to multiple failed attempts.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid administrator passcode.');
        if (typeof data.attemptsRemaining === 'number') {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Store authenticated session token
      if (data.session?.token) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nazazi_admin_token', data.session.token);
          localStorage.setItem('nazazi_admin_token', data.session.token);
          localStorage.setItem('nazazi_admin_auth_at', new Date().toISOString());
        }
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during login';
      setErrorMessage(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 relative">
      {/* Background subtle dashed ambient circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[460px] h-[460px] rounded-full border border-dashed border-[#DDD7CF] dark:border-[#2C2825] opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className={`w-full max-w-sm relative z-10 space-y-5 ${shake ? 'animate-shake' : ''}`}
      >
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#706A65] hover:text-[#24211F] dark:text-[#A8A19A] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Site</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#706A65] dark:text-[#A8A19A]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted Session</span>
          </div>
        </div>

        {/* Minimalist Card */}
        <div className="bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[3px] p-7 sm:p-8 shadow-xs space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-[3px] bg-[#981C00] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                N
              </div>
              <div className="w-2 h-2 rounded-full bg-[#981C00] animate-pulse" title="Admin Auth Protected" />
            </div>

            <div className="pt-2">
              <h1 className="text-xl font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5]">
                Admin Authentication
              </h1>
              <p className="text-xs text-[#706A65] dark:text-[#A8A19A] mt-1">
                Enter your master passcode to access the management portal.
              </p>
            </div>
          </div>

          {/* Error / Alert */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-[3px] border text-xs flex items-start gap-2.5 ${
                isLocked
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isLocked ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold">{isLocked ? 'Access Temporarily Suspended' : 'Authentication Failed'}</p>
                <p className="text-[11px] leading-relaxed opacity-90">{errorMessage}</p>
                {lockoutCountdown > 0 && (
                  <p className="font-mono font-bold text-rose-600 dark:text-rose-400 pt-1 text-[11px]">
                    Cooldown remaining: {Math.floor(lockoutCountdown / 60)}:
                    {String(lockoutCountdown % 60).padStart(2, '0')}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Simple Clean Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#24211F] dark:text-[#FAF8F5]">
                <label htmlFor="admin-passcode" className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#706A65] dark:text-[#A8A19A]" />
                  <span>Passcode</span>
                </label>
                {attemptsRemaining !== null && !isLocked && (
                  <span className="text-[11px] font-normal text-[#706A65] dark:text-[#A8A19A]">
                    {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  id="admin-passcode"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLocked || isLoading}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1F1C1A] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[3px] text-sm font-mono tracking-wider text-[#24211F] dark:text-[#FAF8F5] placeholder:text-[#A8A19A] focus:outline-none focus:ring-1 focus:ring-[#981C00] dark:focus:ring-[#C43214] focus:border-[#981C00] dark:focus:border-[#C43214] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#706A65] hover:text-[#24211F] dark:text-[#A8A19A] dark:hover:text-[#FAF8F5] p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!password.trim() || isLocked || isLoading}
              className="w-full py-2.5 px-4 bg-[#981C00] hover:bg-[#7A1D28] text-white font-semibold text-xs rounded-[3px] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked ({lockoutCountdown}s)</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security badge at bottom */}
        <div className="text-center text-[11px] text-[#706A65] dark:text-[#A8A19A] flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-[#981C00] dark:text-[#C43214]" />
          <span>Restricted Portal • Authorized Personnel Only</span>
        </div>
      </motion.div>
    </div>
  );
};
