'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, FileEdit, Trash2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getSalidasMasivas, deleteSalidaMasiva } from '@/services/salidaMasivaService';
import { SalidaMasivaConRelaciones } from '@/types/salidaMasiva';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SalidaMasivaList() {
  const { toast } = useToast();
  const [salidasMasivas, setSalidasMasivas] = useState<SalidaMasivaConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [salidaToDelete, setSalidaToDelete] = useState<number | null>(null);

  // Cargar las salidas masivas al montar el componente
  useEffect(() => {
    loadSalidasMasivas();
  }, []);

  // Función para cargar las salidas masivas
  const loadSalidasMasivas = async () => {
    try {
      setLoading(true);
      const data = await getSalidasMasivas();
      setSalidasMasivas(data);
    } catch (error) {
      console.error('Error al cargar salidas masivas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las salidas masivas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una salida masiva
  const handleDelete = async () => {
    if (salidaToDelete === null) return;

    try {
      setLoading(true);
      await deleteSalidaMasiva(salidaToDelete);
      
      toast({
        title: 'Éxito',
        description: 'Salida masiva eliminada correctamente',
      });
      
      // Recargar la lista
      loadSalidasMasivas();
    } catch (error: any) {
      console.error('Error al eliminar salida masiva:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la salida masiva',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSalidaToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Salidas Masivas</CardTitle>
          <CardDescription>
            Listado de todas las salidas masivas de sierras registradas
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/salidas-masivas/crear">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Salida Masiva
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Cargando salidas masivas...</p>
        ) : salidasMasivas.length === 0 ? (
          <p className="text-center py-4">No hay salidas masivas registradas</p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Fecha de Salida</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salidasMasivas.map((salida) => (
                  <TableRow key={salida.id}>
                    <TableCell>{salida.id}</TableCell>
                    <TableCell>{salida.sucursal?.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(salida.fecha_salida), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button asChild size="icon" variant="ghost">
                          <Link href={`/salidas-masivas/${salida.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => setSalidaToDelete(salida.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará la salida masiva y revertirá los cambios en los afilados asociados.
                                Los afilados volverán a estar sin fecha de salida y las sierras volverán a estado "Lista para retiro".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setSalidaToDelete(null)}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
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
    </Card>
  );
}
