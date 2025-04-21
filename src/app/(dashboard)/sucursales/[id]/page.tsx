'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Trash, Building, Phone, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase-client';

// Definir tipos localmente ya que parecen faltar en los archivos importados
interface Empresa {
  id: number;
  razon_social: string;
  rut: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  creado_en: string;
  modificado_en: string;
}

interface Sucursal {
  id: number;
  empresa_id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  creado_en: string;
  modificado_en: string;
}

interface SucursalConEmpresa extends Sucursal {
  empresa?: Empresa;
}

interface SucursalDetailPageProps {
  params: {
    id: string;
  };
}

export default function SucursalDetailPage({ params }: SucursalDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const sucursalId = parseInt(params.id);
  
  const [sucursal, setSucursal] = useState<SucursalConEmpresa | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSucursal = async () => {
    setLoading(true);
    try {
      // Obtener datos de la sucursal con información de la empresa
      const { data, error } = await supabase
        .from('sucursales')
        .select(`
          *,
          empresa:empresas(*)
        `)
        .eq('id', sucursalId)
        .single();
      
      if (error) throw error;
      
      // Transformar el resultado para que coincida con la interfaz esperada
      const sucursalData: SucursalConEmpresa = {
        ...data,
        empresa: data.empresa
      };
      
      setSucursal(sucursalData);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar la sucursal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la sucursal.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursal();
  }, [sucursalId]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('sucursales')
        .delete()
        .eq('id', sucursalId);
      
      if (error) throw error;
      
      toast({
        title: 'Sucursal eliminada',
        description: 'La sucursal ha sido eliminada exitosamente.'
      });
      
      // Redirigir a la lista de sucursales
      router.push('/sucursales');
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sucursal. Intente nuevamente.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-[50vh]">
          Cargando información...
        </div>
      </div>
    );
  }

  if (!sucursal) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-[50vh]">
          Sucursal no encontrada
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="mr-2"
        >
          <Link href="/sucursales">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver a Sucursales
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center">
          <Building className="h-6 w-6 mr-2" />
          {sucursal.nombre}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge variant={sucursal.activo ? "default" : "destructive"} className={sucursal.activo ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                {sucursal.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Empresa</p>
              <Link href={`/empresas/${sucursal.empresa_id}`} className="text-blue-600 hover:underline">
                {sucursal.empresa?.razon_social}
              </Link>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">RUT Empresa</p>
              <p>{sucursal.empresa?.rut}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <Phone className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p>{sucursal.telefono}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Mail className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{sucursal.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">Dirección</p>
            <p>{sucursal.direccion}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fechas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <Calendar className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <p>{formatDate(sucursal.creado_en)}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última Modificación</p>
              <p>{formatDate(sucursal.modificado_en)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/sucursales/editar/${sucursal.id}`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar Sucursal
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Eliminar Sucursal
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
              <AlertDialogAction onClick={handleDelete}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}