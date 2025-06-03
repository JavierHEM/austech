import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';
import { Empresa } from '@/types/empresa';
import { Sucursal } from '@/types/sucursal';

export interface ReporteAfiladosPorClienteFilters {
  empresa_id: number | string | null;
  sucursal_id: number | string | null;
  fecha_desde: Date | string | null;
  fecha_hasta: Date | string | null;
  tipo_sierra_id: number | string | null;
  tipo_afilado_id: number | string | null;
  activo: boolean;
  estado_afilado?: string;
  estado?: boolean; // Estado del afilado (true = Activo, false = Inactivo)
}

export interface ReporteAfiladoItem {
  id: number;
  fecha_afilado: string;
  fecha_salida: string | null;
  codigo_barras: string;
  codigo_sierra?: string; // Alias para codigo_barras en algunos contextos
  tipo_sierra: string;
  tipo_afilado: string;
  sucursal: string;
  empresa?: string; // Nombre de la empresa
  estado: string;
  estado_afilado?: string; // Estado específico del afilado
  observaciones: string | null;
  fecha_registro?: string; // Fecha de registro en el sistema
  activo?: boolean; // Si la sierra está activa o no
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
    estados_sierra: { id: number; nombre: string };
  };
  tipos_afilado: { id: number; nombre: string };
}

export async function getReporteAfiladosPorCliente(
  filters: ReporteAfiladosPorClienteFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: ReporteAfiladoItem[], count: number }> {
  try {
    let query = supabase
      .from('afilados')
      .select(`
        id,
        fecha_afilado,
        fecha_salida,
        observaciones,
        estado,
        creado_en,
        sierras!inner(
          id,
          codigo_barras,
          sucursal_id,
          tipo_sierra_id,
          activo,
          tipos_sierra!inner(id, nombre),
          sucursales!inner(
            id, 
            nombre, 
            empresa_id,
            empresas!inner(id, razon_social)
          ),
          estados_sierra!inner(id, nombre)
        ),
        tipos_afilado!inner(id, nombre)
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.empresa_id) {
      console.log('Aplicando filtro de empresa ID:', filters.empresa_id, 'tipo:', typeof filters.empresa_id);
      // Asegurar que la comparación sea robusta convirtiendo a string y normalizando
      query = query.eq('sierras.sucursales.empresa_id', String(filters.empresa_id).trim());
    }

    if (filters.sucursal_id) {
      query = query.eq('sierras.sucursal_id', String(filters.sucursal_id).trim());
    }

    if (filters.tipo_sierra_id) {
      query = query.eq('sierras.tipos_sierra.id', String(filters.tipo_sierra_id).trim());
    }

    if (filters.tipo_afilado_id) {
      query = query.eq('tipos_afilado.id', String(filters.tipo_afilado_id).trim());
    }

    if (filters.fecha_desde) {
      // Manejar tanto objetos Date como strings
      const fechaDesde = typeof filters.fecha_desde === 'string' 
        ? filters.fecha_desde 
        : filters.fecha_desde.toISOString().split('T')[0]; // Solo usar la parte de fecha
      query = query.gte('fecha_afilado', fechaDesde);
    }

    if (filters.fecha_hasta) {
      // Ajustar la fecha hasta para incluir todo el día
      if (typeof filters.fecha_hasta === 'string') {
        query = query.lte('fecha_afilado', filters.fecha_hasta);
      } else {
        const fechaHasta = new Date(filters.fecha_hasta);
        fechaHasta.setHours(23, 59, 59, 999);
        query = query.lte('fecha_afilado', fechaHasta.toISOString().split('T')[0] + 'T23:59:59.999Z');
      }
    }
    
    // Filtrar por estado de afilado (pendiente/completado)
    if (filters.estado_afilado === 'pendiente') {
      query = query.is('fecha_salida', null);
    } else if (filters.estado_afilado === 'completado') {
      query = query.not('fecha_salida', 'is', null);
    }
    
    // Filtrar por estado de sierra (activo/inactivo) si se especifica
    if (filters.activo !== undefined) {
      console.log('Aplicando filtro de estado de sierra:', filters.activo);
      query = query.eq('sierras.activo', filters.activo);
    }
    
    // Filtrar por estado del afilado (activo/inactivo) si se especifica
    if (filters.estado !== undefined) {
      console.log('Aplicando filtro de estado del afilado:', filters.estado);
      query = query.eq('estado', filters.estado);
    }
    
    // Aplicar paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Ordenar por fecha de afilado descendente (más reciente primero)
    query = query.order('fecha_afilado', { ascending: false }).range(from, to);
    
    // Ejecutar la consulta
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error al obtener reporte de afilados por cliente:', error);
      throw error;
    }

    // Transformar los datos para la tabla
    const reporteItems: ReporteAfiladoItem[] = (data as any[]).map(item => {
      const sierra = item.sierras || {};
      const sucursal = sierra.sucursales || {};
      const empresa = sucursal.empresas || {};
      
      // Obtener el estado del afilado basado en fecha_salida
      const estadoAfilado = item.fecha_salida ? 'completado' : 'pendiente';
      
      // Log para depurar el valor del campo estado
      console.log(`ID: ${item.id}, estado (valor original):`, item.estado, 'tipo:', typeof item.estado);
      
      // Convertir explícitamente a booleano para manejar diferentes formatos
      const estadoBooleano = item.estado === true || item.estado === 'true' || item.estado === 1;
      
      return {
        id: item.id,
        fecha_afilado: item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
        fecha_salida: item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy') : 'Pendiente',
        codigo_barras: sierra.codigo_barras || 'N/A',
        codigo_sierra: sierra.codigo_barras || 'N/A', // Alias para mantener compatibilidad
        tipo_sierra: sierra.tipos_sierra?.nombre || 'N/A',
        tipo_afilado: item.tipos_afilado?.nombre || 'N/A',
        sucursal: sucursal.nombre || 'N/A',
        empresa: empresa.razon_social || 'N/A', // Ahora obtenemos la razón social de la empresa
        estado: estadoBooleano ? 'Activo' : 'Inactivo', // Usar el campo estado (boolean) de la tabla afilados
        estado_afilado: estadoAfilado,
        observaciones: item.observaciones || '-',
        fecha_registro: item.creado_en ? format(new Date(item.creado_en), 'dd/MM/yyyy') : 'N/A',
        activo: sierra.activo !== undefined ? sierra.activo : true
      };
    });
    
    // Registrar para depuración
    console.log(`Reporte generado: ${reporteItems.length} registros encontrados de ${count} totales`);
    if (reporteItems.length > 0) {
      console.log('Ejemplo de registro:', reporteItems[0]);
    }

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
  filters: ReporteAfiladosPorClienteFilters
): Promise<ReporteAfiladoItem[]> {
  try {
    // Primero, realizar una consulta para obtener el conteo total
    let countQuery = supabase
      .from('afilados')
      .select('id, sierras!inner(sucursales!inner(empresa_id))', { count: 'exact', head: true });

    // Aplicar filtros para el conteo
    if (filters.empresa_id) {
      countQuery = countQuery.eq('sierras.sucursales.empresa_id', String(filters.empresa_id).trim());
    }

    if (filters.sucursal_id) {
      countQuery = countQuery.eq('sierras.sucursal_id', String(filters.sucursal_id).trim());
    }

    if (filters.tipo_sierra_id) {
      countQuery = countQuery.eq('sierras.tipos_sierra.id', String(filters.tipo_sierra_id).trim());
    }

    if (filters.tipo_afilado_id) {
      countQuery = countQuery.eq('tipos_afilado.id', String(filters.tipo_afilado_id).trim());
    }

    if (filters.fecha_desde) {
      const fechaDesde = typeof filters.fecha_desde === 'string' 
        ? filters.fecha_desde 
        : filters.fecha_desde.toISOString().split('T')[0];
      countQuery = countQuery.gte('fecha_afilado', fechaDesde);
    }

    if (filters.fecha_hasta) {
      if (typeof filters.fecha_hasta === 'string') {
        countQuery = countQuery.lte('fecha_afilado', filters.fecha_hasta);
      } else {
        const fechaHasta = new Date(filters.fecha_hasta);
        fechaHasta.setHours(23, 59, 59, 999);
        countQuery = countQuery.lte('fecha_afilado', fechaHasta.toISOString().split('T')[0] + 'T23:59:59.999Z');
      }
    }

    // Filtrar por estado de afilado (pendiente/completado)
    if (filters.estado_afilado === 'pendiente') {
      countQuery = countQuery.is('fecha_salida', null);
    } else if (filters.estado_afilado === 'completado') {
      countQuery = countQuery.not('fecha_salida', 'is', null);
    }

    // Filtrar por estado de sierra (activo/inactivo) si se especifica
    if (filters.activo !== undefined) {
      countQuery = countQuery.eq('sierras.activo', filters.activo);
    }

    // Ejecutar la consulta de conteo
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error al obtener conteo para exportación:', countError);
      throw countError;
    }

    console.log(`Preparando exportación de ${count} registros`);
    
    // Si no hay registros, devolver array vacío
    if (!count || count === 0) {
      return [];
    }

    // Procesar en lotes para evitar problemas con grandes volúmenes de datos
    const batchSize = 500; // Tamaño de lote
    const batches = Math.ceil(count / batchSize);
    let allItems: ReporteAfiladoItem[] = [];

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const from = batchIndex * batchSize;
      const to = from + batchSize - 1;
      
      console.log(`Procesando lote ${batchIndex + 1}/${batches} (registros ${from + 1}-${Math.min(to + 1, count)})`);
      
      // Consulta para este lote
      let batchQuery = supabase
        .from('afilados')
        .select(`
          id,
          fecha_afilado,
          fecha_salida,
          observaciones,
          estado,
          creado_en,
          sierras!inner(
            id,
            codigo_barras,
            sucursal_id,
            tipo_sierra_id,
            activo,
            tipos_sierra!inner(id, nombre),
            sucursales!inner(
              id, 
              nombre, 
              empresa_id,
              empresas!inner(id, razon_social)
            ),
            estados_sierra!inner(id, nombre)
          ),
          tipos_afilado!inner(id, nombre)
        `)
        .order('fecha_afilado', { ascending: false })
        .range(from, to);

      // Aplicar los mismos filtros que en la consulta de conteo
      if (filters.empresa_id) {
        batchQuery = batchQuery.eq('sierras.sucursales.empresa_id', String(filters.empresa_id).trim());
      }

      if (filters.sucursal_id) {
        batchQuery = batchQuery.eq('sierras.sucursal_id', String(filters.sucursal_id).trim());
      }

      if (filters.tipo_sierra_id) {
        batchQuery = batchQuery.eq('sierras.tipos_sierra.id', String(filters.tipo_sierra_id).trim());
      }

      if (filters.tipo_afilado_id) {
        batchQuery = batchQuery.eq('tipos_afilado.id', String(filters.tipo_afilado_id).trim());
      }

      if (filters.fecha_desde) {
        // Manejar tanto objetos Date como strings
        const fechaDesde = typeof filters.fecha_desde === 'string' 
          ? filters.fecha_desde 
          : (filters.fecha_desde as Date).toISOString().split('T')[0]; // Solo usar la parte de fecha
        batchQuery = batchQuery.gte('fecha_afilado', fechaDesde);
      }

      if (filters.fecha_hasta) {
        // Ajustar la fecha hasta para incluir todo el día
        if (typeof filters.fecha_hasta === 'string') {
          batchQuery = batchQuery.lte('fecha_afilado', filters.fecha_hasta);
        } else {
          const fechaHasta = new Date(filters.fecha_hasta);
          fechaHasta.setHours(23, 59, 59, 999);
          batchQuery = batchQuery.lte('fecha_afilado', (fechaHasta as Date).toISOString().split('T')[0] + 'T23:59:59.999Z');
        }
      }

      // Filtrar por estado de sierra (activo/inactivo) si se especifica
      if (filters.activo !== undefined) {
        console.log('Lote - Aplicando filtro de estado de sierra:', filters.activo);
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
        const batchItems = (batchData as any[]).map(item => {
          const sierra = item.sierras || {};
          const sucursal = sierra.sucursales || {};
          const empresa = sucursal.empresas || {};
          
          // Log para depurar el valor del campo estado en la exportación
          console.log(`Exportación - ID: ${item.id}, estado (valor original):`, item.estado, 'tipo:', typeof item.estado);
          
          // Convertir explícitamente a booleano para manejar diferentes formatos
          const estadoBooleano = item.estado === true || item.estado === 'true' || item.estado === 1;
          
          return {
            id: item.id,
            fecha_afilado: item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
            fecha_salida: item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy') : 'Pendiente',
            codigo_barras: sierra.codigo_barras || 'N/A',
            codigo_sierra: sierra.codigo_barras || 'N/A',
            tipo_sierra: sierra.tipos_sierra?.nombre || 'N/A',
            tipo_afilado: item.tipos_afilado?.nombre || 'N/A',
            sucursal: sucursal.nombre || 'N/A',
            empresa: empresa.razon_social || 'N/A',
            estado: estadoBooleano ? 'Activo' : 'Inactivo', // Usar el campo estado (boolean) de la tabla afilados
            observaciones: item.observaciones || '-',
            fecha_registro: item.creado_en ? format(new Date(item.creado_en), 'dd/MM/yyyy') : 'N/A',
            activo: sierra.activo !== undefined ? sierra.activo : true
          };
        });
        
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

// Función para obtener empresas activas
export async function getEmpresasActivas(): Promise<Empresa[]> {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('activo', true)
      .order('razon_social');

    if (error) {
      console.error('Error al obtener empresas activas:', error);
      throw error;
    }

    return data as Empresa[];
  } catch (error) {
    console.error('Error en getEmpresasActivas:', error);
    throw error;
  }
}

// Función para obtener sucursales por empresa
export async function getSucursalesPorEmpresa(empresaId: number | string): Promise<Sucursal[]> {
  try {
    if (!empresaId) {
      return [];
    }

    const { data, error } = await supabase
      .from('sucursales')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error al obtener sucursales por empresa:', error);
      throw error;
    }

    return data as Sucursal[];
  } catch (error) {
    console.error('Error en getSucursalesPorEmpresa:', error);
    throw error;
  }
}
