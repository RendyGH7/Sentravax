import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button, type ButtonVariant } from './Button';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  theme?: 'light' | 'dark';
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  theme = 'light',
  children,
  className,
  ...props
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border transition-colors',
        isDark
          ? 'bg-[#161616] border-[#2C2C2C] text-[#F5F5F5]'
          : 'bg-white border-[#E5E7EB] text-[#111827]',
        className
      )}
      {...props}
    >
      {/* Icon Wrapper */}
      <div
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors border',
          isDark
            ? 'bg-[#212121] border-[#2C2C2C] text-[#A3A3A3]'
            : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]'
        )}
        aria-hidden="true"
      >
        {icon ? (
          <div className="w-7 h-7 flex items-center justify-center">{icon}</div>
        ) : (
          <Inbox className="w-7 h-7" />
        )}
      </div>

      {/* Title */}
      <h3
        className={cn(
          'text-base sm:text-lg font-bold tracking-tight mb-1.5',
          isDark ? 'text-[#F5F5F5]' : 'text-[#111827]'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-xs sm:text-sm max-w-md mb-6 leading-relaxed',
            isDark ? 'text-[#D4D4D4]' : 'text-[#4B5563]'
          )}
        >
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            action.href ? (
              <a
                href={action.href}
                className={cn(
                  'inline-flex items-center justify-center font-semibold rounded-xl text-xs sm:text-sm px-4 py-2 gap-2 h-10 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isDark
                    ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0C0C0C] font-bold focus-visible:ring-[#F59E0B] focus-visible:ring-offset-[#0C0C0C]'
                    : 'bg-[#047857] hover:bg-[#065F46] text-white shadow-xs focus-visible:ring-[#047857] focus-visible:ring-offset-[#FFFFFF]'
                )}
              >
                {action.icon && <span aria-hidden="true">{action.icon}</span>}
                <span>{action.label}</span>
              </a>
            ) : (
              <Button
                variant={action.variant || 'primary'}
                theme={theme}
                onClick={action.onClick}
                leftIcon={action.icon}
                size="md"
              >
                {action.label}
              </Button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <a
                href={secondaryAction.href}
                className={cn(
                  'inline-flex items-center justify-center font-semibold rounded-xl text-xs sm:text-sm px-4 py-2 gap-2 h-10 transition-all select-none border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isDark
                    ? 'bg-[#212121] hover:bg-[#2B2B2B] text-[#F5F5F5] border-[#2C2C2C] focus-visible:ring-[#F59E0B] focus-visible:ring-offset-[#0C0C0C]'
                    : 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] border-[#E5E7EB] focus-visible:ring-[#047857] focus-visible:ring-offset-[#FFFFFF]'
                )}
              >
                {secondaryAction.icon && <span aria-hidden="true">{secondaryAction.icon}</span>}
                <span>{secondaryAction.label}</span>
              </a>
            ) : (
              <Button
                variant={secondaryAction.variant || 'secondary'}
                theme={theme}
                onClick={secondaryAction.onClick}
                leftIcon={secondaryAction.icon}
                size="md"
              >
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}

      {/* Custom Children Content */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
