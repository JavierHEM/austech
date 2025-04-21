import { supabase } from '@/lib/supabase-client';
import { Afilado, AfiladoConRelaciones, AfiladoFilters } from '@/types/afilado';
import { SierraConRelaciones } from '@/types/sierra';

/**
 * Interfaz para la respuesta paginada de afilados
 */
export interface PaginatedAfilados {
  data: AfiladoConRelaciones[];
  count: number;
}

/**
 * Obtiene los afilados con sus relaciones con soporte para paginación
 */
export const getAfilados = async (
  filters?: AfiladoFilters, 
  page: number = 1, 
  pageSize: number = 10,
  sortField: string = 'fecha_afilado',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<PaginatedAfilados> => {
  try {
    // Primero obtenemos el conteo total para la paginación
    let countQuery = supabase
      .from('afilados')
      .select('id', { count: 'exact' });
    
    // Aplicar filtros al conteo si existen
    if (filters) {
      if (filters.sierra_id) {
        countQuery = countQuery.eq('sierra_id', filters.sierra_id);
      }
      
      if (filters.tipo_afilado_id) {
        countQuery = countQuery.eq('tipo_afilado_id', filters.tipo_afilado_id);
      }
      
      if (filters.fecha_desde) {
        countQuery = countQuery.gte('fecha_afilado', filters.fecha_desde);
      }
      
      if (filters.fecha_hasta) {
        countQuery = countQuery.lte('fecha_afilado', filters.fecha_hasta);
      }
    }
    
    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error al obtener conteo de afilados:', countError);
      throw new Error(countError.message);
    }
    
    // Calcular el rango para la paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Consulta principal con paginación
    let query = supabase
      .from('afilados')
      .select(`
        *,
        sierra:sierra_id(*, sucursales(*), tipos_sierra(*), estados_sierra(*)),
        tipo_afilado:tipo_afilado_id(*)
      `)
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range(from, to);
    
    // Aplicar filtros si existen
    if (filters) {
      if (filters.sierra_id) {
        query = query.eq('sierra_id', filters.sierra_id);
      }
      
      if (filters.tipo_afilado_id) {
        query = query.eq('tipo_afilado_id', filters.tipo_afilado_id);
      }
      
      if (filters.fecha_desde) {
        query = query.gte('fecha_afilado', filters.fecha_desde);
      }
      
      if (filters.fecha_hasta) {
        query = query.lte('fecha_afilado', filters.fecha_hasta);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener afilados:', error);
      throw new Error(error.message);
    }
    
    return {
      data: data || [],
      count: totalCount || 0
    };
  } catch (error) {
    console.error('Error en getAfilados:', error);
    throw error;
  }
};

/**
 * Obtiene un afilado por su ID
 */
export const getAfiladoById = async (id: number): Promise<AfiladoConRelaciones | null> => {
  try {
    const { data, error } = await supabase
      .from('afilados')
      .select(`
        *,
        sierra:sierra_id(*),
        tipo_afilado:tipo_afilado_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró ningún afilado con ese ID
        return null;
      }
      console.error('Error al obtener afilado por ID:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en getAfiladoById:', error);
    throw error;
  }
};

/**
 * Obtiene todos los afilados de una sierra específica
 */
export const getAfiladosBySierra = async (sierraId: number): Promise<AfiladoConRelaciones[]> => {
  try {
    const { data, error } = await supabase
      .from('afilados')
      .select(`
        *,
        sierra:sierra_id(*, sucursal:sucursal_id(*), tipo_sierra:tipo_sierra_id(*), estado_sierra:estado_id(*)),
        tipo_afilado:tipo_afilado_id(*)
      `)
      .eq('sierra_id', sierraId)
      .order('fecha_afilado', { ascending: false });
    
    if (error) {
      console.error('Error al obtener afilados por sierra:', error);
      throw new Error(error.message);
    }
    
    console.log('Afilados obtenidos:', data);
    return data || [];
  } catch (error) {
    console.error('Error en getAfiladosBySierra:', error);
    throw error;
  }
};

/**
 * Crea un nuevo afilado
 */
export const createAfilado = async (afilado: Omit<Afilado, 'id' | 'creado_en' | 'modificado_en'>): Promise<Afilado> => {
  try {
    console.log('Iniciando creación de afilado con datos:', afilado);
    
    // Validar que la sierra exista y esté disponible para afilar
    console.log('Verificando sierra con ID:', afilado.sierra_id);
    const { data: sierra, error: sierraError } = await supabase
      .from('sierras')
      .select('*, estados_sierra(*)')
      .eq('id', afilado.sierra_id)
      .single();
    
    if (sierraError) {
      console.error('Error al verificar sierra:', sierraError);
      throw new Error(`No se pudo verificar la sierra seleccionada: ${sierraError.message}`);
    }
    
    if (!sierra) {
      console.error('Sierra no encontrada con ID:', afilado.sierra_id);
      throw new Error('La sierra seleccionada no existe.');
    }
    
    console.log('Sierra encontrada:', sierra);
    
    // Verificar que la sierra esté en un estado que permita afilado
    const estadoPermiteAfilado = sierra.estado_id === 1; // Estado 1 es "Disponible"
    console.log('Estado de sierra:', sierra.estado_id, 'Permite afilado:', estadoPermiteAfilado);
    
    if (!estadoPermiteAfilado) {
      throw new Error(`La sierra seleccionada no está disponible para afilado. Estado actual: ${sierra.estados_sierra?.nombre || 'Desconocido'}`);
    }
    
    // Validar que el tipo de afilado exista
    console.log('Verificando tipo de afilado con ID:', afilado.tipo_afilado_id);
    const { data: tipoAfilado, error: tipoError } = await supabase
      .from('tipos_afilado')
      .select('*')
      .eq('id', afilado.tipo_afilado_id)
      .single();
    
    if (tipoError && tipoError.code !== 'PGRST116') { // Ignorar error si es "no se encontraron registros"
      console.error('Error al verificar tipo de afilado:', tipoError);
      throw new Error(`No se pudo verificar el tipo de afilado: ${tipoError.message}`);
    }
    
    if (!tipoAfilado) {
      console.error('Tipo de afilado no encontrado con ID:', afilado.tipo_afilado_id);
      throw new Error('El tipo de afilado seleccionado no existe.');
    }
    
    console.log('Tipo de afilado encontrado:', tipoAfilado);
    
    // Crear el afilado
    console.log('Insertando nuevo afilado en la base de datos');
    const afiladoToInsert = {
      ...afilado,
      creado_en: new Date().toISOString(),
      modificado_en: new Date().toISOString()
    };
    console.log('Datos a insertar:', afiladoToInsert);
    
    const { data, error } = await supabase
      .from('afilados')
      .insert([afiladoToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear afilado:', error);
      throw new Error(`Error al crear afilado: ${error.message}`);
    }
    
    if (!data) {
      console.error('No se recibieron datos después de insertar el afilado');
      throw new Error('No se pudo crear el afilado. No se recibieron datos de confirmación.');
    }
    
    console.log('Afilado creado exitosamente:', data);
    
    // Actualizar el estado de la sierra a "En proceso de afilado" (estado con id 2)
    console.log('Actualizando estado de sierra a "En proceso de afilado" (ID 2)');
    const { error: updateError } = await supabase
      .from('sierras')
      .update({ 
        estado_id: 2, // Estado "En proceso de afilado"
        modificado_en: new Date().toISOString()
      })
      .eq('id', afilado.sierra_id);
    
    if (updateError) {
      console.error('Error al actualizar estado de sierra:', updateError);
      throw new Error(`El afilado se registró pero no se pudo actualizar el estado de la sierra: ${updateError.message}`);
    }
    
    console.log('Estado de sierra actualizado correctamente');
    return data as Afilado;
  } catch (error: any) {
    console.error('Error en createAfilado:', error);
    throw error;
  }
};

/**
 * Actualiza un afilado existente
 */
export const updateAfilado = async (id: number, afilado: Partial<Omit<Afilado, 'id' | 'creado_en' | 'modificado_en'>>): Promise<Afilado> => {
  try {
    const { data, error } = await supabase
      .from('afilados')
      .update({
        ...afilado,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar afilado:', error);
      throw new Error(error.message);
    }
    
    return data as Afilado;
  } catch (error) {
    console.error('Error en updateAfilado:', error);
    throw error;
  }
};

/**
 * Completa un afilado (registra fecha de salida)
 */
export const completarAfilado = async (id: number, fecha_salida: string, observaciones?: string): Promise<Afilado> => {
  try {
    // Obtener el afilado actual para conocer la sierra asociada
    const { data: afiladoActual, error: getError } = await supabase
      .from('afilados')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Error al obtener afilado para completar:', getError);
      throw new Error('No se pudo obtener información del afilado.');
    }
    
    // Actualizar el afilado con la fecha de salida
    const { data, error } = await supabase
      .from('afilados')
      .update({
        fecha_salida,
        observaciones: observaciones || afiladoActual.observaciones,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al completar afilado:', error);
      throw new Error(error.message);
    }
    
    // Actualizar el estado de la sierra a "Disponible" (estado 1)
    const { error: updateError } = await supabase
      .from('sierras')
      .update({ 
        estado_id: 1, // Estado "Disponible"
        modificado_en: new Date().toISOString()
      })
      .eq('id', afiladoActual.sierra_id);
    
    if (updateError) {
      console.error('Error al actualizar estado de sierra:', updateError);
      throw new Error('El afilado se completó pero no se pudo actualizar el estado de la sierra.');
    }
    
    return data as Afilado;
  } catch (error) {
    console.error('Error en completarAfilado:', error);
    throw error;
  }
};

/**
 * Elimina un afilado
 */
export const deleteAfilado = async (id: number): Promise<void> => {
  try {
    // Obtener el afilado para conocer la sierra asociada
    const { data: afilado, error: getError } = await supabase
      .from('afilados')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Error al obtener afilado para eliminar:', getError);
      throw new Error('No se pudo obtener información del afilado.');
    }
    
    // Eliminar el afilado
    const { error } = await supabase
      .from('afilados')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar afilado:', error);
      throw new Error(error.message);
    }
    
    // Si el afilado no tiene fecha de salida, la sierra estaba en proceso de afilado
    // Por lo tanto, actualizamos el estado de la sierra a "Disponible"
    if (!afilado.fecha_salida) {
      const { error: updateError } = await supabase
        .from('sierras')
        .update({ 
          estado_id: 1, // Estado "Disponible"
          modificado_en: new Date().toISOString()
        })
        .eq('id', afilado.sierra_id);
      
      if (updateError) {
        console.error('Error al actualizar estado de sierra:', updateError);
        throw new Error('El afilado se eliminó pero no se pudo actualizar el estado de la sierra.');
      }
    }
  } catch (error) {
    console.error('Error en deleteAfilado:', error);
    throw error;
  }
};

// Exportar tipos para usar en componentes
export type { Afilado, AfiladoConRelaciones, AfiladoFilters };
