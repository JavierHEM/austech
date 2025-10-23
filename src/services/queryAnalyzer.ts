// src/services/queryAnalyzer.ts
import { supabase } from '@/lib/supabase-client';

interface QueryMetrics {
  query: string;
  executionTime: number;
  resultCount: number;
  error?: string;
  timestamp: Date;
}

interface PerformanceReport {
  totalQueries: number;
  averageExecutionTime: number;
  slowestQueries: QueryMetrics[];
  errors: QueryMetrics[];
  recommendations: string[];
}

class QueryAnalyzer {
  private metrics: QueryMetrics[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Envuelve una consulta para medir su rendimiento
   */
  async analyzeQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) {
      return await queryFunction();
    }

    const startTime = Date.now();
    let result: T | undefined;
    let error: string | undefined;

    try {
      result = await queryFunction();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
      throw err;
    } finally {
      const executionTime = Date.now() - startTime;
      
      this.metrics.push({
        query: queryName,
        executionTime,
        resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
        error,
        timestamp: new Date()
      });

      // Log en desarrollo
      if (executionTime > 1000) {
        console.warn(`🐌 Consulta lenta detectada: ${queryName} (${executionTime}ms)`);
      } else if (executionTime > 500) {
        console.log(`⚠️ Consulta moderadamente lenta: ${queryName} (${executionTime}ms)`);
      }
    }

    return result;
  }

  /**
   * Genera un reporte de rendimiento
   */
  generateReport(): PerformanceReport {
    const totalQueries = this.metrics.length;
    const averageExecutionTime = this.metrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalQueries;
    
    const slowestQueries = this.metrics
      .filter(m => !m.error)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5);

    const errors = this.metrics.filter(m => m.error);

    const recommendations: string[] = [];
    
    if (averageExecutionTime > 1000) {
      recommendations.push('Considerar optimizar consultas - tiempo promedio muy alto');
    }
    
    if (slowestQueries.length > 0 && slowestQueries[0].executionTime > 2000) {
      recommendations.push('Implementar índices en las consultas más lentas');
    }
    
    if (errors.length > 0) {
      recommendations.push('Revisar y corregir consultas con errores');
    }

    return {
      totalQueries,
      averageExecutionTime,
      slowestQueries,
      errors,
      recommendations
    };
  }

  /**
   * Limpia las métricas almacenadas
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Obtiene métricas específicas de una consulta
   */
  getQueryMetrics(queryName: string): QueryMetrics[] {
    return this.metrics.filter(m => m.query === queryName);
  }
}

// Instancia global del analizador
export const queryAnalyzer = new QueryAnalyzer();

/**
 * Hook para usar el analizador en componentes React
 */
export function useQueryAnalyzer() {
  return {
    analyzeQuery: queryAnalyzer.analyzeQuery.bind(queryAnalyzer),
    generateReport: queryAnalyzer.generateReport.bind(queryAnalyzer),
    clearMetrics: queryAnalyzer.clearMetrics.bind(queryAnalyzer),
    getQueryMetrics: queryAnalyzer.getQueryMetrics.bind(queryAnalyzer)
  };
}

/**
 * Función helper para analizar consultas específicas
 */
export async function analyzeSupabaseQuery<T>(
  queryName: string,
  queryBuilder: any
): Promise<T> {
  return await queryAnalyzer.analyzeQuery(queryName, async () => {
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  });
}
