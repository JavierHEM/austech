'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  }, [empresaIdParam, role]); // Corregido: se agregó role a las dependencias y se eliminó la coma suelta

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

  // Exportar a Excel - Genera el reporte con todos los datos según los filtros aplicados
  const handleExportToExcel = async () => {
    if (!filtrosAplicados) return;
    
    try {
      // Mostrar indicador de carga
      setIsLoading(true);
      
      // Obtener todos los datos directamente del servicio con los filtros actuales
      // Esto asegura que exportamos TODOS los registros, no solo los que se muestran en pantalla
      const allData = await getReporteAfiladosPorCliente(filtrosAplicados);
      
      if (allData.length === 0) {
        return;
      }
      
      // Formatear datos para Excel
      const dataForExcel = allData.map(item => ({
        'Empresa': item.empresa,
        'Sucursal': item.sucursal,
        'Tipo Sierra': item.tipo_sierra,
        'Código Sierra': item.codigo_sierra,
        'Tipo Afilado': item.tipo_afilado,
        // Se eliminó la columna 'Estado Sierra' según lo solicitado
        'Fecha Afilado': item.fecha_afilado ? format(new Date(item.fecha_afilado), 'dd/MM/yyyy') : 'N/A',
        'Fecha Registro': item.fecha_registro ? format(new Date(item.fecha_registro), 'dd/MM/yyyy') : 'N/A',
        'Activo': item.activo ? 'Sí' : 'No'
      }));

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Afilados por Cliente');
      
      // Configurar formato de celdas para las fechas (dd/mm/aaaa)
      const dateColumns = ['G', 'H']; // Columnas de fecha (G: Fecha Afilado, H: Fecha Registro)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Iterar sobre las columnas de fecha y aplicar formato
      dateColumns.forEach(col => {
        for (let row = 1; row <= range.e.r; row++) { // Empezar desde 1 para omitir la cabecera
          const cellRef = `${col}${row + 1}`; // +1 porque las filas en XLSX empiezan en 1, pero el rango en 0
          if (worksheet[cellRef]) {
            // Asegurarse de que la celda se trate como texto con formato de fecha
            worksheet[cellRef].z = 'dd/mm/yyyy';
            // Marcar como texto para evitar conversiones automáticas
            worksheet[cellRef].t = 's';
          }
        }
      });

      // Ajustar anchos de columna
      const columnWidths = [
        { wch: 20 }, // Empresa
        { wch: 20 }, // Sucursal
        { wch: 15 }, // Tipo Sierra
        { wch: 15 }, // Código Sierra
        { wch: 15 }, // Tipo Afilado
        { wch: 15 }, // Fecha Afilado
        { wch: 15 }, // Fecha Registro
        { wch: 10 }  // Activo
      ];
      worksheet['!cols'] = columnWidths;

      // Generar nombre de archivo con fecha
      const fechaHoy = format(new Date(), 'dd-MM-yyyy');
      let fileName = `Reporte_Afilados_${fechaHoy}.xlsx`;

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

  // Convertimos empresaIdParam a número o undefined para satisfacer el tipo esperado por ClienteRestriction
  const empresaIdNumerico = empresaIdParam ? Number(empresaIdParam) : undefined;
  
  return (
    <ClienteRestriction empresaId={empresaIdNumerico}>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-6 w-6" />
                  Reporte de Afilados por Cliente
                </div>
              </CardTitle>
              <CardDescription>
                Visualiza y analiza los afilados realizados para cada cliente
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFilters}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleExportToExcel}
                disabled={reporteItems.length === 0 || isLoading}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Filtros */}
            {showFilters && (
              <ReporteAfiladosFilters 
                onFilter={handleFilter} 
                isLoading={isLoading} 
                empresaIdFijo={role === 'cliente' ? empresaIdParam : undefined}
              />
            )}

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
                        <TableHead>Estado</TableHead>
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
                              <Badge variant={item.activo ? "default" : "secondary"}>
                                {item.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                        {selectedItem && (
                                          <div className="space-y-4">
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
                                                <h4 className="text-sm font-medium">Estado Sierra</h4>
                                                <p className="text-sm">{selectedItem.estado_sierra}</p>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-medium">Fecha Afilado</h4>
                                                <p className="text-sm">
                                                  {selectedItem.fecha_afilado ? format(new Date(selectedItem.fecha_afilado), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                                                </p>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-medium">Fecha Registro</h4>
                                                <p className="text-sm">
                                                  {selectedItem.fecha_registro ? format(new Date(selectedItem.fecha_registro), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                                                </p>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-medium">Estado</h4>
                                                <Badge variant={selectedItem.activo ? "default" : "secondary"}>
                                                  {selectedItem.activo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                              </div>
                                            </div>

                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>
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
                          <TableCell colSpan={8} className="h-24 text-center">
                            {filtrosAplicados ? 'No se encontraron resultados' : 'Aplica filtros para ver resultados'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="resumen" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              acc[item.empresa] = (acc[item.empresa] || 0) + 1;
                              return acc;
                            }, {})
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
    </ClienteRestriction>
  );
}