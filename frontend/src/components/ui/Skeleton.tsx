import React from 'react';
import { cn } from '../../lib/utils';
import type { UITheme } from './Button';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'table';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  theme?: UITheme;
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  theme = 'light',
  width,
  height,
  count = 1,
  style,
  ...props
}) => {
  const isDark = theme === 'dark';
  const shimmerClass = isDark ? 'skeleton-dark' : 'skeleton-light';

  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  // Card Skeleton Preset
  if (variant === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'p-5 sm:p-6 rounded-2xl border space-y-4 shadow-xs',
              isDark ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#E5E7EB]',
              className
            )}
            role="status"
            aria-label="Memuat kartu..."
          >
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl shrink-0', shimmerClass)} />
              <div className="space-y-2 flex-1">
                <div className={cn('h-4 w-1/3 rounded-md', shimmerClass)} />
                <div className={cn('h-3 w-1/2 rounded-md', shimmerClass)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className={cn('h-3 w-full rounded-md', shimmerClass)} />
              <div className={cn('h-3 w-5/6 rounded-md', shimmerClass)} />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <div className={cn('h-3 w-20 rounded-md', shimmerClass)} />
              <div className={cn('h-8 w-24 rounded-lg', shimmerClass)} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table Skeleton Preset
  if (variant === 'table') {
    return (
      <div
        className={cn(
          'w-full rounded-2xl border overflow-hidden',
          isDark ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#E5E7EB]',
          className
        )}
        role="status"
        aria-label="Memuat tabel..."
      >
        <div className={cn('h-10 border-b flex items-center px-4 gap-4', isDark ? 'border-[#2C2C2C]' : 'border-[#E5E7EB]')}>
          <div className={cn('h-3.5 w-1/4 rounded', shimmerClass)} />
          <div className={cn('h-3.5 w-1/4 rounded', shimmerClass)} />
          <div className={cn('h-3.5 w-1/4 rounded', shimmerClass)} />
          <div className={cn('h-3.5 w-1/6 rounded ml-auto', shimmerClass)} />
        </div>
        <div className="divide-y divide-inherit">
          {Array.from({ length: count || 4 }).map((_, i) => (
            <div key={i} className="h-12 flex items-center px-4 gap-4">
              <div className={cn('h-3 w-1/3 rounded', shimmerClass)} />
              <div className={cn('h-3 w-1/4 rounded', shimmerClass)} />
              <div className={cn('h-3 w-1/5 rounded', shimmerClass)} />
              <div className={cn('h-3 w-16 rounded ml-auto', shimmerClass)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Basic Variants (Text, Circular, Rectangular)
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'text':
        return 'h-3.5 w-full rounded-md my-1';
      case 'circular':
        return 'rounded-full aspect-square';
      case 'rectangular':
      default:
        return 'rounded-xl';
    }
  };

  if (count > 1) {
    return (
      <div className="space-y-2" role="status" aria-label="Memuat konten...">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={customStyle}
            className={cn(shimmerClass, getVariantStyles(), className)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Memuat konten..."
      style={customStyle}
      className={cn(shimmerClass, getVariantStyles(), className)}
      {...props}
    />
  );
};

Skeleton.displayName = 'Skeleton';

