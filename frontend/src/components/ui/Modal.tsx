import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UITheme } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  theme?: UITheme;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  theme = 'light',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  ariaLabel,
}) => {
  const isDark = theme === 'dark';
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Handle Focus Trap, Escape key & body overflow lock
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const getFocusableElements = (): HTMLElement[] => {
      if (!modalRef.current) return [];
      const elements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(elements).filter(
        (el) => !el.hasAttribute('aria-hidden') && (el.offsetWidth > 0 || el.offsetHeight > 0)
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Keyboard Focus Trap: Tab and Shift+Tab
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          modalRef.current?.focus();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab (backwards)
          if (document.activeElement === firstElement || !modalRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab (forwards)
          if (document.activeElement === lastElement || !modalRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move initial focus to the first focusable element inside the modal, or the panel container
    const timer = setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 20);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === 'function') {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  const containerTheme = isDark
    ? 'bg-[#161616] border-[#2C2C2C] text-[#F5F5F5]'
    : 'bg-white border-[#E5E7EB] text-[#111827]';

  const closeBtnTheme = isDark
    ? 'text-[#8A8A8A] hover:text-white hover:bg-[#212121] focus-visible:ring-[#F59E0B]'
    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] focus-visible:ring-[#047857]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 motion-reduce:animate-none motion-reduce:transition-none"
        aria-hidden="true"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Dialog Panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : (ariaLabel || 'Dialog')}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative w-full rounded-2xl border shadow-xl z-10 overflow-hidden outline-none',
          'animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none motion-reduce:transition-none',
          sizeStyles[size],
          containerTheme,
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 sm:p-6 border-b border-inherit">
            <div className="space-y-1 pr-6">
              {title && (
                <h3 id={titleId} className="text-base sm:text-lg font-bold tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p
                  id={descId}
                  className={cn('text-xs sm:text-sm leading-relaxed', isDark ? 'text-[#D4D4D4]' : 'text-[#4B5563]')}
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className={cn(
                'p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 cursor-pointer',
                closeBtnTheme
              )}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-inherit bg-inherit">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';
