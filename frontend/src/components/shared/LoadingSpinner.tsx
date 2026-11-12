import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  label?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  theme = 'light',
  label,
  fullPage = false,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const spinnerColor =
    theme === 'dark'
      ? 'border-[#F59E0B] border-t-transparent'
      : 'border-[#047857] border-t-transparent';

  const labelColor = theme === 'dark' ? 'text-[#A3A3A3]' : 'text-[#6B7280]';

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} rounded-full ${spinnerColor} animate-spin`}
        role="status"
        aria-label="Memuat data..."
      />
      {label && (
        <span className={`text-xs font-mono ${labelColor} animate-pulse`}>
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    const bgClass = theme === 'dark' ? 'bg-[#0C0C0C]' : 'bg-[#F9FAFB]';
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${bgClass}`}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

