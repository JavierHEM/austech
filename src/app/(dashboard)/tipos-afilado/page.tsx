'use client';

import { useState, useEffect } from 'react';
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
  Scissors, 
  Plus, 
  Edit, 
  Trash2, 
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
import { supabase } from '@/lib/supabase-client';
import { TipoAfilado } from '@/types/afilado';
import { getTiposAfilado } from '@/services/tipoAfiladoService';

export default function TiposAfiladoPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tiposAfilado, setTiposAfilado] = useState<TipoAfilado[]>([]);
  const [tipoToDelete, setTipoToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cargar tipos de afilado
  const loadTiposAfilado = async () => {
    setLoading(true);
    try {
      const data = await getTiposAfilado();
      setTiposAfilado(data || []);
    } catch (error) {
      console.error('Error al cargar tipos de afilado:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tipos de afilado.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de afilado al montar el componente
  useEffect(() => {
    loadTiposAfilado();
  }, []);

  // Manejar eliminación de tipo de afilado
  const handleDeleteTipo = async () => {
    if (!tipoToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('tipos_afilado')
        .delete()
        .eq('id', tipoToDelete);
      
      if (error) throw error;
      
      toast({
        title: 'Tipo de afilado eliminado',
        description: 'El tipo de afilado ha sido eliminado exitosamente.'
      });
      loadTiposAfilado(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error('Error al eliminar tipo de afilado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el tipo de afilado.',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
      setTipoToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Afilado</h1>
          <p className="text-muted-foreground">Gestione los tipos de afilado disponibles en el sistema</p>
        </div>
        <Link href="/tipos-afilado/crear">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tipo de Afilado
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tipos de Afilado</CardTitle>
          <CardDescription>Gestione los tipos de afilado que pueden ser aplicados a las sierras</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando tipos de afilado...</span>
            </div>
          ) : tiposAfilado.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No hay tipos de afilado registrados</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aún no se han registrado tipos de afilado en el sistema.
              </p>
              <Link href="/tipos-afilado/crear" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Tipo de Afilado
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposAfilado.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-medium">{tipo.nombre}</TableCell>
                      <TableCell>{tipo.descripcion}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/tipos-afilado/editar/${tipo.id}`}>
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
                                  Esta acción eliminará permanentemente el tipo de afilado "{tipo.nombre}".
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => setTipoToDelete(tipo.id)}
                                  disabled={deleteLoading && tipoToDelete === tipo.id}
                                >
                                  {deleteLoading && tipoToDelete === tipo.id && (
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
        {!loading && tiposAfilado.length > 0 && (
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Mostrando {tiposAfilado.length} tipos de afilado
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
