export interface SucursalFormValues {
  empresa_id?: number; // Añadido empresa_id como opcional para compatibilidad con ambos escenarios
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
}

export interface Empresa {
  id: number;
  razon_social: string;
  rut: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  creado_en: string;
  modificado_en: string;
}

export interface EmpresaFilters {
  razon_social?: string;
  rut?: string;
  activo?: boolean | null;
}