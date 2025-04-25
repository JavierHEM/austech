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
import { getSalidaMasivaById, deleteSalidaMasiva } from '@/services/salidaMasivaService';
import { SalidaMasivaConRelaciones } from '@/types/salidaMasiva';
import { AfiladoConRelaciones } from '@/types/afilado';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SalidaMasivaDetailProps {
  id: number;
}

export default function SalidaMasivaDetail({ id }: SalidaMasivaDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  // Definimos el tipo explícitamente para evitar errores de tipo
  const [salidaMasiva, setSalidaMasiva] = useState<(SalidaMasivaConRelaciones & {
    afilados?: Array<{
      id: number;
      fecha_afilado: string;
      sierra?: {
        id: number;
        codigo_barras: string;
        tipo_sierra?: {
          nombre: string;
        };
        estado_sierra?: {
          nombre: string;
        };
      };
    }>
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Cargar los detalles de la salida masiva al montar el componente
  useEffect(() => {
    loadSalidaMasiva();
  }, [id]);

  // Función para cargar los detalles de la salida masiva
  const loadSalidaMasiva = async () => {
    try {
      setLoading(true);
      const data = await getSalidaMasivaById(id);
      setSalidaMasiva(data);
    } catch (error) {
      console.error('Error al cargar detalles de salida masiva:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los detalles de la salida masiva',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar la salida masiva
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteSalidaMasiva(id);
      
      toast({
        title: 'Éxito',
        description: 'Salida masiva eliminada correctamente',
      });
      
      // Redireccionar a la lista de salidas masivas
      router.push('/salidas-masivas');
      router.refresh();
    } catch (error: any) {
      console.error('Error al eliminar salida masiva:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la salida masiva',
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

  if (!salidaMasiva) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-medium">No se encontró la salida masiva</p>
            <Button asChild className="mt-4">
              <Link href="/salidas-masivas">
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
          <Link href="/salidas-masivas">
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
                  Esta acción eliminará la salida masiva y revertirá los cambios en los afilados asociados.
                  Los afilados volverán a estar sin fecha de salida y las sierras volverán a estado "Lista para retiro".
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
          <CardTitle>Detalles de Salida Masiva #{salidaMasiva.id}</CardTitle>
          <CardDescription>
            Información detallada de la salida masiva y las sierras asociadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Sucursal</p>
              <p>{salidaMasiva.sucursal?.nombre || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Fecha de Salida</p>
              <p>{format(new Date(salidaMasiva.fecha_salida), 'PPP', { locale: es })}</p>
            </div>
            {salidaMasiva.observaciones && (
              <div className="space-y-2 col-span-2">
                <p className="text-sm font-medium">Observaciones</p>
                <p className="text-sm">{salidaMasiva.observaciones}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Sierras Incluidas ({salidaMasiva.afilados?.length || 0})</h3>
            {salidaMasiva.afilados && salidaMasiva.afilados.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código de Barras</TableHead>
                      <TableHead>Tipo de Sierra</TableHead>
                      <TableHead>Fecha de Afilado</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salidaMasiva.afilados.map((afilado: any) => (
                      <TableRow key={afilado.id}>
                        <TableCell>
                          <Link href={`/sierras/${afilado.sierra?.id}`} className="text-primary hover:underline">
                            {afilado.sierra?.codigo_barras || 'N/A'}
                          </Link>
                        </TableCell>
                        <TableCell>{afilado.sierra?.tipo_sierra?.nombre || 'N/A'}</TableCell>
                        <TableCell>
                          {format(new Date(afilado.fecha_afilado), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {afilado.sierra?.estado_sierra?.nombre || 'Sin estado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-4 border rounded-md">No hay sierras asociadas a esta salida masiva</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>Creado el: {format(new Date(salidaMasiva.creado_en), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
