'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createBajaMasiva } from '@/services/bajaMasivaService';
import { BajaMasivaInput } from '@/types/bajaMasiva';
import { SierraConRelaciones } from '@/types/sierra';
import BarcodeInputComponent from '@/components/scanner/BarcodeInputComponent';
import { getSierraByCodigo } from '@/services/sierraService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';

// Esquema de validación para el formulario
const formSchema = z.object({
  fecha_baja: z.date({
    required_error: 'Debe seleccionar una fecha de baja',
  }),
  observaciones: z.string().optional(),
});

export default function BajaMasivaForm() {
  const { session } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scannedSierras, setScannedSierras] = useState<SierraConRelaciones[]>([]);
  const [processingBarcode, setProcessingBarcode] = useState(false);

  // Inicializar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha_baja: new Date(),
      observaciones: '',
    },
  });

  // Manejar el envío del formulario
  const onSubmit = async () => {
    if (scannedSierras.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe escanear al menos una sierra para registrar la baja masiva',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Preparar los datos para enviar
      const bajaMasivaData: BajaMasivaInput = {
        fecha_baja: format(new Date(), 'yyyy-MM-dd'),
        observaciones: form.getValues().observaciones || '',
        sierras_ids: scannedSierras.map(sierra => sierra.id),
      };

      // Crear la baja masiva
      await createBajaMasiva(bajaMasivaData, session?.user?.id || '');

      toast({
        title: 'Éxito',
        description: 'Baja masiva registrada correctamente. Las sierras han sido marcadas como "Fuera de servicio".',
      });

      // Redireccionar a la lista de bajas masivas
      router.push('/bajas-masivas');
    } catch (error: any) {
      console.error('Error al registrar baja masiva:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar la baja masiva',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  // Manejar el escaneo de código de barras
  const handleBarcodeScan = async (barcode: string) => {
    // Validar que el código no esté vacío
    if (!barcode || barcode.trim() === '') {
      toast({
        title: 'Error',
        description: 'Código de barras inválido',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingBarcode(true);
      
      // Verificar si ya se escaneó esta sierra
      const sierraYaEscaneada = scannedSierras.some(
        sierra => sierra.codigo_barras === barcode
      );
      
      if (sierraYaEscaneada) {
        toast({
          title: 'Advertencia',
          description: 'Esta sierra ya ha sido escaneada',
          variant: 'default',
        });
        setProcessingBarcode(false);
        return;
      }
      
      // Buscar la sierra por código de barras
      console.log('Buscando sierra con código:', barcode);
      const sierra = await getSierraByCodigo(barcode);
      console.log('Resultado de búsqueda:', sierra);
      
      if (!sierra) {
        toast({
          title: 'Error',
          description: 'No se encontró ninguna sierra con ese código de barras',
          variant: 'destructive',
        });
        setProcessingBarcode(false);
        return;
      }
      
      // Verificar que la sierra esté activa
      if (!sierra.activo) {
        toast({
          title: 'Error',
          description: 'La sierra ya está marcada como inactiva',
          variant: 'destructive',
        });
        setProcessingBarcode(false);
        return;
      }
      
      // Agregar la sierra a la lista
      setScannedSierras(prev => [...prev, sierra]);
      
      toast({
        title: 'Éxito',
        description: 'Sierra escaneada correctamente',
      });
    } catch (error: any) {
      console.error('Error al procesar código de barras:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo procesar el código de barras',
        variant: 'destructive',
      });
    } finally {
      setProcessingBarcode(false);
    }
  };

  // Eliminar una sierra de la lista
  const handleRemoveSierra = (sierraId: number) => {
    setScannedSierras(prev => prev.filter(sierra => sierra.id !== sierraId));
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fecha_baja"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Baja</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={loading}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Fecha en que se dan de baja las sierras
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ingrese observaciones adicionales (opcional)"
                    className="resize-none"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormDescription>
                  Información adicional sobre la baja masiva
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Escanear Sierras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <BarcodeInputComponent 
                    onScan={handleBarcodeScan} 
                    placeholder="Escanee o ingrese el código de barras de la sierra"
                  />
                  {processingBarcode && (
                    <div className="flex justify-center mt-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Procesando código...</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Sierras Escaneadas ({scannedSierras.length})</h3>
                  {scannedSierras.length > 0 ? (
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      <div className="space-y-2">
                        {scannedSierras.map((sierra) => (
                          <div key={sierra.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">Código: {sierra.codigo_barras}</p>
                              <p className="text-sm text-muted-foreground">
                                Tipo: {sierra.tipo_sierra?.nombre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Sucursal: {sierra.sucursal?.nombre}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {sierra.estado_sierra?.nombre}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSierra(sierra.id)}
                              disabled={loading}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-center py-8 border rounded-md">
                      No hay sierras escaneadas. Escanee al menos una sierra para continuar.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {confirming ? (
            <div className="mt-4 border rounded-md p-4 bg-amber-50">
              <h3 className="text-lg font-medium mb-2">Confirmar Acción</h3>
              <p className="mb-4">¿Está seguro que desea registrar la baja de {scannedSierras.length} sierra(s)? Esta acción cambiará el estado de las sierras a "Fuera de servicio" y las marcará como inactivas.</p>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={onSubmit}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Baja Masiva
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={() => setConfirming(true)}
                disabled={loading || scannedSierras.length === 0}
              >
                Registrar Baja Masiva
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}