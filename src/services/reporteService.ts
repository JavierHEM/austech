// src/services/reporteService.ts
import { supabase } from '@/lib/supabase-client';
import { Empresa } from '@/types/empresa';

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
  sierras: Sierra;
  tipos_afilado: TipoAfilado | { id: number; nombre: string }[];
}

// Interfaz para los filtros del reporte
export interface ReporteAfiladosPorClienteFilters {
  empresa_id: number;
  sucursal_id: number | null;
  tipo_sierra_id: number | null;
  tipo_afilado_id: number | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  activo?: boolean;
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
  estado_sierra: string;
  fecha_afilado: string;
  fecha_registro: string;
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
    
    // Basado en el esquema de la DB:
    // - La tabla 'afilados' tiene una clave foránea a 'sierras' (sierra_id)
    // - La tabla 'sierras' tiene claves foráneas a 'sucursales' y 'tipos_sierra'
    // - La tabla 'sucursales' tiene una clave foránea a 'empresas'
    // - La tabla 'afilados' tiene una clave foránea a 'tipos_afilado'
    
    console.log('Iniciando consulta de afilados con filtros:', filters);
    
    // Primero, ejecutamos la consulta básica para obtener los afilados con sus sierras
    const { data: afiladosData, error: afiladosError } = await supabase
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
        sierras(
          id,
          codigo_barras,
          activo,
          fecha_registro,
          sucursal_id,
          tipo_sierra_id,
          estado_id
        ),
        tipos_afilado(
          id,
          nombre
        )
      `);
      
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
    
    // Extraemos los IDs de las sucursales para obtener sus datos
    const sucursalIds = afiladosTyped.map(item => item.sierras.sucursal_id);
    const uniqueSucursalIds = [...new Set(sucursalIds)];
    
    // Obtenemos las sucursales
    const { data: sucursalesData, error: sucursalesError } = await supabase
      .from('sucursales')
      .select(`
        id,
        nombre,
        empresa_id,
        empresas(
          id,
          razon_social
        )
      `)
      .in('id', uniqueSucursalIds)
      .eq('empresa_id', filters.empresa_id); // Aplicamos el filtro de empresa
    
    if (sucursalesError) {
      console.error('Error al obtener sucursales:', sucursalesError);
      throw new Error('Error al generar el reporte: ' + sucursalesError.message);
    }
    
    // Creamos un mapa de sucursales para facilitar la búsqueda
    const sucursalesMap = new Map<number, { nombre: string; empresa_id: number; empresa_nombre: string }>();
    
    if (sucursalesData) {
      sucursalesData.forEach(sucursal => {
        // Tenemos que acceder al primer elemento del array de empresas
        const empresa = Array.isArray(sucursal.empresas) ? sucursal.empresas[0] : sucursal.empresas;
        
        sucursalesMap.set(sucursal.id, {
          nombre: sucursal.nombre,
          empresa_id: sucursal.empresa_id,
          empresa_nombre: empresa.razon_social
        });
      });
    }
    
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
    
    // Filtro por tipo de afilado
    if (filters.tipo_afilado_id) {
      filteredData = filteredData.filter(item => 
        item.tipo_afilado_id === filters.tipo_afilado_id
      );
    }
    
    // Filtro por fecha desde
    if (filters.fecha_desde) {
      filteredData = filteredData.filter(item => 
        new Date(item.fecha_afilado) >= new Date(filters.fecha_desde as string)
      );
    }
    
    // Filtro por fecha hasta
    if (filters.fecha_hasta) {
      filteredData = filteredData.filter(item => 
        new Date(item.fecha_afilado) <= new Date(filters.fecha_hasta as string)
      );
    }
    
    // Filtro por activo
    if (typeof filters.activo === 'boolean') {
      filteredData = filteredData.filter(item => 
        item.sierras.activo === filters.activo
      );
    }
    
    // Transformar los datos al formato esperado
    const transformedData: ReporteAfiladoItem[] = filteredData
      .filter(item => {
        // Solo incluimos los elementos que tenemos datos de sucursal/empresa
        const sucursalInfo = sucursalesMap.get(item.sierras.sucursal_id);
        return sucursalInfo !== undefined;
      })
      .map(item => {
        const sucursalInfo = sucursalesMap.get(item.sierras.sucursal_id);
        const tipoSierraNombre = tiposSierraMap.get(item.sierras.tipo_sierra_id) || 'Desconocido';
        
        if (!sucursalInfo) {
          throw new Error(`No se encontró información de sucursal para ID: ${item.sierras.sucursal_id}`);
        }
        
        // Obtenemos el nombre del estado de sierra del mapa
        const estadoSierra = estadosSierraMap.get(item.sierras.estado_id);
        const estadoSierraNombre = estadoSierra ? estadoSierra.nombre : 'Desconocido';
        
        // Para manejar tipos_afilado, que puede ser un array o un objeto
        let tipoAfiladoNombre = 'Desconocido';
        if (item.tipos_afilado) {
          if (Array.isArray(item.tipos_afilado)) {
            // Si es un array, tomamos el primer elemento
            if (item.tipos_afilado.length > 0) {
              tipoAfiladoNombre = item.tipos_afilado[0].nombre;
            }
          } else {
            // Si es un objeto, tomamos su propiedad nombre
            tipoAfiladoNombre = (item.tipos_afilado as TipoAfilado).nombre;
          }
        }
        
        return {
          id: item.id,
          empresa: sucursalInfo.empresa_nombre,
          empresa_id: sucursalInfo.empresa_id,
          sucursal: sucursalInfo.nombre,
          sucursal_id: item.sierras.sucursal_id,
          tipo_sierra: tipoSierraNombre,
          tipo_sierra_id: item.sierras.tipo_sierra_id,
          codigo_sierra: item.sierras.codigo_barras || 'Sin código',
          tipo_afilado: tipoAfiladoNombre,
          tipo_afilado_id: item.tipo_afilado_id,
          estado_sierra: estadoSierraNombre,
          fecha_afilado: item.fecha_afilado,
          fecha_registro: item.sierras.fecha_registro || item.creado_en,
          activo: item.sierras.activo
        };
      });
    
    // Ordenar por fecha de afilado descendente
    transformedData.sort((a, b) => 
      new Date(b.fecha_afilado).getTime() - new Date(a.fecha_afilado).getTime()
    );
    
    console.log(`Se encontraron ${transformedData.length} registros después de aplicar filtros`);
    return transformedData;
  } catch (error) {
    console.error('Error al generar reporte:', error);
    throw error;
  }
};