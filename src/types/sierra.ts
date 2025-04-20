import { Sucursal, SucursalConEmpresa } from './sucursal';

// Definimos los tipos aquí para evitar problemas de importación circular
export interface TipoSierra {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  creado_en: string;
  modificado_en: string;
}

export interface EstadoSierra {
  id: number;
  nombre: string;
  descripcion: string;
  creado_en: string;
  modificado_en: string;
}

export interface Sierra {
  id: number;
  codigo_barras: string;
  sucursal_id: number;
  tipo_sierra_id: number;
  estado_id: number; // Corregido para coincidir con la columna real en la base de datos
  fecha_registro: string;
  activo: boolean;
  creado_en: string;
  modificado_en: string;
}

export interface SierraConRelaciones extends Sierra {
  sucursal?: SucursalConEmpresa;
  tipo_sierra?: TipoSierra;
  estado_sierra?: EstadoSierra; // Mantenemos esta propiedad para la relación con estados_sierra
}

export interface SierraFilters {
  codigo_barras?: string;
  sucursal_id?: number | null;
  tipo_sierra_id?: number | null;
  estado_id?: number | null; // Corregido para coincidir con la columna real en la base de datos
  activo?: boolean | null;
}
