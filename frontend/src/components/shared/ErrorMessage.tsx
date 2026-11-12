import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  onRetry,
  theme = 'light',
  className = '',
}) => {
  const isDark = theme === 'dark';

  const containerStyle = isDark
    ? 'bg-[#1C1113] border-[#7F1D1D]/60 text-[#FCA5A5]'
    : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]';

  const titleStyle = isDark ? 'text-white' : 'text-[#991B1B]';
  const descStyle = isDark ? 'text-[#D4D4D4]' : 'text-[#7F1D1D]';

  const buttonStyle = isDark
    ? 'bg-[#2A1618] border-[#7F1D1D] text-[#FCA5A5] hover:bg-[#3D1E22]'
    : 'bg-white border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2]';

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm ${containerStyle} ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          {title && <h4 className={`font-bold mb-0.5 ${titleStyle}`}>{title}</h4>}
          <p className={`leading-relaxed ${descStyle}`}>{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${buttonStyle}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

