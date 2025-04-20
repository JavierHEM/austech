import { createClient } from '@/lib/supabase';
import { TipoAfilado } from '@/types/afilado';

const supabase = createClient();

/**
 * Obtiene todos los tipos de afilado
 */
export const getTiposAfilado = async (soloActivos: boolean = true): Promise<TipoAfilado[]> => {
  try {
    let query = supabase
      .from('tipos_afilado')
      .select('*')
      .order('nombre', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener tipos de afilado:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getTiposAfilado:', error);
    throw error;
  }
};

/**
 * Obtiene un tipo de afilado por su ID
 */
export const getTipoAfiladoById = async (id: number): Promise<TipoAfilado | null> => {
  try {
    const { data, error } = await supabase
      .from('tipos_afilado')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró ningún tipo de afilado con ese ID
        return null;
      }
      console.error('Error al obtener tipo de afilado por ID:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en getTipoAfiladoById:', error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de afilado
 */
export const createTipoAfilado = async (tipoAfilado: Omit<TipoAfilado, 'id' | 'creado_en' | 'modificado_en'>): Promise<TipoAfilado> => {
  try {
    const { data, error } = await supabase
      .from('tipos_afilado')
      .insert([{
        ...tipoAfilado,
        creado_en: new Date().toISOString(),
        modificado_en: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear tipo de afilado:', error);
      throw new Error(error.message);
    }
    
    return data as TipoAfilado;
  } catch (error) {
    console.error('Error en createTipoAfilado:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo de afilado existente
 */
export const updateTipoAfilado = async (id: number, tipoAfilado: Partial<Omit<TipoAfilado, 'id' | 'creado_en' | 'modificado_en'>>): Promise<TipoAfilado> => {
  try {
    const { data, error } = await supabase
      .from('tipos_afilado')
      .update({
        ...tipoAfilado,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar tipo de afilado:', error);
      throw new Error(error.message);
    }
    
    return data as TipoAfilado;
  } catch (error) {
    console.error('Error en updateTipoAfilado:', error);
    throw error;
  }
};

/**
 * Elimina un tipo de afilado (borrado lógico)
 */
export const deleteTipoAfilado = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tipos_afilado')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar tipo de afilado:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error en deleteTipoAfilado:', error);
    throw error;
  }
};

// Exportar tipos para usar en componentes
export type { TipoAfilado };
