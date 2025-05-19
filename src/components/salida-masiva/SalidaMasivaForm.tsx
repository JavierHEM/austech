'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CustomDatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createSalidaMasiva, SalidaMasivaInput } from '@/services/salidaMasivaService';

import { AfiladoConRelaciones } from '@/types/afilado';
import BarcodeInputComponent from '@/components/scanner/BarcodeInputComponent';
import { getSierraByCodigo } from '@/services/sierraService';
import { getAfiladosBySierra } from '@/services/afiladoService';
import { useAuth } from '@/hooks/use-auth';

// Esquema de validación para el formulario
const formSchema = z.object({
  fecha_salida: z.date({
    required_error: 'Debe seleccionar una fecha de salida',
  }),
  observaciones: z.string().optional(),
});

export default function SalidaMasivaForm() {
  const { session } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scannedAfilados, setScannedAfilados] = useState<AfiladoConRelaciones[]>([]);
  const [processingBarcode, setProcessingBarcode] = useState(false);
  
  // Inicializar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha_salida: new Date(),
      observaciones: '',
    },
  });

  // Manejar la confirmación y registro de la salida masiva
  const handleConfirmSalida = async () => {
    if (scannedAfilados.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe escanear al menos una sierra para registrar la salida masiva',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Obtener la fecha seleccionada del formulario
      const fechaSeleccionada = form.getValues().fecha_salida;
      console.log('Fecha seleccionada en el DatePicker:', fechaSeleccionada);
      
      // Preparar los datos para enviar
      const salidaMasivaData: SalidaMasivaInput = {
        sucursal_id: scannedAfilados[0].sierra?.sucursal_id || 0,
        fecha_salida: format(fechaSeleccionada, 'yyyy-MM-dd'),
        observaciones: form.getValues().observaciones || '',
        afilados_ids: scannedAfilados.map(afilado => afilado.id),
      };
      
      console.log('Fecha formateada para enviar:', salidaMasivaData.fecha_salida);

      // Crear la salida masiva - esto actualizará el estado de las sierras a "Disponible" (estado_id = 1)
      // y registrará la fecha de salida en los afilados
      await createSalidaMasiva(salidaMasivaData, session?.user?.id || '');

      toast({
        title: 'Éxito',
        description: 'Salida masiva registrada correctamente. Las sierras han sido marcadas como "Disponible".',
      });

      // Redireccionar a la página de salidas masivas
      router.push('/salidas-masivas');
    } catch (error) {
      console.error('Error al registrar salida masiva:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la salida masiva',
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

    // Verificar si la sierra ya está escaneada
    const isAlreadyScanned = scannedAfilados.some(
      afilado => afilado.sierra?.codigo_barras === barcode
    );

    if (isAlreadyScanned) {
      toast({
        title: 'Información',
        description: 'Esta sierra ya ha sido escaneada',
      });
      return;
    }

    try {
      setProcessingBarcode(true);
      
      // Buscar la sierra por código de barras
      const sierra = await getSierraByCodigo(barcode);
      
      if (!sierra) {
        toast({
          title: 'Error',
          description: 'Sierra no encontrada',
          variant: 'destructive',
        });
        return;
      }
      
      // Verificar que la sierra esté en estado "Lista para retiro" (estado_id = 3) o "En proceso de afilado" (estado_id = 2)
      if (sierra.estado_id !== 3 && sierra.estado_id !== 2) {
        toast({
          title: 'Error',
          description: `La sierra debe estar en estado "Lista para retiro" o "En proceso de afilado". Estado actual: ${sierra.estado_sierra?.nombre || 'Desconocido'}`,
          variant: 'destructive',
        });
        return;
      }
      
      // Obtener los afilados pendientes de la sierra (los que no tienen fecha_salida)
      const afilados = await getAfiladosBySierra(sierra.id);
      const pendingAfilados = afilados.filter(afilado => !afilado.fecha_salida);
      
      if (pendingAfilados.length === 0) {
        toast({
          title: 'Error',
          description: 'No hay afilados pendientes para esta sierra',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Afilados pendientes:', pendingAfilados);
      
      // Agregar los afilados a la lista de escaneados
      setScannedAfilados(prev => [...prev, ...pendingAfilados]);

      toast({
        title: 'Éxito',
        description: `Sierra escaneada correctamente. Se agregaron ${pendingAfilados.length} afilados.`,
      });
    } catch (error) {
      console.error('Error al procesar código de barras:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar el código de barras',
        variant: 'destructive',
      });
    } finally {
      setProcessingBarcode(false);
    }
  };

  // Eliminar un afilado de la lista
  const handleRemoveAfilado = (afiladoId: number) => {
    setScannedAfilados(prev => prev.filter(afilado => afilado.id !== afiladoId));
  };

  const onSubmit = form.handleSubmit(handleConfirmSalida);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Registro de Salida Masiva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FormField
                  control={form.control}
                  name="fecha_salida"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Salida</FormLabel>
                      <FormControl>
                        <CustomDatePicker
                          date={field.value}
                          onDateChange={(date) => {
                            console.log('Nueva fecha seleccionada:', date);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Escanear Sierras</h3>
                  <BarcodeInputComponent
                    onScan={handleBarcodeScan}
                    placeholder="Escanee o ingrese el código de barras de la sierra"
                  />

                  {processingBarcode && (
                    <div className="flex items-center justify-center mt-4 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Procesando código de barras...</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Sierras Escaneadas ({scannedAfilados.length})</h3>
                  {scannedAfilados.length > 0 ? (
                    <div>
                      <ScrollArea className="h-[300px] border rounded-md p-4">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="py-2 text-left">Código</th>
                              <th className="py-2 text-left">Tipo</th>
                              <th className="py-2 text-left">Estado</th>
                              <th className="py-2 text-left">Sucursal</th>
                              <th className="py-2 text-left">Fecha Ingreso</th>
                              <th className="py-2 text-left">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scannedAfilados.map((afilado) => (
                              <tr key={afilado.id}>
                                <td className="py-2">{afilado.sierra?.codigo_barras}</td>
                                <td className="py-2">{afilado.sierra?.tipo_sierra?.nombre}</td>
                                <td className="py-2">
                                  <Badge 
                                    variant={afilado.sierra?.estado_id === 2 ? 'outline' : 'default'}
                                  >
                                    {afilado.sierra?.estado_sierra?.nombre || 'Desconocido'}
                                  </Badge>
                                </td>
                                <td className="py-2">{afilado.sierra?.sucursal?.nombre}</td>
                                <td className="py-2">{afilado.fecha_afilado ? format(new Date(afilado.fecha_afilado), 'dd/MM/yyyy') : '-'}</td>
                                <td className="py-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveAfilado(afilado.id)}
                                    disabled={loading || confirming}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                      
                      {!confirming ? (
                        <div className="flex justify-end mt-4 space-x-4">
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
                            disabled={loading || scannedAfilados.length === 0}
                          >
                            Registrar Salida Masiva
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 border rounded-md p-4 bg-amber-50">
                          <h3 className="text-lg font-medium mb-2">Confirmar Acción</h3>
                          <p className="mb-4">¿Está seguro que desea registrar la salida de {scannedAfilados.length} sierra(s)? Esta acción cambiará el estado de las sierras a "Disponible" y registrará su fecha de salida.</p>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setConfirming(false)}
                              disabled={loading}
                              type="button"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Procesando...
                                </>
                              ) : (
                                'Confirmar Salida'
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-end mt-4">
                      <Button 
                        onClick={() => setConfirming(true)}
                        disabled={scannedAfilados.length === 0}
                        type="button"
                      >
                        Registrar Salida
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
