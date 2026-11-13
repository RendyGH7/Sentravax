import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type UITheme = 'light' | 'dark';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme?: UITheme;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      theme = 'light',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDark = theme === 'dark';
    const isDisabled = disabled || isLoading;

    // Base Styles (Layout, Typography, Transitions, Focus Ring)
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]';

    const focusRing = isDark
      ? 'focus-visible:ring-[#F59E0B] focus-visible:ring-offset-[#0C0C0C]'
      : 'focus-visible:ring-[#047857] focus-visible:ring-offset-[#FFFFFF]';

    // Size Styles
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-xs sm:text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 h-12',
    };

    // Variant Styles by Theme
    const getVariantStyles = (): string => {
      if (isDark) {
        switch (variant) {
          case 'primary':
            return 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] font-bold shadow-xs active:bg-[#B45309]';
          case 'secondary':
            return 'bg-[#212121] hover:bg-[#2B2B2B] text-[#F5F5F5] border border-[#2C2C2C]';
          case 'outline':
            return 'bg-transparent hover:bg-[#212121] text-[#F5F5F5] border border-[#343434]';
          case 'ghost':
            return 'bg-transparent hover:bg-[#212121] text-[#A3A3A3] hover:text-white';
          case 'danger':
            return 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs';
        }
      }

      // Light Theme
      switch (variant) {
        case 'primary':
          return 'bg-[#047857] hover:bg-[#065F46] text-white shadow-xs active:bg-[#064E3B]';
        case 'secondary':
          return 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border border-[#E5E7EB]';
        case 'outline':
          return 'bg-white hover:bg-[#F9FAFB] text-[#111827] border border-[#D1D5DB] shadow-xs';
        case 'ghost':
          return 'bg-transparent hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827]';
        case 'danger':
          return 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs';
      }
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(baseStyles, focusRing, sizeStyles[size], getVariantStyles(), className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none shrink-0" aria-hidden="true" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

