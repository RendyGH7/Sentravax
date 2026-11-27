import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../app/context/theme-context';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'menu-item';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'icon',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Aktifkan Tema Terang' : 'Aktifkan Tema Gelap'}
        aria-label={isDark ? 'Aktifkan Tema Terang' : 'Aktifkan Tema Gelap'}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors text-left cursor-pointer ${className}`}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
        </span>
        <span className="text-[10px] font-mono text-neutral-400">
          {isDark ? 'Gelap' : 'Terang'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Aktifkan Tema Terang' : 'Aktifkan Tema Gelap'}
      aria-label={isDark ? 'Aktifkan Tema Terang' : 'Aktifkan Tema Gelap'}
      className={`inline-flex items-center justify-center p-2 rounded-xl border transition-colors cursor-pointer ${
        isDark
          ? 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-white'
          : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-neutral-900 shadow-2xs'
      } ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-rose-700" />}
    </button>
  );
};

export default ThemeToggle;
