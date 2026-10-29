'use client';

import React from 'react';

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CheckboxVariant = 'default' | 'card';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  labelClassName?: string;
  description?: React.ReactNode;
  descriptionClassName?: string;
  variant?: CheckboxVariant;
  size?: CheckboxSize;
  className?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  id?: string;
}

const sizeConfig: Record<
  CheckboxSize,
  {
    box: string;
    icon: string;
    label: string;
    desc: string;
    gap: string;
  }
> = {
  xs: {
    box: 'w-3.5 h-3.5 rounded-[3px]',
    icon: 'w-2.5 h-2.5',
    label: 'text-[11px] leading-tight',
    desc: 'text-[10px] leading-snug',
    gap: 'gap-2',
  },
  sm: {
    box: 'w-4 h-4 rounded-[4px]',
    icon: 'w-3 h-3',
    label: 'text-xs leading-tight',
    desc: 'text-[11px] leading-snug',
    gap: 'gap-2.5',
  },
  md: {
    box: 'w-[18px] h-[18px] rounded-[6px]',
    icon: 'w-3.5 h-3.5',
    label: 'text-xs sm:text-sm leading-tight',
    desc: 'text-[11px] sm:text-xs leading-snug',
    gap: 'gap-3',
  },
  lg: {
    box: 'w-5 h-5 rounded-[6px]',
    icon: 'w-4 h-4',
    label: 'text-sm sm:text-base leading-snug',
    desc: 'text-xs sm:text-sm leading-relaxed',
    gap: 'gap-3.5',
  },
  xl: {
    box: 'w-6 h-6 rounded-[6px]',
    icon: 'w-4.5 h-4.5',
    label: 'text-base sm:text-lg leading-snug',
    desc: 'text-sm leading-relaxed',
    gap: 'gap-4',
  },
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  label,
  labelClassName = '',
  description,
  descriptionClassName = '',
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  badge,
  children,
  id,
}) => {
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const isCheckedOrIndeterminate = indeterminate || checked;

  const handleToggle = () => {
    if (disabled) return;
    if (indeterminate) {
      onCheckedChange(true);
    } else {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  // The Checkbox Box Element with Animated Tick / Dash
  const BoxElement = (
    <div
      className={`shrink-0 ${currentSize.box} flex items-center justify-center border transition-all duration-200 ${
        isCheckedOrIndeterminate
          ? 'bg-[#981C00] dark:bg-[#E89382] border-[#981C00] dark:border-[#E89382] text-white dark:text-[#181615] shadow-xs'
          : 'border-[#A8A29D] dark:border-[#57534E] bg-white/70 dark:bg-[#1C1A18]/70 hover:border-[#981C00] dark:hover:border-[#E89382]'
      }`}
    >
      {indeterminate ? (
        <svg
          viewBox="0 0 16 16"
          className={`${currentSize.icon} animate-in zoom-in-50 duration-150`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 16 16"
          className={`${currentSize.icon} transition-transform duration-200 ${
            checked ? 'scale-100 opacity-100 animate-in zoom-in-75' : 'scale-0 opacity-0'
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M3 8.5L6.5 12L13 4.5"
            style={{
              strokeDasharray: 20,
              strokeDashoffset: checked ? 0 : 20,
              transition: 'stroke-dashoffset 220ms ease-in-out',
            }}
          />
        </svg>
      )}
    </div>
  );

  // Card Variant
  if (variant === 'card') {
    return (
      <div
        id={id}
        role="checkbox"
        tabIndex={disabled ? -1 : 0}
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full p-3 sm:p-3.5 rounded-[15px] border transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#981C00]/40 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isCheckedOrIndeterminate
            ? 'border-[#981C00] dark:border-[#E89382] bg-[#FAF8F5]/60 dark:bg-[#1E1B19]/60 shadow-2xs'
            : 'border-[#E8E4DF] dark:border-[#2C2825] bg-transparent hover:border-[#DDD7CF] dark:hover:border-[#38332F]'
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {icon && (
              <div className="mt-0.5 shrink-0 text-[#981C00] dark:text-[#E89382]">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {label && (
                <div
                  className={`font-semibold text-[#24211F] dark:text-[#FAF8F5] ${currentSize.label} ${labelClassName}`}
                >
                  {label}
                </div>
              )}
              {description && (
                <div
                  className={`text-[#706A65] dark:text-[#A8A29D] mt-0.5 ${currentSize.desc} ${descriptionClassName}`}
                >
                  {description}
                </div>
              )}
              {children}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {badge && <div>{badge}</div>}
            {BoxElement}
          </div>
        </div>
      </div>
    );
  }

  // Default Variant (Clean Row without borders or backgrounds)
  return (
    <div
      id={id}
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`group flex items-start justify-between ${currentSize.gap} py-2 px-1.5 rounded-[15px] transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#981C00]/40 hover:bg-[#FAF8F5]/60 dark:hover:bg-[#1C1A18]/60 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className={`flex items-start ${currentSize.gap} flex-1 min-w-0`}>
        <div className="pt-0.5">{BoxElement}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="shrink-0 text-[#981C00] dark:text-[#E89382]">
                {icon}
              </span>
            )}
            {label && (
              <span
                className={`font-medium text-[#24211F] dark:text-[#FAF8F5] group-hover:text-[#981C00] dark:group-hover:text-[#E89382] transition-colors ${currentSize.label} ${labelClassName}`}
              >
                {label}
              </span>
            )}
          </div>
          {description && (
            <p
              className={`text-[#706A65] dark:text-[#A8A29D] mt-0.5 ${currentSize.desc} ${descriptionClassName}`}
            >
              {description}
            </p>
          )}
          {children}
        </div>
      </div>

      {badge && <div className="shrink-0 ml-2 self-center">{badge}</div>}
    </div>
  );
};
