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
import { Badge } from '@/components/ui/badge';
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
import { createClient } from '@/lib/supabase';
import { TipoSierra } from '@/types/sierra';

export default function TiposSierraPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tiposSierra, setTiposSierra] = useState<TipoSierra[]>([]);
  const [tipoToDelete, setTipoToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const supabase = createClient();

  // Cargar tipos de sierra
  const loadTiposSierra = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tipos_sierra')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      
      setTiposSierra(data || []);
    } catch (error) {
      console.error('Error al cargar tipos de sierra:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tipos de sierra.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de sierra al montar el componente
  useEffect(() => {
    loadTiposSierra();
  }, []);

  // Manejar eliminación de tipo de sierra
  const handleDeleteTipo = async () => {
    if (!tipoToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('tipos_sierra')
        .update({ 
          activo: false,
          modificado_en: new Date().toISOString()
        })
        .eq('id', tipoToDelete);
      
      if (error) throw error;
      
      toast({
        title: 'Tipo de sierra desactivado',
        description: 'El tipo de sierra ha sido desactivado exitosamente.'
      });
      loadTiposSierra(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error('Error al desactivar tipo de sierra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo desactivar el tipo de sierra.',
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
          <h1 className="text-3xl font-bold">Tipos de Sierra</h1>
          <p className="text-muted-foreground">Gestione los tipos de sierra disponibles en el sistema</p>
        </div>
        <Link href="/tipos-sierra/crear">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tipo de Sierra
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tipos de Sierra</CardTitle>
          <CardDescription>Gestione los tipos de sierra que pueden ser asignados a las sierras</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando tipos de sierra...</span>
            </div>
          ) : tiposSierra.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No hay tipos de sierra registrados</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aún no se han registrado tipos de sierra en el sistema.
              </p>
              <Link href="/tipos-sierra/crear" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Tipo de Sierra
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
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposSierra.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-medium">{tipo.nombre}</TableCell>
                      <TableCell>{tipo.descripcion}</TableCell>
                      <TableCell>
                        {tipo.activo ? (
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
                          <Link href={`/tipos-sierra/editar/${tipo.id}`}>
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
                                  Esta acción desactivará el tipo de sierra "{tipo.nombre}". 
                                  Los datos se mantendrán en el sistema pero el tipo no estará disponible para su uso.
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
        </CardContent>
        {!loading && tiposSierra.length > 0 && (
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Mostrando {tiposSierra.length} tipos de sierra
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
