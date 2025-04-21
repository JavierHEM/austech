import { supabase } from '@/lib/supabase-client';
import { Empresa } from '@/types/empresa';
import { AfiladoConRelaciones } from '@/types/afilado';
import { SierraConRelaciones } from '@/types/sierra';

export interface ReporteAfiladosPorClienteFilters {
  empresa_id: number;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
  sucursal_id?: number | null;
  tipo_sierra_id?: number | null;
  tipo_afilado_id?: number | null;
  activo?: boolean | null;
}

export interface ReporteAfiladoItem {
  id: number;
  empresa: string;
  sucursal: string;
  tipo_sierra: string;
  codigo_sierra: string;
  tipo_afilado: string;
  estado_sierra: string;
  fecha_afilado: string;
  fecha_registro: string;
  activo: boolean;
  observaciones?: string;
}

/**
 * Obtiene los datos para el reporte de afilados por cliente
 */
export const getReporteAfiladosPorCliente = async (
  filters: ReporteAfiladosPorClienteFilters
): Promise<ReporteAfiladoItem[]> => {
  try {
    // Obtenemos la información de la empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, razon_social')
      .eq('id', filters.empresa_id)
      .single();
      
    if (empresaError) {
      console.error('Error al obtener información de la empresa:', empresaError);
      throw new Error(empresaError.message);
    }
    
    // Primero obtenemos las sucursales de la empresa
    let sucursalesQuery = supabase
      .from('sucursales')
      .select('id, nombre')
      .eq('empresa_id', filters.empresa_id);
      
    // Si se especificó una sucursal específica, filtramos por ella
    if (filters.sucursal_id) {
      sucursalesQuery = sucursalesQuery.eq('id', filters.sucursal_id);
    } else {
      // Si no se especificó una sucursal, solo mostramos las activas
      sucursalesQuery = sucursalesQuery.eq('activo', true);
    }
    
    const { data: sucursales, error: sucursalesError } = await sucursalesQuery;

    if (sucursalesError) {
      console.error('Error al obtener sucursales:', sucursalesError);
      throw new Error(sucursalesError.message);
    }

    if (!sucursales || sucursales.length === 0) {
      return [];
    }

    // IDs de las sucursales de la empresa
    const sucursalIds = sucursales.map(s => s.id);

    // Obtenemos las sierras de esas sucursales
    let sierrasQuery = supabase
      .from('sierras')
      .select(`
        id, 
        codigo_barras,
        fecha_registro,
        activo,
        sucursal:sucursal_id(id, nombre),
        tipo_sierra:tipo_sierra_id(id, nombre),
        estado_sierra:estado_id(id, nombre)
      `)
      .in('sucursal_id', sucursalIds);
      
    // Aplicar filtros adicionales si existen
    if (filters.tipo_sierra_id) {
      sierrasQuery = sierrasQuery.eq('tipo_sierra_id', filters.tipo_sierra_id);
    }
    
    // Solo aplicamos el filtro de activo si es un valor booleano (true o false)
    // PostgreSQL no acepta null como valor para una columna booleana
    if (typeof filters.activo === 'boolean') {
      sierrasQuery = sierrasQuery.eq('activo', filters.activo);
    }
    
    const { data: sierras, error: sierrasError } = await sierrasQuery;
      
    // Definimos el tipo para las sierras con sus relaciones
    interface SierraReporte {
      id: number;
      codigo_barras: string;
      fecha_registro: string;
      activo: boolean;
      sucursal: { id: number; nombre: string };
      tipo_sierra: { id: number; nombre: string };
      estado_sierra: { id: number; nombre: string };
    }

    if (sierrasError) {
      console.error('Error al obtener sierras:', sierrasError);
      throw new Error(sierrasError.message);
    }

    if (!sierras || sierras.length === 0) {
      return [];
    }

    // IDs de las sierras
    const sierraIds = sierras.map(s => s.id);

    // Construimos la consulta para obtener los afilados
    let query = supabase
      .from('afilados')
      .select(`
        id,
        fecha_afilado,
        sierra_id,
        observaciones,
        tipo_afilado:tipo_afilado_id(id, nombre)
      `)
      .in('sierra_id', sierraIds)
      .order('fecha_afilado', { ascending: false });
      
    // Aplicar filtro de tipo de afilado si existe
    if (filters.tipo_afilado_id) {
      query = query.eq('tipo_afilado_id', filters.tipo_afilado_id);
    }
      
    // Definimos el tipo para los afilados con sus relaciones
    interface AfiladoReporte {
      id: number;
      fecha_afilado: string;
      sierra_id: number;
      tipo_afilado: { id: number; nombre: string } | null;
    }

    // Aplicar filtros de fecha si existen
    if (filters.fecha_desde) {
      query = query.gte('fecha_afilado', filters.fecha_desde);
    }
    
    if (filters.fecha_hasta) {
      query = query.lte('fecha_afilado', filters.fecha_hasta);
    }

    const { data: afilados, error: afiladosError } = await query;

    if (afiladosError) {
      console.error('Error al obtener afilados:', afiladosError);
      throw new Error(afiladosError.message);
    }

    // Mapeamos los resultados al formato del reporte
    const reporteItems: ReporteAfiladoItem[] = [];

    for (const afilado of afilados || []) {
      const sierra = sierras?.find(s => s.id === afilado.sierra_id) as SierraReporte | undefined;
      if (sierra) {
        reporteItems.push({
          id: afilado.id,
          empresa: empresa.razon_social,
          sucursal: sierra.sucursal?.nombre || 'N/A',
          tipo_sierra: sierra.tipo_sierra?.nombre || 'N/A',
          codigo_sierra: sierra.codigo_barras || 'N/A',
          tipo_afilado: afilado.tipo_afilado && typeof afilado.tipo_afilado === 'object' && 'nombre' in afilado.tipo_afilado ? String(afilado.tipo_afilado.nombre) : 'N/A',
          estado_sierra: sierra.estado_sierra?.nombre || 'N/A',
          fecha_afilado: afilado.fecha_afilado,
          fecha_registro: sierra.fecha_registro,
          activo: sierra.activo,
          observaciones: afilado.observaciones
        });
      }
    }

    return reporteItems;
  } catch (error) {
    console.error('Error en getReporteAfiladosPorCliente:', error);
    throw error;
  }
};

/**
 * Obtiene todas las empresas activas para el selector
 */
export const getEmpresasActivas = async (): Promise<Empresa[]> => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('activo', true)
      .order('razon_social');
    
    if (error) {
      console.error('Error al obtener empresas activas:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getEmpresasActivas:', error);
    throw error;
  }
};