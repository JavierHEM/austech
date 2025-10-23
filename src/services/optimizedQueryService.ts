// src/services/optimizedQueryService.ts
import { supabase } from '@/lib/supabase-client';
import { queryAnalyzer } from './queryAnalyzer';

/**
 * Servicio optimizado con análisis de rendimiento integrado
 */
export class OptimizedQueryService {
  
  /**
   * Obtiene afilados con análisis de rendimiento
   */
  static async getAfiladosOptimized(
    filters: any = {},
    page: number = 1,
    pageSize: number = 10,
    empresaId?: number
  ) {
    return await queryAnalyzer.analyzeQuery('getAfiladosOptimized', async () => {
      // Consulta optimizada con índices sugeridos
      let query = supabase
        .from('afilados')
        .select(`
          id,
          fecha_afilado,
          fecha_salida,
          observaciones,
          estado,
          sierra:sierra_id(
            id,
            codigo_barras,
            sucursal_id,
            tipo_sierra_id,
            activo,
            tipos_sierra(id, nombre),
            sucursales(
              id,
              nombre,
              empresa_id,
              empresas(id, razon_social, rut)
            ),
            estados_sierra(id, nombre)
          ),
          tipo_afilado:tipo_afilado_id(id, nombre)
        `, { count: 'exact' });

      // Aplicar filtros de manera optimizada
      if (empresaId) {
        query = query.eq('sierra.sucursales.empresa_id', empresaId);
      }

      if (filters.fecha_desde) {
        query = query.gte('fecha_afilado', filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        query = query.lte('fecha_afilado', filters.fecha_hasta);
      }

      if (filters.tipo_afilado_id) {
        query = query.eq('tipo_afilado_id', filters.tipo_afilado_id);
      }

      // Paginación optimizada
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Ordenamiento optimizado
      query = query.order('fecha_afilado', { ascending: false });

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data || [],
        count: count || 0
      };
    });
  }

  /**
   * Obtiene estadísticas del dashboard con análisis de rendimiento
   */
  static async getDashboardStatsOptimized() {
    return await queryAnalyzer.analyzeQuery('getDashboardStatsOptimized', async () => {
      // Ejecutar consultas en paralelo para mejor rendimiento
      const [empresasResult, sucursalesResult, sierrasResult, afiladosResult] = await Promise.all([
        supabase.from('empresas').select('id', { count: 'exact', head: true }),
        supabase.from('sucursales').select('id', { count: 'exact', head: true }),
        supabase.from('sierras').select('id', { count: 'exact', head: true }),
        supabase.from('afilados').select('id', { count: 'exact', head: true })
      ]);

      // Verificar errores
      if (empresasResult.error) throw empresasResult.error;
      if (sucursalesResult.error) throw sucursalesResult.error;
      if (sierrasResult.error) throw sierrasResult.error;
      if (afiladosResult.error) throw afiladosResult.error;

      return {
        empresas: empresasResult.count || 0,
        sucursales: sucursalesResult.count || 0,
        sierras: sierrasResult.count || 0,
        afilados: afiladosResult.count || 0
      };
    });
  }

  /**
   * Obtiene sierras con análisis de rendimiento
   */
  static async getSierrasOptimized(
    filters: any = {},
    page: number = 1,
    pageSize: number = 10
  ) {
    return await queryAnalyzer.analyzeQuery('getSierrasOptimized', async () => {
      let query = supabase
        .from('sierras')
        .select(`
          id,
          codigo_barras,
          sucursal_id,
          tipo_sierra_id,
          estado_id,
          activo,
          fecha_registro,
          sucursales(id, nombre, empresa_id),
          tipos_sierra(id, nombre),
          estados_sierra(id, nombre)
        `, { count: 'exact' });

      // Aplicar filtros optimizados
      if (filters.codigo_barras) {
        query = query.ilike('codigo_barras', `%${filters.codigo_barras}%`);
      }

      if (filters.sucursal_id) {
        query = query.eq('sucursal_id', filters.sucursal_id);
      }

      if (filters.tipo_sierra_id) {
        query = query.eq('tipo_sierra_id', filters.tipo_sierra_id);
      }

      if (filters.estado_id) {
        query = query.eq('estado_id', filters.estado_id);
      }

      if (filters.activo !== undefined) {
        query = query.eq('activo', filters.activo);
      }

      // Paginación
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Ordenamiento
      query = query.order('fecha_registro', { ascending: false });

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data || [],
        count: count || 0
      };
    });
  }

  /**
   * Obtiene reportes optimizados
   */
  static async getReporteAfiladosOptimized(
    filters: any = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    return await queryAnalyzer.analyzeQuery('getReporteAfiladosOptimized', async () => {
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

      // Aplicar filtros optimizados
      if (filters.empresa_id) {
        query = query.eq('sierras.sucursales.empresa_id', filters.empresa_id);
      }

      if (filters.sucursal_id) {
        query = query.eq('sierras.sucursal_id', filters.sucursal_id);
      }

      if (filters.tipo_sierra_id) {
        query = query.eq('sierras.tipo_sierra_id', filters.tipo_sierra_id);
      }

      if (filters.tipo_afilado_id) {
        query = query.eq('tipos_afilado.id', filters.tipo_afilado_id);
      }

      if (filters.fecha_desde) {
        query = query.gte('fecha_afilado', filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        query = query.lte('fecha_afilado', filters.fecha_hasta);
      }

      // Paginación
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Ordenamiento
      query = query.order('fecha_afilado', { ascending: false });

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data || [],
        count: count || 0
      };
    });
  }

  /**
   * Genera recomendaciones de optimización basadas en métricas
   */
  static generateOptimizationRecommendations() {
    const report = queryAnalyzer.generateReport();
    const recommendations: string[] = [];

    // Analizar consultas lentas
    const slowQueries = report.slowestQueries.filter(q => q.executionTime > 1000);
    if (slowQueries.length > 0) {
      recommendations.push(`Implementar índices para ${slowQueries.length} consultas lentas`);
    }

    // Analizar tiempo promedio
    if (report.averageExecutionTime > 500) {
      recommendations.push('Considerar caché para consultas frecuentes');
    }

    // Analizar errores
    if (report.errors.length > 0) {
      recommendations.push(`Revisar ${report.errors.length} consultas con errores`);
    }

    // Recomendaciones específicas
    recommendations.push('Usar JOINs en lugar de consultas múltiples');
    recommendations.push('Implementar paginación para consultas grandes');
    recommendations.push('Considerar índices compuestos para filtros frecuentes');

    return {
      report,
      recommendations,
      priority: report.averageExecutionTime > 1000 ? 'high' : 'medium'
    };
  }
}
