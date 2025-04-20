import { Empresa } from './empresa';

export interface Sucursal {
  id: number;
  empresa_id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  creado_en: string;
  modificado_en: string;
}

export interface SucursalConEmpresa extends Sucursal {
  empresa?: Empresa;
}

export interface SucursalFormValues {
  empresa_id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
}

export interface SucursalFilters {
  search: string;
  empresa_id: number | null;
  activo: boolean | null;
}