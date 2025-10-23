'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePageState, usePersistence } from '@/components/UniversalPersistenceProvider';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarDays, 
  CircleCheck, 
  CircleX, 
  Clock, 
  FileText, 
  PieChart as PieChartIcon, 
  Scissors, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Zap,
  Target,
  BarChart3,
  Users,
  Building2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AfiladosTendenciaChart } from '@/components/AfiladosTendenciaChart';

// Tipos de datos optimizados
type SierraStats = {
  total: number;
  activas: number;
  inactivas: number;
  porTipo: { name: string; value: number; percentage: number }[];
  eficiencia: number; // Porcentaje de sierras activas
};

type AfiladoStats = {
  total: number;
  ultimosMeses: { name: string; cantidad: number; mes?: string; año?: number; trend?: 'up' | 'down' | 'stable' }[];
  porTipo: { name: string; value: number; percentage: number }[];
  promedioMensual: number;
  tendencia: 'up' | 'down' | 'stable';
};

type ProximosAfilados = {
  id: string;
  codigo_barras: string;
  tipo: string;
  fecha_estimada: string;
  dias_restantes: number;
  urgencia: 'critica' | 'alta' | 'media' | 'baja';
  ultimoAfilado: string;
};

type DashboardStats = {
  sierras: SierraStats;
  afilados: AfiladoStats;
  proximosAfilados: ProximosAfilados[];
  rendimiento: {
    eficienciaGeneral: number;
    sierrasCriticas: number;
    afiladosEsteMes: number;
    promedioDiasAfilado: number;
  };
  ultimaActualizacion: string;
};

type CacheData = {
  stats: DashboardStats | null;
  timestamp: number;
  empresaId: string;
};

// Colores optimizados para mejor contraste
const COLORS = {
  primary: '#0088FE',
  success: '#00C49F',
  warning: '#FFBB28',
  danger: '#FF8042',
  info: '#8884D8',
  secondary: '#82ca9d'
};

// Configuración de caché (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;

// Función para obtener todos los registros con paginación automática
const getAllRecordsWithPagination = async (query: any, maxRecords = 2000) => {
  const allRecords: any[] = [];
  const limit = 1000; // Límite por página
  
  
  // Primera página
  let { data, error } = await query.limit(limit);
  
  if (error) {
    console.error('❌ Error en primera página:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  allRecords.push(...data);
  
  // Si obtenimos menos de 1000 registros, no hay más páginas
  if (data.length < limit) {
    return allRecords;
  }
  
  // Páginas adicionales
  let page = 2;
  while (allRecords.length < maxRecords) {
    
    const { data: nextData, error: nextError } = await query
      .range((page - 1) * limit, page * limit - 1);
    
    if (nextError) {
      console.error('❌ Error en página adicional:', nextError);
      throw nextError;
    }
    
    if (!nextData || nextData.length === 0) {
      break;
    }
    
    allRecords.push(...nextData);
    
    // Si obtenemos menos registros que el límite, hemos llegado al final
    if (nextData.length < limit) {
      break;
    }
    
    page++;
  }
  
  return allRecords.slice(0, maxRecords);
};

export default function ClienteDashboardPage() {
  const { session } = useAuth();
  const { saveState, loadState } = usePersistence();
  
  // Persistencia del estado del dashboard
  const [dashboardState, setDashboardState] = usePageState('cliente-dashboard-state', {
    stats: null,
    timestamp: 0,
    empresaId: ''
  });
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Memoización de datos procesados
  const processedStats = useMemo(() => {
    if (!dashboardState.stats) return null;
    
    const stats = dashboardState.stats as DashboardStats;
    
    // Calcular métricas adicionales
    const eficienciaGeneral = stats.sierras.total > 0 
      ? Math.round((stats.sierras.activas / stats.sierras.total) * 100)
      : 0;
    
    const sierrasCriticas = stats.proximosAfilados.filter(s => s.urgencia === 'critica').length;
    
    const afiladosEsteMes = stats.afilados.ultimosMeses.length > 0
      ? stats.afilados.ultimosMeses[stats.afilados.ultimosMeses.length - 1]?.cantidad || 0
      : 0;
    
    const promedioDiasAfilado = stats.proximosAfilados.length > 0
      ? Math.round(stats.proximosAfilados.reduce((acc, s) => acc + s.dias_restantes, 0) / stats.proximosAfilados.length)
      : 0;

    return {
      ...stats,
      rendimiento: {
        eficienciaGeneral,
        sierrasCriticas,
        afiladosEsteMes,
        promedioDiasAfilado
      }
    };
  }, [dashboardState.stats]);

  // Función para determinar urgencia
  const getUrgencia = useCallback((diasRestantes: number): 'critica' | 'alta' | 'media' | 'baja' => {
    if (diasRestantes < 0) return 'critica';
    if (diasRestantes <= 3) return 'alta';
    if (diasRestantes <= 7) return 'media';
    return 'baja';
  }, []);

  // Función para obtener color de urgencia
  const getUrgenciaColor = useCallback((urgencia: string) => {
    switch (urgencia) {
      case 'critica': return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'alta': return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
      case 'media': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'baja': return 'text-green-600 bg-green-50 dark:bg-green-950';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  }, []);

  // Función para obtener icono de tendencia
  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  }, []);

  // Función para cargar datos con caché inteligente
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (!session?.user?.id) return;

    try {
      // Verificar caché
      const cachedData = loadState('cliente-dashboard-cache', null) as CacheData | null;
      const now = Date.now();
      
      if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        setDashboardState({
          stats: cachedData.stats,
          timestamp: cachedData.timestamp,
          empresaId: cachedData.empresaId
        });
        setLoading(false);
        return;
      }
      
        setLoading(true);
      setRefreshing(true);
        
      // 1. Obtener empresa del usuario (optimizado)
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', session.user.id)
          .single();
          
        if (userError || !userData?.empresa_id) {
          throw new Error('No se pudo obtener la empresa asociada al usuario');
        }
        
        const empresaId = userData.empresa_id;
        
      // 2. Consultas paralelas para mejor rendimiento
      const [sucursalesResult, empresaResult] = await Promise.all([
        supabase
          .from('sucursales')
          .select('id, nombre')
          .eq('empresa_id', empresaId),
        supabase
          .from('empresas')
          .select('razon_social')
          .eq('id', empresaId)
          .single()
      ]);
      
      if (sucursalesResult.error) throw sucursalesResult.error;
      if (empresaResult.error) throw empresaResult.error;
      
      if (!sucursalesResult.data || sucursalesResult.data.length === 0) {
        // Sin sucursales
        const emptyStats: DashboardStats = {
          sierras: { total: 0, activas: 0, inactivas: 0, porTipo: [], eficiencia: 0 },
          afilados: { total: 0, ultimosMeses: [], porTipo: [], promedioMensual: 0, tendencia: 'stable' },
          proximosAfilados: [],
          rendimiento: { eficienciaGeneral: 0, sierrasCriticas: 0, afiladosEsteMes: 0, promedioDiasAfilado: 0 },
          ultimaActualizacion: new Date().toISOString()
        };
        
        const cacheData: CacheData = {
          stats: emptyStats,
          timestamp: now,
          empresaId
        };
        
        saveState('cliente-dashboard-cache', cacheData);
        setDashboardState({ stats: emptyStats, timestamp: now, empresaId });
          setLoading(false);
        setRefreshing(false);
          return;
        }
        
      const sucursalIds = sucursalesResult.data.map(s => s.id);
        
      // 3. Consultas paralelas para sierras y afilados
      const [sierrasData, afiladosCountResult] = await Promise.all([
        getAllRecordsWithPagination(
          supabase
            .from('sierras')
            .select(`
              id, 
              codigo_barras, 
              activo, 
              tipo_sierra_id,
              tipos_sierra(nombre),
              sucursal_id,
              sucursales(nombre)
            `)
            .in('sucursal_id', sucursalIds),
          2000 // Máximo 2000 sierras
        ),
        supabase
          .from('afilados')
          .select('id', { count: 'exact', head: true })
          .in('sierra_id', sucursalesResult.data.map(s => s.id)) // Usar IDs de sucursales como proxy
      ]);
      
      const totalAfilados = afiladosCountResult.count || 0;
      
      // 4. Procesar datos de sierras
      const sierrasActivas = sierrasData.filter(s => s.activo);
      const sierrasInactivas = sierrasData.filter(s => !s.activo);
      
      // Agrupar por tipo con porcentajes
      const sierrasPorTipo: Record<string, number> = {};
      sierrasData.forEach(sierra => {
        const tipoNombre = sierra.tipos_sierra?.nombre || 'Sin tipo';
        sierrasPorTipo[tipoNombre] = (sierrasPorTipo[tipoNombre] || 0) + 1;
      });
      
      const sierrasPorTipoArray = Object.entries(sierrasPorTipo).map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / sierrasData.length) * 100)
      }));
      
      // 5. Obtener datos de afilados por mes (últimos 6 meses)
      const ahora = new Date();
          const ultimosMeses: Record<string, number> = {};
          const mesesClaves: {clave: string, fecha: Date}[] = [];
          
          for (let i = 5; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            ultimosMeses[clave] = 0;
            mesesClaves.push({clave, fecha});
          }
          
          const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
          const fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
          
      // Estrategia mejorada: Obtener conteo por mes directamente desde la BD
      // Esto evita el problema de paginación y da resultados precisos
      
      const ultimosMesesArray = mesesClaves.map(async ({clave, fecha}) => {
        const mesInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const mesFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        
        
        const { count, error } = await supabase
          .from('afilados')
          .select('id', { count: 'exact', head: true })
          .in('sierra_id', sierrasData.map(s => s.id))
          .gte('fecha_afilado', mesInicio.toISOString())
          .lte('fecha_afilado', mesFin.toISOString());
        
        if (error) {
          console.error(`❌ Error en mes ${clave}:`, error);
        } else {
        }
        
        return {
          name: `${fecha.toLocaleString('es', { month: 'short' })} ${fecha.getFullYear()}`,
          cantidad: count || 0,
          mes: fecha.toLocaleString('es', { month: 'short' }),
          año: fecha.getFullYear(),
          trend: 'stable' as 'up' | 'down' | 'stable' // Se calculará después
        };
      });
      
      // Ejecutar todas las consultas de conteo en paralelo
      const afiladosPorMesData = await Promise.all(ultimosMesesArray);
      
      // Calcular tendencia
      const valoresMeses = afiladosPorMesData.map(m => m.cantidad);
      const tendencia = valoresMeses.length >= 2 
        ? (valoresMeses[valoresMeses.length - 1] > valoresMeses[valoresMeses.length - 2] ? 'up' : 
           valoresMeses[valoresMeses.length - 1] < valoresMeses[valoresMeses.length - 2] ? 'down' : 'stable')
        : 'stable';
      
      // Actualizar tendencia en todos los meses
      afiladosPorMesData.forEach(mes => {
        mes.trend = tendencia as 'up' | 'down' | 'stable';
      });
          
      // Los datos de afilados por mes ya están procesados en afiladosPorMesData
      
      // 6. Obtener tipos de afilado (con paginación automática)
      const afiladosMuestra = await getAllRecordsWithPagination(
        supabase
          .from('afilados')
          .select('tipo_afilado_id, tipos_afilado(nombre)')
          .in('sierra_id', sierrasData.map(s => s.id))
          .order('fecha_afilado', { ascending: false }),
        1000 // Máximo 1000 afilados para análisis de tipos
      );
      
      const afiladosPorTipo: Record<string, number> = {};
      afiladosMuestra?.forEach(afilado => {
        const tipoNombre = afilado.tipos_afilado?.nombre || 'Sin tipo';
        afiladosPorTipo[tipoNombre] = (afiladosPorTipo[tipoNombre] || 0) + 1;
      });
      
      const afiladosPorTipoArray = Object.entries(afiladosPorTipo).map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / (afiladosMuestra?.length || 1)) * 100)
      }));
      
      // 7. Calcular próximos afilados
      const proximosAfilados: ProximosAfilados[] = [];
      
      if (sierrasActivas.length > 0) {
        // Obtener último afilado por sierra (con paginación automática)
        const ultimosAfilados = await getAllRecordsWithPagination(
          supabase
            .from('afilados')
            .select('sierra_id, fecha_afilado')
            .in('sierra_id', sierrasActivas.map(s => s.id))
            .order('fecha_afilado', { ascending: false }),
          2000 // Máximo 2000 afilados para análisis
        );
        
          const afiladosPorSierra: Record<string, any[]> = {};
        ultimosAfilados?.forEach(afilado => {
            if (!afiladosPorSierra[afilado.sierra_id]) {
              afiladosPorSierra[afilado.sierra_id] = [];
            }
            afiladosPorSierra[afilado.sierra_id].push(afilado);
          });
          
          const hoy = new Date();
        
        sierrasActivas.forEach(sierra => {
              const afilados = afiladosPorSierra[sierra.id] || [];
              if (afilados.length > 0) {
                const ultimoAfilado = afilados[0];
                const fechaUltimoAfilado = new Date(ultimoAfilado.fecha_afilado);
                
            // Calcular próximo afilado (30 días promedio)
                const fechaEstimada = new Date(fechaUltimoAfilado);
            fechaEstimada.setDate(fechaEstimada.getDate() + 30);
                
                const diasRestantes = Math.floor(
                  (fechaEstimada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
                );
                
            proximosAfilados.push({
                  id: sierra.id,
                  codigo_barras: sierra.codigo_barras,
              tipo: sierra.tipos_sierra?.nombre || 'Sin tipo',
                  fecha_estimada: fechaEstimada.toISOString().split('T')[0],
              dias_restantes: diasRestantes,
              urgencia: getUrgencia(diasRestantes),
              ultimoAfilado: fechaUltimoAfilado.toLocaleDateString('es')
                });
              }
            });
          
        // Ordenar por urgencia y días restantes
        proximosAfilados.sort((a, b) => {
          const urgenciaOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
          if (urgenciaOrder[a.urgencia] !== urgenciaOrder[b.urgencia]) {
            return urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia];
          }
          return a.dias_restantes - b.dias_restantes;
        });
      }
      
      // 8. Construir estadísticas finales
      const stats: DashboardStats = {
            sierras: {
          total: sierrasData.length,
              activas: sierrasActivas.length,
              inactivas: sierrasInactivas.length,
          porTipo: sierrasPorTipoArray,
          eficiencia: sierrasData.length > 0 ? Math.round((sierrasActivas.length / sierrasData.length) * 100) : 0
            },
            afilados: {
          total: totalAfilados,
          ultimosMeses: afiladosPorMesData,
          porTipo: afiladosPorTipoArray,
          promedioMensual: Math.round(afiladosPorMesData.reduce((a, b) => a + b.cantidad, 0) / afiladosPorMesData.length),
          tendencia
        },
        proximosAfilados: proximosAfilados.slice(0, 10), // Limitar a 10 más relevantes
        rendimiento: {
          eficienciaGeneral: sierrasData.length > 0 ? Math.round((sierrasActivas.length / sierrasData.length) * 100) : 0,
          sierrasCriticas: proximosAfilados.filter(s => s.urgencia === 'critica').length,
          afiladosEsteMes: afiladosPorMesData[afiladosPorMesData.length - 1]?.cantidad || 0,
          promedioDiasAfilado: proximosAfilados.length > 0 
            ? Math.round(proximosAfilados.reduce((acc, s) => acc + s.dias_restantes, 0) / proximosAfilados.length)
            : 0
        },
        ultimaActualizacion: new Date().toISOString()
      };
      
      // 9. Guardar en caché
      const cacheData: CacheData = {
        stats,
        timestamp: now,
        empresaId
      };
      
      saveState('cliente-dashboard-cache', cacheData);
      setDashboardState({ stats, timestamp: now, empresaId });
      setLastRefresh(new Date());
      
      } catch (err: any) {
      console.error('❌ Error al cargar dashboard:', err);
      setError(err.message || 'Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      setRefreshing(false);
      }
  }, [session, loadState, saveState, setDashboardState, getUrgencia]);
    
  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Función para refrescar manualmente
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Función para limpiar caché
  const handleClearCache = useCallback(() => {
    saveState('cliente-dashboard-cache', null);
    setDashboardState({ stats: null, timestamp: 0, empresaId: '' });
    fetchDashboardData(true);
  }, [saveState, setDashboardState, fetchDashboardData]);

  // Loading state optimizado
  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Panel de Cliente
          </h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = processedStats;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con controles */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Panel de Cliente
        </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lastRefresh && `Última actualización: ${lastRefresh.toLocaleTimeString('es')}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing}
            >
              {refreshing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Actualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearCache}
            >
              <Zap className="h-4 w-4 mr-2" />
              Limpiar Caché
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Eficiencia General */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Target className="mr-2 h-5 w-5 text-blue-600" />
                Eficiencia General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.rendimiento.eficienciaGeneral || 0}%</div>
              <div className="text-sm text-muted-foreground mt-1">
                Sierras activas vs total
              </div>
              <Progress value={stats?.rendimiento.eficienciaGeneral || 0} className="mt-2" />
            </CardContent>
          </Card>

          {/* Sierras Críticas */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                Sierras Críticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.rendimiento.sierrasCriticas || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Requieren atención inmediata
              </div>
              {stats?.rendimiento?.sierrasCriticas && stats.rendimiento.sierrasCriticas > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Atención Requerida
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Afilados Este Mes */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
                Afilados Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.rendimiento.afiladosEsteMes || 0}</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center">
                {getTrendIcon(stats?.afilados.tendencia || 'stable')}
                <span className="ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          {/* Promedio Días */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5 text-purple-600" />
                Promedio Días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.rendimiento.promedioDiasAfilado || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Días hasta próximo afilado
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sierras por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                Distribución de Sierras
              </CardTitle>
              <CardDescription>
                Total: {stats?.sierras.total || 0} sierras registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.sierras.porTipo && stats.sierras.porTipo.length > 0 ? (
                  stats.sierras.porTipo.map((tipo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: COLORS[Object.keys(COLORS)[index % Object.keys(COLORS).length] as keyof typeof COLORS] }}
                        />
                        <span className="font-medium">{tipo.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{tipo.value}</span>
                        <Badge variant="secondary">{tipo.percentage}%</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No hay datos de sierras disponibles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Afilados por Mes - Gráfico de Tendencia */}
          <AfiladosTendenciaChart 
            data={stats?.afilados.ultimosMeses || []} 
            promedio={stats?.afilados.promedioMensual || 0} 
          />
        </div>

        {/* Próximos Afilados */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Próximos Afilados Estimados
          </h2>
            <Badge variant="outline">
              {stats?.proximosAfilados.length || 0} sierras programadas
            </Badge>
          </div>
          
          {stats?.proximosAfilados && stats.proximosAfilados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.proximosAfilados.map((afilado, index) => (
                <Card key={index} className={`transition-all hover:shadow-md ${getUrgenciaColor(afilado.urgencia)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{afilado.codigo_barras}</CardTitle>
                      <Badge variant={afilado.urgencia === 'critica' ? 'destructive' : 
                                   afilado.urgencia === 'alta' ? 'destructive' : 
                                   afilado.urgencia === 'media' ? 'secondary' : 'default'}>
                        {afilado.urgencia.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>{afilado.tipo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Fecha estimada:</span>
                        <span className="font-bold">{new Date(afilado.fecha_estimada).toLocaleDateString('es')}</span>
                      </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Último afilado:</span>
                        <span className="text-sm">{afilado.ultimoAfilado}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Días restantes:</span>
                        <span className={`font-bold ${afilado.dias_restantes < 0 ? 'text-red-600' : 
                                                      afilado.dias_restantes < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {afilado.dias_restantes < 0 ? 'Atrasado' : `${afilado.dias_restantes} días`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay próximos afilados estimados disponibles</p>
                  <p className="text-sm mt-2">Los datos se actualizarán cuando haya más información de afilados</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Información de caché */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              <span>Datos en caché para carga más rápida</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Empresa ID: {dashboardState.empresaId}</span>
              <span>Actualizado: {new Date(dashboardState.timestamp).toLocaleTimeString('es')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}