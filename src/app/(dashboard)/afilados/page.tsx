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
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Calendar,
  Barcode,
  Tag
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
import { createClient } from '@/lib/supabase';
import { getAfilados, deleteAfilado, AfiladoFilters } from '@/services/afiladoService';
import AfiladoFiltersComponent from '@/components/afilados/AfiladoFilters';

export default function AfiladosPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [afilados, setAfilados] = useState<any[]>([]);
  const [afiladoToDelete, setAfiladoToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AfiladoFilters>({});
  const [sortField, setSortField] = useState<string>('fecha_afilado');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const supabase = createClient();

  // Cargar afilados
  const loadAfilados = async () => {
    setLoading(true);
    try {
      const data = await getAfilados(filters);
      setAfilados(data || []);
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

  // Cargar afilados al montar el componente o cuando cambian los filtros
  useEffect(() => {
    loadAfilados();
  }, [filters]);

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
    
    // Ordenar la lista de afilados
    const sortedAfilados = [...afilados].sort((a, b) => {
      let valueA, valueB;
      
      // Manejar campos anidados
      if (field === 'sierra_codigo') {
        valueA = a.sierra?.codigo_barra || '';
        valueB = b.sierra?.codigo_barra || '';
      } else if (field === 'tipo_afilado_nombre') {
        valueA = a.tipo_afilado?.nombre || '';
        valueB = b.tipo_afilado?.nombre || '';
      } else {
        valueA = a[field];
        valueB = b[field];
      }
      
      // Comparar fechas
      if (field.includes('fecha')) {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }
      
      // Ordenar
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setAfilados(sortedAfilados);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Afilados</h1>
          <p className="text-muted-foreground">Gestione los afilados de sierras en el sistema</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Link href="/afilados/crear">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              Nuevo Afilado
            </Button>
          </Link>
        </div>
      </div>
      
      {showFilters && (
        <AfiladoFiltersComponent onFilterChange={handleFilterChange} />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Afilados</CardTitle>
          <CardDescription>
            Gestione los afilados realizados a las sierras
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
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Barcode className="h-4 w-4 mr-1 text-muted-foreground" />
                            <Link 
                              href={`/sierras/${afilado.sierra_id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {afilado.sierra?.codigo_barras || `Sierra #${afilado.sierra_id}`}
                            </Link>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {afilado.sierra?.sucursales?.nombre || 'Sin sucursal'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
                          {afilado.tipo_afilado?.nombre || 'Sin tipo'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {afilado.fecha_afilado 
                            ? format(new Date(afilado.fecha_afilado), 'dd/MM/yyyy', { locale: es })
                            : 'Sin fecha'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {afilado.fecha_salida 
                          ? (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              {format(new Date(afilado.fecha_salida), 'dd/MM/yyyy', { locale: es })}
                            </div>
                          )
                          : 'Pendiente'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={afilado.fecha_salida ? 'success' : 'secondary'}>
                          {afilado.fecha_salida ? 'Completado' : 'En proceso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {!afilado.fecha_salida && (
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/afilados/completar/${afilado.id}`}>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-green-500 flex items-center gap-1"
                                      aria-label="Completar afilado"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span className="hidden sm:inline">Completar</span>
                                    </Button>
                                  </Link>
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
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Mostrando {afilados.length} afilados
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
