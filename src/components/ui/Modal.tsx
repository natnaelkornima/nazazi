import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  noPadding?: boolean;
  bodyClassName?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  noPadding = false,
  bodyClassName,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/70 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full bg-white dark:bg-[#1D1A18] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[3px] shadow-2xl z-10 overflow-hidden text-[#141413] dark:text-[#FAF8F5]',
              maxWidths[maxWidth],
              className
            )}
          >
            {(title || description) && (
              <div className="p-5 sm:p-6 pb-4 flex items-start justify-between border-b border-[#E8E4DF]/80 dark:border-[#2C2825]/80">
                <div>
                  {title && <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#141413] dark:text-[#FAF8F5]">{title}</h3>}
                  {description && (
                    <p className="text-xs text-[#706A65] dark:text-[#A8A19A] mt-1 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-[#706A65] hover:text-[#141413] dark:hover:text-[#FAF8F5] transition-colors p-1.5 rounded-[3px] hover:bg-[#F3EFEA] dark:hover:bg-[#25221F] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-30 text-[#706A65] hover:text-[#141413] dark:hover:text-[#FAF8F5] transition-colors p-1.5 rounded-[3px] bg-[#FAF8F5]/90 dark:bg-[#25221F]/90 hover:bg-[#F3EFEA] dark:hover:bg-[#332E2A] cursor-pointer backdrop-blur-md shadow-2xs border border-[#E8E4DF] dark:border-[#2C2825]"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className={cn(noPadding ? '' : 'p-5 sm:p-6', bodyClassName)}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
