'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Search, 
  Barcode,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSierraByCodigo } from '@/services/sierraService';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function BuscarSierraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [codigoBarras, setCodigoBarras] = useState('');
  const [loading, setLoading] = useState(false);
  const [sierraEncontrada, setSierraEncontrada] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigoBarras.trim()) {
      toast({
        title: 'Error',
        description: 'Debe ingresar un código de barras para buscar.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setNotFound(false);
    setSierraEncontrada(null);
    
    try {
      const sierra = await getSierraByCodigo(codigoBarras.trim());
      
      if (sierra) {
        setSierraEncontrada(sierra);
      } else {
        setNotFound(true);
        toast({
          title: 'Sierra no encontrada',
          description: `No se encontró ninguna sierra con el código ${codigoBarras}.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error al buscar sierra:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al buscar la sierra. Intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Buscar Sierra</h1>
          <p className="text-muted-foreground">Busque una sierra por su código de barras</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/sierras')}>
          Volver a la lista
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Escanear Código de Barras</CardTitle>
          <CardDescription>
            Escanee o ingrese manualmente el código de barras de la sierra que desea buscar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Escanee o ingrese el código de barras"
                className="pl-9"
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !codigoBarras.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {notFound && (
        <Card className="border-destructive">
          <CardHeader className="bg-destructive/10">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <CardTitle className="text-destructive">Sierra no encontrada</CardTitle>
            </div>
            <CardDescription>
              No se encontró ninguna sierra con el código de barras: <strong>{codigoBarras}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p>¿Desea registrar una nueva sierra con este código de barras?</p>
          </CardContent>
          <CardFooter>
            <Link href={`/sierras/crear?codigo_barras=${encodeURIComponent(codigoBarras)}`}>
              <Button>
                Registrar Nueva Sierra
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}

      {sierraEncontrada && (
        <Card>
          <CardHeader>
            <CardTitle>Sierra Encontrada</CardTitle>
            <CardDescription>
              Información de la sierra con código: <strong>{sierraEncontrada.codigo_barras}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Sucursal</p>
                  <p>{sierraEncontrada.sucursal?.nombre || 'No asignada'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Sierra</p>
                  <p>{sierraEncontrada.tipo_sierra?.nombre || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={getEstadoBadgeVariant(sierraEncontrada.estado_sierra?.nombre || '')}>
                    {sierraEncontrada.estado_sierra?.nombre || 'Sin estado'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                  <p>{new Date(sierraEncontrada.fecha_registro).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Estado Activo</p>
                  <Badge variant={sierraEncontrada.activo ? 'success' : 'destructive'}>
                    {sierraEncontrada.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/sierras/editar/${sierraEncontrada.id}`}>
              <Button variant="outline">
                Editar Sierra
              </Button>
            </Link>
            <Link href={`/sierras/${sierraEncontrada.id}`}>
              <Button>
                Ver Detalles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
