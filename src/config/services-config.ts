// src/config/services-config.ts
/**
 * Configuración de servicios
 * 
 * Este archivo permite cambiar fácilmente entre servicios originales
 * y mejorados sin afectar el código de producción.
 */

// Cambiar a 'improved' para usar servicios mejorados
// Cambiar a 'original' para usar servicios originales
export const SERVICES_SYSTEM = 'improved' as 'original' | 'improved';

// Configuración adicional para servicios
export const SERVICES_CONFIG = {
  // Habilitar logs de diagnóstico en desarrollo
  enableDiagnostics: process.env.NODE_ENV === 'development',
  
  // Habilitar comparación de servicios en desarrollo
  enableComparison: process.env.NODE_ENV === 'development',
  
  // Timeout para operaciones de servicios (en ms)
  serviceTimeout: 15000,
  
  // Reintentos para operaciones fallidas
  maxRetries: 3,
  
  // Configuración de caché para servicios
  cacheEnabled: true,
  cacheTimeout: 10 * 60 * 1000, // 10 minutos
  
  // Configuración de paginación por defecto
  defaultPageSize: 10,
  maxPageSize: 100,
  
  // Configuración de JOINs
  enableOptimizedJoins: true,
  enableDataValidation: true,
} as const;

// Función helper para verificar qué sistema está activo
export function isImprovedServicesActive(): boolean {
  return SERVICES_SYSTEM === 'improved';
}

// Función helper para obtener el sistema activo
export function getActiveServicesSystem(): string {
  return SERVICES_SYSTEM;
}

// Función helper para obtener configuración de servicios
export function getServicesConfig() {
  return SERVICES_CONFIG;
}
