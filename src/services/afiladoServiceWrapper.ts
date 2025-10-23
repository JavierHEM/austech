// src/services/afiladoServiceWrapper.ts
import { getAfilados } from './afiladoService';
import { getAfiladosImproved } from './afiladoServiceImproved';
import { SERVICES_SYSTEM } from '@/config/services-config';
import { AfiladoFilters, PaginatedAfilados } from '@/types/afilado';

/**
 * Wrapper que decide qué servicio de afilados usar
 * basado en la configuración en services-config.ts
 */
export function getAfiladosWrapper(
  filters?: AfiladoFilters,
  page: number = 1,
  pageSize: number = 10,
  sortField: string = 'fecha_afilado',
  sortDirection: 'asc' | 'desc' = 'desc',
  empresaId?: number
): Promise<PaginatedAfilados> {
  
  // En desarrollo, mostrar información sobre el servicio activo
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Servicio de afilados activo: ${SERVICES_SYSTEM}`);
  }

  // Usar el servicio configurado
  if (SERVICES_SYSTEM === 'improved') {
    return getAfiladosImproved(filters, page, pageSize, sortField, sortDirection, empresaId);
  }

  // Servicio original (por defecto)
  return getAfilados(filters, page, pageSize, sortField, sortDirection, empresaId);
}

// Re-exportar tipos para conveniencia
export type { AfiladoFilters, PaginatedAfilados } from '@/types/afilado';
