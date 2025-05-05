// src/services/reporteUsuariosService.ts
import { supabase } from '@/lib/supabase-client';

// Definir interfaces para los tipos de datos
export interface Role {
  id: number;
  nombre: string;
}

export interface Empresa {
  id: number;
  razon_social: string;
}

// Interfaz para un usuario en el reporte
export interface ReporteUsuarioItem {
  id: string;
  email: string;
  nombre_completo: string;
  rol: string;
  rol_id: number;
  empresa: string;
  empresa_id: number;
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso: string;
}

// Interfaz para los filtros del reporte
export interface ReporteUsuariosFilters {
  search?: string;
  rol_id?: number | null;
  empresa_id?: number | null;
  activo?: boolean | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
}

// Obtener roles activos
export const getRolesActivos = async (): Promise<Role[]> => {
  try {
    console.log('Obteniendo roles activos');
    
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('activo', true)
      .order('nombre');
      
    if (error) {
      console.error('Error al obtener roles activos:', error);
      throw new Error('Error al obtener roles: ' + error.message);
    }
    
    console.log(`Se encontraron ${data?.length || 0} roles activos`);
    return data || [];
  } catch (error) {
    console.error('Error al obtener roles activos:', error);
    throw error;
  }
};

// Obtener empresas activas
export const getEmpresasActivas = async (): Promise<Empresa[]> => {
  try {
    console.log('Obteniendo empresas activas');
    
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('activo', true)
      .order('razon_social');
      
    if (error) {
      console.error('Error al obtener empresas activas:', error);
      throw new Error('Error al obtener empresas: ' + error.message);
    }
    
    console.log(`Se encontraron ${data?.length || 0} empresas activas`);
    return data || [];
  } catch (error) {
    console.error('Error al obtener empresas activas:', error);
    throw error;
  }
};

// Obtener el reporte de usuarios con los filtros aplicados
export const getReporteUsuarios = async (
  filters: ReporteUsuariosFilters
): Promise<ReporteUsuarioItem[]> => {
  try {
    console.log('Generando reporte de usuarios con filtros:', filters);
    
    // Consulta directa de usuarios con todos los datos necesarios
    let query = supabase
      .from('usuarios')
      .select(`
        id,
        email,
        nombre_completo,
        rol_id,
        empresa_id,
        activo,
        created_at,
        last_sign_in_at,
        roles:rol_id (id, nombre),
        empresas:empresa_id (id, razon_social)
      `)
      .order('nombre_completo', { ascending: true });
    
    // Aplicar filtros
    if (filters.search) {
      query = query.or(`nombre_completo.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    if (filters.rol_id) {
      query = query.eq('rol_id', filters.rol_id);
    }
    
    if (filters.empresa_id) {
      query = query.eq('empresa_id', filters.empresa_id);
    }
    
    if (filters.activo !== null && filters.activo !== undefined) {
      query = query.eq('activo', filters.activo);
    }
    
    // Aplicar filtro por fecha de creación si se especifica
    if (filters.fecha_desde) {
      query = query.gte('created_at', filters.fecha_desde);
    }
    
    if (filters.fecha_hasta) {
      // Ajustar la fecha_hasta para incluir todo el día
      const fechaHastaCompleta = new Date(filters.fecha_hasta);
      fechaHastaCompleta.setHours(23, 59, 59, 999);
      query = query.lte('created_at', fechaHastaCompleta.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error('Error al obtener usuarios: ' + error.message);
    }
    
    // Transformar los datos para el reporte
    const transformedData: ReporteUsuarioItem[] = [];
    
    if (data && data.length > 0) {
      console.log(`Procesando ${data.length} registros de usuarios`);
      
      for (const item of data) {
        try {
          // Obtener información del rol
          let rolNombre = 'Sin rol';
          if (item.roles) {
            if (Array.isArray(item.roles)) {
              rolNombre = item.roles.length > 0 && item.roles[0].nombre 
                ? item.roles[0].nombre 
                : 'Sin rol';
            } else {
              rolNombre = (item.roles as Role).nombre || 'Sin rol';
            }
          }
          
          // Obtener información de la empresa
          let empresaNombre = 'Sin empresa';
          if (item.empresas) {
            if (Array.isArray(item.empresas)) {
              empresaNombre = item.empresas.length > 0 && item.empresas[0].razon_social 
                ? item.empresas[0].razon_social 
                : 'Sin empresa';
            } else {
              empresaNombre = (item.empresas as Empresa).razon_social || 'Sin empresa';
            }
          }
          
          // Formatear fechas
          const fechaCreacion = item.created_at 
            ? new Date(item.created_at).toISOString().split('T')[0]
            : '';
            
          const ultimoAcceso = item.last_sign_in_at
            ? new Date(item.last_sign_in_at).toISOString().split('T')[0]
            : '';
          
          // Crear el objeto de reporte
          transformedData.push({
            id: item.id,
            email: item.email,
            nombre_completo: item.nombre_completo || 'Sin nombre',
            rol: rolNombre,
            rol_id: item.rol_id || 0,
            empresa: empresaNombre,
            empresa_id: item.empresa_id || 0,
            activo: item.activo,
            fecha_creacion: fechaCreacion,
            ultimo_acceso: ultimoAcceso
          });
        } catch (err) {
          console.error('Error al procesar usuario:', err, 'Datos:', item);
        }
      }
    }
    
    console.log(`Se encontraron ${transformedData.length} registros después de aplicar filtros`);
    return transformedData;
  } catch (error) {
    console.error('Error al generar reporte de usuarios:', error);
    throw error;
  }
};

// Activar o desactivar un usuario
export const toggleUsuarioActivo = async (
  userId: string,
  activar: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: activar })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Error al ${activar ? 'activar' : 'desactivar'} usuario: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error al ${activar ? 'activar' : 'desactivar'} usuario:`, error);
    throw error;
  }
};
