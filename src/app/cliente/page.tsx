'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
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
  fecha_ingreso: string;
  fecha_salida: string;
  sierra_id: number;
  sierras: {
    codigo_barras: string;
  };
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

  // Datos estáticos para el dashboard
  const [stats, setStats] = useState<StatsData>({
    totalSierras: 354,
    sierrasActivas: 310,
    sierrasInactivas: 44,
    afiladosPendientes: 15,
    totalAfilados: 762,
    ultimosAfilados: [],
    proximosAfilados: [
      { id: 24120309, codigo: "SIERRA D30D 796", tipo: "D30D", dias: 12 },
      { id: 24100290, codigo: "SIERRA D30D 296", tipo: "D30D", dias: 12 },
      { id: 24100158, codigo: "SIERRA D30D 266", tipo: "D30D", dias: 12 },
      { id: 24120152, codigo: "SIERRA D30D 796", tipo: "D30D", dias: 13 },
      { id: 24120203, codigo: "SIERRA D30D 796", tipo: "D30D", dias: 13 }
    ],
    empresaId: 1
  });

  useEffect(() => {
    // Simular carga de datos
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      
      // Cargar datos de reporte simulados
      handleFilter({
        empresa_id: 1,
        fecha_desde: null,
        fecha_hasta: null,
        sucursal_id: null,
        tipo_sierra_id: null,
        tipo_afilado_id: null,
        activo: true
      });
    }, 1000);
  }, []);

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

    // Limpiar el contenido anterior
    chartRef.current.innerHTML = '';

    // Crear el SVG con menos altura para dejar espacio a la leyenda
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "200");
    svg.setAttribute("height", "160"); // Reducir altura para dejar espacio a la leyenda
    svg.setAttribute("viewBox", "0 0 100 100");
    
    // Crear el círculo de fondo
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", "40");
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("stroke", "#ff4d4f");
    circle.setAttribute("stroke-width", "20");
    svg.appendChild(circle);

    // Calcular el perímetro del círculo
    const circumference = 2 * Math.PI * 40;
    
    // Crear el arco para el porcentaje activo
    const arc = document.createElementNS(svgNS, "circle");
    arc.setAttribute("cx", "50");
    arc.setAttribute("cy", "50");
    arc.setAttribute("r", "40");
    arc.setAttribute("fill", "transparent");
    arc.setAttribute("stroke", "#52c41a");
    arc.setAttribute("stroke-width", "20");
    arc.setAttribute("stroke-dasharray", circumference.toString());
    arc.setAttribute("stroke-dashoffset", (circumference * (1 - activasPct / 100)).toString());
    arc.setAttribute("transform", "rotate(-90 50 50)");
    svg.appendChild(arc);

    // Crear el texto central
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "50");
    text.setAttribute("y", "50");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-size", "16");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", "white");
    text.textContent = `${activasPct}%`;
    svg.appendChild(text);

    // Crear el texto de la etiqueta
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", "50");
    label.setAttribute("y", "65");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", "#52c41a");
    label.textContent = "SIERRA D3C";
    svg.appendChild(label);

    // Añadir el SVG al contenedor
    chartRef.current.appendChild(svg);

    // Añadir la leyenda con mejor visibilidad
    const legend = document.createElement("div");
    legend.className = "flex flex-col items-center justify-center mt-6";
    
    // Título de la leyenda
    const legendTitle = document.createElement("div");
    legendTitle.className = "text-sm font-medium mb-2";
    legendTitle.textContent = "Estado de Sierras";
    legend.appendChild(legendTitle);
    
    // Contenedor de los elementos de la leyenda
    const legendItems = document.createElement("div");
    legendItems.className = "flex justify-center gap-6 text-sm";
    
    const activeLegend = document.createElement("div");
    activeLegend.className = "flex items-center";
    activeLegend.innerHTML = `<span class="inline-block w-4 h-4 bg-green-500 mr-2 rounded-full"></span> <span class="font-medium">${activas}</span> activas`;
    
    const inactiveLegend = document.createElement("div");
    inactiveLegend.className = "flex items-center";
    inactiveLegend.innerHTML = `<span class="inline-block w-4 h-4 bg-red-500 mr-2 rounded-full"></span> <span class="font-medium">${inactivas}</span> inactivas`;
    
    legendItems.appendChild(activeLegend);
    legendItems.appendChild(inactiveLegend);
    legend.appendChild(legendItems);
    
    chartRef.current.appendChild(legend);
  };

  // Manejar la aplicación de filtros para el reporte (versión estática)
  const handleFilter = (filters: ReporteAfiladosPorClienteFilters) => {
    setReporteLoading(true);
    setReporteError(null);
    
    // Simular un tiempo de carga
    setTimeout(() => {
      // Generar datos simulados para el reporte
      const simulatedData: ReporteAfiladoItem[] = Array(10).fill(0).map((_, index) => ({
        id: 1000 + index,
        empresa: 'Empresa Demo',
        empresa_id: 1,
        sucursal: 'Sucursal Principal',
        sucursal_id: 1,
        codigo_sierra: `SIERRA-${1000 + index}`,
        sierra_id: 1000 + index,
        tipo_sierra: 'D30D',
        tipo_sierra_id: 1,
        tipo_afilado: 'Estándar',
        tipo_afilado_id: 1,
        estado_sierra: 'Activo',
        estado_sierra_id: 1,
        fecha_afilado: new Date(Date.now() - (index * 86400000)).toISOString(),
        fecha_registro: new Date(Date.now() - (index * 86400000)).toISOString(),
        activo: index % 5 !== 0 // Algunos activos, otros no
      }));
      
      setReporteItems(simulatedData);
      setFiltrosAplicados(filters);
      setReporteLoading(false);
    }, 500);
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
      'Estado Sierra': item.estado_sierra,
      'Fecha Afilado': format(new Date(item.fecha_afilado), 'dd/MM/yyyy'),
      'Fecha Registro': format(new Date(item.fecha_registro), 'dd/MM/yyyy'),
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
                  <TableHead>Estado</TableHead>
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
                      <TableCell>
                        <Badge variant="outline">{item.estado_sierra}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(item.fecha_afilado), 'dd/MM/yyyy')}</TableCell>
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
                                  <h4 className="font-semibold text-sm">Estado Sierra</h4>
                                  <p>{selectedItem?.estado_sierra}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Fecha Afilado</h4>
                                  <p>{selectedItem && format(new Date(selectedItem.fecha_afilado), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">Fecha Registro</h4>
                                  <p>{selectedItem && format(new Date(selectedItem.fecha_registro), 'dd/MM/yyyy')}</p>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportToExcel}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
