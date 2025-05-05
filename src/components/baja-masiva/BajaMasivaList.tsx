'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Trash2, Plus } from 'lucide-react';

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
import { getBajasMasivas, deleteBajaMasiva } from '@/services/bajaMasivaService';
import { BajaMasivaConRelaciones } from '@/types/bajaMasiva';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BajaMasivaList() {
  const { toast } = useToast();
  const [bajasMasivas, setBajasMasivas] = useState<BajaMasivaConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [bajaToDelete, setBajaToDelete] = useState<number | null>(null);

  // Cargar las bajas masivas al montar el componente
  useEffect(() => {
    loadBajasMasivas();
  }, []);

  // Función para cargar las bajas masivas
  const loadBajasMasivas = async () => {
    try {
      setLoading(true);
      const data = await getBajasMasivas();
      setBajasMasivas(data);
    } catch (error) {
      console.error('Error al cargar bajas masivas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las bajas masivas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una baja masiva
  const handleDelete = async () => {
    if (bajaToDelete === null) return;

    try {
      setLoading(true);
      await deleteBajaMasiva(bajaToDelete);
      
      toast({
        title: 'Éxito',
        description: 'Baja masiva eliminada correctamente',
      });
      
      // Recargar la lista
      loadBajasMasivas();
    } catch (error: any) {
      console.error('Error al eliminar baja masiva:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la baja masiva',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setBajaToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bajas Masivas</CardTitle>
          <CardDescription>
            Listado de todas las bajas masivas de sierras registradas
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/bajas-masivas/crear">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Baja Masiva
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Cargando bajas masivas...</p>
        ) : bajasMasivas.length === 0 ? (
          <p className="text-center py-4">No hay bajas masivas registradas</p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha de Baja</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bajasMasivas.map((baja) => (
                  <TableRow key={baja.id}>
                    <TableCell>{baja.id}</TableCell>
                    <TableCell>
                      {(() => {
                        // Corregir el problema de zona horaria
                        const fechaBaja = baja.fecha_baja;
                        // Parsear la fecha sin conversión de zona horaria
                        const [year, month, day] = fechaBaja.split('-').map(Number);
                        // Crear la fecha en la zona horaria local
                        const fecha = new Date(year, month - 1, day);
                        return format(fecha, 'dd/MM/yyyy', { locale: es });
                      })()}
                    </TableCell>
                    <TableCell>
                      {baja.observaciones ? 
                        (baja.observaciones.length > 50 ? 
                          `${baja.observaciones.substring(0, 50)}...` : 
                          baja.observaciones) : 
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button asChild size="icon" variant="ghost">
                          <Link href={`/bajas-masivas/${baja.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => setBajaToDelete(baja.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará la baja masiva y revertirá los cambios en las sierras asociadas.
                                Las sierras volverán a estar activas y en estado "Disponible".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setBajaToDelete(null)}>
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
