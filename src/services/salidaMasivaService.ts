import { createClient } from '@/lib/supabase';
import { SalidaMasiva, SalidaMasivaConRelaciones, SalidaMasivaInput } from '@/types/salidaMasiva';

const supabase = createClient();

/**
 * Obtiene todas las salidas masivas con sus relaciones
 */
export const getSalidasMasivas = async (): Promise<SalidaMasivaConRelaciones[]> => {
  try {
    const { data, error } = await supabase
      .from('salidas_masivas')
      .select(`
        *,
        sucursal:sucursal_id(*)
      `)
      .order('fecha_salida', { ascending: false });
    
    if (error) {
      console.error('Error al obtener salidas masivas:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getSalidasMasivas:', error);
    throw error;
  }
};

/**
 * Obtiene una salida masiva por su ID con todos sus afilados relacionados
 */
export const getSalidaMasivaById = async (id: number): Promise<SalidaMasivaConRelaciones | null> => {
  try {
    // Primero obtenemos la salida masiva
    const { data: salidaMasiva, error: salidaError } = await supabase
      .from('salidas_masivas')
      .select(`
        *,
        sucursal:sucursal_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (salidaError) {
      if (salidaError.code === 'PGRST116') {
        return null;
      }
      console.error('Error al obtener salida masiva por ID:', salidaError);
      throw new Error(salidaError.message);
    }
    
    // Luego obtenemos los detalles (afilados relacionados)
    const { data: detalles, error: detallesError } = await supabase
      .from('salida_masiva_afilados')
      .select(`
        *,
        afilado:afilado_id(*, sierra:sierra_id(*, tipo_sierra:tipo_sierra_id(*), estado_sierra:estado_id(*), sucursal:sucursal_id(*)), tipo_afilado:tipo_afilado_id(*))
      `)
      .eq('salida_masiva_id', id);
    
    if (detallesError) {
      console.error('Error al obtener detalles de salida masiva:', detallesError);
      throw new Error(detallesError.message);
    }
    
    // Extraemos los afilados de los detalles
    const afilados = detalles?.map(detalle => detalle.afilado) || [];
    
    return {
      ...salidaMasiva,
      afilados
    };
  } catch (error) {
    console.error('Error en getSalidaMasivaById:', error);
    throw error;
  }
};

/**
 * Crea una nueva salida masiva y actualiza los afilados relacionados
 */
export const createSalidaMasiva = async (salidaMasiva: SalidaMasivaInput, usuarioId: string): Promise<SalidaMasiva> => {
  try {
    // Iniciar una transacción para asegurar consistencia
    const { data: salidaData, error: salidaError } = await supabase
      .from('salidas_masivas')
      .insert([{
        usuario_id: usuarioId,
        sucursal_id: salidaMasiva.sucursal_id,
        fecha_salida: salidaMasiva.fecha_salida,
        observaciones: salidaMasiva.observaciones || null,
        creado_en: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (salidaError) {
      console.error('Error al crear salida masiva:', salidaError);
      throw new Error(salidaError.message);
    }
    
    const salidaMasivaId = salidaData.id;
    
    // Verificar que todos los afilados existan y no tengan fecha de salida
    for (const afiladoId of salidaMasiva.afilados_ids) {
      const { data: afilado, error: afiladoError } = await supabase
        .from('afilados')
        .select('*, sierra:sierra_id(*)')
        .eq('id', afiladoId)
        .single();
      
      if (afiladoError) {
        console.error(`Error al verificar afilado ${afiladoId}:`, afiladoError);
        throw new Error(`No se pudo verificar el afilado #${afiladoId}: ${afiladoError.message}`);
      }
      
      if (afilado.fecha_salida) {
        throw new Error(`El afilado #${afiladoId} ya tiene registrada una fecha de salida.`);
      }
      
      // Verificar que la sierra esté en estado "Lista para retiro" (estado 3) o "En proceso de afilado" (estado 2)
      if (afilado.sierra.estado_id !== 3 && afilado.sierra.estado_id !== 2) {
        throw new Error(`La sierra del afilado #${afiladoId} debe estar en estado "Lista para retiro" o "En proceso de afilado".`);
      }
    }
    
    // Crear los registros de relación en salida_masiva_afilados
    const detallesInsert = salidaMasiva.afilados_ids.map(afiladoId => ({
      salida_masiva_id: salidaMasivaId,
      afilado_id: afiladoId
    }));
    
    const { error: detallesError } = await supabase
      .from('salida_masiva_afilados')
      .insert(detallesInsert);
    
    if (detallesError) {
      console.error('Error al crear detalles de salida masiva:', detallesError);
      throw new Error(detallesError.message);
    }
    
    // Actualizar la fecha de salida en los afilados
    for (const afiladoId of salidaMasiva.afilados_ids) {
      const { error: updateError } = await supabase
        .from('afilados')
        .update({
          fecha_salida: salidaMasiva.fecha_salida,
          modificado_en: new Date().toISOString()
        })
        .eq('id', afiladoId);
      
      if (updateError) {
        console.error(`Error al actualizar fecha de salida del afilado ${afiladoId}:`, updateError);
        throw new Error(`No se pudo actualizar la fecha de salida del afilado #${afiladoId}: ${updateError.message}`);
      }
      
      // Obtener la sierra asociada al afilado
      const { data: afilado } = await supabase
        .from('afilados')
        .select('sierra_id')
        .eq('id', afiladoId)
        .single();
      
      // Verificar que se haya encontrado el afilado y tenga sierra_id
      if (!afilado || !afilado.sierra_id) {
        console.warn(`No se encontró información de sierra para el afilado ${afiladoId}`);
        continue; // Continuar con el siguiente afilado
      }
      
      // Actualizar el estado de la sierra a "Disponible" (estado 1)
      const { error: sierraError } = await supabase
        .from('sierras')
        .update({
          estado_id: 1, // Estado "Disponible"
          modificado_en: new Date().toISOString()
        })
        .eq('id', afilado.sierra_id);
      
      if (sierraError) {
        console.error(`Error al actualizar estado de la sierra del afilado ${afiladoId}:`, sierraError);
        throw new Error(`No se pudo actualizar el estado de la sierra del afilado #${afiladoId}: ${sierraError.message}`);
      }
    }
    
    return salidaData;
  } catch (error) {
    console.error('Error en createSalidaMasiva:', error);
    throw error;
  }
};

/**
 * Elimina una salida masiva y revierte los cambios en afilados
 */
export const deleteSalidaMasiva = async (id: number): Promise<void> => {
  try {
    // Obtener los afilados relacionados antes de eliminar
    const { data: detalles, error: detallesError } = await supabase
      .from('salida_masiva_afilados')
      .select('afilado_id')
      .eq('salida_masiva_id', id);
    
    if (detallesError) {
      console.error('Error al obtener detalles de salida masiva:', detallesError);
      throw new Error(detallesError.message);
    }
    
    const afiladosIds = detalles.map(detalle => detalle.afilado_id);
    
    // Eliminar los registros de relación
    const { error: deleteDetallesError } = await supabase
      .from('salida_masiva_afilados')
      .delete()
      .eq('salida_masiva_id', id);
    
    if (deleteDetallesError) {
      console.error('Error al eliminar detalles de salida masiva:', deleteDetallesError);
      throw new Error(deleteDetallesError.message);
    }
    
    // Eliminar la salida masiva
    const { error: deleteSalidaError } = await supabase
      .from('salidas_masivas')
      .delete()
      .eq('id', id);
    
    if (deleteSalidaError) {
      console.error('Error al eliminar salida masiva:', deleteSalidaError);
      throw new Error(deleteSalidaError.message);
    }
    
    // Revertir los cambios en los afilados (quitar fecha de salida)
    for (const afiladoId of afiladosIds) {
      const { error: updateError } = await supabase
        .from('afilados')
        .update({
          fecha_salida: null,
          modificado_en: new Date().toISOString()
        })
        .eq('id', afiladoId);
      
      if (updateError) {
        console.error(`Error al revertir fecha de salida del afilado ${afiladoId}:`, updateError);
        throw new Error(`No se pudo revertir la fecha de salida del afilado #${afiladoId}: ${updateError.message}`);
      }
      
      // Obtener la sierra asociada al afilado
      const { data: afilado } = await supabase
        .from('afilados')
        .select('sierra_id')
        .eq('id', afiladoId)
        .single();
      
      // Verificar que se haya encontrado el afilado y tenga sierra_id
      if (!afilado || !afilado.sierra_id) {
        console.warn(`No se encontró información de sierra para el afilado ${afiladoId}`);
        continue; // Continuar con el siguiente afilado
      }
      
      // Actualizar el estado de la sierra a "Lista para retiro" (estado 3)
      const { error: sierraError } = await supabase
        .from('sierras')
        .update({
          estado_id: 3, // Estado "Lista para retiro"
          modificado_en: new Date().toISOString()
        })
        .eq('id', afilado.sierra_id);
      
      if (sierraError) {
        console.error(`Error al revertir estado de la sierra del afilado ${afiladoId}:`, sierraError);
        throw new Error(`No se pudo revertir el estado de la sierra del afilado #${afiladoId}: ${sierraError.message}`);
      }
    }
  } catch (error) {
    console.error('Error en deleteSalidaMasiva:', error);
    throw error;
  }
};

// Exportar tipos para usar en componentes
export type { SalidaMasiva, SalidaMasivaConRelaciones, SalidaMasivaInput };
