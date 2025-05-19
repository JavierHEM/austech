'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Scissors, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Barcode, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Tag,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase-client';
import { getAfilados, deleteAfilado } from '@/services/afiladoService';
import { AfiladoFilters, PaginatedAfilados } from '@/types/afilado';
import { getEmpresaIdByAuthId } from '@/services/userServices';
import { marcarSierraListaParaRetiro, getSierraByCodigoBarras } from '@/services/sierraService';
import SierraSearchBar from '@/components/afilados/SierraSearchBar';
import AfiladoSearchBar from '@/components/afilados/AfiladoSearchBar';
import AfiladoFiltersComponent from '@/components/afilados/AfiladoFilters';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function AfiladosPage() {
  const { toast } = useToast();
  const { session, role } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [afilados, setAfilados] = useState<any[]>([]);
  const [sierrasListasParaRetiro, setSierrasListasParaRetiro] = useState<number[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [afiladoToDelete, setAfiladoToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [completarLoading, setCompletarLoading] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AfiladoFilters>({});
  const [sortField, setSortField] = useState<string>('fecha_afilado');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const isCliente = role === 'cliente';

  // Manejar búsqueda por código de barras
  const handleSearch = async (codigoBarras: string) => {
    // Si el código está vacío, resetear los filtros y mostrar todos los afilados
    if (!codigoBarras) {
      if (filters.sierra_id) {
        const newFilters = { ...filters, sierra_id: null };
        setFilters(newFilters);
      }
      return;
    }

    setSearchLoading(true);
    try {
      const sierra = await getSierraByCodigoBarras(codigoBarras);
      
      if (!sierra) {
        toast({
          title: 'Sierra no encontrada',
          description: `No se encontró ninguna sierra con el código ${codigoBarras}`,
          variant: 'destructive'
        });
        return;
      }
      
      // Actualizar filtros para mostrar solo los afilados de esta sierra
      const newFilters = { ...filters, sierra_id: sierra.id };
      setFilters(newFilters);
      
      toast({
        title: 'Sierra encontrada',
        description: `Mostrando afilados para la sierra #${sierra.id} (${sierra.codigo_barras})`
      });
    } catch (error) {
      console.error('Error al buscar sierra:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al buscar la sierra',
        variant: 'destructive'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Redirigir a los usuarios con rol 'cliente' a su dashboard específico si intentan acceder directamente a esta página
  useEffect(() => {
    if (isCliente) {
      router.push('/dashboardcliente');
    }
  }, [isCliente, router]);

  // Obtener el ID de empresa del usuario si es cliente
  useEffect(() => {
    const fetchEmpresaId = async () => {
      if (session?.user?.id && isCliente) {
        const id = await getEmpresaIdByAuthId(session.user.id);
        setEmpresaId(id);
      }
    };
    fetchEmpresaId();
  }, [session, isCliente]);

  // Cargar afilados
  const loadAfilados = async () => {
    setLoading(true);
    try {
      const result: PaginatedAfilados = await getAfilados(
        filters,
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        isCliente && empresaId ? empresaId : undefined
      );
      
      // Obtener información completa de las sierras
      const sierraIds = result.data.map(afilado => afilado.sierra_id);
      if (sierraIds.length > 0) {
        // Usar una anotación de tipo para evitar errores
        interface SierraData {
          id: number;
          estado_id: number;
          codigo_barras: string;
          tipo_id: number;
          sucursal_id: number;
          tipos_sierra: { nombre: string } | null;
          estados_sierra: { nombre: string } | null;
          sucursales: { nombre: string } | null;
        }
        
        const { data: sierras } = await supabase
          .from('sierras')
          .select('id, estado_id, codigo_barras, tipo_id, sucursal_id, tipos_sierra:tipo_id(nombre), estados_sierra:estado_id(nombre), sucursales:sucursal_id(nombre)')
          .in('id', sierraIds) as { data: SierraData[] | null };
        
        // Actualizar el estado de las sierras listas para retiro
        const listasParaRetiro = sierras
          ?.filter(sierra => sierra.estado_id === 3)
          .map(sierra => sierra.id) || [];
        
        setSierrasListasParaRetiro(listasParaRetiro);
        
        // Actualizar los datos de las sierras en los afilados
        const afiladosConDatosSierra = result.data.map(afilado => {
          const sierra = sierras?.find(s => s.id === afilado.sierra_id);
          return {
            ...afilado,
            sierra: sierra ? {
              ...afilado.sierra,
              codigo_barras: sierra.codigo_barras,
              tipo: sierra.tipos_sierra?.nombre || 'Sin tipo',
              estado: sierra.estados_sierra?.nombre || 'Sin estado',
              sucursal: sierra.sucursales?.nombre || 'Sin sucursal'
            } : afilado.sierra
          };
        });
        
        setAfilados(afiladosConDatosSierra || []);
        setTotalCount(result.count);
        return; // Salir temprano ya que ya hemos establecido los afilados
      }
      
      setAfilados(result.data || []);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Error al cargar afilados:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los afilados.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar afilados al montar el componente o cuando cambian los filtros, página o ordenamiento
  useEffect(() => {
    loadAfilados();
  }, [filters, currentPage, pageSize, sortField, sortDirection]);

  // Manejar eliminación de afilado
  const handleDeleteAfilado = async () => {
    if (!afiladoToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteAfilado(afiladoToDelete);
      
      toast({
        title: 'Afilado eliminado',
        description: 'El afilado ha sido eliminado exitosamente.'
      });
      loadAfilados(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error('Error al eliminar afilado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el afilado.',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
      setAfiladoToDelete(null);
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (newFilters: AfiladoFilters) => {
    setFilters(newFilters);
  };

  // Manejar ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // La ordenación ahora se maneja en el servidor
    // y se recarga automáticamente por el useEffect
  };
  
  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Manejar cambio de tamaño de página
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Resetear a la primera página cuando cambia el tamaño
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Afilados</h1>
          <p className="text-muted-foreground">Gestione los afilados de sierras en el sistema</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>
      </div>

      {/* Barra de búsqueda de sierra */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4" id="nuevo-afilado-card">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Registrar nuevo afilado</h2>
            <p className="text-sm text-muted-foreground mb-2">Escanee el código de barras de la sierra o ingréselo manualmente</p>
            <SierraSearchBar />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Buscar afilados por sierra</h2>
            <p className="text-sm text-muted-foreground mb-2">Filtre la tabla por código de barras de sierra</p>
            <AfiladoSearchBar onSearch={handleSearch} />
            {searchLoading && (
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando sierra...
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {showFilters && (
        <AfiladoFiltersComponent onFilterChange={handleFilterChange} />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Afilados</CardTitle>
          <CardDescription>
            Historial de afilados realizados a las sierras
            {Object.values(filters).some(v => v !== null && v !== undefined) && (
              <Badge variant="outline" className="ml-2">
                Filtros aplicados
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando afilados...</span>
            </div>
          ) : afilados.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No hay afilados registrados</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {Object.values(filters).some(v => v !== null && v !== undefined)
                  ? 'No se encontraron afilados con los filtros aplicados.'
                  : 'Aún no se han registrado afilados en el sistema.'}
              </p>
              <Link href="/afilados/crear" className="mt-4 inline-block">
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Registrar Afilado
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('sierra_codigo')}
                    >
                      <div className="flex items-center">
                        Sierra
                        {sortField === 'sierra_codigo' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('tipo_afilado_nombre')}
                    >
                      <div className="flex items-center">
                        Tipo de Afilado
                        {sortField === 'tipo_afilado_nombre' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('fecha_afilado')}
                    >
                      <div className="flex items-center">
                        Fecha de Afilado
                        {sortField === 'fecha_afilado' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('fecha_salida')}
                    >
                      <div className="flex items-center">
                        Fecha de Salida
                        {sortField === 'fecha_salida' && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {afilados.map((afilado) => (
                    <TableRow key={afilado.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Barcode className="h-4 w-4 mr-1 text-muted-foreground" />
                          <Link 
                            href={`/sierras/${afilado.sierra_id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {afilado.sierra?.codigo_barras || `Sierra #${afilado.sierra_id}`}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
                          {afilado.tipo_afilado?.nombre || 'Sin tipo'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center" data-component-name="AfiladosPage">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {afilado.fecha_afilado 
                            ? (() => {
                                // Asegurarse de que la fecha se procese correctamente
                                try {
                                  // Corregir el problema de zona horaria
                                  // Extraer los componentes de la fecha (YYYY-MM-DD)
                                  if (typeof afilado.fecha_afilado === 'string') {
                                    // Si la fecha tiene formato ISO (con T), extraer solo la parte de fecha
                                    const fechaStr = afilado.fecha_afilado.includes('T') 
                                      ? afilado.fecha_afilado.split('T')[0] 
                                      : afilado.fecha_afilado;
                                    
                                    // Crear la fecha usando UTC para evitar problemas de zona horaria
                                    const [year, month, day] = fechaStr.split('-').map(Number);
                                    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                      // Usar formato directo sin conversión de zona horaria
                                      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                                    }
                                  }
                                  
                                  // Fallback al método anterior si hay algún problema
                                  console.error('Usando método fallback para fecha:', afilado.fecha_afilado);
                                  return afilado.fecha_afilado || 'Fecha inválida';
                                } catch (error) {
                                  console.error('Error al formatear fecha:', error);
                                  // Mostrar la fecha sin formato en caso de error
                                  return afilado.fecha_afilado || 'Error de formato';
                                }
                              })()
                            : 'Sin fecha'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {afilado.fecha_salida 
                          ? (() => {
                              // Corregir el problema de zona horaria para fecha_salida
                              if (typeof afilado.fecha_salida === 'string') {
                                // Si la fecha tiene formato ISO (con T), extraer solo la parte de fecha
                                const fechaStr = afilado.fecha_salida.includes('T') 
                                  ? afilado.fecha_salida.split('T')[0] 
                                  : afilado.fecha_salida;
                                
                                // Extraer los componentes de la fecha (YYYY-MM-DD)
                                const [year, month, day] = fechaStr.split('-').map(Number);
                                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                  // Usar formato directo sin conversión de zona horaria
                                  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                                }
                              }
                              return afilado.fecha_salida;
                            })()
                          : '-'}
                        </TableCell>
                      <TableCell>
                        {afilado.fecha_salida ? (
                          <Badge variant="success">Completado</Badge>
                        ) : sierrasListasParaRetiro.includes(afilado.sierra_id) ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">Lista para retiro</Badge>
                        ) : (
                          <Badge variant="secondary">En proceso</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {!afilado.fecha_salida && (
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-green-500 flex items-center gap-1"
                                    aria-label="Completar afilado"
                                    onClick={async () => {
                                       setCompletarLoading(afilado.sierra_id);
                                       try {
                                          await marcarSierraListaParaRetiro(afilado.sierra_id); // Usar el ID real de la sierra
                                          
                                          // Actualizar el estado visual inmediatamente
                                          setSierrasListasParaRetiro(prev => [...prev, afilado.sierra_id]);
                                          
                                          toast({
                                            title: 'Sierra actualizada',
                                            description: 'La sierra ha sido marcada como lista para retiro.'
                                          });
                                          
                                          // Recargar los datos después de un breve retraso
                                          setTimeout(() => {
                                            loadAfilados();
                                          }, 1000);
                                      } catch (error: any) {
                                        console.error('Error al marcar sierra como lista para retiro:', error);
                                        toast({
                                          title: 'Error',
                                          description: error.message || 'No se pudo marcar la sierra como lista para retiro.',
                                          variant: 'destructive'
                                        });
                                      } finally {
                                        setCompletarLoading(null);
                                      }
                                    }}
                                    disabled={completarLoading === afilado.sierra_id}
                                  >
                                    {completarLoading === afilado.sierra_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">Completar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                  Completar afilado
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                           )}
                           <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/afilados/${afilado.id}`}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    aria-label="Editar afilado"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="hidden sm:inline">Editar</span>
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                Editar afilado
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <AlertDialog>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-500 flex items-center gap-1"
                                      aria-label="Eliminar afilado"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="hidden sm:inline">Eliminar</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                  Eliminar afilado
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente el registro de afilado.
                                  {!afilado.fecha_salida && " También se actualizará el estado de la sierra a 'Disponible'."}
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => setAfiladoToDelete(afilado.id)}
                                  disabled={deleteLoading && afiladoToDelete === afilado.id}
                                >
                                  {deleteLoading && afiladoToDelete === afilado.id && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}  
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {!loading && afilados.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {afilados.length} de {totalCount} afilados
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filas por página:</span>
                <select 
                  className="border rounded p-1 text-sm" 
                  value={pageSize} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {Math.ceil(totalCount / pageSize)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
