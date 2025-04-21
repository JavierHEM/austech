'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, FileText, AlertCircle, Clock, Scissors } from 'lucide-react';
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
  ultimosMeses: { name: string; cantidad: number }[];
  porTipo: { name: string; value: number }[];
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.id) return;
      
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
        
        let afiladosData: any[] = [];
        let afiladosError = null;
        
        if (sierraIds.length > 0) {
          const { data: afiladosResult, error: error } = await supabase
            .from('afilados')
            .select(`
              id, 
              fecha_afilado,
              sierra_id,
              tipo_afilado_id,
              tipos_afilado(nombre)
            `)
            .in('sierra_id', sierraIds)
            .order('fecha_afilado', { ascending: false });
            
          afiladosData = afiladosResult || [];
          afiladosError = error;
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
        
        if (sierrasData && afiladosData) {
          // Agrupar afilados por sierra
          const afiladosPorSierra: Record<string, any[]> = {};
          
          afiladosData.forEach(afilado => {
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
        
        // Procesar datos de afilados por mes
        const ultimosMeses: Record<string, number> = {};
        const ahora = new Date();
        
        // Inicializar los últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
          const mesNombre = fecha.toLocaleString('es', { month: 'short' });
          ultimosMeses[mesNombre] = 0;
        }
        
        // Contar afilados por mes
        afiladosData?.forEach(afilado => {
          const fecha = new Date(afilado.fecha_afilado);
          const mesNombre = fecha.toLocaleString('es', { month: 'short' });
          
          // Solo contar si está en los últimos 6 meses
          if (ultimosMeses[mesNombre] !== undefined) {
            ultimosMeses[mesNombre] += 1;
          }
        });
        
        // Agrupar afilados por tipo
        const afiladosPorTipo: Record<string, number> = {};
        afiladosData?.forEach(afilado => {
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
            total: afiladosData?.length || 0,
            ultimosMeses: Object.entries(ultimosMeses).map(([name, cantidad]) => ({ name, cantidad })),
            porTipo: Object.entries(afiladosPorTipo).map(([name, value]) => ({ name, value }))
          },
          proximosAfilados: proximosAfilados || []
        });
      } catch (err: any) {
        console.error('Error al cargar datos del dashboard:', err);
        setError(err.message || 'Error al cargar los datos del dashboard');
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full mt-6 rounded-xl" />
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
        
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Scissors className="mr-2 h-5 w-5" />
                Sierras
              </CardTitle>
              <CardDescription>
                Resumen de tus sierras registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.sierras.total || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">{stats?.sierras.activas || 0}</span> activas, 
                <span className="text-red-600 font-medium ml-1">{stats?.sierras.inactivas || 0}</span> inactivas
              </div>
              
              {stats?.sierras.total ? (
                <div className="mt-4 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.sierras.porTipo}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {stats.sierras.porTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} sierras`, 'Cantidad']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-4 text-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ArrowUpRight className="mr-2 h-5 w-5" />
                Afilados
              </CardTitle>
              <CardDescription>
                Historial de afilados realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.afilados.total || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Total de afilados registrados
              </div>
              
              {stats?.afilados.total ? (
                <div className="mt-4 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.afilados.ultimosMeses}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#8884d8" name="Afilados" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-4 text-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Próximos Afilados
              </CardTitle>
              <CardDescription>
                Sierras que requieren afilado pronto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.proximosAfilados && stats.proximosAfilados.length > 0 ? (
                <div className="space-y-3">
                  {stats.proximosAfilados.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{item.codigo_barras}</div>
                        <div className="text-xs text-muted-foreground">{item.tipo}</div>
                      </div>
                      <div className={`text-sm font-medium ${item.dias_restantes <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.dias_restantes <= 0 
                          ? 'Vencido' 
                          : `${item.dias_restantes} día${item.dias_restantes !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No hay próximos afilados programados
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sección de reportes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Reportes Disponibles
            </CardTitle>
            <CardDescription>
              Genera y descarga reportes de tus sierras y afilados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Inventario de Sierras</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    Listado completo de tus sierras con su estado actual
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/reportes/inventario-sierras">
                      Generar Reporte
                    </a>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Historial de Afilados</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    Registro histórico de todos los afilados realizados
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/reportes/historial-afilados">
                      Generar Reporte
                    </a>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Rendimiento por Sierra</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    Análisis de rendimiento y frecuencia de afilado
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/reportes/rendimiento-sierras">
                      Generar Reporte
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
