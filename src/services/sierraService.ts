import { createClient } from '@/lib/supabase';
import { Sierra, SierraConRelaciones, SierraFilters } from '@/types/sierra';

const supabase = createClient();

// Interfaz para la respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Obtiene una lista paginada de sierras con filtros opcionales
 */
export const getSierras = async (
  page: number = 1,
  pageSize: number = 10,
  filters: SierraFilters = {}
): Promise<PaginatedResponse<SierraConRelaciones>> => {
  try {
    console.log('Obteniendo sierras con filtros:', { page, pageSize, filters });
    
    // Iniciar la consulta
    let query = supabase
      .from('sierras')
      .select('*, sucursales(*), tipos_sierra(*), estados_sierra(*)', { count: 'exact' });
    
    // Aplicar filtros si existen
    if (filters.codigo_barras) {
      query = query.ilike('codigo_barras', `%${filters.codigo_barras}%`);
    }
    
    if (filters.sucursal_id !== undefined && filters.sucursal_id !== null) {
      query = query.eq('sucursal_id', filters.sucursal_id);
    }
    
    if (filters.tipo_sierra_id !== undefined && filters.tipo_sierra_id !== null) {
      query = query.eq('tipo_sierra_id', filters.tipo_sierra_id);
    }
    
    if (filters.estado_id !== undefined && filters.estado_id !== null) {
      query = query.eq('estado_id', filters.estado_id);
    }
    
    if (filters.activo !== undefined) {
      query = query.eq('activo', filters.activo);
    }
    
    // Calcular el rango para la paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Ejecutar la consulta con paginación
    const { data, error, count } = await query
      .range(from, to)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error al obtener sierras:', error);
      throw new Error(error.message);
    }
    
    // Transformar los datos para que coincidan con SierraConRelaciones
    const sierrasConRelaciones: SierraConRelaciones[] = data.map(item => {
      const { sucursales, tipos_sierra, estados_sierra, ...sierra } = item;
      return {
        ...sierra,
        sucursal: sucursales,
        tipo_sierra: tipos_sierra,
        estado_sierra: estados_sierra
      } as SierraConRelaciones;
    });
    
    // Calcular el total de páginas
    const totalPages = count ? Math.ceil(count / pageSize) : 0;
    
    return {
      data: sierrasConRelaciones,
      count: count || 0,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('Error en getSierras:', error);
    throw error;
  }
};

/**
 * Obtiene una sierra por su ID
 */
export const getSierraById = async (id: number): Promise<SierraConRelaciones | null> => {
  try {
    const { data, error } = await supabase
      .from('sierras')
      .select('*, sucursales(*), tipos_sierra(*), estados_sierra(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error al obtener sierra por ID:', error);
      throw new Error(error.message);
    }
    
    if (!data) return null;
    
    // Transformar los datos para que coincidan con SierraConRelaciones
    const { sucursales, tipos_sierra, estados_sierra, ...sierra } = data;
    return {
      ...sierra,
      sucursal: sucursales,
      tipo_sierra: tipos_sierra,
      estado_sierra: estados_sierra
    } as SierraConRelaciones;
  } catch (error) {
    console.error('Error en getSierraById:', error);
    throw error;
  }
};

/**
 * Obtiene una sierra por su código de barras
 */
export const getSierraByCodigo = async (codigoBarras: string): Promise<SierraConRelaciones | null> => {
  try {
    const { data, error } = await supabase
      .from('sierras')
      .select('*, sucursales(*), tipos_sierra(*), estados_sierra(*)')
      .eq('codigo_barras', codigoBarras)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró ninguna sierra con ese código
        return null;
      }
      console.error('Error al obtener sierra por código de barras:', error);
      throw new Error(error.message);
    }
    
    if (!data) return null;
    
    // Transformar los datos para que coincidan con SierraConRelaciones
    const { sucursales, tipos_sierra, estados_sierra, ...sierra } = data;
    return {
      ...sierra,
      sucursal: sucursales,
      tipo_sierra: tipos_sierra,
      estado_sierra: estados_sierra
    } as SierraConRelaciones;
  } catch (error) {
    console.error('Error en getSierraByCodigo:', error);
    throw error;
  }
};

/**
 * Crea una nueva sierra
 */
export const createSierra = async (sierra: Omit<Sierra, 'id' | 'creado_en' | 'modificado_en'>): Promise<Sierra> => {
  try {
    const { data, error } = await supabase
      .from('sierras')
      .insert([{
        ...sierra,
        creado_en: new Date().toISOString(),
        modificado_en: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear sierra:', error);
      throw new Error(error.message);
    }
    
    return data as Sierra;
  } catch (error) {
    console.error('Error en createSierra:', error);
    throw error;
  }
};

/**
 * Actualiza una sierra existente
 */
export const updateSierra = async (id: number, sierra: Partial<Omit<Sierra, 'id' | 'creado_en' | 'modificado_en'>>): Promise<Sierra> => {
  try {
    const { data, error } = await supabase
      .from('sierras')
      .update({
        ...sierra,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar sierra:', error);
      throw new Error(error.message);
    }
    
    return data as Sierra;
  } catch (error) {
    console.error('Error en updateSierra:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una sierra
 */
export const updateEstadoSierra = async (id: number, estadoSierraId: number): Promise<Sierra> => {
  try {
    const { data, error } = await supabase
      .from('sierras')
      .update({
        estado_id: estadoSierraId,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar estado de sierra:', error);
      throw new Error(error.message);
    }
    
    return data as Sierra;
  } catch (error) {
    console.error('Error en updateEstadoSierra:', error);
    throw error;
  }
};

/**
 * Elimina una sierra (borrado lógico)
 */
export const deleteSierra = async (id: number): Promise<void> => {
  try {
    // Realizamos un borrado lógico cambiando el estado a inactivo
    const { error } = await supabase
      .from('sierras')
      .update({
        activo: false,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar sierra:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error en deleteSierra:', error);
    throw error;
  }
};

/**
 * Obtiene todos los tipos de sierra
 */
export const getTiposSierra = async (soloActivos: boolean = true): Promise<any[]> => {
  try {
    let query = supabase
      .from('tipos_sierra')
      .select('*');
    
    if (soloActivos) {
      query = query.eq('activo', true);
    }
    
    const { data, error } = await query.order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error al obtener tipos de sierra:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en getTiposSierra:', error);
    throw error;
  }
};

/**
 * Obtiene todos los estados de sierra
 */
export const getEstadosSierra = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('estados_sierra')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error al obtener estados de sierra:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en getEstadosSierra:', error);
    throw error;
  }
};

// Exportar tipos para usar en componentes
export type { Sierra, SierraConRelaciones, SierraFilters };
