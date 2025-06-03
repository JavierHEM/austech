'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, CircleCheck, CircleX, Clock, FileText, PieChart as PieChartIcon, Scissors, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Tipos de datos
type SierraStats = {
  total: number;
  activas: number;
  inactivas: number;
  porTipo: { name: string; value: number }[];
};

type AfiladoStats = {
  total: number;
  ultimosMeses: { name: string; cantidad: number; mes?: string; año?: number }[];
  porTipo: { name: string; value: number }[];
};

type AfiladosData = {
  muestra: any[];
  total: number;
  porMes: Record<string, number>;
  mesesClaves: {clave: string, fecha: Date}[];
};

type DashboardStats = {
  sierras: SierraStats;
  afilados: AfiladoStats;
  proximosAfilados: {
    id: string;
    codigo_barras: string;
    tipo: string;
    fecha_estimada: string;
    dias_restantes: number;
  }[];
};

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function ClienteDashboardPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [afiladosData, setAfiladosData] = useState<AfiladosData | null>(null);
  
  // Función para cargar datos de ejemplo en caso de error
  const setDatosEjemplo = () => {
    setStats({
      sierras: {
        total: 24,
        activas: 18,
        inactivas: 6,
        porTipo: [
          { name: 'Cinta', value: 12 },
          { name: 'Circular', value: 8 },
          { name: 'Sinfin', value: 4 }
        ]
      },
      afilados: {
        total: 156,
        ultimosMeses: [
          { name: 'Ene 2025', cantidad: 22 },
          { name: 'Feb 2025', cantidad: 18 },
          { name: 'Mar 2025', cantidad: 24 },
          { name: 'Abr 2025', cantidad: 30 },
          { name: 'May 2025', cantidad: 28 },
          { name: 'Jun 2025', cantidad: 34 }
        ],
        porTipo: [
          { name: 'Estándar', value: 98 },
          { name: 'Premium', value: 58 }
        ]
      },
      proximosAfilados: [
        { id: '1', codigo_barras: 'S001', tipo: 'Cinta', fecha_estimada: '2025-06-05', dias_restantes: 2 },
        { id: '2', codigo_barras: 'S002', tipo: 'Circular', fecha_estimada: '2025-06-10', dias_restantes: 7 },
        { id: '3', codigo_barras: 'S003', tipo: 'Sinfin', fecha_estimada: '2025-06-01', dias_restantes: -2 }
      ]
    });
    setError(null);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.id) {
        setDatosEjemplo();
        return;
      }
      
      try {
        setLoading(true);
        
        // 1. Obtener la empresa del usuario
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', session.user.id)
          .single();
          
        if (userError || !userData?.empresa_id) {
          throw new Error('No se pudo obtener la empresa asociada al usuario');
        }
        
        const empresaId = userData.empresa_id;
        
        // 2. Obtener las sucursales de la empresa
        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('id')
          .eq('empresa_id', empresaId);
          
        if (sucursalesError) throw sucursalesError;
        
        if (!sucursalesData || sucursalesData.length === 0) {
          // Si no hay sucursales, no hay sierras
          setStats({
            sierras: {
              total: 0,
              activas: 0,
              inactivas: 0,
              porTipo: []
            },
            afilados: {
              total: 0,
              ultimosMeses: [],
              porTipo: []
            },
            proximosAfilados: []
          });
          setLoading(false);
          return;
        }
        
        // Obtener IDs de sucursales
        const sucursalIds = sucursalesData.map(s => s.id);
        
        // 2. Obtener estadísticas de sierras para todas las sucursales de la empresa
        const { data: sierrasData, error: sierrasError } = await supabase
          .from('sierras')
          .select('id, codigo_barras, activo, tipo_sierra_id, tipos_sierra(nombre), sucursal_id')
          .in('sucursal_id', sucursalIds);
          
        if (sierrasError) throw sierrasError;
        
        // 3. Obtener estadísticas de afilados para las sierras de las sucursales
        const sierraIds = sierrasData?.map(s => s.id) || [];
        
        // Definir una variable para almacenar los datos procesados de afilados
        let afiladosDataTemp: AfiladosData | null = null;
        let afiladosError = null;
        
        if (sierraIds.length > 0) {
          // Cargar afilados por mes directamente para evitar el límite de 1000 registros

          
          // Inicializar contador de afilados por mes
          const ultimosMeses: Record<string, number> = {};
          const ahora = new Date();
          const mesesClaves: {clave: string, fecha: Date}[] = [];
          
          // Inicializar los últimos 6 meses
          for (let i = 5; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            ultimosMeses[clave] = 0;
            mesesClaves.push({clave, fecha});
          }
          
          // Obtener fechas límite para filtrar solo los últimos 6 meses
          const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
          const fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
          
          // Consulta para contar afilados por mes directamente en la base de datos
          const { data: afiladosPorMes, error: errorConteo } = await supabase
            .from('afilados')
            .select(`
              id,
              fecha_afilado,
              sierra_id
            `)
            .in('sierra_id', sierraIds)
            .gte('fecha_afilado', fechaInicio.toISOString())
            .lte('fecha_afilado', fechaFin.toISOString());
          
          if (errorConteo) {
            // Error al contar afilados por mes
            afiladosError = errorConteo;
          } else {

            
            // Contar afilados por mes
            afiladosPorMes?.forEach(afilado => {
              if (!afilado.fecha_afilado) return;
              
              const fecha = new Date(afilado.fecha_afilado);
              const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
              
              if (ultimosMeses[clave] !== undefined) {
                ultimosMeses[clave] += 1;
              }
            });
          }
          
          // Consulta para obtener el total de afilados (solo conteo)
          const { count: totalAfilados, error: errorTotal } = await supabase
            .from('afilados')
            .select('id', { count: 'exact', head: true })
            .in('sierra_id', sierraIds);
          
          if (errorTotal) {
            // Error al obtener total de afilados
            afiladosError = errorTotal;
          }
          

          
          // Obtener una muestra de afilados para tipos de afilado
          const { data: afiladosMuestra, error: errorMuestra } = await supabase
            .from('afilados')
            .select(`
              id, 
              fecha_afilado,
              sierra_id,
              tipo_afilado_id,
              tipos_afilado(nombre)
            `)
            .in('sierra_id', sierraIds)
            .order('fecha_afilado', { ascending: false })
            .limit(1000);
          
          if (errorMuestra) {
            // Error al obtener muestra de afilados
            afiladosError = errorMuestra;
          }
          
          // Guardar los datos procesados
          afiladosDataTemp = {
            muestra: afiladosMuestra || [],
            total: totalAfilados || 0,
            porMes: ultimosMeses,
            mesesClaves: mesesClaves
          };
          
          // Datos procesados correctamente
        }
          
        if (afiladosError) throw afiladosError;
        
        // 4. Calcular próximos afilados estimados localmente
        // (ya que no podemos usar la función RPC hasta que se implemente en la base de datos)
        let proximosAfilados: Array<{
          id: string;
          codigo_barras: string;
          tipo: string;
          fecha_estimada: string;
          dias_restantes: number;
        }> = [];
        
        if (sierrasData && afiladosDataTemp?.muestra) {
          // Agrupar afilados por sierra
          const afiladosPorSierra: Record<string, any[]> = {};
          
          afiladosDataTemp.muestra.forEach((afilado: any) => {
            if (!afiladosPorSierra[afilado.sierra_id]) {
              afiladosPorSierra[afilado.sierra_id] = [];
            }
            afiladosPorSierra[afilado.sierra_id].push(afilado);
          });
          
          // Para cada sierra, calcular el próximo afilado estimado
          const hoy = new Date();
          const estimaciones: Array<{
            id: string;
            codigo_barras: string;
            tipo: string;
            fecha_estimada: string;
            dias_restantes: number;
          }> = [];
          
          sierrasData
            .filter(sierra => sierra.activo)
            .forEach(sierra => {
              const afilados = afiladosPorSierra[sierra.id] || [];
              
              if (afilados.length > 0) {
                // Ordenar afilados por fecha (más reciente primero)
                afilados.sort((a, b) => 
                  new Date(b.fecha_afilado).getTime() - new Date(a.fecha_afilado).getTime()
                );
                
                const ultimoAfilado = afilados[0];
                const fechaUltimoAfilado = new Date(ultimoAfilado.fecha_afilado);
                
                // Asumimos 30 días entre afilados si no hay información específica
                const diasEntreAfilados = 30;
                
                // Calcular fecha estimada del próximo afilado
                const fechaEstimada = new Date(fechaUltimoAfilado);
                fechaEstimada.setDate(fechaEstimada.getDate() + diasEntreAfilados);
                
                // Calcular días restantes
                const diasRestantes = Math.floor(
                  (fechaEstimada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
                );
                
                estimaciones.push({
                  id: sierra.id,
                  codigo_barras: sierra.codigo_barras,
                  tipo: typeof sierra.tipos_sierra === 'object' && sierra.tipos_sierra !== null
                    ? (sierra.tipos_sierra as any).nombre || 'Sin tipo'
                    : 'Sin tipo',
                  fecha_estimada: fechaEstimada.toISOString().split('T')[0],
                  dias_restantes: diasRestantes
                });
              }
            });
          
          // Ordenar por días restantes (más urgentes primero) y limitar a 5
          proximosAfilados = estimaciones
            .sort((a, b) => a.dias_restantes - b.dias_restantes)
            .slice(0, 5);
        }
          
        // No necesitamos manejar errores de proximosAfilados porque lo calculamos localmente
        
        // Procesar datos de sierras
        const sierrasActivas = sierrasData?.filter(s => s.activo) || [];
        const sierrasInactivas = sierrasData?.filter(s => !s.activo) || [];
        
        // Agrupar sierras por tipo
        const sierrasPorTipo: Record<string, number> = {};
        sierrasData?.forEach(sierra => {
          // Asegurarnos de que tipos_sierra es un objeto y no un array
          const tipoNombre = typeof sierra.tipos_sierra === 'object' && sierra.tipos_sierra !== null
            ? (sierra.tipos_sierra as any).nombre || 'Sin tipo'
            : 'Sin tipo';
          sierrasPorTipo[tipoNombre] = (sierrasPorTipo[tipoNombre] || 0) + 1;
        });
        
        // Guardar los datos de afilados en el estado
        setAfiladosData(afiladosDataTemp);
        
        // Procesar datos para el gráfico si tenemos datos de afilados
        if (!afiladosDataTemp) {
          // No hay datos de afilados disponibles
          setStats({
            sierras: {
              total: sierrasData?.length || 0,
              activas: sierrasActivas.length,
              inactivas: sierrasInactivas.length,
              porTipo: Object.entries(sierrasPorTipo).map(([name, value]) => ({ name, value }))
            },
            afilados: {
              total: 0,
              ultimosMeses: [],
              porTipo: []
            },
            proximosAfilados: proximosAfilados || []
          });
          setLoading(false);
          return;
        }
        
        // Convertir a formato para gráfico
        const ultimosMesesArray = afiladosDataTemp.mesesClaves.map(({clave, fecha}: {clave: string, fecha: Date}) => ({
          name: `${fecha.toLocaleString('es', { month: 'short' })} ${fecha.getFullYear()}`,
          cantidad: afiladosDataTemp.porMes[clave] || 0,
          mes: fecha.toLocaleString('es', { month: 'short' }),
          año: fecha.getFullYear()
        }));
        
        // Agrupar afilados por tipo
        const afiladosPorTipo: Record<string, number> = {};
        afiladosDataTemp.muestra.forEach((afilado: any) => {
          // Asegurarnos de que tipos_afilado es un objeto y no un array
          const tipoNombre = typeof afilado.tipos_afilado === 'object' && afilado.tipos_afilado !== null
            ? (afilado.tipos_afilado as any).nombre || 'Sin tipo'
            : 'Sin tipo';
          afiladosPorTipo[tipoNombre] = (afiladosPorTipo[tipoNombre] || 0) + 1;
        });
        
        // Formatear datos para los gráficos
        setStats({
          sierras: {
            total: sierrasData?.length || 0,
            activas: sierrasActivas.length,
            inactivas: sierrasInactivas.length,
            porTipo: Object.entries(sierrasPorTipo).map(([name, value]) => ({ name, value }))
          },
          afilados: {
            total: afiladosDataTemp ? afiladosDataTemp.total : 0,
            ultimosMeses: ultimosMesesArray || [],
            porTipo: Object.entries(afiladosPorTipo).map(([name, value]) => ({ name, value }))
          },
          proximosAfilados: proximosAfilados || []
        });
      } catch (err: any) {
        // Error al cargar datos del dashboard
        setDatosEjemplo();
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [session]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

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
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Panel de Cliente
        </h1>
        
        {/* Tarjetas informativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total de sierras */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Scissors className="mr-2 h-5 w-5" />
                Total de Sierras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.sierras.total || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Sierras registradas en el sistema
              </div>
            </CardContent>
          </Card>

          {/* Sierras activas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CircleCheck className="mr-2 h-5 w-5 text-green-600" />
                Sierras Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.sierras.activas || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats?.sierras.total ? (
                  <span>
                    {Math.round((stats.sierras.activas / stats.sierras.total) * 100)}% del total
                  </span>
                ) : 'Sin datos'}
              </div>
            </CardContent>
          </Card>

          {/* Sierras inactivas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CircleX className="mr-2 h-5 w-5 text-red-600" />
                Sierras Inactivas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.sierras.inactivas || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats?.sierras.total ? (
                  <span>
                    {Math.round((stats.sierras.inactivas / stats.sierras.total) * 100)}% del total
                  </span>
                ) : 'Sin datos'}
              </div>
            </CardContent>
          </Card>

          {/* Total de afilados */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Total de Afilados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.afilados.total || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Afilados registrados en el sistema
              </div>
            </CardContent>
          </Card>

          {/* Afilados por mes (últimos 3 meses) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-purple-600" />
                Afilados Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.afilados.ultimosMeses && stats.afilados.ultimosMeses.length > 0 ? (
                  stats.afilados.ultimosMeses.slice(-3).reverse().map((mes, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="font-medium">{mes.name}</div>
                      <div className="font-bold text-purple-600">{mes.cantidad}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No hay datos disponibles</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tipos de sierra */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-orange-600" />
                Tipos de Sierra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.sierras.porTipo && stats.sierras.porTipo.length > 0 ? (
                  stats.sierras.porTipo.slice(0, 5).map((tipo, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="font-medium">{tipo.name || 'Sin tipo'}</div>
                      <div className="font-bold text-orange-600">{tipo.value}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No hay datos disponibles</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos afilados */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Próximos Afilados Estimados
          </h2>
          
          {stats?.proximosAfilados && stats.proximosAfilados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.proximosAfilados.map((afilado, index) => (
                <Card key={index} className={`${afilado.dias_restantes < 0 ? 'border-red-500' : afilado.dias_restantes < 7 ? 'border-yellow-500' : 'border-green-500'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{afilado.codigo_barras}</CardTitle>
                    <CardDescription>{afilado.tipo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">Fecha estimada:</div>
                        <div className="font-bold">{new Date(afilado.fecha_estimada).toLocaleDateString('es')}</div>
                      </div>
                      <div className={`text-lg font-bold ${afilado.dias_restantes < 0 ? 'text-red-600' : afilado.dias_restantes < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {afilado.dias_restantes < 0 ? 'Atrasado' : `${afilado.dias_restantes} días`}
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
                  No hay próximos afilados estimados disponibles
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
