'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  empresa_id: number;
}

interface SucursalesTableProps {
  empresaId: number;
  onEdit: (sucursalId: number) => void;
  onNew: () => void;
}

export default function SucursalesTable({ empresaId, onEdit, onNew }: SucursalesTableProps) {
  const { toast } = useToast();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSucursales = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const from = (page - 1) * 10;
      const to = from + 9;
      
      const { data, error, count } = await supabase
        .from('sucursales')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .range(from, to);
      
      if (error) throw error;
      
      setSucursales(data || []);
      
      // Calcular el total de páginas
      if (count) {
        setTotalPages(Math.ceil(count / 10));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sucursales. Intente nuevamente.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  }, [empresaId, toast]);

  useEffect(() => {
    fetchSucursales(currentPage);
  }, [currentPage, empresaId, fetchSucursales]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = useCallback(async (id: number) => {
    try {
      const { error } = await supabase
        .from('sucursales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Sucursal eliminada',
        description: 'La sucursal ha sido eliminada exitosamente.'
      });
      
      // Recargar la lista después de eliminar
      fetchSucursales(currentPage);
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sucursal. Intente nuevamente.',
        variant: 'destructive'
      });
    }
  }, [toast, currentPage, fetchSucursales]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sucursales</CardTitle>
          <CardDescription>Gestione las sucursales de esta empresa</CardDescription>
        </div>
        <Button onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
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
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <div className="mt-2">Cargando sucursales...</div>
                </TableCell>
              </TableRow>
            ) : sucursales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No se encontraron sucursales para esta empresa
                </TableCell>
              </TableRow>
            ) : (
              sucursales.map((sucursal) => (
                <TableRow key={sucursal.id}>
                  <TableCell>{sucursal.id}</TableCell>
                  <TableCell>{sucursal.nombre}</TableCell>
                  <TableCell>{sucursal.direccion}</TableCell>
                  <TableCell>{sucursal.telefono}</TableCell>
                  <TableCell>{sucursal.email}</TableCell>
                  <TableCell>
                    <Badge variant={sucursal.activo ? "default" : "destructive"} className={sucursal.activo ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {sucursal.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => onEdit(sucursal.id)}
                      >
                        <Edit className="h-4 w-4" />
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
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la sucursal
                              y todos sus datos asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(sucursal.id)}>
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
        
        {!loading && sucursales.length > 0 && (
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
  );
}