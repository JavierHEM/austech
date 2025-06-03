import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';

// Interfaz para los filtros del reporte
export interface ReporteAfiladosFiltros {
  empresa_id?: number | null;
  sucursal_id?: number | null;
  tipo_sierra_id?: number | null;
  tipo_afilado_id?: number | null;
  fecha_desde?: Date | string | null;
  fecha_hasta?: Date | string | null;
  estado_afilado?: 'pendiente' | 'completado' | 'todos' | null;
  estado?: string | null; // Estado de la tabla afilados
}

// Interfaz para los items del reporte
export interface ReporteAfiladoItem {
  id: number;
  empresa: string;
  sucursal: string;
  tipo_sierra: string;
  codigo_sierra: string;
  tipo_afilado: string;
  fecha_afilado: string;
  fecha_salida: string | null;
  estado: string;
  observaciones: string | null;
  sierra_id: number; // Para poder obtener más detalles
}

/**
 * Obtiene los datos del reporte de afilados por cliente con filtros y paginación
 */
export async function obtenerReporteAfilados(
  filtros: ReporteAfiladosFiltros,
  pagina: number = 1,
  porPagina: number = 20
): Promise<{ datos: ReporteAfiladoItem[], total: number }> {
  try {
    console.log('Obteniendo reporte con filtros:', filtros);
    
    // Construir la consulta base
    let query = supabase
      .from('afilados')
      .select(`
        id,
        fecha_afilado,
        fecha_salida,
        estado,
        observaciones,
        creado_en,
        sierras!inner(
          id,
          codigo_barras,
          observaciones,
          tipo_sierra_id,
          sucursal_id,
          tipos_sierra!inner(id, nombre),
          sucursales!inner(
            id, 
            nombre, 
            empresa_id,
            empresas!inner(id, razon_social)
          )
        ),
        tipos_afilado!inner(id, nombre)
      `, { count: 'exact' });
    
    // Aplicar filtros
    if (filtros.empresa_id) {
      query = query.eq('sierras.sucursales.empresa_id', filtros.empresa_id);
    }
    
    if (filtros.sucursal_id) {
      query = query.eq('sierras.sucursal_id', filtros.sucursal_id);
    }
    
    if (filtros.tipo_sierra_id) {
      query = query.eq('sierras.tipo_sierra_id', filtros.tipo_sierra_id);
    }
    
    if (filtros.tipo_afilado_id) {
      query = query.eq('tipos_afilado.id', filtros.tipo_afilado_id);
    }
    
    if (filtros.fecha_desde) {
      const fechaDesde = typeof filtros.fecha_desde === 'string' 
        ? filtros.fecha_desde 
        : format(filtros.fecha_desde, 'yyyy-MM-dd');
      query = query.gte('fecha_afilado', fechaDesde);
    }
    
    if (filtros.fecha_hasta) {
      const fechaHasta = typeof filtros.fecha_hasta === 'string' 
        ? filtros.fecha_hasta 
        : format(filtros.fecha_hasta, 'yyyy-MM-dd');
      query = query.lte('fecha_afilado', fechaHasta);
    }
    
    // Filtro por estado de afilado (basado en fecha_salida)
    if (filtros.estado_afilado) {
      if (filtros.estado_afilado === 'pendiente') {
        query = query.is('fecha_salida', null);
      } else if (filtros.estado_afilado === 'completado') {
        query = query.not('fecha_salida', 'is', null);
      }
    }
    
    // Filtro por estado de la tabla afilados
    if (filtros.estado && filtros.estado !== 'todos') {
      query = query.eq('estado', filtros.estado);
    }
    
    // Ordenar por fecha de afilado descendente
    query = query.order('fecha_afilado', { ascending: false });
    
    // Aplicar paginación
    const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;
    query = query.range(desde, hasta);
    
    // Ejecutar la consulta
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error al obtener reporte de afilados:', error);
      throw error;
    }
    
    // Transformar los datos para el formato del reporte
    const items: ReporteAfiladoItem[] = (data || []).map(item => {
      // Acceder a los datos anidados de forma segura
      const sierra = item.sierras as any || {};
      const sucursal = sierra.sucursales as any || {};
      const empresa = sucursal.empresas as any || {};
      const tipoSierra = sierra.tipos_sierra as any || {};
      const tipoAfilado = item.tipos_afilado as any || {};
      
      return {
        id: item.id,
        empresa: empresa.razon_social || 'N/A',
        sucursal: sucursal.nombre || 'N/A',
        tipo_sierra: tipoSierra.nombre || 'N/A',
        codigo_sierra: sierra.codigo_barras || 'N/A',
        tipo_afilado: tipoAfilado.nombre || 'N/A',
        fecha_afilado: item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
        fecha_salida: item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy') : 'Pendiente',
        estado: item.estado || 'N/A',
        observaciones: sierra.observaciones || '-',
        sierra_id: sierra.id || 0
      };
    });
    
    console.log(`Reporte generado: ${items.length} registros de ${count || 0} totales`);
    
    return {
      datos: items,
      total: count || 0
    };
  } catch (error) {
    console.error('Error en obtenerReporteAfilados:', error);
    throw error;
  }
}

/**
 * Obtiene los detalles de una sierra específica
 */
export async function obtenerDetalleSierra(sierraId: number) {
  try {
    const { data, error } = await supabase
      .from('sierras')
      .select(`
        id,
        codigo_barras,
        observaciones,
        activo,
        tipos_sierra(id, nombre),
        sucursales(
          id, 
          nombre, 
          empresas(id, razon_social)
        ),
        estados_sierra(id, nombre)
      `)
      .eq('id', sierraId)
      .single();
    
    if (error) {
      console.error('Error al obtener detalle de sierra:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error en obtenerDetalleSierra:', error);
    throw error;
  }
}
