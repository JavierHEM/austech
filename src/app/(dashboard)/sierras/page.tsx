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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { 
  Scissors, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Barcode,
  ArrowUpRight
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
import { Pagination } from '@/components/ui/pagination';
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
import SierraFilters from '@/components/sierras/SierraFilters';
import { getSierras, desactivarSierra, updateEstadoSierra, activateSierra, SierraFilters as SierraFiltersType, SierraConRelaciones } from '@/services/sierraService';

export default function SierrasPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sierras, setSierras] = useState<SierraConRelaciones[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SierraFiltersType>({});
  const [sierraToDelete, setSierraToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cambioEstadoLoading, setCambioEstadoLoading] = useState<number | null>(null);
  const [activateLoading, setActivateLoading] = useState<number | null>(null);
  const pageSize = 10;

  // Cargar sierras
  const loadSierras = async () => {
    setLoading(true);
    try {
      const result = await getSierras(currentPage, pageSize, filters);
      setSierras(result.data);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Error al cargar sierras:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sierras.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar sierras cuando cambian los filtros o la página
  useEffect(() => {
    loadSierras();
  }, [currentPage, filters]);

  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters: SierraFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Resetear a la primera página cuando se aplican filtros
  };

  // Manejar cambio de estado de sierra de "En proceso de afilado" a "Lista para retiro"
  const handleCambioEstado = async (sierraId: number) => {
    setCambioEstadoLoading(sierraId);
    try {
      // Estado 3 corresponde a "Lista para retiro"
      await updateEstadoSierra(sierraId, 3);
      toast({
        title: 'Estado actualizado',
        description: 'La sierra ha sido marcada como "Lista para retiro".',
      });
      loadSierras(); // Recargar la lista después de actualizar
    } catch (error) {
      console.error('Error al cambiar estado de sierra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la sierra.',
        variant: 'destructive'
      });
    } finally {
      setCambioEstadoLoading(null);
    }
  };

  // Manejar desactivación de sierra
  const handleDeleteSierra = async (id: number) => {
    if (!id) return;
    
    setDeleteLoading(true);
    try {
      await desactivarSierra(id);
      toast({
        title: 'Sierra desactivada',
        description: 'La sierra ha sido marcada como fuera de servicio.'
      });
      
      // Recargar la lista después de desactivar
      loadSierras();
    } catch (error: any) {
      console.error('Error al desactivar sierra:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo desactivar la sierra.',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
      setSierraToDelete(null);
    }
  };

  // Manejar activación de sierra
  const handleActivateSierra = async (sierraId: number) => {
    setActivateLoading(sierraId);
    try {
      await activateSierra(sierraId);
      toast({
        title: 'Sierra activada',
        description: 'La sierra ha sido activada y marcada como disponible.'
      });
      loadSierras(); // Recargar la lista después de activar
    } catch (error) {
      console.error('Error al activar sierra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo activar la sierra.',
        variant: 'destructive'
      });
    } finally {
      setActivateLoading(null);
    }
  };

  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalCount / pageSize);

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeVariant = (estadoNombre: string, activo: boolean) => {
    if (!activo) {
      return 'destructive' as const;
    }
    switch (estadoNombre?.toLowerCase()) {
      case 'disponible':
        return 'success' as const;
      case 'en proceso de afilado':
        return 'secondary' as const;
      case 'lista para retiro':
        return 'secondary' as const;
      case 'fuera de servicio':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Función para obtener el nombre del estado según la condición de la sierra
  const getEstadoNombre = (sierra: SierraConRelaciones) => {
    if (!sierra.activo) {
      return 'Fuera de servicio';
    }
    return sierra.estado_sierra?.nombre || 'Sin estado';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sierras</h1>
          <p className="text-muted-foreground">Gestione las sierras registradas en el sistema</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/sierras/buscar">
            <Button variant="outline" className="flex items-center gap-2">
              <Barcode className="h-4 w-4" />
              Buscar por código
            </Button>
          </Link>
          <Link href="/sierras/crear">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Sierra
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Listado de Sierras
          </CardTitle>
          <CardDescription>
            Visualice y gestione todas las sierras registradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SierraFilters onFilterChange={handleFilterChange} />
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : sierras.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <XCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No se encontraron sierras con los filtros aplicados</p>
            </div>
          ) : (
            <div className="border rounded-md mt-4 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código de Barras</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sierras.map((sierra) => (
                    <TableRow key={sierra.id}>
                      <TableCell>
                        <Link href={`/sierras/${sierra.id}`} className="text-primary hover:underline">
                          {sierra.codigo_barras}
                        </Link>
                      </TableCell>
                      <TableCell>{sierra.tipo_sierra?.nombre || 'Sin tipo'}</TableCell>
                      <TableCell>{sierra.sucursal?.nombre || 'Sin sucursal'}</TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(sierra.estado_sierra?.nombre || '', sierra.activo)}>
                          {getEstadoNombre(sierra)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sierra.fecha_registro ? new Date(sierra.fecha_registro).toLocaleDateString('es-ES') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {sierra.estado_id === 2 && (
                            <>
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCambioEstado(sierra.id)}
                                      disabled={cambioEstadoLoading === sierra.id}
                                      className="text-green-500 flex items-center gap-1"
                                    >
                                      {cambioEstadoLoading === sierra.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4" />
                                          <span className="hidden sm:inline">Lista para retiro</span>
                                        </>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                    Marcar como "Lista para retiro"
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link href={`/salidas-masivas/crear?sierra_id=${sierra.id}`}>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-blue-500 flex items-center gap-1"
                                      >
                                        <ArrowUpRight className="h-4 w-4" />
                                        <span className="hidden sm:inline">Registrar salida</span>
                                      </Button>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                    Registrar salida de esta sierra
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/sierras/editar/${sierra.id}`}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="hidden sm:inline">Editar</span>
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                Editar sierra
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {sierra.activo ? (
                            <AlertDialog>
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-500 flex items-center gap-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="hidden sm:inline">Desactivar</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                    Desactivar sierra
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción desactivará la sierra con código "{sierra.codigo_barras}". 
                                    Los datos se mantendrán en el sistema pero la sierra no estará disponible para su uso.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteSierra(sierra.id)}
                                    disabled={deleteLoading}
                                  >
                                    {deleteLoading && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-green-500 flex items-center gap-1"
                                    onClick={() => handleActivateSierra(sierra.id)}
                                    disabled={activateLoading === sierra.id}
                                  >
                                    {activateLoading === sierra.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">Activar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-black text-white px-3 py-2 rounded-md text-xs">
                                  Activar sierra
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!loading && sierras.length > 0 && totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
        {!loading && sierras.length > 0 && (
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Mostrando {sierras.length} de {totalCount} sierras
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
