'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ReporteAfiladosFiltros, 
  ReporteAfiladoItem, 
  obtenerReporteAfilados 
} from '@/services/nuevoReporteAfiladosService';
import { NuevoReporteAfiladosFilters } from '@/components/reportes/NuevoReporteAfiladosFilters';
import { DetalleSierraModal } from '@/components/reportes/DetalleSierraModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ChevronDown, 
  Download, 
  Eye, 
  FileSpreadsheet, 
  Filter, 
  Loader2, 
  MoreHorizontal 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NuevoReporteAfiladosPorClientePage() {
  // Estados para el reporte
  const [reporteItems, setReporteItems] = useState<ReporteAfiladoItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estado para los filtros aplicados
  const [filtrosAplicados, setFiltrosAplicados] = useState<ReporteAfiladosFiltros | null>(null);
  
  // Estado para el modal de detalle
  const [sierraSeleccionadaId, setSierraSeleccionadaId] = useState<number | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  
  // Estado para el diálogo de exportación
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Router y parámetros de URL
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Función para aplicar filtros y obtener datos
  const handleFilter = async (filtros: ReporteAfiladosFiltros, pagina: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar fechas
      if (!filtros.fecha_desde || !filtros.fecha_hasta) {
        setError('Debe seleccionar un rango de fechas para generar el reporte');
        setReporteItems([]);
        return;
      }
      
      const fechaDesde = new Date(filtros.fecha_desde as string);
      const fechaHasta = new Date(filtros.fecha_hasta as string);
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        setError('El rango de fechas no puede ser mayor a 31 días');
        setReporteItems([]);
        return;
      }
      
      // Guardar filtros aplicados y página actual
      setFiltrosAplicados(filtros);
      setCurrentPage(pagina);
      
      // Obtener datos del reporte
      const resultado = await obtenerReporteAfilados(filtros, pagina, pageSize);
      
      if (resultado) {
        setReporteItems(resultado.datos);
        setTotalItems(resultado.total);
        setTotalPages(Math.ceil(resultado.total / pageSize));
      } else {
        setReporteItems([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Error al obtener reporte:', err);
      setError(`Error al obtener reporte: ${err.message || 'Error desconocido'}`);
      setReporteItems([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cambiar de página
  const handlePageChange = (pagina: number) => {
    if (filtrosAplicados) {
      handleFilter(filtrosAplicados, pagina);
    }
  };
  
  // Función para mostrar el detalle de una sierra
  const handleVerDetalle = (sierraId: number) => {
    setSierraSeleccionadaId(sierraId);
    setModalDetalleAbierto(true);
  };
  
  // Función para exportar a Excel
  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      
      if (!filtrosAplicados) {
        setError('Debe aplicar filtros antes de exportar');
        return;
      }
      
      // Obtener todos los datos para exportar (sin paginación)
      const resultado = await obtenerReporteAfilados(filtrosAplicados, 1, 10000);
      
      if (!resultado || !resultado.datos || resultado.datos.length === 0) {
        setError('No hay datos para exportar');
        return;
      }
      
      // Preparar los datos para Excel
      const datosExcel = resultado.datos.map(item => ({
        'Empresa': item.empresa,
        'Sucursal': item.sucursal,
        'Tipo Sierra': item.tipo_sierra,
        'Código Sierra': item.codigo_sierra,
        'Tipo Afilado': item.tipo_afilado,
        'Fecha Afilado': item.fecha_afilado,
        'Fecha Salida': item.fecha_salida === 'Pendiente' ? 'Pendiente' : 
                       item.fecha_salida ? format(new Date(item.fecha_salida), 'dd/MM/yyyy', { locale: es }) : 'N/A',
        'Estado': item.estado,
        'Observaciones': item.observaciones
      }));
      
      // Crear el libro de Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Afilados');
      
      // Generar nombre de archivo con fecha
      const fechaActual = format(new Date(), 'dd-MM-yyyy', { locale: es });
      const nombreArchivo = `Reporte_Afilados_${fechaActual}.xlsx`;
      
      // Guardar el archivo
      XLSX.writeFile(wb, nombreArchivo);
      
      // Cerrar el diálogo
      setExportDialogOpen(false);
    } catch (err: any) {
      console.error('Error al exportar a Excel:', err);
      setError(`Error al exportar a Excel: ${err.message || 'Error desconocido'}`);
    } finally {
      setExportLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reporte de Afilados por Cliente</h1>
        
        {reporteItems.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setExportDialogOpen(true)}
            disabled={isLoading || exportLoading}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
        )}
      </div>
      
      <Separator />
      
      {/* Filtros */}
      <NuevoReporteAfiladosFilters 
        onFilter={handleFilter} 
        loading={isLoading} 
      />
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      )}
      
      {/* Resultados */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Resultados</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="ml-2">
                {totalItems} registros
              </Badge>
              
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reporteItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filtrosAplicados ? 'No se encontraron registros con los filtros aplicados' : 'Aplique filtros para ver resultados'}
            </div>
          ) : (
            <>
              {/* Tabla de resultados */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Tipo Sierra</TableHead>
                      <TableHead>Código Sierra</TableHead>
                      <TableHead>Tipo Afilado</TableHead>
                      <TableHead>Fecha Afilado</TableHead>
                      <TableHead>Fecha Salida</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.empresa}</TableCell>
                        <TableCell>{item.sucursal}</TableCell>
                        <TableCell>{item.tipo_sierra}</TableCell>
                        <TableCell>{item.codigo_sierra}</TableCell>
                        <TableCell>{item.tipo_afilado}</TableCell>
                        <TableCell>{item.fecha_afilado}</TableCell>
                        <TableCell>
                          {item.fecha_salida === 'Pendiente' ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                              Pendiente
                            </Badge>
                          ) : item.fecha_salida ? (
                            format(new Date(item.fecha_salida), 'dd/MM/yyyy', { locale: es })
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{item.estado}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleVerDetalle(item.sierra_id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de detalle de sierra */}
      <DetalleSierraModal 
        sierraId={sierraSeleccionadaId}
        isOpen={modalDetalleAbierto}
        onClose={() => {
          setModalDetalleAbierto(false);
          setSierraSeleccionadaId(null);
        }}
      />
      
      {/* Diálogo de confirmación para exportar */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar a Excel</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea exportar todos los registros del reporte a Excel?
              {totalItems > 1000 && (
                <div className="mt-2 text-amber-600">
                  Atención: El reporte contiene {totalItems} registros. La exportación puede tardar unos momentos.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={exportLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                exportToExcel();
              }}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
