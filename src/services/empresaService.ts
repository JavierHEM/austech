import { createClient } from '@/lib/supabase';
import { Empresa } from '@/types/empresa';

const supabase = createClient();

// Interfaz para los filtros de empresa
export interface EmpresaFilters {
  razon_social?: string;
  rut?: string;
  activo?: boolean;
}

// Interfaz para la respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Obtiene una lista paginada de empresas con filtros opcionales
 */
export const getEmpresas = async (
  page: number = 1,
  pageSize: number = 10,
  filters: EmpresaFilters = {}
): Promise<PaginatedResponse<Empresa>> => {
  try {
    console.log('Obteniendo empresas con filtros:', { page, pageSize, filters });
    
    // Iniciar la consulta
    let query = supabase
      .from('empresas')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros si existen
    if (filters.razon_social) {
      query = query.ilike('razon_social', `%${filters.razon_social}%`);
    }
    
    if (filters.rut) {
      query = query.ilike('rut', `%${filters.rut}%`);
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
      console.error('Error al obtener empresas:', error);
      throw new Error(error.message);
    }
    
    // Calcular el total de páginas
    const totalPages = count ? Math.ceil(count / pageSize) : 0;
    
    return {
      data: data as Empresa[],
      count: count || 0,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('Error en getEmpresas:', error);
    throw error;
  }
};

/**
 * Obtiene una empresa por su ID
 */
export const getEmpresaById = async (id: number): Promise<Empresa | null> => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error al obtener empresa por ID:', error);
      throw new Error(error.message);
    }
    
    return data as Empresa;
  } catch (error) {
    console.error('Error en getEmpresaById:', error);
    throw error;
  }
};

/**
 * Crea una nueva empresa
 */
export const createEmpresa = async (empresa: Omit<Empresa, 'id' | 'creado_en' | 'modificado_en'>): Promise<Empresa> => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .insert([{
        ...empresa,
        creado_en: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear empresa:', error);
      throw new Error(error.message);
    }
    
    return data as Empresa;
  } catch (error) {
    console.error('Error en createEmpresa:', error);
    throw error;
  }
};

/**
 * Actualiza una empresa existente
 */
export const updateEmpresa = async (id: number, empresa: Partial<Omit<Empresa, 'id' | 'creado_en' | 'modificado_en'>>): Promise<Empresa> => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .update({
        ...empresa,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar empresa:', error);
      throw new Error(error.message);
    }
    
    return data as Empresa;
  } catch (error) {
    console.error('Error en updateEmpresa:', error);
    throw error;
  }
};

/**
 * Elimina una empresa (borrado lógico)
 */
export const deleteEmpresa = async (id: number): Promise<void> => {
  try {
    // Realizamos un borrado lógico cambiando el estado a inactivo
    const { error } = await supabase
      .from('empresas')
      .update({
        activo: false,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar empresa:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error en deleteEmpresa:', error);
    throw error;
  }
};
