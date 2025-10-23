'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { Eye, FileSpreadsheet, Filter, Info, Search } from "lucide-react";
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';

import ReporteAfiladosFiltersFixed from '@/components/reportes/ReporteAfiladosFiltersFixed';
import { getReporteAfiladosPorCliente, getAllReporteAfiladosPorCliente, ReporteAfiladosPorClienteFilters, ReporteAfiladoItem } from '@/services/reporteService';
import ClienteRestriction from '@/components/auth/ClienteRestriction';
import { useAuth } from '@/hooks/use-auth';

export default function ReporteAfiladosPorClientePage() {
  const searchParams = useSearchParams();
  const empresaIdParam = searchParams ? searchParams.get('empresa_id') : null;
  
  const { session, role, loading: authLoading } = useAuth();
  const [reporteItems, setReporteItems] = useState<ReporteAfiladoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState<ReporteAfiladosPorClienteFilters | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReporteAfiladoItem | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 20; // Tamaño de página fijo
  
  // Aplicar filtros iniciales si se proporciona un ID de empresa en la URL (para usuarios con rol cliente)
  useEffect(() => {
    if (empresaIdParam && role === 'cliente') {
      const initialFilters: ReporteAfiladosPorClienteFilters = {
        empresa_id: Number(empresaIdParam),
        fecha_desde: null,
        fecha_hasta: null,
        sucursal_id: null,
        tipo_sierra_id: null,
        tipo_afilado_id: null,
        activo: true
      };
      
      handleFilter(initialFilters);
    }
  }, [empresaIdParam, role]);

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    if (filtrosAplicados && newPage >= 1 && newPage <= totalPages) {
      handleFilter(filtrosAplicados, newPage);
    }
  };
  
  // Función para generar el reporte con los filtros actuales
  const handleGenerateReport = () => {
    if (filtrosAplicados) {
      handleFilter(filtrosAplicados, 1); // Volver a la primera página al regenerar
    }
  };
  
  // Manejar la aplicación de filtros
  const handleFilter = async (filters: ReporteAfiladosPorClienteFilters, page: number = 1) => {
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
      
      // Guardar los filtros aplicados para poder regenerar el reporte o exportar a Excel
      setFiltrosAplicados(filters);
      setCurrentPage(page);
      
      // Calcular offset para paginación
      const offset = (page - 1) * pageSize;
      
      // Obtener datos del reporte con paginación
      // Solicitando reporte con filtros aplicados
      const result = await getReporteAfiladosPorCliente(filters, page, pageSize);
      
      // Procesando resultado del reporte
      
      // La función ahora devuelve { data: ReporteAfiladoItem[], count: number }
      if (result && 'data' in result && 'count' in result) {
        setReporteItems(result.data);
        setTotalItems(result.count);
        setTotalPages(Math.ceil(result.count / pageSize));
      } else {
        console.error('Formato de respuesta inesperado:', result);
        setReporteItems([]);
        setTotalItems(0);
        setTotalPages(0);
        setError('Error en el formato de respuesta del servidor');
      }
    } catch (error: any) {
      console.error('Error al obtener reporte:', error);
      setError(error.message || 'Error al obtener el reporte');
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
      
      // Usar getAllReporteAfiladosPorCliente para obtener TODOS los registros sin paginación
      // Esta función está diseñada específicamente para la exportación a Excel
      const allData = await getAllReporteAfiladosPorCliente(filtrosAplicados);
      
      if (!allData || allData.length === 0) {
        setError('No hay datos para exportar');
        return;
      }
      
      if (allData.length === 0) {
        setError('No hay datos para exportar');
        return;
      }
      
      // Formatear datos para Excel usando las fechas reales de cada item
      const dataForExcel = allData.map((item: ReporteAfiladoItem) => {
        return {
          'Empresa': item.empresa || 'N/A',
          'Sucursal': item.sucursal || 'N/A',
          'Tipo Sierra': item.tipo_sierra || 'N/A',
          'Código Sierra': item.codigo_sierra || 'N/A',
          'Tipo Afilado': item.tipo_afilado || 'N/A',
          'Fecha Afilado': item.fecha_afilado || 'N/A',
          'Fecha Salida': item.fecha_salida || 'Pendiente',
          'Estado': item.estado || 'N/A',
          'Fecha Registro': item.fecha_registro || 'N/A',
          'Activo Sierra': item.activo ? 'Sí' : 'No',
          'Observaciones': item.observaciones || ''
        };
      });
      
      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      
      // Ajustar anchos de columna
      const columnWidths = [
        { wch: 20 }, // Empresa
        { wch: 20 }, // Sucursal
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
      
      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Afilados');
      
      // Generar nombre de archivo con fecha
      const fechaHoy = format(new Date(), 'dd-MM-yyyy');
      const fileName = `Reporte_Afilados_${fechaHoy}.xlsx`;
      
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
        {Array(10).fill(0).map((_, cellIndex) => (
          <TableCell key={cellIndex}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };
  
  // Ver detalles de un afilado
  const handleViewDetails = (item: ReporteAfiladoItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };
  
  // Alternar visibilidad de filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  return (
    <ClienteRestriction>
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Reporte de Afilados por Cliente</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportToExcel}
              disabled={!filtrosAplicados || reporteItems.length === 0 || isLoading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar a Excel
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Seleccione los filtros para generar el reporte</CardDescription>
            </CardHeader>
            <CardContent>
              <ReporteAfiladosFiltersFixed 
                onFilter={handleFilter} 
                empresaIdFijo={empresaIdParam ? empresaIdParam : null}
              />
            </CardContent>
          </Card>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Resultados</CardTitle>
              {totalItems > 0 && (
                <div className="text-sm text-muted-foreground">
                  Mostrando {reporteItems.length} de {totalItems} registros
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tabla">
              <TabsList>
                <TabsTrigger value="tabla">Tabla</TabsTrigger>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tabla" className="space-y-4">
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
                              {item.fecha_afilado}
                            </TableCell>
                            <TableCell>
                              {item.fecha_salida}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.estado === 'Activo' ? "default" : "secondary"}>
                                {item.estado}
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
                          <TableCell colSpan={10} className="h-24 text-center">
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
                
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center space-x-1" data-component-name="ReporteAfiladosPorClientePage">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          // Mostrar páginas alrededor de la página actual
                          let pageNum: number;
                          if (totalPages <= 5) {
                            // Si hay 5 o menos páginas, mostrar todas
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // Si estamos en las primeras páginas
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // Si estamos en las últimas páginas
                            pageNum = totalPages - 4 + i;
                          } else {
                            // Estamos en el medio
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={isLoading}
                              className="h-8 rounded-md px-3 text-xs"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="resumen">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Resumen por empresa */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Afilados por Empresa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-[200px] w-full" />
                      ) : reporteItems.length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(
                            reporteItems.reduce((acc: Record<string, number>, item: ReporteAfiladoItem) => {
                              // Asegurar que item.empresa sea una string válida
                              const empresaNombre = item.empresa || 'Sin empresa';
                              acc[empresaNombre] = (acc[empresaNombre] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([empresa, count]) => (
                            <div key={empresa} className="flex justify-between items-center">
                              <span>{empresa}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Resumen por sucursal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Afilados por Sucursal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-[200px] w-full" />
                      ) : reporteItems.length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(
                            reporteItems.reduce((acc: Record<string, number>, item: ReporteAfiladoItem) => {
                              acc[item.sucursal] = (acc[item.sucursal] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([sucursal, count]) => (
                            <div key={sucursal} className="flex justify-between items-center">
                              <span>{sucursal}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Resumen por tipo de sierra */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Afilados por Tipo de Sierra</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-[200px] w-full" />
                      ) : reporteItems.length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(
                            reporteItems.reduce((acc: Record<string, number>, item: ReporteAfiladoItem) => {
                              acc[item.tipo_sierra] = (acc[item.tipo_sierra] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([tipo, count]) => (
                            <div key={tipo} className="flex justify-between items-center">
                              <span>{tipo}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
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
                    {selectedItem.fecha_afilado && !isNaN(new Date(selectedItem.fecha_afilado).getTime()) ? format(new Date(selectedItem.fecha_afilado), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Fecha Salida</h4>
                  <p className="text-sm">
                    {selectedItem.fecha_salida === 'Pendiente' ? 'Pendiente' : (selectedItem.fecha_salida && !isNaN(new Date(selectedItem.fecha_salida).getTime())) ? format(new Date(selectedItem.fecha_salida), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Estado</h4>
                  <Badge variant={selectedItem.estado === 'Activo' ? "default" : "secondary"}>
                    {selectedItem.estado}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Fecha Registro</h4>
                  <p className="text-sm">
                    {selectedItem.fecha_registro && !isNaN(new Date(selectedItem.fecha_registro).getTime()) ? format(new Date(selectedItem.fecha_registro), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Sierra Activa</h4>
                  <Badge variant={selectedItem.activo ? "default" : "secondary"}>
                    {selectedItem.activo ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium">Observaciones</h4>
                  <p className="text-sm">{selectedItem.observaciones || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ClienteRestriction>
  );
}
