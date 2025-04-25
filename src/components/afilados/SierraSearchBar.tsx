'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Barcode, AlertCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSierraByCodigoBarras } from '@/services/sierraService';
import { supabase } from '@/lib/supabase-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SierraSearchBar() {
  const { toast } = useToast();
  const router = useRouter();
  const [codigoBarras, setCodigoBarras] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNoEncontradaDialog, setShowNoEncontradaDialog] = useState(false);
  const [codigoNoEncontrado, setCodigoNoEncontrado] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Enfocar el input al cargar el componente
    if (inputRef.current) {
      // Usar un pequeño retraso para asegurar que el enfoque funcione después de que el DOM esté completamente cargado
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
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

    try {
      // Buscar la sierra por código de barras
      const sierra = await getSierraByCodigoBarras(codigoBarras);
      
      if (!sierra) {
        // La sierra no existe - mostrar diálogo
        setCodigoNoEncontrado(codigoBarras);
        setShowNoEncontradaDialog(true);
        setLoading(false);
        return;
      }

      // Verificar si la sierra está activa
      if (!sierra.activo) {
        toast({
          title: 'Sierra inactiva',
          description: 'La sierra está marcada como inactiva (último afilado). No se puede registrar un nuevo afilado.',
          variant: 'destructive'
        });
        setLoading(false);
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
        toast({
          title: 'Afilado pendiente',
          description: 'La sierra tiene un afilado pendiente. No se puede registrar un nuevo afilado hasta completar el pendiente.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Si pasa todas las validaciones, redirigir al formulario de creación de afilado
      router.push(`/afilados/crear?sierra_id=${sierra.id}`);
    } catch (error) {
      console.error('Error al buscar sierra:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al buscar la sierra. Intente nuevamente.',
        variant: 'destructive'
      });
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
    <>
      <div className="flex items-center space-x-2 w-full max-w-lg">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            ref={inputRef}
            className="pl-10 h-12 text-lg"
            placeholder="Escanear código de barras"
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
          <span className="ml-2 hidden sm:inline">Buscar</span>
        </Button>
      </div>

      {/* Diálogo para sierra no encontrada */}
      <Dialog open={showNoEncontradaDialog} onOpenChange={setShowNoEncontradaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Sierra no encontrada
            </DialogTitle>
            <DialogDescription>
              No se encontró ninguna sierra con el código <strong>{codigoNoEncontrado}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Desea registrar una nueva sierra con este código de barras?
            </p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNoEncontradaDialog(false);
                setCodigoBarras('');
                if (inputRef.current) inputRef.current.focus();
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setShowNoEncontradaDialog(false);
                router.push('/sierras/crear');
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar nueva sierra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
