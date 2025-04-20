'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2 
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
import SucursalFilters from '@/components/sucursales/SucursalFilters';
import { getSucursales, deleteSucursal, SucursalFilters as SucursalFiltersType, SucursalConEmpresa } from '@/services/sucursalService';



export default function SucursalesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState<SucursalConEmpresa[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SucursalFiltersType>({
    search: '',
    empresa_id: null,
    activo: null
  });
  const [sucursalToDelete, setSucursalToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const pageSize = 10;

  // Cargar sucursales
  const loadSucursales = async () => {
    setLoading(true);
    try {
      const result = await getSucursales(currentPage, pageSize, filters);
      setSucursales(result.data);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sucursales.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar sucursales cuando cambian los filtros o la página
  useEffect(() => {
    loadSucursales();
  }, [currentPage, filters]);

  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters: SucursalFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Resetear a la primera página cuando se aplican filtros
  };

  // Manejar eliminación de sucursal
  const handleDeleteSucursal = async () => {
    if (!sucursalToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteSucursal(sucursalToDelete);
      toast({
        title: 'Sucursal eliminada',
        description: 'La sucursal ha sido desactivada exitosamente.'
      });
      loadSucursales(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sucursal.',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
      setSucursalToDelete(null);
    }
  };

  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sucursales</h1>
          <p className="text-muted-foreground">Gestione las sucursales de las empresas</p>
        </div>
        <Link href="/sucursales/crear">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Sucursal
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <SucursalFilters onFilterChange={handleFilterChange} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sucursales</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sucursales.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No se encontraron sucursales con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sucursales.map((sucursal) => (
                    <TableRow key={sucursal.id}>
                      <TableCell className="font-medium">{sucursal.nombre}</TableCell>
                      <TableCell>{sucursal.empresa?.razon_social || 'N/A'}</TableCell>
                      <TableCell>{sucursal.direccion}</TableCell>
                      <TableCell>{sucursal.telefono}</TableCell>
                      <TableCell>
                        {sucursal.activo ? (
                          <div className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            <span>Activo</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            <span>Inactivo</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/sucursales/editar/${sucursal.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción desactivará la sucursal "{sucursal.nombre}". 
                                  Los datos se mantendrán en el sistema pero la sucursal no estará disponible para su uso.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => setSucursalToDelete(sucursal.id)}
                                  disabled={deleteLoading && sucursalToDelete === sucursal.id}
                                >
                                  {deleteLoading && sucursalToDelete === sucursal.id && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Confirmar
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
          
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Mostrando {sucursales.length} de {totalCount} sucursales
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}