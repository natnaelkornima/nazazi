import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[3px] border bg-white dark:bg-[#1D1A18] border-[#E8E4DF] dark:border-[#2C2825] text-[#141413] dark:text-[#FAF8F5] shadow-xs transition-all duration-150',
          hoverEffect &&
            'hover:shadow-md hover:border-[#981C00]/30 dark:hover:border-[#C43214]/40 hover:-translate-y-0.5',
          glass &&
            'bg-white/80 dark:bg-[#1D1A18]/80 backdrop-blur-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-6 pb-3 flex flex-col gap-1', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'p-6 pt-3 flex items-center border-t border-zinc-100 dark:border-zinc-800/50',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
