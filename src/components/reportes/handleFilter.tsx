import { getReporteAfiladosPorCliente, ReporteAfiladosPorClienteFilters, ReporteAfiladoItem } from '@/services/reporteService';
import { supabase } from '@/lib/supabase-client';
import { ToastAction } from '@/components/ui/toast';

interface HandleFilterProps {
  filtrosAplicados: ReporteAfiladosPorClienteFilters | null;
  setFiltrosAplicados: (filtros: ReporteAfiladosPorClienteFilters | null) => void;
  setReporteItems: (items: ReporteAfiladoItem[]) => void;
  setReporteLoading: (loading: boolean) => void;
  setReporteError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setTotalItems: (items: number) => void;
  toast: any;
  role: string;
  empresaId: number;
  pageSize: number;
  currentPage?: number;
}

export const handleFilter = async ({
  filtrosAplicados,
  setFiltrosAplicados,
  setReporteItems,
  setReporteLoading,
  setReporteError,
  setCurrentPage,
  setTotalPages,
  setTotalItems,
  toast,
  role,
  empresaId,
  pageSize,
  currentPage = 1
}: HandleFilterProps) => {
  try {
    // Si ya hay filtros aplicados y se intenta aplicar de nuevo, verificar fechas
    if (filtrosAplicados) {
      const fechaDesde = new Date(filtrosAplicados.fecha_desde as string);
      const fechaHasta = new Date(filtrosAplicados.fecha_hasta as string);
      
      // Calcular la diferencia en días
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        toast({
          title: "Rango de fechas demasiado amplio",
          description: "Por favor seleccione un rango de fechas no mayor a 31 días.",
          variant: "destructive",
          action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
        });
        return;
      }
    }
    
    setReporteLoading(true);
    setReporteError(null);
    
    try {
      // Determinar el ID de empresa según el rol
      let empresaIdParam = null;
      if (role === 'cliente') {
        empresaIdParam = empresaId;
      } else if (filtrosAplicados && filtrosAplicados.empresa_id) {
        empresaIdParam = filtrosAplicados.empresa_id;
      }
      
      // Obtener los datos del reporte
      const result = await getReporteAfiladosPorCliente({
        page: currentPage,
        pageSize,
        fecha_desde: filtrosAplicados?.fecha_desde || undefined,
        fecha_hasta: filtrosAplicados?.fecha_hasta || undefined,
        sucursal_id: filtrosAplicados?.sucursal_id || undefined,
        tipo_sierra_id: filtrosAplicados?.tipo_sierra_id || undefined,
        tipo_afilado_id: filtrosAplicados?.tipo_afilado_id || undefined,
        empresa_id: empresaIdParam,
        estado_afilado: filtrosAplicados?.estado_afilado || undefined,
      });
      
      setReporteItems(result.items || []);
      setFiltrosAplicados(filtrosAplicados);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
    } catch (error: any) {
      console.error('Error al obtener el reporte:', error);
      setReporteError(error.message || 'Error al obtener el reporte');
    }
  } catch (error: any) {
    setReporteError(error.message || 'Error al aplicar los filtros');
    toast({
      title: 'Error',
      description: error.message || 'Error al aplicar los filtros',
      variant: 'destructive'
    });
  } finally {
    setReporteLoading(false);
  }
};
