// src/components/auth/AuthProviderWrapper.tsx
'use client';

import { AuthProvider } from './AuthProvider';
import { AuthProviderImproved } from './AuthProviderImproved';
import { AUTH_SYSTEM } from '@/config/auth-config';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper que decide qué sistema de autenticación usar
 * basado en la configuración en auth-config.ts
 */
export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  // En desarrollo, mostrar información sobre el sistema activo
  if (process.env.NODE_ENV === 'development') {
  }

  // Usar el sistema configurado
  if (AUTH_SYSTEM === 'improved') {
    return (
      <AuthProviderImproved>
        {children}
      </AuthProviderImproved>
    );
  }

  // Sistema original (por defecto)
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
