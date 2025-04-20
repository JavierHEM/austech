'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileSpreadsheet, Info, Eye, Filter } from 'lucide-react';
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

import ReporteAfiladosFilters from '@/components/reportes/ReporteAfiladosFilters';
import { getReporteAfiladosPorCliente, ReporteAfiladosPorClienteFilters, ReporteAfiladoItem } from '@/services/reporteService';

export default function ReporteAfiladosPorClientePage() {
  const [reporteItems, setReporteItems] = useState<ReporteAfiladoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState<ReporteAfiladosPorClienteFilters | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReporteAfiladoItem | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Manejar la aplicación de filtros
  const handleFilter = async (filters: ReporteAfiladosPorClienteFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getReporteAfiladosPorCliente(filters);
      setReporteItems(data);
      setFiltrosAplicados(filters);
    } catch (err: any) {
      console.error('Error al generar reporte:', err);
      setError(err.message || 'Error al generar el reporte');
      setReporteItems([]);
    } finally {
      setIsLoading(false);
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
      'Estado Sierra': item.estado_sierra,
      'Fecha Afilado': format(new Date(item.fecha_afilado), 'dd/MM/yyyy'),
      'Fecha Registro': format(new Date(item.fecha_registro), 'dd/MM/yyyy'),
      'Activo': item.activo ? 'Sí' : 'No',
      'Observaciones': item.observaciones || ''
    }));

    // Crear libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Afilados por Cliente');

    // Ajustar anchos de columna
    const columnWidths = [
      { wch: 25 }, // Empresa
      { wch: 20 }, // Sucursal
      { wch: 15 }, // Tipo Sierra
      { wch: 15 }, // Código Sierra
      { wch: 15 }, // Tipo Afilado
      { wch: 15 }, // Estado Sierra
      { wch: 15 }, // Fecha Afilado
      { wch: 15 }, // Fecha Registro
      { wch: 10 }, // Activo
      { wch: 30 }  // Observaciones
    ];
    worksheet['!cols'] = columnWidths;

    // Generar nombre de archivo con fecha
    const fechaHoy = format(new Date(), 'dd-MM-yyyy');
    let fileName = `Reporte_Afilados_${fechaHoy}.xlsx`;

    // Guardar archivo
    XLSX.writeFile(workbook, fileName);
  };

  // Renderizar esqueletos durante la carga
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={index}>
        {Array(8).fill(0).map((_, cellIndex) => (
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
  };
  
  // Alternar visibilidad de filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reporte de Afilados por Cliente</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={toggleFilters}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <ReporteAfiladosFilters onFilter={handleFilter} />
      )}

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Reporte de Afilados por Cliente</CardTitle>
            <CardDescription>
              Visualiza y exporta información de afilados por cliente
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFilters}
              className="h-8 gap-1"
            >
              <Filter className="h-3.5 w-3.5" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              disabled={reporteItems.length === 0 || isLoading}
              className="h-8 gap-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar a Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {reporteItems.length === 0 && !isLoading && !error && filtrosAplicados && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>No se encontraron registros con los filtros aplicados.</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="tabla" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tabla">Vista de Tabla</TabsTrigger>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tabla" className="w-full">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Tipo Sierra</TableHead>
                      <TableHead>Código Sierra</TableHead>
                      <TableHead>Tipo Afilado</TableHead>
                      <TableHead>Estado Sierra</TableHead>
                      <TableHead>Fecha Afilado</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      renderSkeletons()
                    ) : (
                      reporteItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.empresa}</TableCell>
                          <TableCell>{item.sucursal}</TableCell>
                          <TableCell>{item.tipo_sierra}</TableCell>
                          <TableCell>{item.codigo_sierra}</TableCell>
                          <TableCell>{item.tipo_afilado}</TableCell>
                          <TableCell>
                            <Badge variant={
                              item.estado_sierra === 'Disponible' ? 'success' :
                              item.estado_sierra === 'En afilado' ? 'outline' :
                              'default'
                            }>
                              {item.estado_sierra}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.fecha_afilado), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.activo ? 'success' : 'destructive'}>
                              {item.activo ? 'Sí' : 'No'}
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
                                    Información completa del registro de afilado
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Empresa:</p>
                                    <p className="text-sm">{item.empresa}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Sucursal:</p>
                                    <p className="text-sm">{item.sucursal}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Tipo Sierra:</p>
                                    <p className="text-sm">{item.tipo_sierra}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Código Sierra:</p>
                                    <p className="text-sm">{item.codigo_sierra}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Tipo Afilado:</p>
                                    <p className="text-sm">{item.tipo_afilado}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Estado Sierra:</p>
                                    <p className="text-sm">{item.estado_sierra}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Fecha Afilado:</p>
                                    <p className="text-sm">{format(new Date(item.fecha_afilado), 'dd/MM/yyyy', { locale: es })}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Fecha Registro:</p>
                                    <p className="text-sm">{format(new Date(item.fecha_registro), 'dd/MM/yyyy', { locale: es })}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Activo:</p>
                                    <p className="text-sm">{item.activo ? 'Sí' : 'No'}</p>
                                  </div>
                                  <div className="space-y-1 col-span-2">
                                    <p className="text-sm font-medium">Observaciones:</p>
                                    <p className="text-sm">{item.observaciones || 'Sin observaciones'}</p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="resumen" className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          reporteItems.reduce((acc, item) => {
                            acc[item.sucursal] = (acc[item.sucursal] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
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
                          reporteItems.reduce((acc, item) => {
                            acc[item.tipo_sierra] = (acc[item.tipo_sierra] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
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
                
                {/* Resumen por tipo de afilado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Afilados por Tipo de Afilado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : reporteItems.length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(
                          reporteItems.reduce((acc, item) => {
                            acc[item.tipo_afilado] = (acc[item.tipo_afilado] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
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
  );
}
