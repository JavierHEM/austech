// Definición de tipos para el módulo de afilado

export interface TipoAfilado {
  id: number;
  nombre: string;
  descripcion: string;
  creado_en: string;
  modificado_en: string;
}

export interface Afilado {
  id: number;
  sierra_id: number;
  tipo_afilado_id: number;
  fecha_afilado: string;
  fecha_salida: string | null;
  observaciones: string;
  usuario_id: string;
  created_by?: string | null; // Agregado para compatibilidad con el servicio
  creado_en: string;
  modificado_en: string;
}

export interface AfiladoConRelaciones extends Afilado {
  sierra?: any;
  tipo_afilado: TipoAfilado;
  urgente: boolean;
}

export interface AfiladoFilters {
  sierra_id?: number | null;
  tipo_afilado_id?: number | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
}

// Interfaz para la paginación de afilados
export interface PaginatedAfilados {
  data: AfiladoConRelaciones[];
  count: number;
}
