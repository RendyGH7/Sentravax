import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UITheme } from './Button';

// ==========================================
// 1. LABEL COMPONENT
// ==========================================
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  theme?: UITheme;
}

export const Label: React.FC<LabelProps> = ({
  children,
  className,
  required = false,
  theme = 'light',
  ...props
}) => {
  const isDark = theme === 'dark';
  return (
    <label
      className={cn(
        'block text-xs font-bold tracking-tight mb-1.5 select-none',
        isDark ? 'text-[#D4D4D4]' : 'text-[#111827]',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <>
          <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>
          <span className="sr-only"> (wajib diisi)</span>
        </>
      )}
    </label>
  );
};

// ==========================================
// 2. FORM ERROR MESSAGE COMPONENT
// ==========================================
export interface FormErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: string | null;
  theme?: UITheme;
}

export const FormErrorMessage: React.FC<FormErrorMessageProps> = ({
  error,
  className,
  theme = 'light',
  ...props
}) => {
  if (!error) return null;
  const isDark = theme === 'dark';

  return (
    <p
      role="alert"
      className={cn(
        'flex items-center gap-1.5 text-[11px] font-medium mt-1.5',
        isDark ? 'text-red-400' : 'text-[#DC2626]',
        className
      )}
      {...props}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{error}</span>
    </p>
  );
};

// ==========================================
// 3. INPUT COMPONENT
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  theme?: UITheme;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      theme = 'light',
      leftIcon,
      rightIcon,
      required,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedByIds = [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;
    const isDark = theme === 'dark';

    const baseStyles =
      'w-full rounded-xl text-xs sm:text-sm px-3.5 py-2.5 transition-all outline-none border font-normal disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-400';

    const colorStyles = isDark
      ? 'bg-[#1C1C1C] text-[#F5F5F5] border-[#2C2C2C] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
      : 'bg-white text-[#111827] border-[#D1D5DB] focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20';

    const errorStyles = error
      ? isDark
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
        : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : '';

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required} theme={theme}>
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-required={required ? true : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={describedByIds}
            className={cn(
              baseStyles,
              colorStyles,
              errorStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <FormErrorMessage id={errorId} error={error} theme={theme} />}
        {!error && helperText && (
          <p
            id={helperId}
            className={cn('text-[11px] mt-1', isDark ? 'text-[#8A8A8A]' : 'text-[#6B7280]')}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ==========================================
// 4. SELECT COMPONENT
// ==========================================
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  theme?: UITheme;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      theme = 'light',
      options,
      placeholder,
      required,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;
    const describedByIds = [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;
    const isDark = theme === 'dark';

    const baseStyles =
      'w-full rounded-xl text-xs sm:text-sm px-3.5 py-2.5 transition-all outline-none border font-normal disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer pr-10';

    const colorStyles = isDark
      ? 'bg-[#1C1C1C] text-[#F5F5F5] border-[#2C2C2C] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
      : 'bg-white text-[#111827] border-[#D1D5DB] focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20';

    const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={selectId} required={required} theme={theme}>
            {label}
          </Label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-required={required ? true : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={describedByIds}
            className={cn(baseStyles, colorStyles, errorStyles, className)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <FormErrorMessage id={errorId} error={error} theme={theme} />}
        {!error && helperText && (
          <p
            id={helperId}
            className={cn('text-[11px] mt-1', isDark ? 'text-[#8A8A8A]' : 'text-[#6B7280]')}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ==========================================
// 5. TEXTAREA COMPONENT
// ==========================================
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  theme?: UITheme;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      theme = 'light',
      required,
      className,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const describedByIds = [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;
    const isDark = theme === 'dark';

    const baseStyles =
      'w-full rounded-xl text-xs sm:text-sm px-3.5 py-2.5 transition-all outline-none border font-normal disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-400 resize-y';

    const colorStyles = isDark
      ? 'bg-[#1C1C1C] text-[#F5F5F5] border-[#2C2C2C] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
      : 'bg-white text-[#111827] border-[#D1D5DB] focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20';

    const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={textareaId} required={required} theme={theme}>
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          aria-required={required ? true : undefined}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={describedByIds}
          className={cn(baseStyles, colorStyles, errorStyles, className)}
          {...props}
        />
        {error && <FormErrorMessage id={errorId} error={error} theme={theme} />}
        {!error && helperText && (
          <p
            id={helperId}
            className={cn('text-[11px] mt-1', isDark ? 'text-[#8A8A8A]' : 'text-[#6B7280]')}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ==========================================
// 6. CHECKBOX COMPONENT
// ==========================================
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
  theme?: UITheme;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, theme = 'light', className, disabled, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const descId = `${checkboxId}-desc`;
    const isDark = theme === 'dark';

    return (
      <div className="flex items-start gap-3 select-none">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            aria-describedby={description ? descId : undefined}
            className={cn(
              'w-4 h-4 rounded-md transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
              isDark
                ? 'bg-[#1C1C1C] border-[#343434] text-[#F59E0B] focus:ring-[#F59E0B]/30'
                : 'bg-white border-[#D1D5DB] text-[#047857] focus:ring-[#047857]/30',
              className
            )}
            {...props}
          />
        </div>
        <div className="text-xs">
          <label
            htmlFor={checkboxId}
            className={cn('font-semibold cursor-pointer', isDark ? 'text-[#F5F5F5]' : 'text-[#111827]')}
          >
            {label}
          </label>
          {description && (
            <p id={descId} className={cn('text-[11px] mt-0.5 leading-normal', isDark ? 'text-[#8A8A8A]' : 'text-[#4B5563]')}>
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// ==========================================
// 7. RADIO COMPONENT
// ==========================================
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
  theme?: UITheme;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ id, label, description, theme = 'light', className, disabled, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;
    const descId = `${radioId}-desc`;
    const isDark = theme === 'dark';

    return (
      <div className="flex items-start gap-3 select-none">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            disabled={disabled}
            aria-describedby={description ? descId : undefined}
            className={cn(
              'w-4 h-4 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
              isDark
                ? 'bg-[#1C1C1C] border-[#343434] text-[#F59E0B] focus:ring-[#F59E0B]/30'
                : 'bg-white border-[#D1D5DB] text-[#047857] focus:ring-[#047857]/30',
              className
            )}
            {...props}
          />
        </div>
        <div className="text-xs">
          <label
            htmlFor={radioId}
            className={cn('font-semibold cursor-pointer', isDark ? 'text-[#F5F5F5]' : 'text-[#111827]')}
          >
            {label}
          </label>
          {description && (
            <p id={descId} className={cn('text-[11px] mt-0.5 leading-normal', isDark ? 'text-[#8A8A8A]' : 'text-[#4B5563]')}>
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Radio.displayName = 'Radio';

