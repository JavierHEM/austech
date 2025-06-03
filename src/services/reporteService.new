// src/services/reporteService.ts
import { supabase } from '@/lib/supabase-client';
import { Empresa } from '@/types/empresa';
import { format } from 'date-fns';

// Función auxiliar para formatear fechas sin la parte de tiempo
const formatDateWithoutTime = (dateString: string): string => {
  try {
    // Extraer solo la parte de fecha (YYYY-MM-DD) sin convertir a objeto Date
    // para evitar problemas con zonas horarias
    return dateString.split('T')[0];
  } catch (error) {
    console.error('Error al formatear fecha:', error, dateString);
    return dateString; // Devolver la fecha original si hay error
  }
};

// Definir interfaces para los tipos de datos de Supabase
interface Sierra {
  id: number;
  codigo_barras: string;
  activo: boolean;
  fecha_registro: string;
  sucursal_id: number;
  tipo_sierra_id: number;
  estado_id: number;
  estados_sierra: EstadoSierra;
  sucursales: {
    id: number;
    nombre: string;
    empresa_id: number;
    empresas: {
      id: number;
      razon_social: string;
    };
  };
  tipos_sierra: {
    id: number;
    nombre: string;
  };
}

interface TipoAfilado {
  id: number;
  nombre: string;
}

interface EstadoSierra {
  id: number;
  nombre: string;
}

// Interfaz para los datos de afilado que vienen de Supabase
interface AfiladoData {
  id: number;
  fecha_afilado: string;
  fecha_salida: string | null;
  creado_en: string;
  modificado_en: string | null;
  sierra_id: number;
  tipo_afilado_id: number;
  usuario_id: string;
  estado: boolean;
  sierras: Sierra;
  tipos_afilado: TipoAfilado;
}

// Interfaz para los filtros de reporte de afilados por cliente
export interface ReporteAfiladosPorClienteFilters {
  empresa_id: number | string | null;
  sucursal_id?: number | string | null;
  fecha_desde?: Date | string | null;
  fecha_hasta?: Date | string | null;
  tipo_sierra_id?: number | string | null;
  tipo_afilado_id?: number | string | null;
  activo?: boolean;
  estado_afilado?: string;
  // Parámetros de paginación
  page?: number;
  pageSize?: number;
  // Flag para indicar si es una exportación (sin límites de registros)
  isExport?: boolean;
}

// Interfaz para el resultado paginado del reporte
export interface PaginatedReporteResult {
  items: ReporteAfiladoItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Interfaz para un ítem de reporte
export interface ReporteAfiladoItem {
  id: number;
  empresa: string;
  empresa_id: number;
  sucursal: string;
  sucursal_id: number;
  tipo_sierra: string;
  tipo_sierra_id: number;
  codigo_sierra: string;
  tipo_afilado: string;
  tipo_afilado_id: number;
  estado_sierra: string; // Mantenemos este campo para compatibilidad
  fecha_afilado: string | null;
  fecha_salida: string | null; // Fecha de salida del afilado
  estado_afilado: string; // Estado del afilado (Activo/Inactivo)
  fecha_registro: string | null;
  activo: boolean;
  observaciones: string | null; // Observaciones de la sierra
}

// Obtener empresas activas
export const getEmpresasActivas = async (): Promise<Empresa[]> => {
  try {
    console.log('Obteniendo empresas activas');
    
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('activo', true)
      .order('razon_social');
      
    if (error) {
      console.error('Error al obtener empresas activas:', error);
      throw new Error('Error al obtener empresas: ' + error.message);
    }
    
    console.log(`Se encontraron ${data?.length || 0} empresas activas`);
    return data || [];
  } catch (error) {
    console.error('Error al obtener empresas activas:', error);
    throw error;
  }
};

// Obtener el reporte de afilados por cliente con los filtros aplicados
export const getReporteAfiladosPorCliente = async (
  filters: ReporteAfiladosPorClienteFilters
): Promise<PaginatedReporteResult> => {
  try {
    // Validaciones de fechas
    if (!filters.isExport && (!filters.fecha_desde || !filters.fecha_hasta)) {
      throw new Error('Debe especificar un rango de fechas para generar el reporte');
    }
    if (!filters.isExport && filters.fecha_desde && filters.fecha_hasta) {
      const fechaDesde = new Date(filters.fecha_desde as string);
      const fechaHasta = new Date(filters.fecha_hasta as string);
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 31) {
        throw new Error('El rango de fechas no puede ser mayor a 31 días');
      }
    }

    // Paginación
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const startRow = (page - 1) * pageSize;

    // Consulta de conteo
    let countQuery = supabase
      .from('afilados')
      .select('id, sierras!inner(id, sucursal_id, sucursales!inner(empresa_id))', { count: 'exact', head: true });

    // Filtros comunes
    const applyCommonFilters = (q: any) => {
      const empresaId = typeof filters.empresa_id === 'string' ? parseInt(filters.empresa_id) : filters.empresa_id;
      q = q.eq('sierras.sucursales.empresa_id', empresaId);
      if (filters.sucursal_id) {
        if (typeof filters.sucursal_id === 'string' && filters.sucursal_id !== 'all_sucursales') {
          q = q.eq('sierras.sucursal_id', parseInt(filters.sucursal_id));
        } else if (typeof filters.sucursal_id === 'number') {
          q = q.eq('sierras.sucursal_id', filters.sucursal_id);
        }
      }
      if (filters.tipo_sierra_id) {
        if (typeof filters.tipo_sierra_id === 'string' && filters.tipo_sierra_id !== 'all_tipos') {
          q = q.eq('sierras.tipo_sierra_id', parseInt(filters.tipo_sierra_id));
        } else if (typeof filters.tipo_sierra_id === 'number') {
          q = q.eq('sierras.tipo_sierra_id', filters.tipo_sierra_id);
        }
      }
      if (filters.tipo_afilado_id) {
        if (typeof filters.tipo_afilado_id === 'string' && filters.tipo_afilado_id !== 'all_tipos') {
          q = q.eq('tipo_afilado_id', parseInt(filters.tipo_afilado_id));
        } else if (typeof filters.tipo_afilado_id === 'number') {
          q = q.eq('tipo_afilado_id', filters.tipo_afilado_id);
        }
      }
      if (filters.fecha_desde) {
        const fechaDesde = new Date(filters.fecha_desde as string);
        fechaDesde.setHours(0, 0, 0, 0);
        q = q.gte('fecha_afilado', fechaDesde.toISOString().split('T')[0]);
      }
      if (filters.fecha_hasta) {
        const fechaHasta = new Date(filters.fecha_hasta as string);
        fechaHasta.setHours(23, 59, 59, 999);
        q = q.lte('fecha_afilado', fechaHasta.toISOString().split('T')[0]);
      }
      if (typeof filters.activo === 'boolean') {
        q = q.eq('sierras.activo', filters.activo);
      }
      return q;
    };

    // Aplicar filtros a la consulta de conteo
    countQuery = applyCommonFilters(countQuery);
    
    // Ejecutar conteo
    const { count: totalCount, error: countError } = await countQuery;
    if (countError) throw new Error('Error al contar registros: ' + countError.message);
    
    // Función auxiliar para procesar un ítem de afilado
    const processAfiladoItem = (item: any): ReporteAfiladoItem => {
      const sierra = item.sierras;
      const sucursal = sierra.sucursales;
      const empresa = sucursal.empresas;
      const tipoAfilado = item.tipos_afilado;
      const tipoSierra = sierra.tipos_sierra;
      const estadoSierra = sierra.estados_sierra;
      const fechaAfilado = item.fecha_afilado ? formatDateWithoutTime(item.fecha_afilado) : null;
      const fechaSalida = item.fecha_salida ? formatDateWithoutTime(item.fecha_salida) : null;
      const fechaRegistro = sierra.fecha_registro ? formatDateWithoutTime(sierra.fecha_registro) : null;
      let estadoAfilado = '';
      if (item.estado === true || item.estado === 't') estadoAfilado = 'Activo';
      else if (item.estado === false || item.estado === 'f') estadoAfilado = 'Inactivo';
      return {
        id: item.id,
        empresa: empresa?.razon_social || 'Desconocida',
        empresa_id: sucursal?.empresa_id || null,
        sucursal: sucursal?.nombre || 'Sin nombre',
        sucursal_id: sucursal?.id || null,
        tipo_sierra: tipoSierra?.nombre || 'Desconocido',
        tipo_sierra_id: sierra?.tipo_sierra_id || null,
        codigo_sierra: sierra?.codigo_barras || '',
        tipo_afilado: tipoAfilado?.nombre || 'Desconocido',
        tipo_afilado_id: item.tipo_afilado_id || null,
        estado_sierra: estadoSierra?.nombre || '',
        fecha_afilado: fechaAfilado,
        fecha_salida: fechaSalida,
        estado_afilado: estadoAfilado,
        fecha_registro: fechaRegistro,
        activo: sierra?.activo,
        observaciones: sierra?.observaciones || null
      };
    };
    
    // Para exportaciones, siempre usar el mecanismo de lotes para evitar limitaciones
    if (filters.isExport) {
      const actualCount = totalCount || 0;
      console.log(`Exportando ${actualCount} registros en lotes...`);
      
      // Calcular el número de lotes necesarios (cada lote tiene 1000 registros como máximo)
      const batchSize = 1000;
      const batchCount = Math.ceil(actualCount / batchSize);
      let allItems: ReporteAfiladoItem[] = [];
      
      // Obtener registros en lotes
      for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min((batchIndex + 1) * batchSize - 1, actualCount - 1);
        
        console.log(`Obteniendo lote ${batchIndex + 1}/${batchCount} (registros ${batchStart}-${batchEnd})`);
        
        // Consulta para este lote
        let batchQuery = supabase
          .from('afilados')
          .select(`
            id, fecha_afilado, fecha_salida, creado_en, modificado_en, sierra_id, tipo_afilado_id, usuario_id, estado,
            sierras!inner(id, codigo_barras, activo, fecha_registro, observaciones, sucursal_id, tipo_sierra_id, estado_id, estados_sierra!inner(id, nombre), sucursales!inner(id, nombre, empresa_id, empresas!inner(id, razon_social)), tipos_sierra!inner(id, nombre)),
            tipos_afilado!inner(id, nombre)
          `)
          .order('fecha_afilado', { ascending: false })
          .range(batchStart, batchEnd);
        
        // Aplicar los mismos filtros
        batchQuery = applyCommonFilters(batchQuery);
        
        // Ejecutar consulta para este lote
        const { data: batchData, error: batchError } = await batchQuery;
        if (batchError) throw new Error(`Error al obtener lote ${batchIndex + 1}: ${batchError.message}`);
        
        // Procesar resultados de este lote
        if (batchData && batchData.length > 0) {
          const batchItems = batchData.map((item: any) => processAfiladoItem(item));
          allItems = [...allItems, ...batchItems];
        }
      }
      
      console.log(`Exportación completada: ${allItems.length} registros obtenidos`);
      
      return {
        items: allItems,
        total: actualCount,
        page: 1,
        pageSize: actualCount,
        totalPages: 1
      };
    } else {
      // Consulta principal (para visualización normal o exportaciones pequeñas)
      let query = supabase
        .from('afilados')
        .select(`
          id, fecha_afilado, fecha_salida, creado_en, modificado_en, sierra_id, tipo_afilado_id, usuario_id, estado,
          sierras!inner(id, codigo_barras, activo, fecha_registro, observaciones, sucursal_id, tipo_sierra_id, estado_id, estados_sierra!inner(id, nombre), sucursales!inner(id, nombre, empresa_id, empresas!inner(id, razon_social)), tipos_sierra!inner(id, nombre)),
          tipos_afilado!inner(id, nombre)
        `)
        .order('fecha_afilado', { ascending: false });
      
      // Aplicar filtros
      query = applyCommonFilters(query);
      
      // Aplicar paginación o límite según corresponda
      if (filters.isExport) {
        // Para exportaciones, no usar límite para obtener todos los registros
        // No aplicamos límite para permitir exportar todos los registros
      } else {
        // Para visualización normal, usar paginación
        query = query.range(startRow, startRow + pageSize - 1);
      }
      
      // Ejecutar consulta principal
      const { data: afiladosData, error: afiladosError } = await query;
      if (afiladosError) throw new Error('Error al obtener afilados: ' + afiladosError.message);
      if (!afiladosData || afiladosData.length === 0) {
        return {
          items: [],
          total: totalCount || 0,
          page,
          pageSize,
          totalPages: 0
        };
      }

      // Procesar resultados
      const items: ReporteAfiladoItem[] = afiladosData.map((item: any) => processAfiladoItem(item));

      return {
        items,
        total: totalCount || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalCount || 0) / pageSize)
      };
    }
  } catch (error: any) {
    console.error('Error al generar reporte:', error, JSON.stringify(error));
    if (error instanceof Error) {
      console.error('Error.message:', error.message);
      console.error('Error.stack:', error.stack);
    }
    throw error;
  }
};
