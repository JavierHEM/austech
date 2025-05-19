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
  tipos_afilado: TipoAfilado | { id: number; nombre: string }[];
}

// Interfaz para los filtros del reporte
export interface ReporteAfiladosPorClienteFilters {
  empresa_id: number | string;
  sucursal_id: number | string | null;
  tipo_sierra_id: number | string | null;
  tipo_afilado_id: number | string | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  activo?: boolean;
  estado_afilado?: boolean;
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
): Promise<ReporteAfiladoItem[]> => {
  try {
    console.log('Generando reporte con filtros:', filters);
    
    // Consulta directa de afilados con todos los datos necesarios
    let query = supabase
      .from('afilados')
      .select(`
        id,
        fecha_afilado,
        fecha_salida,
        creado_en,
        modificado_en,
        sierra_id,
        tipo_afilado_id,
        usuario_id,
        estado,
        sierras!inner(
          id,
          codigo_barras,
          activo,
          fecha_registro,
          sucursal_id,
          tipo_sierra_id,
          estado_id,
          estados_sierra!inner(id, nombre),
          sucursales!inner(id, nombre, empresa_id, empresas!inner(id, razon_social)),
          tipos_sierra!inner(id, nombre)
        ),
        tipos_afilado!inner(id, nombre)
      `)
      .order('fecha_afilado', { ascending: false })
    
    // Filtrar por empresa_id (convertir a número si es string)
    const empresaId = typeof filters.empresa_id === 'string' ? parseInt(filters.empresa_id) : filters.empresa_id;
    console.log('Filtrando por empresa_id:', empresaId, 'tipo:', typeof empresaId);
    query = query.eq('sierras.sucursales.empresa_id', empresaId);
    
    // El filtro 'activo' se eliminó por ser redundante
    // Ahora solo usamos 'estado_afilado' para filtrar por el estado del afilado
    
    // Aplicar filtro por sucursal si se especifica
    if (filters.sucursal_id) {
      if (typeof filters.sucursal_id === 'string') {
        // Si es string, verificar si es valor especial
        if (filters.sucursal_id !== 'all_sucursales') {
          // Convertir a número solo si no es valor especial
          query = query.eq('sierras.sucursal_id', parseInt(filters.sucursal_id));
        }
      } else {
        // Si ya es número, usar directamente
        query = query.eq('sierras.sucursal_id', filters.sucursal_id);
      }
    }
    
    // Aplicar filtro por tipo de sierra si se especifica
    if (filters.tipo_sierra_id) {
      if (typeof filters.tipo_sierra_id === 'string') {
        // Si es string, verificar si es valor especial
        if (filters.tipo_sierra_id !== 'all_tipos') {
          // Convertir a número solo si no es valor especial
          query = query.eq('sierras.tipo_sierra_id', parseInt(filters.tipo_sierra_id));
        }
      } else {
        // Si ya es número, usar directamente
        query = query.eq('sierras.tipo_sierra_id', filters.tipo_sierra_id);
      }
    }
    
    // Aplicar filtro por tipo de afilado si se especifica
    if (filters.tipo_afilado_id) {
      if (typeof filters.tipo_afilado_id === 'string') {
        // Si es string, verificar si es valor especial
        if (filters.tipo_afilado_id !== 'all_tipos') {
          // Convertir a número solo si no es valor especial
          query = query.eq('tipo_afilado_id', parseInt(filters.tipo_afilado_id));
        }
      } else {
        // Si ya es número, usar directamente
        query = query.eq('tipo_afilado_id', filters.tipo_afilado_id);
      }
    }
    
    // Aplicar filtros de fecha
    if (filters.fecha_desde) {
      const fechaDesde = new Date(filters.fecha_desde as string);
      fechaDesde.setHours(0, 0, 0, 0);
      const fechaDesdeStr = fechaDesde.toISOString().split('T')[0];
      console.log('Filtrando por fecha desde:', fechaDesdeStr);
      query = query.gte('fecha_afilado', fechaDesdeStr);
    }
    
    if (filters.fecha_hasta) {
      const fechaHasta = new Date(filters.fecha_hasta as string);
      fechaHasta.setHours(23, 59, 59, 999);
      const fechaHastaStr = fechaHasta.toISOString().split('T')[0];
      console.log('Filtrando por fecha hasta:', fechaHastaStr);
      query = query.lte('fecha_afilado', fechaHastaStr);
    }
    
    // Aplicar filtro por estado del afilado si está definido
    if (typeof filters.estado_afilado === 'boolean') {
      console.log('Filtrando por estado del afilado:', filters.estado_afilado);
      query = query.eq('estado', filters.estado_afilado);
    }
    
    // Ejecutar la consulta
    console.log('Ejecutando consulta de afilados...');
    const { data: afiladosData, error: afiladosError } = await query;
      
    console.log('Resultado de la consulta:', afiladosData ? 'Datos obtenidos' : 'Sin datos', 'Error:', afiladosError);
    
    if (afiladosError) {
      console.error('Error al obtener afilados:', afiladosError);
      throw new Error('Error al generar el reporte: ' + afiladosError.message);
    }
    
    // Si no hay datos, retornamos un array vacío
    if (!afiladosData || afiladosData.length === 0) {
      return [];
    }
    
    // Aseguramos que afiladosData sea tratado como AfiladoData[]
    const afiladosTyped = afiladosData as unknown as AfiladoData[];
    
    // Los datos ya vienen con toda la información necesaria de las relaciones
    // No necesitamos hacer consultas adicionales para sucursales o empresas
    
    // Obtenemos los tipos de sierra
    const tiposSierraIds = afiladosTyped.map(item => item.sierras.tipo_sierra_id);
    const uniqueTiposSierraIds = [...new Set(tiposSierraIds)];
    
    const { data: tiposSierraData, error: tiposSierraError } = await supabase
      .from('tipos_sierra')
      .select('id, nombre')
      .in('id', uniqueTiposSierraIds);
    
    if (tiposSierraError) {
      console.error('Error al obtener tipos de sierra:', tiposSierraError);
      throw new Error('Error al generar el reporte: ' + tiposSierraError.message);
    }
    
    // Creamos un mapa de tipos de sierra
    const tiposSierraMap = new Map<number, string>();
    
    if (tiposSierraData) {
      tiposSierraData.forEach(tipo => {
        tiposSierraMap.set(tipo.id, tipo.nombre);
      });
    }
    
    // Obtenemos los estados de sierra para cada sierra
    const sierraIds = afiladosTyped.map(item => item.sierras.id);
    const uniqueSierraIds = [...new Set(sierraIds)];
    
    const { data: estadosSierraData, error: estadosSierraError } = await supabase
      .from('estados_sierra')
      .select('*');
      
    if (estadosSierraError) {
      console.error('Error al obtener estados de sierra:', estadosSierraError);
      throw new Error('Error al generar el reporte: ' + estadosSierraError.message);
    }
    
    // Creamos un mapa de estados de sierra
    const estadosSierraMap = new Map<number, { id: number; nombre: string }>();
    
    if (estadosSierraData) {
      estadosSierraData.forEach(estado => {
        estadosSierraMap.set(estado.id, {
          id: estado.id,
          nombre: estado.nombre || 'Desconocido'
        });
      });
    }
    
    // Aplicamos los filtros específicos
    let filteredData = afiladosTyped;
    
    // Filtro por sucursal
    if (filters.sucursal_id) {
      filteredData = filteredData.filter(item => 
        item.sierras.sucursal_id === filters.sucursal_id
      );
    }
    
    // Filtro por tipo de sierra
    if (filters.tipo_sierra_id) {
      filteredData = filteredData.filter(item => 
        item.sierras.tipo_sierra_id === filters.tipo_sierra_id
      );
    }
    
    // Filtro por tipo de afilado (ya aplicado en la consulta SQL)
    // Mantenemos este filtro en memoria como respaldo
    if (filters.tipo_afilado_id) {
      filteredData = filteredData.filter(item => 
        item.tipo_afilado_id === filters.tipo_afilado_id
      );
    }
    
    // Filtros de fecha (ya aplicados en la consulta SQL)
    // Mantenemos estos filtros en memoria como respaldo
    if (filters.fecha_desde) {
      const fechaDesde = new Date(filters.fecha_desde as string);
      fechaDesde.setHours(0, 0, 0, 0);
      console.log('Verificando filtro por fecha desde:', fechaDesde.toISOString());
      
      filteredData = filteredData.filter(item => {
        if (!item.fecha_afilado) return false;
        const itemDate = new Date(item.fecha_afilado);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= fechaDesde;
      });
    }
    
    if (filters.fecha_hasta) {
      const fechaHasta = new Date(filters.fecha_hasta as string);
      fechaHasta.setHours(23, 59, 59, 999);
      console.log('Verificando filtro por fecha hasta:', fechaHasta.toISOString());
      
      filteredData = filteredData.filter(item => {
        if (!item.fecha_afilado) return false;
        const itemDate = new Date(item.fecha_afilado);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate <= fechaHasta;
      });
    }
    
    // Filtro por activo
    if (typeof filters.activo === 'boolean') {
      filteredData = filteredData.filter(item => 
        item.sierras.activo === filters.activo
      );
    }
    
    // Transformar los datos al formato esperado
    const transformedData: ReporteAfiladoItem[] = [];
    
    if (afiladosData && afiladosData.length > 0) {
      console.log(`Procesando ${afiladosData.length} registros de afilados`);
      
      for (const item of afiladosData) {
        try {
          // Acceder a los datos de forma segura
          // Asegurarnos de que las propiedades anidadas existen
          if (!item || !item.sierras) {
            console.log('Item sin sierra:', item);
            continue;
          }
          
          // Tratar sierra como un objeto, no como un array
          const sierra = item.sierras as any;
          
          // Acceder a sucursales de forma segura
          let sucursal: any = null;
          if (sierra.sucursales) {
            // Puede ser un array u objeto
            if (Array.isArray(sierra.sucursales) && sierra.sucursales.length > 0) {
              sucursal = sierra.sucursales[0];
            } else {
              sucursal = sierra.sucursales;
            }
          }
          
          if (!sucursal) {
            console.log('Item sin sucursal:', item);
            continue;
          }
          
          // Acceder a tipo_afilado de forma segura
          let tipoAfilado: any = null;
          if (item.tipos_afilado) {
            if (Array.isArray(item.tipos_afilado) && item.tipos_afilado.length > 0) {
              tipoAfilado = item.tipos_afilado[0];
            } else {
              tipoAfilado = item.tipos_afilado;
            }
          }
          
          if (!tipoAfilado) {
            console.log('Item sin tipo de afilado:', item);
            continue;
          }
          
          // Formatear fechas para mostrar solo la parte de fecha
          const fechaAfilado = item.fecha_afilado ? formatDateWithoutTime(item.fecha_afilado) : null;
          const fechaSalida = item.fecha_salida ? formatDateWithoutTime(item.fecha_salida) : null;
          const fechaRegistro = sierra.fecha_registro ? formatDateWithoutTime(sierra.fecha_registro) : null;
          
          // Obtener nombres de empresas, sucursales, etc.
          let empresaNombre = 'Desconocida';
          if (sucursal.empresas) {
            if (Array.isArray(sucursal.empresas) && sucursal.empresas.length > 0) {
              empresaNombre = sucursal.empresas[0]?.razon_social || 'Desconocida';
            } else {
              empresaNombre = (sucursal.empresas as any).razon_social || 'Desconocida';
            }
          }
                              
          const sucursalNombre = sucursal.nombre || 'Sin nombre';
          
          let tipoSierraNombre = 'Desconocido';
          if (sierra.tipos_sierra) {
            if (Array.isArray(sierra.tipos_sierra) && sierra.tipos_sierra.length > 0) {
              tipoSierraNombre = sierra.tipos_sierra[0]?.nombre || 'Desconocido';
            } else {
              tipoSierraNombre = (sierra.tipos_sierra as any).nombre || 'Desconocido';
            }
          }
                                 
          const tipoAfiladoNombre = tipoAfilado.nombre || 'Desconocido';
          
          // Usar directamente el valor del campo estado de la tabla afilados
          // El campo estado es de tipo booleano (TRUE/FALSE)
          let estadoAfilado = '';
          
          // Simplificar la lógica para manejar el campo estado
          // En PostgreSQL, los booleanos pueden venir como true/false o como strings 't'/'f'
          if (item.estado === true || item.estado === 't') {
            estadoAfilado = 'Activo';
          } else if (item.estado === false || item.estado === 'f') {
            estadoAfilado = 'Inactivo';
          } else {
            // Fallback por si el campo no está disponible
            estadoAfilado = 'Desconocido';
          }
          
          // Mantener el estado de la sierra para compatibilidad
          let estadoSierraNombre = 'Desconocido';
          if (sierra.estados_sierra) {
            if (Array.isArray(sierra.estados_sierra) && sierra.estados_sierra.length > 0) {
              estadoSierraNombre = sierra.estados_sierra[0]?.nombre || 'Desconocido';
            } else {
              estadoSierraNombre = (sierra.estados_sierra as any).nombre || 'Desconocido';
            }
          }
          
          // Crear el objeto de reporte
          transformedData.push({
            id: item.id,
            empresa: empresaNombre,
            empresa_id: sucursal.empresa_id,
            sucursal: sucursalNombre,
            sucursal_id: sucursal.id,
            tipo_sierra: tipoSierraNombre,
            tipo_sierra_id: sierra.tipo_sierra_id,
            codigo_sierra: sierra.codigo_barras || 'Sin código',
            tipo_afilado: tipoAfiladoNombre,
            tipo_afilado_id: item.tipo_afilado_id,
            estado_sierra: estadoSierraNombre,
            fecha_afilado: fechaAfilado,
            fecha_salida: fechaSalida,
            estado_afilado: estadoAfilado,
            fecha_registro: fechaRegistro,
            activo: sierra.activo
          });
        } catch (err) {
          console.error('Error al procesar afilado:', err, 'Datos:', item);
        }
      }
    }
    
    // Los datos ya vienen ordenados por fecha de afilado descendente desde la consulta SQL
    
    console.log(`Se encontraron ${transformedData.length} registros después de aplicar filtros`);
    return transformedData;
  } catch (error) {
    console.error('Error al generar reporte:', error);
    throw error;
  }
};
