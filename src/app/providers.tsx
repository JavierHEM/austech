'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProviderWrapper } from '@/components/auth/AuthProviderWrapper';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProviderWrapper>
        {children}
      </AuthProviderWrapper>
    </ThemeProvider>
  );
}