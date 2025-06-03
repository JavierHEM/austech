'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Eye, FileSpreadsheet, Info } from "lucide-react";
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useAuth } from '@/hooks/use-auth';
import { getReporteAfiladosPorCliente, ReporteAfiladoItem, ReporteAfiladosPorClienteFilters } from '@/services/reporteService';
import { getUserEmpresaId } from '@/services/userService';
import ReporteAfiladosFilters from '@/components/reportes/ReporteAfiladosFilters';

export default function MisAfiladosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { session, role, loading: authLoading } = useAuth();
  const [reporteItems, setReporteItems] = useState<ReporteAfiladoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState<ReporteAfiladosPorClienteFilters | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReporteAfiladoItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Cargar la empresa del usuario
  useEffect(() => {
    const loadUserEmpresa = async () => {
      if (!session?.user?.id) return;
      
      try {
        setIsLoading(true);
        const empresaId = await getUserEmpresaId(session.user.id);
        setEmpresaId(empresaId);
      } catch (error) {
        console.error('Error al obtener la empresa del usuario:', error);
        setError('No se pudo obtener la empresa asignada a tu usuario.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserEmpresa();
  }, [session]);

  // Cargar reporte cuando se aplican filtros
  const handleFilter = async (filters: ReporteAfiladosPorClienteFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar que se hayan seleccionado fechas
      if (!filters.fecha_desde || !filters.fecha_hasta) {
        setError('Debe seleccionar un rango de fechas para generar el reporte (máximo 31 días)');
        setReporteItems([]);
        return;
      }
      
      // Validar que el rango de fechas no sea mayor a 31 días
      const fechaDesde = new Date(filters.fecha_desde as string);
      const fechaHasta = new Date(filters.fecha_hasta as string);
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        setError('El rango de fechas no puede ser mayor a 31 días');
        setReporteItems([]);
        return;
      }
      
      // Asegurarse de que se use el ID de empresa del usuario si está disponible
      let filtrosConEmpresa = { 
        ...filters,
        isExport: true // Obtener todos los resultados sin paginación
      };
      
      // Si tenemos datos de empresa del usuario, forzar ese valor
      if (empresaId) {
        filtrosConEmpresa.empresa_id = empresaId;
      }
      
      console.log('Aplicando filtros para reporte:', filtrosConEmpresa);
      
      // Obtener datos del servicio
      const result = await getReporteAfiladosPorCliente(filtrosConEmpresa);
      
      // Verificar si el resultado es un objeto paginado o un array
      if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data) && 'count' in result) {
        // Es un objeto paginado (formato actual)
        // Usar tipado más específico para evitar errores de TypeScript
        const paginatedResult = result as { data: ReporteAfiladoItem[], count: number };
        console.log(`Reporte cargado: ${paginatedResult.data.length} registros encontrados de un total de ${paginatedResult.count}`);
        setReporteItems(paginatedResult.data);
      } else {
        // Es un array (formato antiguo, por compatibilidad)
        console.log(`Reporte cargado: ${(result as any).length} registros encontrados`);
        setReporteItems(result as unknown as ReporteAfiladoItem[]);
      }
      
      setFiltrosAplicados(filtrosConEmpresa);
    } catch (err: any) {
      console.error('Error al generar reporte:', err);
      setError(err.message || 'Error al generar el reporte');
      setReporteItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar a Excel - Genera el reporte con todos los datos según los filtros aplicados
  const handleExportToExcel = async () => {
    if (!filtrosAplicados) return;
    
    try {
      // Mostrar indicador de carga
      setIsLoading(true);
      
      // Agregar flag para indicar que queremos todos los resultados para exportar
      const filtrosConExport = {
        ...filtrosAplicados,
        isExport: true // Obtener todos los resultados sin paginación
      };
      
      // Obtener todos los datos para exportar
      const result = await getReporteAfiladosPorCliente(filtrosConExport);
      
      // Verificar si el resultado es un objeto paginado o un array
      let allData: ReporteAfiladoItem[] = [];
      if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
        // Es un objeto paginado (formato actual)
        const paginatedResult = result as { data: ReporteAfiladoItem[], count: number };
        allData = paginatedResult.data;
      } else {
        // Es un array (formato antiguo, por compatibilidad)
        allData = result as unknown as ReporteAfiladoItem[];
      }
      
      if (allData.length === 0) {
        return;
      }
      
      // Convertir los datos a formato para Excel
      const workbook = XLSX.utils.book_new();
      const excelData = allData.map(item => ({
        'Empresa': item.empresa,
        'Sucursal': item.sucursal,
        'Tipo Sierra': item.tipo_sierra,
        'Código Sierra': item.codigo_sierra,
        'Tipo Afilado': item.tipo_afilado,
        'Fecha Afilado': item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
        'Fecha Salida': item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy') : 'N/A',
        'Estado': item.estado_afilado,
        'Fecha Registro': item.fecha_registro ? format(new Date(item.fecha_registro), 'dd/MM/yyyy') : 'N/A',
        'Activo Sierra': item.activo ? 'Sí' : 'No',
        'Observaciones': item.observaciones || ''
      }));
      
      // Crear hoja de Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mis Afilados');
      
      // Ajustar anchos de columnas
      const columnWidths = [
        { wch: 15 }, // Empresa
        { wch: 15 }, // Sucursal
        { wch: 15 }, // Tipo Sierra
        { wch: 15 }, // Código Sierra
        { wch: 15 }, // Tipo Afilado
        { wch: 15 }, // Fecha Afilado
        { wch: 15 }, // Fecha Salida
        { wch: 10 }, // Estado
        { wch: 15 }, // Fecha Registro
        { wch: 10 }, // Activo
        { wch: 30 }  // Observaciones
      ];
      worksheet['!cols'] = columnWidths;

      // Generar nombre de archivo con fecha
      const fechaHoy = format(new Date(), 'dd-MM-yyyy');
      let fileName = `Mis_Afilados_${fechaHoy}.xlsx`;

      // Guardar archivo
      XLSX.writeFile(workbook, fileName);
    } catch (error: any) {
      console.error('Error al exportar a Excel:', error);
      setError(error.message || 'Error al exportar a Excel');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar esqueletos durante la carga
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
      </TableRow>
    ));
  };

  // Manejar la visualización de detalles
  const handleViewDetails = (item: ReporteAfiladoItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 pt-0">
      <div className="mb-6">
        <ReporteAfiladosFilters 
          onFilter={handleFilter} 
          isLoading={isLoading}
          empresaIdFijo={empresaId?.toString() || null}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Mis Afilados</h2>
        {reporteItems.length > 0 && (
          <Button 
            variant="outline" 
            onClick={handleExportToExcel}
            disabled={isLoading || !filtrosAplicados}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="tabla" className="w-full">
        <TabsList className="grid w-[200px] grid-cols-2 mb-4">
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
        </TabsList>
        <TabsContent value="tabla">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Tipo Sierra</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo Afilado</TableHead>
                      <TableHead>Fecha Afilado</TableHead>
                      <TableHead>Fecha Salida</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      renderSkeletons()
                    ) : reporteItems.length > 0 ? (
                      reporteItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.empresa}</TableCell>
                          <TableCell>{item.sucursal}</TableCell>
                          <TableCell>{item.tipo_sierra}</TableCell>
                          <TableCell>{item.codigo_sierra}</TableCell>
                          <TableCell>{item.tipo_afilado}</TableCell>
                          <TableCell>
                            {item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.estado_afilado === 'Activo' ? "default" : "secondary"}>
                              {item.estado_afilado}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={item.observaciones || ''}>
                            {item.observaciones || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleViewDetails(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalles</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          {error ? (
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                              <p>{error}</p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">
                              No hay datos disponibles. Aplica filtros para generar el reporte.
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resumen">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Afilados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reporteItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registros encontrados con los filtros aplicados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Afilados Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reporteItems.filter(item => item.estado_afilado === 'Activo').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Afilados con estado activo
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Afilados Inactivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reporteItems.filter(item => item.estado_afilado === 'Inactivo').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Afilados con estado inactivo
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de detalles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Afilado</DialogTitle>
            <DialogDescription>
              Información completa del registro seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Empresa</h4>
                  <p className="text-sm">{selectedItem.empresa}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Sucursal</h4>
                  <p className="text-sm">{selectedItem.sucursal}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Tipo Sierra</h4>
                  <p className="text-sm">{selectedItem.tipo_sierra}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Código Sierra</h4>
                  <p className="text-sm">{selectedItem.codigo_sierra}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Tipo Afilado</h4>
                  <p className="text-sm">{selectedItem.tipo_afilado}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Fecha Afilado</h4>
                  <p className="text-sm">
                    {selectedItem.fecha_afilado ? format(new Date(selectedItem.fecha_afilado), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Fecha Salida</h4>
                  <p className="text-sm">
                    {selectedItem.fecha_salida ? format(new Date(selectedItem.fecha_salida), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Estado</h4>
                  <Badge variant={selectedItem.estado_afilado === 'Activo' ? "default" : "secondary"}>
                    {selectedItem.estado_afilado}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Fecha Registro</h4>
                  <p className="text-sm">
                    {selectedItem.fecha_registro ? format(new Date(selectedItem.fecha_registro), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Sierra Activa</h4>
                  <Badge variant={selectedItem.activo ? "default" : "secondary"}>
                    {selectedItem.activo ? 'Sí' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
