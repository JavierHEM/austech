'use client';

import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { useAuth } from '@/hooks/use-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  // IMPORTANTE: Solo proveedores, sin elementos HTML
  return (

      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
   
  );
}