import React from 'react';
import { cn } from '../../lib/utils';
import type { UITheme } from './Button';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: UITheme;
  padding?: CardPadding;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, theme = 'light', padding = 'md', interactive = false, ...props }, ref) => {
    const isDark = theme === 'dark';

    const paddingStyles: Record<CardPadding, string> = {
      none: 'p-0',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    const baseStyles = isDark
      ? 'bg-[#161616] border-[#2C2C2C] text-[#F5F5F5]'
      : 'bg-white border-[#E5E7EB] text-[#111827]';

    const interactiveStyles = interactive
      ? isDark
        ? 'hover:border-[#3D3D3D] hover:bg-[#1C1C1C] cursor-pointer transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]'
        : 'hover:border-[#D1D5DB] hover:shadow-xs cursor-pointer transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border shadow-xs transition-colors',
          baseStyles,
          paddingStyles[padding],
          interactiveStyles,
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

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  theme?: UITheme;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, bordered = false, theme = 'light', ...props }, ref) => {
    const isDark = theme === 'dark';
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          bordered && (isDark ? 'pb-4 border-b border-[#2C2C2C]' : 'pb-4 border-b border-[#E5E7EB]'),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  theme?: UITheme;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className, as: Component = 'h3', theme = 'light', ...props }, ref) => {
    const isDark = theme === 'dark';
    return (
      <Component
        ref={ref}
        className={cn(
          'font-bold tracking-tight text-base sm:text-lg',
          isDark ? 'text-[#F5F5F5]' : 'text-[#111827]',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  theme?: UITheme;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, theme = 'light', ...props }, ref) => {
    const isDark = theme === 'dark';
    return (
      <p
        ref={ref}
        className={cn(
          'text-xs sm:text-sm leading-relaxed',
          isDark ? 'text-[#A3A3A3]' : 'text-[#6B7280]',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('pt-3 first:pt-0', className)} {...props}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  theme?: UITheme;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, bordered = false, theme = 'light', ...props }, ref) => {
    const isDark = theme === 'dark';
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center pt-4',
          bordered && (isDark ? 'mt-4 border-t border-[#2C2C2C]' : 'mt-4 border-t border-[#E5E7EB]'),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';

