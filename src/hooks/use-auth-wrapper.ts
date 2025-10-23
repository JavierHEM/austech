// src/hooks/use-auth-wrapper.ts
import { useAuth } from './use-auth';
import { useAuthImproved } from './use-auth-improved';
import { AUTH_SYSTEM } from '@/config/auth-config';

/**
 * Hook wrapper que decide qué sistema de autenticación usar
 * basado en la configuración en auth-config.ts
 */
export function useAuthWrapper() {
  const authOriginal = useAuth();
  const authImproved = useAuthImproved();
  
  if (AUTH_SYSTEM === 'improved') {
    return authImproved;
  }

  // Sistema original (por defecto)
  return authOriginal;
}

// Re-exportar tipos para conveniencia
export type { UserRole } from './use-auth';
