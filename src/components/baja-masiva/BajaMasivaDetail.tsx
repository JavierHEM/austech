'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Printer, Trash2, Loader2 } from 'lucide-react';

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
import { getBajaMasivaById, deleteBajaMasiva } from '@/services/bajaMasivaService';
import { BajaMasivaConRelaciones } from '@/types/bajaMasiva';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BajaMasivaDetailProps {
  id: number;
}

export default function BajaMasivaDetail({ id }: BajaMasivaDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bajaMasiva, setBajaMasiva] = useState<BajaMasivaConRelaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Cargar los detalles de la baja masiva al montar el componente
  useEffect(() => {
    loadBajaMasiva();
  }, [id]);

  // Función para cargar los detalles de la baja masiva
  const loadBajaMasiva = async () => {
    try {
      setLoading(true);
      const data = await getBajaMasivaById(id);
      setBajaMasiva(data);
    } catch (error) {
      console.error('Error al cargar detalles de baja masiva:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los detalles de la baja masiva',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar la baja masiva
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteBajaMasiva(id);
      
      toast({
        title: 'Éxito',
        description: 'Baja masiva eliminada correctamente',
      });
      
      // Redireccionar a la lista de bajas masivas
      router.push('/bajas-masivas');
      router.refresh();
    } catch (error: any) {
      console.error('Error al eliminar baja masiva:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la baja masiva',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  // Función para imprimir la página
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando detalles...</span>
      </div>
    );
  }

  if (!bajaMasiva) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-medium">No se encontró la baja masiva</p>
            <Button asChild className="mt-4">
              <Link href="/bajas-masivas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la lista
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button asChild variant="outline">
          <Link href="/bajas-masivas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Link>
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Eliminar
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
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de Baja Masiva #{bajaMasiva.id}</CardTitle>
          <CardDescription>
            Información detallada de la baja masiva y las sierras asociadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Fecha de Baja</p>
              <p>{format(new Date(bajaMasiva.fecha_baja), 'PPP', { locale: es })}</p>
            </div>
            {bajaMasiva.observaciones && (
              <div className="space-y-2 col-span-2">
                <p className="text-sm font-medium">Observaciones</p>
                <p className="text-sm">{bajaMasiva.observaciones}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Sierras Incluidas ({bajaMasiva.sierras?.length || 0})</h3>
            {bajaMasiva.sierras && bajaMasiva.sierras.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código de Barras</TableHead>
                      <TableHead>Tipo de Sierra</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bajaMasiva.sierras.map((sierra) => (
                      <TableRow key={sierra.id}>
                        <TableCell>
                          <Link href={`/sierras/${sierra.id}`} className="text-primary hover:underline">
                            {sierra.codigo_barras}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {/* Accedemos a la relación tipo_sierra a través de la respuesta del servicio */}
                          {(sierra as any).tipo_sierra?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {/* Accedemos a la relación sucursal a través de la respuesta del servicio */}
                          {(sierra as any).sucursal?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-destructive/10">
                            {/* Accedemos a la relación estado_sierra a través de la respuesta del servicio */}
                            {(sierra as any).estado_sierra?.nombre || 'N/A'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-4 border rounded-md">No hay sierras asociadas a esta baja masiva</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>Creado el: {format(new Date(bajaMasiva.creado_en), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
