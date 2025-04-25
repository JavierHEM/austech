'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Barcode, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { getSierraByCodigoBarras } from '@/services/sierraService';

interface SierraBusquedaProps {
  onSierraSelected: (sierra: any) => void;
  onRegistrarNueva: () => void;
}

export default function SierraBusqueda({ onSierraSelected, onRegistrarNueva }: SierraBusquedaProps) {
  const { toast } = useToast();
  const [codigoBarras, setCodigoBarras] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    sierra: any | null;
    error: string | null;
    validationError: string | null;
    canRegister: boolean;
  }>({
    sierra: null,
    error: null,
    validationError: null,
    canRegister: false
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Enfocar el input al cargar el componente
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const buscarSierra = async () => {
    if (!codigoBarras.trim()) {
      toast({
        title: 'Error',
        description: 'Ingrese un código de barras válido',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setResultado({
      sierra: null,
      error: null,
      validationError: null,
      canRegister: false
    });

    try {
      // Buscar la sierra por código de barras
      const sierra = await getSierraByCodigoBarras(codigoBarras);
      
      if (!sierra) {
        // La sierra no existe
        setResultado({
          sierra: null,
          error: 'Sierra no encontrada',
          validationError: null,
          canRegister: true
        });
        return;
      }

      // Verificar si la sierra está activa
      if (!sierra.activo) {
        setResultado({
          sierra,
          error: null,
          validationError: 'La sierra está marcada como inactiva (último afilado)',
          canRegister: false
        });
        return;
      }

      // Verificar si la sierra tiene un afilado pendiente
      const { data: afiladosPendientes, error: errorAfilados } = await supabase
        .from('afilados')
        .select('*')
        .eq('sierra_id', sierra.id)
        .is('fecha_salida', null)
        .limit(1);

      if (errorAfilados) {
        console.error('Error al verificar afilados pendientes:', errorAfilados);
        throw new Error('Error al verificar afilados pendientes');
      }

      if (afiladosPendientes && afiladosPendientes.length > 0) {
        setResultado({
          sierra,
          error: null,
          validationError: 'La sierra tiene un afilado pendiente',
          canRegister: false
        });
        return;
      }

      // Si pasa todas las validaciones
      setResultado({
        sierra,
        error: null,
        validationError: null,
        canRegister: true
      });
    } catch (error) {
      console.error('Error al buscar sierra:', error);
      setResultado({
        sierra: null,
        error: 'Error al buscar la sierra',
        validationError: null,
        canRegister: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarSierra();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Buscar Sierra</CardTitle>
        <CardDescription>
          Escanee el código de barras de la sierra o ingréselo manualmente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              ref={inputRef}
              className="pl-10 h-12 text-lg"
              placeholder="Código de barras"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          <Button 
            onClick={buscarSierra} 
            disabled={loading || !codigoBarras.trim()}
            size="lg"
            className="h-12"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>

        {resultado.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sierra no encontrada</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>No se encontró ninguna sierra con ese código de barras.</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={onRegistrarNueva}
              >
                <Plus className="h-4 w-4 mr-1" />
                Registrar Nueva Sierra
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {resultado.validationError && (
          <Alert variant="destructive" className="mt-4">
            <X className="h-4 w-4" />
            <AlertTitle>No se puede registrar el afilado</AlertTitle>
            <AlertDescription>
              {resultado.validationError}
            </AlertDescription>
          </Alert>
        )}

        {resultado.sierra && !resultado.validationError && (
          <div className="mt-4">
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Sierra encontrada</AlertTitle>
              <AlertDescription>
                La sierra está disponible para registrar un nuevo afilado.
              </AlertDescription>
            </Alert>

            <div className="mt-4 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Barcode className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-semibold text-lg">Sierra #{resultado.sierra.id}</span>
                </div>
                <Badge variant="outline" className="ml-2">
                  {resultado.sierra.codigo_barras}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sucursal</p>
                  <p className="text-lg font-semibold">
                    {resultado.sierra.sucursal?.nombre || resultado.sierra.sucursales?.nombre || 'Sin sucursal'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p className="text-lg font-semibold">
                    {resultado.sierra.tipo_sierra?.nombre || resultado.sierra.tipos_sierra?.nombre || 'Sin tipo'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge 
                    variant={resultado.sierra.estado_id === 1 ? 'success' : 'secondary'}
                  >
                    {resultado.sierra.estado_sierra?.nombre || resultado.sierra.estados_sierra?.nombre || 'Sin estado'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {resultado.sierra && resultado.canRegister && (
        <CardFooter className="flex justify-end">
          <Button 
            onClick={() => onSierraSelected(resultado.sierra)}
            size="lg"
            className="mt-4"
          >
            Continuar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
