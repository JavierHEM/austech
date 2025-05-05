// src/services/usuarioService.ts
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
export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string | null;
  rol_id: number | null;
  empresa_id: number | null;
  activo: boolean;
  rol_nombre: string;
  empresa_nombre: string;
  created_at?: string | null;
  last_sign_in_at?: string | null;
}

// Interfaz para los filtros del reporte de usuarios
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
): Promise<Usuario[]> => {
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
        roles!rol_id(id, nombre),
        empresas!empresa_id(id, razon_social)
      `)
      .order('nombre_completo', { ascending: true })
      .limit(5000); // Aumentamos el límite significativamente
    
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
    
    const { data: usuariosData, error } = await query;
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error('Error al obtener usuarios: ' + error.message);
    }
    
    // Transformar los datos para el reporte
    const transformedData: Usuario[] = [];
    
    if (usuariosData && usuariosData.length > 0) {
      console.log(`Procesando ${usuariosData.length} registros de usuarios`);
      
      for (const item of usuariosData) {
        try {
          // Acceder a los datos de forma segura
          if (!item) {
            console.log('Item sin datos:', item);
            continue;
          }
          
          // Acceder a rol de forma segura
          let rolNombre = 'Sin rol';
          if (item.roles) {
            // Puede ser un array u objeto
            if (Array.isArray(item.roles) && item.roles.length > 0) {
              // Acceder al primer elemento del array y luego a su propiedad nombre
              const primerRol = item.roles[0] as any;
              rolNombre = primerRol && primerRol.nombre ? primerRol.nombre : 'Sin rol';
            } else if (typeof item.roles === 'object') {
              // Acceder directamente a la propiedad nombre del objeto
              const rol = item.roles as any;
              rolNombre = rol && rol.nombre ? rol.nombre : 'Sin rol';
            }
          }
          
          // Acceder a empresa de forma segura
          let empresaNombre = 'Sin empresa';
          if (item.empresas) {
            // Puede ser un array u objeto
            if (Array.isArray(item.empresas) && item.empresas.length > 0) {
              // Acceder al primer elemento del array y luego a su propiedad razon_social
              const primeraEmpresa = item.empresas[0] as any;
              empresaNombre = primeraEmpresa && primeraEmpresa.razon_social ? primeraEmpresa.razon_social : 'Sin empresa';
            } else if (typeof item.empresas === 'object') {
              // Acceder directamente a la propiedad razon_social del objeto
              const empresa = item.empresas as any;
              empresaNombre = empresa && empresa.razon_social ? empresa.razon_social : 'Sin empresa';
            }
          }
          
          // Crear el objeto usuario
          transformedData.push({
            id: item.id,
            email: item.email,
            nombre_completo: item.nombre_completo || 'Sin nombre',
            rol_id: item.rol_id,
            empresa_id: item.empresa_id,
            activo: item.activo,
            rol_nombre: rolNombre,
            empresa_nombre: empresaNombre,
            created_at: item.created_at,
            last_sign_in_at: item.last_sign_in_at
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
