'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ClienteReporteItem, ClienteReporteFilters, getAllReporteAfiladosPorCliente } from '@/services/clienteReporteService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ClienteReporteTableProps {
  items: ClienteReporteItem[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  filtrosAplicados: ClienteReporteFilters | null;
}

export function ClienteReporteTable({
  items,
  loading,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  filtrosAplicados
}: ClienteReporteTableProps) {
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState(false);

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

  // Exportar a Excel
  const handleExportToExcel = async () => {
    if (!filtrosAplicados) {
      toast({
        title: 'Error',
        description: 'Debe aplicar filtros antes de exportar',
        variant: 'destructive'
      });
      return;
    }

    setExportLoading(true);
    try {
      // Obtener todos los datos para exportar
      const allData = await getAllReporteAfiladosPorCliente(filtrosAplicados);
      
      if (allData.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'No hay datos para exportar con los filtros aplicados',
          variant: 'destructive'
        });
        return;
      }

      // Preparar datos para Excel
      const worksheet = XLSX.utils.json_to_sheet(allData.map(item => ({
        'ID': item.id,
        'Fecha Ingreso': item.fecha_afilado,
        'Fecha Salida': item.fecha_salida,
        'Código': item.codigo_barras,
        'Tipo Sierra': item.tipo_sierra,
        'Tipo Afilado': item.tipo_afilado,
        'Sucursal': item.sucursal,
        'Estado': item.estado,
        'Observaciones': item.observaciones || ''
      })));

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 10 }, // ID
        { wch: 15 }, // Fecha Ingreso
        { wch: 15 }, // Fecha Salida
        { wch: 15 }, // Código
        { wch: 20 }, // Tipo Sierra
        { wch: 20 }, // Tipo Afilado
        { wch: 20 }, // Sucursal
        { wch: 15 }, // Estado
        { wch: 30 }  // Observaciones
      ];
      worksheet['!cols'] = columnWidths;

      // Crear libro y archivo
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Afilados');
      
      // Generar nombre de archivo con fecha actual
      const fileName = `Reporte_Afilados_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: 'Exportación exitosa',
        description: `Se han exportado ${allData.length} registros a Excel`,
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast({
        title: 'Error al exportar',
        description: 'No se pudo completar la exportación. Intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón de exportación a Excel */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleExportToExcel}
          disabled={exportLoading || loading || !filtrosAplicados || items.length === 0}
          variant="outline"
        >
          {exportLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar a Excel
            </>
          )}
        </Button>
      </div>

      {/* Tabla de resultados */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo Sierra</TableHead>
              <TableHead>Tipo Afilado</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Fecha Ingreso</TableHead>
              <TableHead>Fecha Salida</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              renderSkeletons()
            ) : items.length > 0 ? (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.codigo_barras}</TableCell>
                  <TableCell>{item.tipo_sierra}</TableCell>
                  <TableCell>{item.tipo_afilado}</TableCell>
                  <TableCell>{item.sucursal}</TableCell>
                  <TableCell>{item.fecha_afilado}</TableCell>
                  <TableCell>{item.fecha_salida}</TableCell>
                  <TableCell>{item.estado}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.observaciones || '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  {filtrosAplicados && filtrosAplicados.fecha_desde && filtrosAplicados.fecha_hasta 
                    ? 'No se encontraron resultados con los filtros aplicados' 
                    : 'Seleccione un rango de fechas y presione "Generar Reporte" para ver los resultados'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {items.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          <div className="flex flex-wrap items-center space-x-2 order-2 md:order-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || loading}
            >
              Primera
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Anterior
            </Button>
            
            {/* Mostrar números de página */}
            <div className="flex items-center space-x-1">
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
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading}
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Siguiente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || loading}
            >
              Última
            </Button>
          </div>
          <div className="flex items-center space-x-4 order-1 md:order-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {items.length} de {totalItems} registros (Página {currentPage} de {totalPages})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
