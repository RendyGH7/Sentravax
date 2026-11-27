import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { useTheme } from '../context/theme-context';

interface AppProvidersProps {
  children: React.ReactNode;
}

const ThemedToaster: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Toaster
      position="top-right"
      richColors
      theme={theme}
      toastOptions={{
        style: isDark
          ? {
              background: '#161616',
              border: '1px solid #2C2C2C',
              color: '#F5F5F5',
            }
          : {
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#111827',
            },
      }}
    />
  );
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  );
};

