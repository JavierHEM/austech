export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string;
          nombre_completo: string | null;
          rol_id: number | null;
          empresa_id: number | null;
          activo: boolean;
          creado_en: string;
          modificado_en: string | null;
        };
        Insert: {
          id: string;
          email: string;
          nombre_completo?: string | null;
          rol_id?: number | null;
          empresa_id?: number | null;
          activo?: boolean;
          creado_en?: string;
          modificado_en?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          nombre_completo?: string | null;
          rol_id?: number | null;
          empresa_id?: number | null;
          activo?: boolean;
          creado_en?: string;
          modificado_en?: string | null;
        };
      };
      roles: {
        Row: {
          id: number;
          nombre: string;
          descripcion: string | null;
          creado_en: string;
          modificado_en: string | null;
        };
        Insert: {
          id?: number;
          nombre: string;
          descripcion?: string | null;
          creado_en?: string;
          modificado_en?: string | null;
        };
        Update: {
          id?: number;
          nombre?: string;
          descripcion?: string | null;
          creado_en?: string;
          modificado_en?: string | null;
        };
      };
      empresas: {
        Row: {
          id: number;
          razon_social: string;
          rut: string;
          direccion: string | null;
          telefono: string | null;
          email: string | null;
          activo: boolean;
          creado_en: string;
          modificado_en: string | null;
        };
        Insert: {
          id?: number;
          razon_social: string;
          rut: string;
          direccion?: string | null;
          telefono?: string | null;
          email?: string | null;
          activo?: boolean;
          creado_en?: string;
          modificado_en?: string | null;
        };
        Update: {
          id?: number;
          razon_social?: string;
          rut?: string;
          direccion?: string | null;
          telefono?: string | null;
          email?: string | null;
          activo?: boolean;
          creado_en?: string;
          modificado_en?: string | null;
        };
      };
      // Definir otras tablas según sea necesario
    };
    Views: {
      // Vistas si existen
    };
    Functions: {
      // Funciones si existen
    };
    Enums: {
      // Enums si existen
    };
  };
}