// src/services/afiladoServiceImproved.ts
import { supabase } from '@/lib/supabase-client';
import { AfiladoFilters, PaginatedAfilados } from '@/types/afilado';

/**
 * Servicio mejorado para manejar afilados con filtros por empresa corregidos
 */
export const getAfiladosImproved = async (
  filters?: AfiladoFilters,
  page: number = 1,
  pageSize: number = 10,
  sortField: string = 'fecha_afilado',
  sortDirection: 'asc' | 'desc' = 'desc',
  empresaId?: number
): Promise<PaginatedAfilados> => {
  try {
    console.log('Obteniendo afilados mejorado con filtros:', { 
      filters, 
      page, 
      pageSize, 
      sortField, 
      sortDirection, 
      empresaId 
    });

    // Construir consulta de conteo con JOINs correctos
    let countQuery = supabase
      .from('afilados')
      .select(`
        id,
        sierras!inner(
          id,
          sucursales!inner(
            empresa_id
          )
        )
      `, { count: 'exact', head: true });

    // Si se proporciona un ID de empresa, filtrar correctamente
    if (empresaId) {
      countQuery = countQuery.eq('sierras.sucursales.empresa_id', empresaId);
    }

    // Aplicar otros filtros si existen
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
    
    // Consulta principal con JOINs correctos y paginación
    let query = supabase
      .from('afilados')
      .select(`
        *,
        sierra:sierra_id(
          *,
          sucursales!inner(
            *,
            empresas!inner(*)
          ),
          tipos_sierra(*),
          estados_sierra(*)
        ),
        tipo_afilado:tipo_afilado_id(*)
      `)
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range(from, to);
      
    console.log('Consultando afilados mejorado con ordenamiento por:', sortField, sortDirection);
    
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
    
    // Si se proporciona un ID de empresa, filtrar correctamente usando JOINs
    if (empresaId) {
      query = query.eq('sierra.sucursales.empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener afilados mejorado:', error);
      throw new Error(error.message);
    }
    
    // Log de las fechas recibidas para diagnóstico
    if (data && data.length > 0) {
      console.log('Fechas de afilado recibidas de la base de datos (mejorado):');
      data.forEach((afilado, index) => {
        console.log(`Afilado #${index + 1} - ID: ${afilado.id}, Sierra: ${afilado.sierra_id}, Fecha afilado:`, afilado.fecha_afilado);
      });
    }
    
    // Procesar datos para asegurar consistencia
    const processedData = data?.map(afilado => ({
      ...afilado,
      // Asegurar que las fechas estén en formato correcto
      fecha_afilado: afilado.fecha_afilado,
      fecha_salida: afilado.fecha_salida,
      // Agregar información de empresa desde la relación
      empresa_info: afilado.sierra?.sucursales?.empresas ? {
        id: afilado.sierra.sucursales.empresas.id,
        razon_social: afilado.sierra.sucursales.empresas.razon_social,
        rut: afilado.sierra.sucursales.empresas.rut
      } : null
    })) || [];
    
    return {
      data: processedData,
      count: totalCount || 0
    };
    
  } catch (error) {
    console.error('Error en getAfiladosImproved:', error);
    throw error;
  }
};

/**
 * Función para obtener sierras por empresa usando la relación correcta
 */
export const getSierrasByEmpresa = async (empresaId: number) => {
  try {
    const { data, error } = await supabase
      .from('sierras')
      .select(`
        *,
        sucursales!inner(
          *,
          empresas!inner(*)
        ),
        tipos_sierra(*),
        estados_sierra(*)
      `)
      .eq('sucursales.empresa_id', empresaId);

    if (error) {
      console.error('Error al obtener sierras por empresa:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error en getSierrasByEmpresa:', error);
    throw error;
  }
};

/**
 * Función para verificar la estructura de datos
 */
export const verifyDataStructure = async () => {
  try {
    console.log('Verificando estructura de datos...');
    
    // Verificar que las tablas existen y tienen las columnas correctas
    const { data: sierrasStructure, error: sierrasError } = await supabase
      .from('sierras')
      .select('id, sucursal_id, tipo_sierra_id, estado_id')
      .limit(1);

    if (sierrasError) {
      console.error('Error al verificar estructura de sierras:', sierrasError);
      return { valid: false, error: sierrasError.message };
    }

    const { data: sucursalesStructure, error: sucursalesError } = await supabase
      .from('sucursales')
      .select('id, empresa_id, nombre')
      .limit(1);

    if (sucursalesError) {
      console.error('Error al verificar estructura de sucursales:', sucursalesError);
      return { valid: false, error: sucursalesError.message };
    }

    const { data: empresasStructure, error: empresasError } = await supabase
      .from('empresas')
      .select('id, razon_social, rut')
      .limit(1);

    if (empresasError) {
      console.error('Error al verificar estructura de empresas:', empresasError);
      return { valid: false, error: empresasError.message };
    }

    console.log('Estructura de datos verificada correctamente');
    return { 
      valid: true, 
      sierras: sierrasStructure, 
      sucursales: sucursalesStructure, 
      empresas: empresasStructure 
    };

  } catch (error) {
    console.error('Error en verifyDataStructure:', error);
    return { valid: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};
