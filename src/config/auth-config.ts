// src/config/auth-config.ts
/**
 * Configuración de autenticación
 * 
 * Este archivo permite cambiar fácilmente entre el sistema de autenticación
 * original y el mejorado sin afectar el código de producción.
 */

// Cambiar a 'improved' para usar el sistema mejorado
// Cambiar a 'original' para usar el sistema original
export const AUTH_SYSTEM = 'improved' as 'original' | 'improved';

// Configuración adicional
export const AUTH_CONFIG = {
  // Habilitar logs de diagnóstico en desarrollo
  enableDiagnostics: process.env.NODE_ENV === 'development',
  
  // Habilitar comparación de sistemas en desarrollo
  enableComparison: process.env.NODE_ENV === 'development',
  
  // Timeout para operaciones de autenticación (en ms)
  authTimeout: 10000,
  
  // Reintentos para operaciones fallidas
  maxRetries: 3,
  
  // Configuración de caché
  cacheEnabled: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
} as const;

// Función helper para verificar qué sistema está activo
export function isImprovedAuthActive(): boolean {
  return AUTH_SYSTEM === 'improved';
}

// Función helper para obtener el sistema activo
export function getActiveAuthSystem(): string {
  return AUTH_SYSTEM;
}
