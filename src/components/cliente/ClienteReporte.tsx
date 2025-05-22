'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ClienteReporteFilters, ClienteReporteItem, getReporteAfiladosPorCliente } from '@/services/clienteReporteService';
import { getEmpresaIdFromUser } from '@/services/clienteService';
import { ClienteReporteFilters as ClienteReporteFiltersComponent } from './ClienteReporteFilters';
import { ClienteReporteTable } from './ClienteReporteTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function ClienteReporte() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reporteItems, setReporteItems] = useState<ClienteReporteItem[]>([]);
  const [reporteError, setReporteError] = useState<string | null>(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState<ClienteReporteFilters | null>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 20; // Tamaño de página fijo

  // Obtener el ID de empresa del usuario al cargar el componente
  useEffect(() => {
    const fetchEmpresaId = async () => {
      if (session?.user?.id) {
        try {
          const id = await getEmpresaIdFromUser(session.user.id);
          setEmpresaId(id);
        } catch (error) {
          console.error('Error al obtener ID de empresa:', error);
          toast({
            title: 'Error',
            description: 'No se pudo obtener la información de su empresa',
            variant: 'destructive'
          });
        }
      }
    };

    fetchEmpresaId();
  }, [session, toast]);

  // Manejar la aplicación de filtros para el reporte
  const handleFilter = async (filters: ClienteReporteFilters, page: number = 1) => {
    setLoading(true);
    setReporteError(null);
    
    try {
      // Asegurar que se use el ID de empresa del usuario
      if (empresaId) {
        filters.empresa_id = empresaId;
      }
      
      // Guardar los filtros aplicados
      setFiltrosAplicados(filters);
      setCurrentPage(page);
      
      // Obtener datos del reporte
      const { data, count } = await getReporteAfiladosPorCliente(filters, page, pageSize);
      
      setReporteItems(data);
      setTotalItems(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      if (data.length === 0 && count === 0) {
        toast({
          title: 'Sin resultados',
          description: 'No se encontraron registros con los filtros aplicados',
        });
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setReporteError('No se pudo generar el reporte. Intente nuevamente.');
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte. Intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    if (filtrosAplicados) {
      handleFilter(filtrosAplicados, newPage);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Afilados</CardTitle>
          <CardDescription>
            Consulte el historial de afilados de sus sierras aplicando diferentes filtros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <ClienteReporteFiltersComponent 
            onFilter={handleFilter}
            loading={loading}
            empresaIdFijo={empresaId}
          />
          
          {/* Mensaje de error */}
          {reporteError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{reporteError}</AlertDescription>
            </Alert>
          )}
          
          {/* Tabla de resultados */}
          <div className="mt-6">
            <ClienteReporteTable
              items={reporteItems}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              filtrosAplicados={filtrosAplicados}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
