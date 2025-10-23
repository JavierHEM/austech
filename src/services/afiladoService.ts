import { supabase } from '@/lib/supabase-client';
import { Afilado, AfiladoFilters, PaginatedAfilados, AfiladoConRelaciones } from '@/types/afilado';
import { format } from 'date-fns';

/**
 * Obtiene los afilados con sus relaciones con soporte para paginación
 */
export const getAfilados = async (
  filters?: AfiladoFilters, 
  page: number = 1, 
  pageSize: number = 10,
  sortField: string = 'fecha_afilado',
  sortDirection: 'asc' | 'desc' = 'desc',
  empresaId?: number
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
    
    // Si se proporciona un ID de empresa (para clientes), filtrar por empresa
    if (empresaId) {
      // Primero obtenemos los IDs de las sierras de la empresa
      const { data: sierrasData } = await supabase
        .from('sierras')
        .select('id')
        .eq('empresa_id', empresaId);
      
      if (sierrasData && sierrasData.length > 0) {
        const sierraIds = sierrasData.map(sierra => sierra.id);
        countQuery = countQuery.in('sierra_id', sierraIds);
      } else {
        // Si no hay sierras para esta empresa, forzar resultado vacío
        countQuery = countQuery.eq('id', -1); // ID que no existirá
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
    
    // Si se proporciona un ID de empresa (para clientes), filtrar por empresa
    if (empresaId) {
      // Primero obtenemos los IDs de las sierras de la empresa
      const { data: sierrasData } = await supabase
        .from('sierras')
        .select('id')
        .eq('empresa_id', empresaId);
      
      if (sierrasData && sierrasData.length > 0) {
        const sierraIds = sierrasData.map(sierra => sierra.id);
        query = query.in('sierra_id', sierraIds);
      } else {
        // Si no hay sierras para esta empresa, forzar resultado vacío
        query = query.eq('id', -1); // ID que no existirá
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener afilados:', error);
      throw new Error(error.message);
    }
    
    
    // Corregir el problema de zona horaria para las fechas
    const processedData = data?.map(afilado => {
      // Para corregir el problema de zona horaria, usamos la fecha original sin convertir a Date
      // Esto evita que JavaScript reste un día debido a la conversión UTC
      let fechaAfilado = afilado.fecha_afilado;
      let fechaSalida = afilado.fecha_salida;

      // Si tenemos una fecha, asegurarnos de preservar el día correcto
      if (fechaAfilado && typeof fechaAfilado === 'string') {
        // Extraer solo la parte de la fecha (YYYY-MM-DD)
        if (fechaAfilado.includes('T')) {
          fechaAfilado = fechaAfilado.split('T')[0];
        }
      }

      // Lo mismo para fecha_salida
      if (fechaSalida && typeof fechaSalida === 'string') {
        if (fechaSalida.includes('T')) {
          fechaSalida = fechaSalida.split('T')[0];
        }
      }

      return {
        ...afilado,
        fecha_afilado: fechaAfilado,
        fecha_salida: fechaSalida
      };
    }) || [];
    
    return {
      data: processedData,
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
      console.error('Error al obtener afilado por ID:', error);
      throw new Error(error.message);
    }
    
    if (!data) {
      return null;
    }
    
    console.log('Afilado obtenido por ID:', id, 'Fecha afilado:', data?.fecha_afilado);
    
    return {
      ...data,
      // Corregir el problema de zona horaria para las fechas
      fecha_afilado: data.fecha_afilado,
      fecha_salida: data.fecha_salida,
      // Asegurarse de que tipo_afilado sea un objeto con la estructura correcta
      tipo_afilado: data.tipo_afilado || { 
        id: data.tipo_afilado_id, 
        nombre: 'Desconocido',
        descripcion: '',
        creado_en: '',
        modificado_en: ''
      },
      // Agregar la propiedad urgente que requiere AfiladoConRelaciones
      urgente: data.observaciones?.toLowerCase().includes('urgente') || false
    };
  } catch (error) {
    console.error('Error en getAfiladoById:', error);
    throw error;
  }
};

/**
 * Obtiene los afilados de una sierra específica
 */
export const getAfiladosBySierra = async (sierraId: number): Promise<AfiladoConRelaciones[]> => {
  try {
    const { data, error } = await supabase
      .from('afilados')
      .select(`
        *,
        sierra:sierra_id(*),
        tipo_afilado:tipo_afilado_id(*)
      `)
      .eq('sierra_id', sierraId)
      .order('fecha_afilado', { ascending: false });
    
    if (error) {
      console.error('Error al obtener afilados por sierra:', error);
      throw new Error(error.message);
    }
    
    // Log de las fechas recibidas para diagnóstico
    if (data && data.length > 0) {
      console.log('Fechas de afilado recibidas para sierra ID:', sierraId);
      data.forEach((afilado, index) => {
        console.log(`Afilado #${index + 1} - ID: ${afilado.id}, Fecha afilado:`, afilado.fecha_afilado);
      });
    }
    
    // Transformar los datos al tipo AfiladoConRelaciones
    return data?.map(afilado => ({
      ...afilado,
      // Corregir el problema de zona horaria para las fechas
      fecha_afilado: afilado.fecha_afilado,
      fecha_salida: afilado.fecha_salida,
      // Asegurarse de que tipo_afilado sea un objeto con la estructura correcta
      tipo_afilado: afilado.tipo_afilado || { 
        id: afilado.tipo_afilado_id, 
        nombre: 'Desconocido',
        descripcion: '',
        creado_en: '',
        modificado_en: ''
      },
      // Agregar la propiedad urgente que requiere AfiladoConRelaciones
      urgente: afilado.observaciones?.toLowerCase().includes('urgente') || false
    })) || [];
  } catch (error) {
    console.error('Error en getAfiladosBySierra:', error);
    throw error;
  }
};

/**
 * Completa un afilado (cambia el estado de la sierra a "Lista para retiro" y actualiza fecha de salida y observaciones)
 */
export const completarAfilado = async (afiladoId: number, fecha_salida?: string, observaciones?: string): Promise<boolean> => {
  try {
    // Primero obtenemos el afilado para verificar la sierra
    const { data: afilado, error: afiladoError } = await supabase
      .from('afilados')
      .select('sierra_id')
      .eq('id', afiladoId)
      .single();
    
    if (afiladoError) {
      console.error('Error al obtener afilado para completar:', afiladoError);
      throw new Error(afiladoError.message);
    }
    
    if (!afilado) {
      throw new Error(`No se encontró el afilado con ID ${afiladoId}`);
    }
    
    // Actualizar el afilado con la fecha de salida y observaciones si se proporcionan
    if (fecha_salida || observaciones) {
      const updateData: any = {};
      if (fecha_salida) updateData.fecha_salida = fecha_salida;
      if (observaciones) updateData.observaciones = observaciones;
      
      const { error: afiladoUpdateError } = await supabase
        .from('afilados')
        .update(updateData)
        .eq('id', afiladoId);
      
      if (afiladoUpdateError) {
        console.error('Error al actualizar afilado:', afiladoUpdateError);
        throw new Error(afiladoUpdateError.message);
      }
    }
    
    // Actualizar el estado de la sierra a "Lista para retiro" (estado_id = 3)
    const { error: updateError } = await supabase
      .from('sierras')
      .update({ estado_id: 3 })
      .eq('id', afilado.sierra_id);
    
    if (updateError) {
      console.error('Error al actualizar estado de sierra:', updateError);
      throw new Error(updateError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error en completarAfilado:', error);
    throw error;
  }
};

/**
 * Crea un nuevo afilado
 */
export const createAfilado = async (afilado: Partial<Afilado>): Promise<Afilado> => {
  try {
    // Formatear la fecha para evitar problemas con la zona horaria
    const fechaAfilado = afilado.fecha_afilado 
      ? afilado.fecha_afilado
      : format(new Date(), 'yyyy-MM-dd');
    
    // Insertar el nuevo afilado
    const { data, error } = await supabase
      .from('afilados')
      .insert({
        sierra_id: afilado.sierra_id,
        tipo_afilado_id: afilado.tipo_afilado_id,
        fecha_afilado: fechaAfilado,
        observaciones: afilado.observaciones || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear afilado:', error);
      throw new Error(error.message);
    }
    
    // Actualizar el estado de la sierra a "En proceso de afilado" (estado_id = 2)
    const { error: updateError } = await supabase
      .from('sierras')
      .update({ estado_id: 2 })
      .eq('id', afilado.sierra_id);
    
    if (updateError) {
      console.error('Error al actualizar estado de sierra:', updateError);
      throw new Error(updateError.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en createAfilado:', error);
    throw error;
  }
};

/**
 * Actualiza un afilado existente
 */
export const updateAfilado = async (id: number, afilado: Partial<Afilado>): Promise<Afilado> => {
  try {
    // Formatear la fecha para evitar problemas con la zona horaria
    const fechaAfilado = afilado.fecha_afilado 
      ? afilado.fecha_afilado
      : undefined;
    
    // Actualizar el afilado
    const { data, error } = await supabase
      .from('afilados')
      .update({
        sierra_id: afilado.sierra_id,
        tipo_afilado_id: afilado.tipo_afilado_id,
        fecha_afilado: fechaAfilado,
        fecha_salida: afilado.fecha_salida,
        observaciones: afilado.observaciones || null,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar afilado:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error en updateAfilado:', error);
    throw error;
  }
};

/**
 * Elimina un afilado
 */
export const deleteAfilado = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('afilados')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar afilado:', error);
      throw new Error(error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error en deleteAfilado:', error);
    throw error;
  }
};
