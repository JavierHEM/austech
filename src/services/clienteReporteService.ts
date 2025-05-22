import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';

export interface ClienteReporteFilters {
  empresa_id: number | null;
  sucursal_id: number | null;
  fecha_desde: Date | null;
  fecha_hasta: Date | null;
  tipo_sierra_id: number | null;
  tipo_afilado_id: number | null;
  activo: boolean;
}

export interface ClienteReporteItem {
  id: number;
  fecha_afilado: string;
  fecha_salida: string | null;
  codigo_barras: string;
  tipo_sierra: string;
  tipo_afilado: string;
  sucursal: string;
  estado: string;
  observaciones: string | null;
}

// Definir una interfaz para los datos que devuelve Supabase
export interface AfiladoReporteData {
  id: number;
  fecha_afilado: string;
  fecha_salida: string | null;
  observaciones: string | null;
  estado: boolean;
  sierras: {
    id: number;
    codigo_barras: string;
    sucursal_id: number;
    tipo_sierra_id: number;
    tipos_sierra: { id: number; nombre: string };
    sucursales: { id: number; nombre: string; empresa_id: number };
  };
  tipos_afilado: { id: number; nombre: string };
}

export async function getReporteAfiladosPorCliente(
  filters: ClienteReporteFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: ClienteReporteItem[], count: number }> {
  try {
    let query = supabase
      .from('afilados')
      .select(`
        id,
        fecha_afilado,
        fecha_salida,
        observaciones,
        estado,
        sierras!inner(
          id,
          codigo_barras,
          sucursal_id,
          tipo_sierra_id,
          tipos_sierra!inner(id, nombre),
          sucursales!inner(id, nombre, empresa_id)
        ),
        tipos_afilado!inner(id, nombre)
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.empresa_id) {
      query = query.eq('sierras.sucursales.empresa_id', String(filters.empresa_id));
    }

    if (filters.sucursal_id) {
      query = query.eq('sierras.sucursal_id', filters.sucursal_id);
    }

    if (filters.tipo_sierra_id) {
      query = query.eq('sierras.tipos_sierra.id', filters.tipo_sierra_id);
    }

    if (filters.tipo_afilado_id) {
      query = query.eq('tipos_afilado.id', filters.tipo_afilado_id);
    }

    if (filters.fecha_desde) {
      query = query.gte('fecha_afilado', filters.fecha_desde.toISOString());
    }

    if (filters.fecha_hasta) {
      // Ajustar la fecha hasta para incluir todo el día
      const fechaHasta = new Date(filters.fecha_hasta);
      fechaHasta.setHours(23, 59, 59, 999);
      query = query.lte('fecha_afilado', fechaHasta.toISOString());
    }

    if (filters.activo !== undefined) {
      query = query.eq('sierras.activo', filters.activo);
    }

    // Ordenar por fecha de ingreso descendente
    query = query.order('fecha_afilado', { ascending: false });

    // Paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener reporte de afilados:', error);
      throw error;
    }

    // Usar la interfaz AfiladoReporteData para tipar los datos

    // Transformar los datos para la tabla
    const reporteItems: ClienteReporteItem[] = (data as any[]).map(item => ({
      id: item.id,
      fecha_afilado: item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
      fecha_salida: item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy') : 'Pendiente',
      codigo_barras: item.sierras?.codigo_barras || 'N/A',
      tipo_sierra: item.sierras?.tipos_sierra?.nombre || 'N/A',
      tipo_afilado: item.tipos_afilado?.nombre || 'N/A',
      sucursal: item.sierras?.sucursales?.nombre || 'N/A',
      estado: typeof item.estado === 'boolean' ? (item.estado ? 'Activo' : 'Inactivo') : String(item.estado || 'N/A'),
      observaciones: item.observaciones || '-'
    }));

    return {
      data: reporteItems,
      count: count || 0
    };
  } catch (error) {
    console.error('Error en getReporteAfiladosPorCliente:', error);
    throw error;
  }
}

// Función para obtener todos los registros para exportar a Excel
export async function getAllReporteAfiladosPorCliente(
  filters: ClienteReporteFilters
): Promise<ClienteReporteItem[]> {
  try {
    // Primero, realizar una consulta para obtener el conteo total
    let countQuery = supabase
      .from('afilados')
      .select('id, sierras!inner(sucursales!inner(empresa_id))', { count: 'exact', head: true });

    // Aplicar los mismos filtros a la consulta de conteo
    if (filters.empresa_id) {
      countQuery = countQuery.eq('sierras.sucursales.empresa_id', String(filters.empresa_id));
    }

    if (filters.sucursal_id) {
      countQuery = countQuery.eq('sierras.sucursal_id', filters.sucursal_id);
    }

    if (filters.tipo_sierra_id) {
      countQuery = countQuery.eq('sierras.tipos_sierra.id', filters.tipo_sierra_id);
    }

    if (filters.tipo_afilado_id) {
      countQuery = countQuery.eq('tipos_afilado.id', filters.tipo_afilado_id);
    }

    if (filters.fecha_desde) {
      countQuery = countQuery.gte('fecha_afilado', filters.fecha_desde.toISOString());
    }

    if (filters.fecha_hasta) {
      // Ajustar la fecha hasta para incluir todo el día
      const fechaHasta = new Date(filters.fecha_hasta);
      fechaHasta.setHours(23, 59, 59, 999);
      countQuery = countQuery.lte('fecha_afilado', fechaHasta.toISOString());
    }

    if (filters.activo !== undefined) {
      countQuery = countQuery.eq('sierras.activo', filters.activo);
    }

    // Ejecutar la consulta de conteo
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error al contar registros para exportar:', countError);
      throw countError;
    }

    const totalCount = count || 0;
    console.log(`Exportando ${totalCount} registros en lotes...`);

    // Implementar obtención por lotes para superar el límite de 1000 registros
    const batchSize = 1000;
    const batchCount = Math.ceil(totalCount / batchSize);
    let allItems: ClienteReporteItem[] = [];

    // Obtener registros en lotes
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min((batchIndex + 1) * batchSize - 1, totalCount - 1);
      
      console.log(`Obteniendo lote ${batchIndex + 1}/${batchCount} (registros ${batchStart}-${batchEnd})`);
      
      // Consulta para este lote
      let batchQuery = supabase
        .from('afilados')
        .select(`
          id,
          fecha_afilado,
          fecha_salida,
          observaciones,
          estado,
          sierras!inner(
            id,
            codigo_barras,
            sucursal_id,
            tipo_sierra_id,
            tipos_sierra!inner(id, nombre),
            sucursales!inner(id, nombre, empresa_id)
          ),
          tipos_afilado!inner(id, nombre)
        `)
        .order('fecha_afilado', { ascending: false })
        .range(batchStart, batchEnd);

      // Aplicar los mismos filtros
      if (filters.empresa_id) {
        batchQuery = batchQuery.eq('sierras.sucursales.empresa_id', String(filters.empresa_id));
      }

      if (filters.sucursal_id) {
        batchQuery = batchQuery.eq('sierras.sucursal_id', filters.sucursal_id);
      }

      if (filters.tipo_sierra_id) {
        batchQuery = batchQuery.eq('sierras.tipos_sierra.id', filters.tipo_sierra_id);
      }

      if (filters.tipo_afilado_id) {
        batchQuery = batchQuery.eq('tipos_afilado.id', filters.tipo_afilado_id);
      }

      if (filters.fecha_desde) {
        batchQuery = batchQuery.gte('fecha_afilado', filters.fecha_desde.toISOString());
      }

      if (filters.fecha_hasta) {
        // Ajustar la fecha hasta para incluir todo el día
        const fechaHasta = new Date(filters.fecha_hasta);
        fechaHasta.setHours(23, 59, 59, 999);
        batchQuery = batchQuery.lte('fecha_afilado', fechaHasta.toISOString());
      }

      if (filters.activo !== undefined) {
        batchQuery = batchQuery.eq('sierras.activo', filters.activo);
      }

      // Ejecutar consulta para este lote
      const { data: batchData, error: batchError } = await batchQuery;
      
      if (batchError) {
        console.error(`Error al obtener lote ${batchIndex + 1}:`, batchError);
        throw batchError;
      }

      // Procesar resultados de este lote
      if (batchData && batchData.length > 0) {
        const batchItems = (batchData as any[]).map(item => ({
          id: item.id,
          fecha_afilado: item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
          fecha_salida: item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy') : 'Pendiente',
          codigo_barras: item.sierras?.codigo_barras || 'N/A',
          tipo_sierra: item.sierras?.tipos_sierra?.nombre || 'N/A',
          tipo_afilado: item.tipos_afilado?.nombre || 'N/A',
          sucursal: item.sierras?.sucursales?.nombre || 'N/A',
          estado: typeof item.estado === 'boolean' ? (item.estado ? 'Activo' : 'Inactivo') : String(item.estado || 'N/A'),
          observaciones: item.observaciones || '-'
        }));
        
        allItems = [...allItems, ...batchItems];
      }
    }

    console.log(`Exportación completada: ${allItems.length} registros obtenidos`);
    return allItems;
  } catch (error) {
    console.error('Error en getAllReporteAfiladosPorCliente:', error);
    throw error;
  }
}
