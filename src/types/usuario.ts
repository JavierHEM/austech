// Definición de la interfaz para el Rol
export interface Role {
    id: number;
    nombre: string;
  }
  
  // Definición de la interfaz para la Empresa
  export interface Empresa {
    id: number;
    razon_social: string;
  }
  
  // Definición principal para el Usuario
  export interface Usuario {
    id: string;
    email: string;
    nombre_completo: string | null;
    rol_id: number | null;
    empresa_id: number | null;
    activo: boolean;
    creado_en?: string;
    modificado_en?: string;
    roles?: Role | null;
    empresas?: Empresa | null;
  }
  
  // Datos de formulario para crear/editar usuarios
  export interface UsuarioFormValues {
    email: string;
    nombre_completo: string;
    rol_id: number | null;
    empresa_id: number | null;
    activo: boolean;
    password?: string; // opcional, solo para creación
  }
  
  // Opciones de filtrado para el listado de usuarios
  export interface UsuarioFilterOptions {
    search: string;
    rolId: string;
    empresaId: string;
    status: string;
  }