'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Building } from 'lucide-react';
import { Empresa } from '@/types/empresa';
import EmpresaFilters from '@/components/empresas/EmpresaFilters';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getEmpresas, deleteEmpresa, EmpresaFilters as EmpresaFilterType } from '@/services/empresaService';

export default function EmpresasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmpresas = async (page = 1, filters: EmpresaFilterType = {}) => {
    setLoading(true);
    try {
      // Llamada real a Supabase a través de nuestro servicio
      const response = await getEmpresas(page, 10, filters);
      
      setEmpresas(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error al cargar empresas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las empresas. Intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filters: any) => {
    fetchEmpresas(1, filters);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      // Llamada real a Supabase a través de nuestro servicio
      await deleteEmpresa(id);
      
      toast({
        title: 'Empresa eliminada',
        description: 'La empresa ha sido eliminada exitosamente.'
      });
      
      // Recargar la lista después de eliminar
      fetchEmpresas(currentPage);
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la empresa. Intente nuevamente.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Empresas</h1>
        <Button onClick={() => router.push('/empresas/crear')}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre la lista de empresas según sus necesidades</CardDescription>
        </CardHeader>
        <CardContent>
          <EmpresaFilters onFilterChange={handleFilterChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>Gestione las empresas registradas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Razón Social</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Cargando empresas...
                  </TableCell>
                </TableRow>
              ) : empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    No se encontraron empresas
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell>{empresa.id}</TableCell>
                    <TableCell>{empresa.razon_social}</TableCell>
                    <TableCell>{empresa.rut}</TableCell>
                    <TableCell>{empresa.telefono}</TableCell>
                    <TableCell>{empresa.email}</TableCell>
                    <TableCell>
                      <Badge variant={empresa.activo ? "success" : "destructive"}>
                        {empresa.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => router.push(`/empresas/editar/${empresa.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => router.push(`/empresas/${empresa.id}/sucursales`)}
                        >
                          <Building className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-red-500"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la empresa
                                y todos sus datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(empresa.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {!loading && empresas.length > 0 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}