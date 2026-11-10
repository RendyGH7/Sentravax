import React from 'react';
import { Toaster } from 'sonner';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster 
        position="top-right" 
        richColors 
        theme="dark"
        toastOptions={{
          style: {
            background: '#0B1320',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#F8FAFC',
          },
        }}
      />
    </>
  );
};

