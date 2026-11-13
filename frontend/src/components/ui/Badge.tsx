import React from 'react';
import { cn } from '../../lib/utils';
import type { UITheme } from './Button';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type BadgeSize = 'sm' | 'md';
export type DataFreshnessStatus = 'LIVE' | 'SIMULATED' | 'STATIC' | 'STALE' | 'UNAVAILABLE';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  theme?: UITheme;
  dataStatus?: DataFreshnessStatus;
  dot?: boolean;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  theme = 'light',
  dataStatus,
  dot,
  ...props
}) => {
  const isDark = theme === 'dark';

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-sans',
  };

  // If dataStatus is specified, enforce strict truthful styling according to PRD & DESIGN
  if (dataStatus) {
    const getStatusConfig = () => {
      switch (dataStatus) {
        case 'LIVE':
          return {
            label: 'LIVE (REALTIME)',
            dotClass: 'bg-emerald-500 motion-safe:animate-pulse',
            style: isDark
              ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
              : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]',
          };
        case 'SIMULATED':
          return {
            label: 'DATA SIMULASI',
            dotClass: 'bg-purple-500',
            style: isDark
              ? 'bg-purple-950/50 border-purple-800/60 text-purple-300'
              : 'bg-purple-50 border-purple-200 text-purple-700',
          };
        case 'STATIC':
          return {
            label: 'DATA STATIS',
            dotClass: 'bg-neutral-400',
            style: isDark
              ? 'bg-[#212121] border-[#343434] text-[#D4D4D4]'
              : 'bg-neutral-100 border-neutral-300 text-neutral-700',
          };
        case 'STALE':
          return {
            label: 'DATA TERTUNDA / USANG',
            dotClass: 'bg-amber-500',
            style: isDark
              ? 'bg-amber-950/50 border-amber-800/60 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-800',
          };
        case 'UNAVAILABLE':
          return {
            label: 'TIDAK TERSEDIA',
            dotClass: 'bg-red-500',
            style: isDark
              ? 'bg-red-950/50 border-red-800/60 text-red-300'
              : 'bg-red-50 border-red-200 text-red-800',
          };
      }
    };

    const statusConfig = getStatusConfig();

    return (
      <span
        className={cn(
          'inline-flex items-center font-bold tracking-tight rounded-full border',
          sizeStyles[size],
          statusConfig.style,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dotClass)} aria-hidden="true" />
        {children || statusConfig.label}
      </span>
    );
  }

  // Standard Variant Styles
  const getVariantStyles = (): string => {
    if (isDark) {
      switch (variant) {
        case 'success':
          return 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400';
        case 'warning':
          return 'bg-amber-950/40 border-amber-800/50 text-amber-300';
        case 'danger':
          return 'bg-red-950/40 border-red-800/50 text-red-400';
        case 'info':
          return 'bg-[#212121] border-[#343434] text-[#A3A3A3]';
        case 'neutral':
        default:
          return 'bg-[#191919] border-[#2C2C2C] text-[#D4D4D4]';
      }
    }

    // Light Theme
    switch (variant) {
      case 'success':
        return 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'info':
        return 'bg-neutral-100 border-neutral-300 text-neutral-800';
      case 'neutral':
      default:
        return 'bg-white border-[#E5E7EB] text-[#4B5563]';
    }
  };

  const getDotColor = (): string => {
    switch (variant) {
      case 'success':
        return isDark ? 'bg-emerald-400' : 'bg-[#047857]';
      case 'warning':
        return isDark ? 'bg-amber-400' : 'bg-amber-600';
      case 'danger':
        return isDark ? 'bg-red-400' : 'bg-red-600';
      case 'info':
        return isDark ? 'bg-neutral-400' : 'bg-neutral-600';
      case 'neutral':
      default:
        return isDark ? 'bg-neutral-500' : 'bg-neutral-400';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border shadow-2xs',
        sizeStyles[size],
        getVariantStyles(),
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', getDotColor())} aria-hidden="true" />}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

