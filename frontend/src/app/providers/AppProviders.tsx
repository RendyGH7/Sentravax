import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
      <Toaster 
        position="top-right" 
        richColors 
        theme="dark"
        toastOptions={{
          style: {
            background: '#161616',
            border: '1px solid #2C2C2C',
            color: '#F5F5F5',
          },
        }}
      />
    </AuthProvider>
  );
};

