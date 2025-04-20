import { createClient } from '@/lib/supabase';
import { BajaMasiva, BajaMasivaConRelaciones, BajaMasivaInput } from '@/types/bajaMasiva';
import { Sierra, SierraConRelaciones } from '@/types/sierra';

const supabase = createClient();

// Interfaces para manejar las respuestas de Supabase
interface SierraBajaResponse {
  sierra_id: number;
  sierras: {
    id: number;
    codigo_barras: string;
    activo: boolean;
    estado_id: number;
  };
  tipos_sierra: {
    id: number;
    nombre: string;
  };
  sucursales: {
    id: number;
    nombre: string;
  };
  estados_sierra: {
    id: number;
    nombre: string;
  };
}

/**
 * Obtiene todas las bajas masivas con sus relaciones
 */
export const getBajasMasivas = async (): Promise<BajaMasivaConRelaciones[]> => {
  try {
    const { data, error } = await supabase
      .from('bajas_masivas')
      .select('*')
      .order('fecha_baja', { ascending: false });
    
    if (error) {
      console.error('Error al obtener bajas masivas:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getBajasMasivas:', error);
    throw error;
  }
};

/**
 * Obtiene una baja masiva por su ID con todas sus sierras relacionadas
 */
export const getBajaMasivaById = async (id: number): Promise<BajaMasivaConRelaciones | null> => {
  try {
    // Primero obtenemos la baja masiva
    const { data: bajaMasiva, error: bajaError } = await supabase
      .from('bajas_masivas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (bajaError) {
      if (bajaError.code === 'PGRST116') {
        return null;
      }
      console.error('Error al obtener baja masiva por ID:', bajaError);
      throw new Error(bajaError.message);
    }
    
    // Primero obtenemos las sierras relacionadas con la baja masiva
    const { data: bajaSierras, error: bajaSierrasError } = await supabase
      .from('baja_masiva_sierras')
      .select('sierra_id')
      .eq('baja_masiva_id', id);
      
    if (bajaSierrasError) {
      console.error('Error al obtener relaciones de baja masiva:', bajaSierrasError);
      throw new Error(bajaSierrasError.message);
    }
    
    // Si no hay sierras asociadas, devolvemos la baja masiva sin sierras
    if (!bajaSierras || bajaSierras.length === 0) {
      return {
        ...bajaMasiva,
        sierras: []
      };
    }
    
    // Obtenemos los IDs de las sierras
    const sierraIds = bajaSierras.map(item => item.sierra_id);
    
    // Luego obtenemos los detalles completos de cada sierra con sus relaciones
    const { data: sierrasData, error: sierrasError } = await supabase
      .from('sierras')
      .select(`
        *,
        tipo_sierra:tipos_sierra(*),
        sucursal:sucursales(*),
        estado_sierra:estados_sierra(*)
      `)
      .in('id', sierraIds);
    
    if (sierrasError) {
      console.error('Error al obtener sierras de baja masiva:', sierrasError);
      throw new Error(sierrasError.message);
    }
    
    // Las sierras ya vienen con el formato correcto desde la consulta
    const sierras = sierrasData || [];
    
    return {
      ...bajaMasiva,
      sierras
    };
  } catch (error) {
    console.error('Error en getBajaMasivaById:', error);
    throw error;
  }
};

/**
 * Crea una nueva baja masiva y actualiza las sierras relacionadas
 */
export const createBajaMasiva = async (bajaMasiva: BajaMasivaInput, usuarioId: string): Promise<BajaMasiva> => {
  try {
    // Iniciar una transacción para asegurar consistencia
    const { data: bajaData, error: bajaError } = await supabase
      .from('bajas_masivas')
      .insert([{
        usuario_id: usuarioId,
        fecha_baja: bajaMasiva.fecha_baja,
        observaciones: bajaMasiva.observaciones || null,
        creado_en: new Date().toISOString(),
        modificado_en: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (bajaError) {
      console.error('Error al crear baja masiva:', bajaError);
      throw new Error(bajaError.message);
    }
    
    const bajaMasivaId = bajaData.id;
    
    // Verificar que todas las sierras existan y estén activas
    for (const sierraId of bajaMasiva.sierras_ids) {
      const { data: sierra, error: sierraError } = await supabase
        .from('sierras')
        .select('*')
        .eq('id', sierraId)
        .single();
      
      if (sierraError) {
        console.error(`Error al verificar sierra ${sierraId}:`, sierraError);
        throw new Error(`No se pudo verificar la sierra #${sierraId}: ${sierraError.message}`);
      }
      
      if (!sierra.activo) {
        throw new Error(`La sierra #${sierraId} ya está marcada como inactiva.`);
      }
    }
    
    // Crear los registros de relación en baja_masiva_sierras
    for (const sierraId of bajaMasiva.sierras_ids) {
      // Obtener el estado actual de la sierra antes de cambiarla
      const { data: sierra, error: sierraError } = await supabase
        .from('sierras')
        .select('activo')
        .eq('id', sierraId)
        .single();
      
      if (sierraError || !sierra) {
        console.error(`Error al obtener información de la sierra ${sierraId}:`, sierraError);
        throw new Error(`No se pudo obtener información de la sierra #${sierraId}`);
      }
      
      // Crear el registro de relación
      const { error: detalleError } = await supabase
        .from('baja_masiva_sierras')
        .insert({
          baja_masiva_id: bajaMasivaId,
          sierra_id: sierraId,
          estado_anterior: sierra.activo
        });
      
      if (detalleError) {
        console.error(`Error al crear detalle de baja masiva para sierra ${sierraId}:`, detalleError);
        throw new Error(`No se pudo registrar la baja de la sierra #${sierraId}: ${detalleError.message}`);
      }
      
      // Actualizar el estado de la sierra a inactiva y cambiar a "Fuera de servicio"
      const { error: updateError } = await supabase
        .from('sierras')
        .update({
          activo: false,
          estado_id: 4, // Estado "Fuera de servicio"
          modificado_en: new Date().toISOString()
        })
        .eq('id', sierraId);
      
      if (updateError) {
        console.error(`Error al actualizar estado de la sierra ${sierraId}:`, updateError);
        throw new Error(`No se pudo actualizar el estado de la sierra #${sierraId}: ${updateError.message}`);
      }
    }
    
    return bajaData;
  } catch (error) {
    console.error('Error en createBajaMasiva:', error);
    throw error;
  }
};

/**
 * Elimina una baja masiva y revierte los cambios en las sierras
 */
export const deleteBajaMasiva = async (id: number): Promise<void> => {
  try {
    // Obtener los detalles de la baja masiva antes de eliminar
    const { data: detalles, error: detallesError } = await supabase
      .from('baja_masiva_sierras')
      .select('sierra_id, estado_anterior')
      .eq('baja_masiva_id', id);
    
    if (detallesError) {
      console.error('Error al obtener detalles de baja masiva:', detallesError);
      throw new Error(detallesError.message);
    }
    
    // Eliminar los registros de relación
    const { error: deleteDetallesError } = await supabase
      .from('baja_masiva_sierras')
      .delete()
      .eq('baja_masiva_id', id);
    
    if (deleteDetallesError) {
      console.error('Error al eliminar detalles de baja masiva:', deleteDetallesError);
      throw new Error(deleteDetallesError.message);
    }
    
    // Eliminar la baja masiva
    const { error: deleteBajaError } = await supabase
      .from('bajas_masivas')
      .delete()
      .eq('id', id);
    
    if (deleteBajaError) {
      console.error('Error al eliminar baja masiva:', deleteBajaError);
      throw new Error(deleteBajaError.message);
    }
    
    // Revertir los cambios en las sierras (restaurar estado anterior)
    for (const detalle of detalles) {
      const { error: updateError } = await supabase
        .from('sierras')
        .update({
          activo: detalle.estado_anterior,
          estado_id: 1, // Volver a estado "Disponible"
          modificado_en: new Date().toISOString()
        })
        .eq('id', detalle.sierra_id);
      
      if (updateError) {
        console.error(`Error al revertir estado de la sierra ${detalle.sierra_id}:`, updateError);
        throw new Error(`No se pudo revertir el estado de la sierra #${detalle.sierra_id}: ${updateError.message}`);
      }
    }
  } catch (error) {
    console.error('Error en deleteBajaMasiva:', error);
    throw error;
  }
};

// Exportar tipos para usar en componentes
export type { BajaMasiva, BajaMasivaConRelaciones, BajaMasivaInput };
