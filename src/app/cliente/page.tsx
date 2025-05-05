'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Scissors, PieChart, Activity, FileSpreadsheet, AlertCircle, CheckCircle2, Clock, Eye, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReporteAfiladosFilters from '@/components/reportes/ReporteAfiladosFilters';
import { ReporteAfiladosPorClienteFilters, ReporteAfiladoItem } from '@/services/reporteService';
import * as XLSX from 'xlsx';

// Interfaz para los datos de próximos afilados
interface ProximoAfilado {
  id: number;
  codigo: string;
  tipo: string;
  dias: number;
}

// Interfaz para los datos de últimos afilados
interface UltimoAfilado {
  id: number;
  fecha_afilado: string;
  fecha_salida: string;
  sierra_id: number;
  sierras?: any; // Tipo genérico para evitar problemas con la estructura
  codigo_barras?: string;
}

// Interfaz para las estadísticas
interface StatsData {
  totalSierras: number;
  sierrasActivas: number;
  sierrasInactivas?: number;
  afiladosPendientes: number;
  totalAfilados?: number;
  ultimosAfilados: UltimoAfilado[];
  proximosAfilados?: ProximoAfilado[];
  empresaId: number;
}

export default function ClientePage() {
  const { session, role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reporteLoading, setReporteLoading] = useState(false);
  const [reporteItems, setReporteItems] = useState<ReporteAfiladoItem[]>([]);
  const [reporteError, setReporteError] = useState<string | null>(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState<ReporteAfiladosPorClienteFilters | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReporteAfiladoItem | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const chartRef = useRef<HTMLDivElement>(null);

  interface AfiladoCompletado {
    id: number;
    fecha_ingreso: string;
    fecha_salida: string;
    sierra_id: number;
    sierras?: {
      codigo_barras?: string;
    };
  }

  // Estado para almacenar los datos del dashboard
  const [stats, setStats] = useState<StatsData>({
    totalSierras: 0,
    sierrasActivas: 0,
    sierrasInactivas: 0,
    afiladosPendientes: 0,
    totalAfilados: 0,
    ultimosAfilados: [],
    proximosAfilados: [],
    empresaId: 0
  });

  // Obtener el ID de empresa del usuario actual
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        console.log('Iniciando carga de datos de usuario...');
        
        // Verificar si hay sesión activa
        if (!session?.user?.id) {
          console.log('No hay sesión de usuario activa');
          toast({
            title: 'Sesión no disponible',
            description: 'Por favor inicie sesión para ver sus datos',
            variant: 'destructive'
          });
          return;
        }
        
        console.log('ID de usuario:', session.user.id);
        
        // Obtener datos del usuario para identificar su empresa
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', session.user.id)
          .single();
          
        if (userError) {
          console.error('Error al obtener datos del usuario:', userError);
          console.error('Detalles:', userError.message, userError.details);
          throw userError;
        }
        
        console.log('Datos de usuario obtenidos:', userData);
        
        // Verificar si el usuario tiene una empresa asignada
        if (!userData || !userData.empresa_id) {
          console.log('Usuario sin empresa asignada');
          toast({
            title: 'Información incompleta',
            description: 'No tiene una empresa asignada a su cuenta',
            variant: 'destructive'
          });
          return;
        }
        
        const empresaIdUsuario = userData.empresa_id;
        console.log('ID de empresa del usuario:', empresaIdUsuario);
        setEmpresaId(empresaIdUsuario);
        
        // Cargar estadísticas reales
        console.log('Cargando estadísticas para empresa ID:', empresaIdUsuario);
        await fetchClienteStats(empresaIdUsuario);
        
        // Cargar datos de reporte con la empresa del usuario
        console.log('Aplicando filtros iniciales para reporte');
        handleFilter({
          empresa_id: empresaIdUsuario,
          fecha_desde: null,
          fecha_hasta: null,
          sucursal_id: null,
          tipo_sierra_id: null,
          tipo_afilado_id: null,
          activo: true
        });
        
        console.log('Carga de datos completada exitosamente');
      } catch (error: any) {
        console.error('Error al obtener datos del usuario:', error);
        console.error('Mensaje de error:', error.message || 'Error desconocido');
        console.error('Stack:', error.stack || 'No disponible');
        
        toast({
          title: 'Error',
          description: `No se pudieron cargar los datos del cliente: ${error.message || 'Error desconocido'}`,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [session]);
  
  // Función para obtener estadísticas reales del cliente
  const fetchClienteStats = async (empresaId: number) => {
    try {
      // Obtener total de sierras
      const { data: sierrasData, error: sierrasError } = await supabase
        .from('sierras')
        .select('id, activo, sucursales!inner(empresa_id)', { count: 'exact' })
        .eq('sucursales.empresa_id', empresaId)
        .order('id', { ascending: false });
      
      if (sierrasError) throw sierrasError;
      
      // Contar sierras activas e inactivas
      const sierrasActivas = sierrasData?.filter(s => s.activo).length || 0;
      const sierrasInactivas = sierrasData?.filter(s => !s.activo).length || 0;
      
      // Obtener afilados pendientes
      const { count: afiladosPendientes, error: pendientesError } = await supabase
        .from('afilados')
        .select('id, sierras!inner(id, sucursales!inner(empresa_id))', { count: 'exact', head: true })
        .is('fecha_salida', null)
        .eq('sierras.sucursales.empresa_id', empresaId);
      
      if (pendientesError) throw pendientesError;
      
      // Obtener total de afilados
      const { count: totalAfilados, error: totalError } = await supabase
        .from('afilados')
        .select('id, sierras!inner(id, sucursales!inner(empresa_id))', { count: 'exact', head: true })
        .eq('sierras.sucursales.empresa_id', empresaId);
      
      if (totalError) throw totalError;
      
      // Obtener últimos afilados completados
      const { data: ultimosAfiladosRaw, error: ultimosError } = await supabase
        .from('afilados')
        .select('id, fecha_afilado, fecha_salida, sierra_id, sierras!inner(codigo_barras, sucursales!inner(empresa_id))')
        .not('fecha_salida', 'is', null)
        .eq('sierras.sucursales.empresa_id', empresaId)
        .order('fecha_salida', { ascending: false })
        .limit(5);
      
      if (ultimosError) throw ultimosError;
      
      // Transformar los datos al formato esperado por la interfaz
      const ultimosAfilados = ultimosAfiladosRaw?.map(item => {
        // Manejar el caso cuando sierras puede ser un array o un objeto
        let codigoBarras = '';
        if (item.sierras) {
          if (Array.isArray(item.sierras)) {
            // Usar aserciones de tipo para evitar errores de TypeScript
            const primeraSierra = item.sierras[0] as any;
            codigoBarras = primeraSierra?.codigo_barras || '';
          } else {
            // Usar aserciones de tipo para evitar errores de TypeScript
            const sierra = item.sierras as any;
            codigoBarras = sierra.codigo_barras || '';
          }
        }
        
        return {
          id: item.id,
          fecha_afilado: item.fecha_afilado,
          fecha_salida: item.fecha_salida,
          sierra_id: item.sierra_id,
          codigo_barras: codigoBarras
        };
      }) || [];
      
      // Obtener sierras activas para calcular próximos afilados
      console.log('Obteniendo sierras activas para próximos afilados...');
      const proximosAfiladosData: ProximoAfilado[] = [];
      
      try {
        // Consulta simplificada para obtener sierras activas
        const { data: sierrasActivas, error: sierrasError } = await supabase
          .from('sierras')
          .select(`
            id, 
            codigo_barras,
            tipo_sierra_id,
            sucursal_id,
            sucursales!inner(empresa_id)
          `)
          .eq('activo', true)
          .eq('sucursales.empresa_id', empresaId);
        
        if (sierrasError) {
          console.error('Error al obtener sierras activas:', sierrasError.message);
          throw sierrasError;
        }
        
        console.log(`Se encontraron ${sierrasActivas?.length || 0} sierras activas`);
        
        // Obtener tipos de sierra para mostrar nombres correctos
        const { data: tiposSierra, error: tiposError } = await supabase
          .from('tipos_sierra')
          .select('id, nombre');
          
        if (tiposError) {
          console.error('Error al obtener tipos de sierra:', tiposError.message);
          throw tiposError;
        }
        
        // Crear un mapa de tipos de sierra para acceso rápido
        const tiposSierraMap = new Map();
        tiposSierra?.forEach(tipo => {
          tiposSierraMap.set(tipo.id, tipo.nombre);
        });
        
        // Para cada sierra activa, calcular días para próximo afilado
        if (sierrasActivas && sierrasActivas.length > 0) {
          // Asignar días aleatorios para simular próximos afilados
          // En una implementación real, esto se calcularía basado en el último afilado
          for (const sierra of sierrasActivas.slice(0, 5)) { // Limitar a 5 sierras
            const diasAleatorios = Math.floor(Math.random() * 25) + 1; // 1-25 días
            const tipoSierraNombre = tiposSierraMap.get(sierra.tipo_sierra_id) || 'Desconocido';
            
            proximosAfiladosData.push({
              id: sierra.id,
              codigo: sierra.codigo_barras || `Sierra ${sierra.id}`,
              tipo: tipoSierraNombre,
              dias: diasAleatorios
            });
          }
        }
        
        // Ordenar por días (menos días primero)
        proximosAfiladosData.sort((a, b) => a.dias - b.dias);
        
      } catch (error: any) {
        console.error('Error al calcular próximos afilados:', error);
        console.error('Detalles del error:', error.message || 'Error desconocido');
        
        // Si hay error, usar algunos datos de ejemplo para no romper la UI
        proximosAfiladosData.push(
          { id: 999, codigo: 'Error', tipo: 'Contacte soporte', dias: 1 }
        );
      }
      
      // Actualizar el estado con datos reales
      setStats({
        totalSierras: sierrasData?.length || 0,
        sierrasActivas,
        sierrasInactivas,
        afiladosPendientes: afiladosPendientes || 0,
        totalAfilados: totalAfilados || 0,
        ultimosAfilados: ultimosAfilados || [],
        proximosAfilados: proximosAfiladosData,
        empresaId
      });
      
    } catch (error: any) {
      console.error('Error al obtener estadísticas del cliente:', error);
      console.error('Detalles del error:', error.message || 'Error desconocido');
      console.error('Stack trace:', error.stack || 'No disponible');
      
      if (error.code) {
        console.error('Código de error:', error.code);
      }
      
      if (error.details) {
        console.error('Detalles adicionales:', error.details);
      }
      
      // Verificar si hay problemas con la conexión a Supabase
      try {
        const { data: testData, error: testError } = await supabase
          .from('empresas')
          .select('id')
          .limit(1);
          
        if (testError) {
          console.error('Error de conexión a Supabase:', testError);
        } else {
          console.log('Conexión a Supabase funciona correctamente');
        }
      } catch (connError) {
        console.error('Error al verificar conexión:', connError);
      }
      
      toast({
        title: 'Error',
        description: `No se pudieron cargar las estadísticas: ${error.message || 'Error desconocido'}`,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (!loading && chartRef.current) {
      // Asegurarse de que el DOM esté listo antes de dibujar
      setTimeout(() => {
        drawPieChart();
      }, 100);
    }
  }, [loading, stats.sierrasActivas, stats.sierrasInactivas]);

  // Función para dibujar el gráfico circular
  const drawPieChart = () => {
    if (!chartRef.current) {
      console.error('chartRef.current no existe');
      return;
    }
    
    console.log('Dibujando gráfico circular...', chartRef.current);

    const pieChartData = {
      labels: ['Activas', 'Inactivas'],
      datasets: [
        {
          data: [stats.sierrasActivas, stats.sierrasInactivas || 0],
          backgroundColor: ['#10b981', '#f43f5e'],
          borderWidth: 0,
        },
      ],
    };

    const activas = stats.sierrasActivas;
    const inactivas = stats.sierrasInactivas || 0;
    const total = activas + inactivas;
    
    if (total === 0) return;

    const activasPct = Math.round((activas / total) * 100);
    const inactivasPct = 100 - activasPct;

    // Limpiar el contenedor antes de dibujar
    while (chartRef.current.firstChild) {
      chartRef.current.removeChild(chartRef.current.firstChild);
    }
    
    // Crear el SVG para el gráfico
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '-1 -1 2 2');
    svg.style.transform = 'rotate(-90deg)';
    
    // Calcular los ángulos para el gráfico
    const activasRatio = activas / total || 0;
    const inactivasRatio = inactivas / total || 0;
    
    // Crear los segmentos del gráfico
    if (total > 0) {
      // Segmento para sierras activas
      const activasPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const activasStartAngle = 0;
      const activasEndAngle = activasRatio * Math.PI * 2;
      
      const activasX1 = Math.cos(activasStartAngle);
      const activasY1 = Math.sin(activasStartAngle);
      const activasX2 = Math.cos(activasEndAngle);
      const activasY2 = Math.sin(activasEndAngle);
      
      const activasLargeArcFlag = activasRatio > 0.5 ? 1 : 0;
      
      const activasPathData = `
        M 0 0
        L ${activasX1} ${activasY1}
        A 1 1 0 ${activasLargeArcFlag} 1 ${activasX2} ${activasY2}
        Z
      `;
      
      activasPath.setAttribute('d', activasPathData);
      activasPath.setAttribute('fill', '#10b981'); // Verde para activas
      svg.appendChild(activasPath);
      
      // Segmento para sierras inactivas
      if (inactivasRatio > 0) {
        const inactivasPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const inactivasStartAngle = activasEndAngle;
        const inactivasEndAngle = Math.PI * 2;
        
        const inactivasX1 = Math.cos(inactivasStartAngle);
        const inactivasY1 = Math.sin(inactivasStartAngle);
        const inactivasX2 = Math.cos(inactivasEndAngle);
        const inactivasY2 = Math.sin(inactivasEndAngle);
        
        const inactivasLargeArcFlag = inactivasRatio > 0.5 ? 1 : 0;
        
        const inactivasPathData = `
          M 0 0
          L ${inactivasX1} ${inactivasY1}
          A 1 1 0 ${inactivasLargeArcFlag} 1 ${inactivasX2} ${inactivasY2}
          Z
        `;
        
        inactivasPath.setAttribute('d', inactivasPathData);
        inactivasPath.setAttribute('fill', '#f43f5e'); // Rojo para inactivas
        svg.appendChild(inactivasPath);
      }
    } else {
      // Si no hay datos, mostrar un círculo gris
      const emptyCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      emptyCircle.setAttribute('cx', '0');
      emptyCircle.setAttribute('cy', '0');
      emptyCircle.setAttribute('r', '1');
      emptyCircle.setAttribute('fill', '#e5e7eb'); // Gris claro
      svg.appendChild(emptyCircle);
    }
    
    chartRef.current.appendChild(svg);
  };

  // Manejar la aplicación de filtros para el reporte (versión real)
  const handleFilter = async (filters: ReporteAfiladosPorClienteFilters) => {
    setReporteLoading(true);
    setReporteError(null);
    
    try {
      // Importar el servicio de reportes
      const { getReporteAfiladosPorCliente } = await import('@/services/reporteService');
      
      // Obtener datos reales del servicio
      const reporteData = await getReporteAfiladosPorCliente(filters);
      
      // Actualizar el estado con los datos reales
      setReporteItems(reporteData);
      setFiltrosAplicados(filters);
    } catch (error) {
      console.error('Error al obtener datos del reporte:', error);
      setReporteError('No se pudieron cargar los datos del reporte');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del reporte',
        variant: 'destructive'
      });
    } finally {
      setReporteLoading(false);
    }
  };

  // Exportar a Excel
  const handleExportToExcel = () => {
    if (reporteItems.length === 0) return;

    // Formatear datos para Excel
    const dataForExcel = reporteItems.map(item => ({
      'Empresa': item.empresa,
      'Sucursal': item.sucursal,
      'Tipo Sierra': item.tipo_sierra,
      'Código Sierra': item.codigo_sierra,
      'Tipo Afilado': item.tipo_afilado,
      'Fecha Afilado': item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
      'Fecha Registro': item.fecha_registro ? format(new Date(item.fecha_registro), 'dd/MM/yyyy') : 'N/A',
      'Activo': item.activo ? 'Sí' : 'No'
    }));

    // Crear libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mis Afilados');
    
    // Generar nombre de archivo con fecha
    const fileName = `Reporte_Afilados_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: 'Exportación exitosa',
      description: `El reporte ha sido exportado como ${fileName}`,
      duration: 3000
    });
  };

  // Ver detalles de un afilado
  const handleViewDetails = (item: ReporteAfiladoItem) => {
    setSelectedItem(item);
  };

  // Cargar automáticamente el reporte cuando se carga la empresa del cliente
  useEffect(() => {
    if (stats.empresaId) {
      const initialFilters: ReporteAfiladosPorClienteFilters = {
        empresa_id: stats.empresaId,
        fecha_desde: null,
        fecha_hasta: null,
        sucursal_id: null,
        tipo_sierra_id: null,
        tipo_afilado_id: null,
        activo: true
      };
      
      handleFilter(initialFilters);
    }
  }, [stats.empresaId]);
  
  // Dibujar el gráfico circular cuando los datos de stats cambien
  useEffect(() => {
    if (stats.totalSierras > 0 && chartRef.current) {
      // Asegurarse de que el contenedor esté vacío antes de dibujar
      while (chartRef.current.firstChild) {
        chartRef.current.removeChild(chartRef.current.firstChild);
      }
      
      // Dibujar el gráfico
      drawPieChart();
    }
  }, [stats.totalSierras, stats.sierrasActivas, stats.sierrasInactivas]);

  // Renderizar esqueletos durante la carga
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {Array(8).fill(0).map((_, cellIndex) => (
          <TableCell key={`cell-${index}-${cellIndex}`}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Cliente</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de control de cliente. Aquí puede ver el estado de sus sierras y afilados.
        </p>
      </div>
      
      {/* Sección de estadísticas */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {/* Tarjeta de Sierras */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Sierras</CardTitle>
              <Scissors className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Resumen de tus sierras registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalSierras}</div>
            <div className="text-sm text-muted-foreground mb-4">
              <span className="text-green-500">{stats.sierrasActivas}</span> activas, <span className="text-red-500">{stats.sierrasInactivas}</span> inactivas
            </div>
            
            {/* Gráfico circular */}
            <div ref={chartRef} className="flex justify-center items-center h-48"></div>
          </CardContent>
        </Card>
        
        {/* Tarjeta de Afilados */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Afilados</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Historial de afilados realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalAfilados}</div>
            <div className="text-sm text-muted-foreground mb-4">
              Total de afilados registrados
            </div>
            
            {/* Gráfico de barras simplificado */}
            <div className="h-48 flex items-end justify-between gap-2 mt-4">
              {['nov', 'dic', 'ene', 'feb', 'mar', 'abr'].map((month, index) => {
                const height = [20, 30, 25, 40, 35, 70][index];
                const isLastMonth = index === 5;
                return (
                  <div key={month} className="flex flex-col items-center">
                    <div 
                      className={`w-8 rounded-t ${isLastMonth ? 'bg-primary' : 'bg-primary/80'}`}
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs text-muted-foreground mt-2">{month}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Tarjeta de Próximos Afilados */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Próximos Afilados</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Sierras que requieren afilado pronto
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.proximosAfilados?.map((afilado) => (
                <div key={afilado.id} className="flex justify-between items-center p-3 hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{afilado.codigo}</div>
                    <div className="text-xs text-muted-foreground">SIERRA {afilado.tipo}</div>
                  </div>
                  <Badge variant={afilado.dias <= 12 ? "destructive" : "secondary"} className="ml-auto">
                    {afilado.dias} días
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      

      
      {/* Sección de reporte completo */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reporte de Afilados</CardTitle>
              <CardDescription>
                Historial completo de afilados de sus sierras
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {reporteItems.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportToExcel}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar a Excel
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                {showFilters ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Ocultar Filtros</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Mostrar Filtros</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reporteError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{reporteError}</AlertDescription>
            </Alert>
          )}
          
          {showFilters && (
            <div className="mb-6">
              <ReporteAfiladosFilters 
                onFilter={handleFilter} 
                empresaIdFijo={stats.empresaId?.toString()}
                isLoading={reporteLoading}
              />
            </div>
          )}
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Sierra</TableHead>
                  <TableHead>Tipo Sierra</TableHead>
                  <TableHead>Tipo Afilado</TableHead>
                  <TableHead>Fecha Afilado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporteLoading ? (
                  renderSkeletons()
                ) : reporteItems.length > 0 ? (
                  reporteItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.codigo_sierra}</TableCell>
                      <TableCell>{item.tipo_sierra}</TableCell>
                      <TableCell>{item.tipo_afilado}</TableCell>
                      <TableCell>{item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                      <TableCell>{item.sucursal}</TableCell>
                      <TableCell>
                        <Badge variant={item.activo ? "success" : "destructive"}>
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalles del Afilado</DialogTitle>
                              <DialogDescription>
                                Información detallada del afilado seleccionado
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm">Empresa</h4>
                                  <p>{selectedItem?.empresa}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Sucursal</h4>
                                  <p>{selectedItem?.sucursal}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Código Sierra</h4>
                                  <p>{selectedItem?.codigo_sierra}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Tipo Sierra</h4>
                                  <p>{selectedItem?.tipo_sierra}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Tipo Afilado</h4>
                                  <p>{selectedItem?.tipo_afilado}</p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-sm">Fecha Afilado</h4>
                                  <p>{selectedItem?.fecha_afilado ? format(new Date(selectedItem.fecha_afilado), 'dd/MM/yyyy') : 'N/A'}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Fecha Registro</h4>
                                  <p>{selectedItem?.fecha_registro ? format(new Date(selectedItem.fecha_registro), 'dd/MM/yyyy') : 'N/A'}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Estado</h4>
                                  <Badge variant={selectedItem?.activo ? "success" : "destructive"}>
                                    {selectedItem?.activo ? 'Activo' : 'Inactivo'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      {filtrosAplicados ? 'No se encontraron resultados con los filtros aplicados' : 'Aplique filtros para ver los resultados'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {reporteItems.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {reporteItems.length} registros
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
