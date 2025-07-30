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
      // Consulta optimizada para mostrar datos completos
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

    // Aplicar filtro de empresa
    if (filters.empresa_id) {
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
    // IMPORTANTE: Solo aplicar este filtro cuando NO estamos buscando registros inactivos
    if (filters.activo !== undefined && !(filters.estado === false)) {
      // Aplicando filtro de estado de sierra
      // Aplicar el filtro de sierra activa solo cuando no estamos buscando registros inactivos
      query = query.eq('sierras.activo', filters.activo);
    } else if (filters.activo !== undefined) {
      // Omitiendo filtro de estado de sierra para mostrar todos los registros inactivos
    }
    
    // Filtrar por estado del afilado (activo/inactivo) si se especifica
    if (filters.estado !== undefined) {
      // Convertir explícitamente a booleano para evitar problemas de comparación
      const estadoBooleano = filters.estado === true || String(filters.estado).toLowerCase() === 'true';
      
      // Aplicar filtros principales
      
      // Consulta con filtro de fechas para verificar registros inactivos en el rango
      if (filters.fecha_desde && filters.fecha_hasta) {
        // Convertir fechas a formato ISO string de manera segura
        const fechaDesde = filters.fecha_desde instanceof Date 
          ? filters.fecha_desde.toISOString() 
          : new Date(filters.fecha_desde).toISOString();
        
        const fechaHasta = filters.fecha_hasta instanceof Date 
          ? filters.fecha_hasta.toISOString() 
          : new Date(filters.fecha_hasta).toISOString();
        
        const { data: diagnosticoFechas } = await supabase
          .from('afilados')
          .select('id, estado, fecha_afilado')
          .or('estado.eq.false,estado.is.null')
          .gte('fecha_afilado', fechaDesde)
          .lte('fecha_afilado', fechaHasta)
          .limit(5);
        
        // Verificación de registros inactivos en rango de fechas completada
      }
      
      // SOLUCIÓN FINAL: Implementar una solución robusta para el filtro de estado
      if (estadoBooleano) {
        // Para activos, solo mostrar registros con estado = true
        query = query.eq('estado', true);
      } else {
        // Para inactivos, mostrar registros con estado = false O estado = null
        // Usamos la sintaxis de Supabase para OR con filtros múltiples
        query = query.or('estado.eq.false,estado.is.null');
      }
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
      // Procesamiento de estado para cada item
      
      // Convertir explícitamente a booleano para manejar diferentes formatos
      const estadoBooleano = item.estado === true || item.estado === 'true' || item.estado === 1;
      
      // Función para formatear fechas de manera segura
      const formatFechaSafe = (fechaStr: string | null | undefined): string => {
        if (!fechaStr) return 'N/A';
        try {
          // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar problemas de zona horaria
          let fechaParseada;
          
          if (typeof fechaStr === 'string') {
            // Si es una fecha ISO, extraer solo la parte de la fecha
            if (fechaStr.includes('T')) {
              const soloFecha = fechaStr.split('T')[0];
              // Crear fecha a las 12 del mediodía para evitar problemas de zona horaria
              fechaParseada = new Date(`${soloFecha}T12:00:00`);
            } else {
              // Si ya es solo fecha, agregar hora para evitar problemas de zona horaria
              fechaParseada = new Date(`${fechaStr}T12:00:00`);
            }
          } else {
            fechaParseada = new Date(fechaStr);
          }
          
          // Verificar si la fecha es válida
          if (isNaN(fechaParseada.getTime())) {
            console.warn(`Fecha inválida encontrada: ${fechaStr}`);
            return 'N/A';
          }
          
          // Imprimir para depuración
          // Fecha parseada y formateada correctamente
          
          return format(fechaParseada, 'dd/MM/yyyy');
        } catch (error) {
          console.error(`Error al formatear fecha: ${fechaStr}`, error);
          return 'N/A';
        }
      };

      // Log para depuración de fechas
      // Procesamiento de fechas para cada item
      
      return {
        id: item.id,
        fecha_afilado: formatFechaSafe(item.fecha_afilado),
        fecha_salida: item.fecha_salida ? formatFechaSafe(item.fecha_salida) : 'Pendiente',
        codigo_barras: sierra.codigo_barras || 'N/A',
        codigo_sierra: sierra.codigo_barras || 'N/A', // Alias para mantener compatibilidad
        tipo_sierra: sierra.tipos_sierra?.nombre || 'N/A',
        tipo_afilado: item.tipos_afilado?.nombre || 'N/A',
        sucursal: sucursal.nombre || 'N/A',
        empresa: empresa.razon_social || 'N/A', // Ahora obtenemos la razón social de la empresa
        estado: estadoBooleano ? 'Activo' : 'Inactivo', // Usar el campo estado (boolean) de la tabla afilados
        estado_afilado: estadoAfilado,
        observaciones: item.observaciones || '-',
        fecha_registro: formatFechaSafe(item.creado_en),
        activo: sierra.activo !== undefined ? sierra.activo : true
      };
    });
    
    // Registrar para depuración
    // Reporte generado correctamente
    if (reporteItems.length > 0) {
      // Ejemplo de registro disponible
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

    // Los filtros de empresa ya se aplicaron en la consulta inicial
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
    // IMPORTANTE: Solo aplicar este filtro cuando NO estamos buscando registros inactivos
    if (filters.activo !== undefined && !(filters.estado === false)) {
      // Aplicar el filtro de sierra activa solo cuando no estamos buscando registros inactivos
      countQuery = countQuery.eq('sierras.activo', filters.activo);
    }

    // Filtrar por estado del afilado (activo/inactivo) si se especifica
    if (filters.estado !== undefined) {
      // Convertir explícitamente a booleano para evitar problemas de comparación
      const estadoBooleano = filters.estado === true || String(filters.estado).toLowerCase() === 'true';
      
      if (estadoBooleano) {
        // Para activos, solo mostrar registros con estado = true
        countQuery = countQuery.eq('estado', true);
      } else {
        // Para inactivos, mostrar registros con estado = false O estado = null
        // Usamos la sintaxis de Supabase para OR con filtros múltiples
        countQuery = countQuery.or('estado.eq.false,estado.is.null');
      }
    }

    // Ejecutar la consulta de conteo
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error al obtener conteo para exportación:', countError);
      throw countError;
    }

    // Preparando exportación
    
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
      
      // Procesando lote de registros
      
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
      // IMPORTANTE: Solo aplicar este filtro cuando NO estamos buscando registros inactivos
      if (filters.activo !== undefined && !(filters.estado === false)) {
        // Aplicar el filtro de sierra activa solo cuando no estamos buscando registros inactivos
        batchQuery = batchQuery.eq('sierras.activo', filters.activo);
      }
      
      // Filtrar por estado del afilado (activo/inactivo) si se especifica
      if (filters.estado !== undefined) {
        // Convertir explícitamente a booleano para evitar problemas de comparación
        const estadoBooleano = filters.estado === true || String(filters.estado).toLowerCase() === 'true';
        
        if (estadoBooleano) {
          // Para activos, solo mostrar registros con estado = true
          batchQuery = batchQuery.eq('estado', true);
        } else {
          // Para inactivos, mostrar registros con estado = false O estado = null
          // Usamos la sintaxis de Supabase para OR con filtros múltiples
          batchQuery = batchQuery.or('estado.eq.false,estado.is.null');
        }
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
          
          // Procesamiento del estado para exportación
          
          // Convertir explícitamente a booleano para manejar diferentes formatos
          const estadoBooleano = item.estado === true || item.estado === 'true' || item.estado === 1;
          
          // Procesamiento de datos para exportación
          
          // Función simplificada para formatear fechas
          const formatearFecha = (fecha: any) => {
            if (!fecha) {
              return 'N/A';
            }
            
            try {
              // Convertir string a fecha si es necesario
              let fechaObj;
              if (typeof fecha === 'string') {
                // Si la fecha es una cadena ISO, usarla directamente
                if (fecha.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                  fechaObj = new Date(fecha);
                } else {
                  // Intentar parsear otros formatos de fecha
                  const partes = fecha.split(/[-\/]/);
                  if (partes.length === 3) {
                    // Asumir formato yyyy-mm-dd o dd/mm/yyyy
                    const esFormatoISO = fecha.includes('-');
                    const year = esFormatoISO ? parseInt(partes[0]) : parseInt(partes[2]);
                    const month = parseInt(partes[1]) - 1; // Los meses en JS son 0-11
                    const day = esFormatoISO ? parseInt(partes[2]) : parseInt(partes[0]);
                    fechaObj = new Date(year, month, day);
                  } else {
                    fechaObj = new Date(fecha);
                  }
                }
              } else {
                fechaObj = new Date(fecha);
              }
              
              // Verificar si la fecha es válida
              if (isNaN(fechaObj.getTime())) {
                return 'N/A';
              }
              
              // Formatear fecha válida
              return format(fechaObj, 'dd/MM/yyyy');
            } catch (error) {
              return 'N/A';
            }
          };
          
          // Obtener la fecha actual para valores por defecto
          const fechaActual = format(new Date(), 'dd/MM/yyyy');
          
          // Usar las fechas reales de la base de datos
          return {
            id: item.id,
            fecha_afilado: item.fecha_afilado ? formatearFecha(item.fecha_afilado) : 'N/A',
            fecha_salida: item.fecha_salida ? formatearFecha(item.fecha_salida) : 'Pendiente',
            codigo_barras: sierra.codigo_barras || 'N/A',
            codigo_sierra: sierra.codigo_barras || 'N/A',
            tipo_sierra: sierra.tipos_sierra?.nombre || 'N/A',
            tipo_afilado: item.tipos_afilado?.nombre || 'N/A',
            sucursal: sucursal.nombre || 'N/A',
            empresa: empresa.razon_social || 'N/A',
            estado: estadoBooleano ? 'Activo' : 'Inactivo', // Usar el campo estado (boolean) de la tabla afilados
            observaciones: item.observaciones || '-',
            fecha_registro: item.creado_en ? formatearFecha(item.creado_en) : 'N/A',
            activo: sierra.activo !== undefined ? sierra.activo : true
          };
        });
        
        allItems = [...allItems, ...batchItems];
      }
    }

    // Exportación completada
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
