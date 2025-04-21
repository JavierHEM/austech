'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2, 
  Edit, 
  ArrowLeft, 
  Scissors,
  Barcode,
  Building,
  Calendar,
  Tag,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getSierraById } from '@/services/sierraService';
import { SierraConRelaciones } from '@/types/sierra';
import { supabase } from '@/lib/supabase-client';

interface SierraPageProps {
  params: {
    id: string;
  };
}

export default function SierraPage({ params }: SierraPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [sierra, setSierra] = useState<SierraConRelaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const sierraId = params.id ? parseInt(params.id) : 0;

  useEffect(() => {
    const fetchSierra = async () => {
      if (!sierraId) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getSierraById(sierraId);
        console.log('Sierra obtenida en la página de detalles:', data);
        
        // Si no hay datos de estado_sierra pero hay un estado_id, intentar obtener el estado
        if (data && !data.estado_sierra && data.estado_id) {
          try {
            const { data: estadoData } = await supabase
              .from('estados_sierra')
              .select('*')
              .eq('id', data.estado_id)
              .single();
            
            if (estadoData) {
              // Añadir manualmente la relación estado_sierra
              data.estado_sierra = estadoData;
              console.log('Estado obtenido manualmente:', estadoData);
            }
          } catch (estadoError) {
            console.error('Error al obtener el estado:', estadoError);
          }
        }
        
        setSierra(data);
      } catch (error) {
        console.error('Error al cargar la sierra:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información de la sierra.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSierra();
  }, [sierraId, toast]);

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeVariant = (estadoNombre: string) => {
    switch (estadoNombre?.toLowerCase()) {
      case 'disponible':
        return 'success' as const;
      case 'en proceso de afilado':
        return 'secondary' as const;
      case 'lista para retiro':
        return 'secondary' as const;
      case 'fuera de servicio':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando información de la sierra...</span>
      </div>
    );
  }

  if (!sierra) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Sierra no encontrada</CardTitle>
            <CardDescription>No se encontró la sierra solicitada.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/sierras')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Detalles de Sierra</h1>
          <p className="text-muted-foreground">Información detallada de la sierra</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/sierras')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Link href={`/sierras/editar/${sierra.id}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4 border-b pb-4">
              <Barcode className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código de Barras</p>
                <p className="text-lg font-semibold">{sierra.codigo_barras}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 border-b pb-4">
              <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sucursal</p>
                <p className="text-lg font-semibold">{sierra.sucursal?.nombre || 'No asignada'}</p>
                <p className="text-sm text-muted-foreground">
                  {sierra.sucursal?.empresa?.razon_social || 'Empresa no asignada'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 border-b pb-4">
              <Scissors className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Sierra</p>
                <p className="text-lg font-semibold">{sierra.tipo_sierra?.nombre || 'No especificado'}</p>
                <p className="text-sm text-muted-foreground">
                  {sierra.tipo_sierra?.descripcion || 'Sin descripción'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 border-b pb-4">
              <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <div>
                  <Badge variant={getEstadoBadgeVariant(sierra.estado_sierra?.nombre || '')}>
                    {sierra.estado_sierra?.nombre || 'Sin estado'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {sierra.estado_sierra?.descripcion || 'Sin descripción'}
                </p>
                {/* Nota: Asumimos que la propiedad empresa puede no existir en el tipo Sucursal, 
                  pero en el contexto de la aplicación, sabemos que la relación existe */}
              </div>
            </div>

            <div className="flex items-start space-x-4 border-b pb-4">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                <p className="text-lg font-semibold">
                  {new Date(sierra.fecha_registro).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado Activo</p>
                <div>
                  <Badge variant={sierra.activo ? 'success' : 'destructive'}>
                    {sierra.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Afilados</CardTitle>
            <CardDescription>Registro de afilados realizados a esta sierra</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Esta funcionalidad estará disponible próximamente.</p>
              <p className="text-sm mt-2">Aquí se mostrará el historial de afilados de la sierra.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" disabled className="w-full">
              Ver historial completo
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
