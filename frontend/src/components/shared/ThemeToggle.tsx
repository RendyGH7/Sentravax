import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../app/context/theme-context';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

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
