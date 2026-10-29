import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'brand' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981C00] dark:focus-visible:ring-[#C43214] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] dark:focus-visible:ring-offset-[#141211] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none rounded-[3px] cursor-pointer';

    const variants = {
      brand:
        'bg-[#981C00] hover:bg-[#7A1D28] text-white shadow-xs hover:shadow-sm',
      primary:
        'bg-[#141413] text-[#FAF8F5] hover:bg-[#252320] dark:bg-[#FAF8F5] dark:text-[#141413] dark:hover:bg-[#EFE9DE] shadow-xs',
      secondary:
        'bg-[#FAF8F5] text-[#141413] border border-[#E8E4DF] hover:bg-[#F3EFEA] dark:bg-[#1D1A18] dark:text-[#FAF8F5] dark:border-[#2C2825] dark:hover:bg-[#25221F] shadow-2xs',
      outline:
        'bg-transparent border border-[#E8E4DF] dark:border-[#2C2825] text-[#141413] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#1D1A18]',
      ghost:
        'bg-transparent text-[#706A65] dark:text-[#A8A19A] hover:text-[#141413] dark:hover:text-[#FAF8F5] hover:bg-[#F3EFEA] dark:hover:bg-[#25221F]',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-xs dark:bg-rose-600 dark:hover:bg-rose-500',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-sm gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
