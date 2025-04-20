'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createSalidaMasiva, SalidaMasivaInput } from '@/services/salidaMasivaService';

import { AfiladoConRelaciones } from '@/types/afilado';
import BarcodeInputComponent from '@/components/scanner/BarcodeInputComponent';
import { getSierraByCodigo } from '@/services/sierraService';
import { getAfiladosBySierra } from '@/services/afiladoService';
import { useAuth } from '@/contexts/AuthContext';



export default function SalidaMasivaForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scannedAfilados, setScannedAfilados] = useState<AfiladoConRelaciones[]>([]);
  const [processingBarcode, setProcessingBarcode] = useState(false);





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

      // Preparar los datos para enviar
      const salidaMasivaData: SalidaMasivaInput = {
        sucursal_id: scannedAfilados[0].sierra?.sucursal_id || 0,
        fecha_salida: format(new Date(), 'yyyy-MM-dd'),
        observaciones: '',
        afilados_ids: scannedAfilados.map(afilado => afilado.id),
      };

      // Crear la salida masiva - esto actualizará el estado de las sierras a "Disponible" (estado_id = 1)
      // y registrará la fecha de salida en los afilados
      await createSalidaMasiva(salidaMasivaData, user?.id || '');

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

    // Verificar si la sierra ya fue escaneada
    const alreadyScanned = scannedAfilados.some(afilado => 
      afilado.sierra?.codigo_barras === barcode
    );

    if (alreadyScanned) {
      toast({
        title: 'Aviso',
        description: 'Esta sierra ya ha sido escaneada',
        variant: 'default',
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
          description: 'No se encontró ninguna sierra con ese código de barras',
          variant: 'destructive',
        });
        return;
      }

      // Verificar que la sierra esté en estado "En proceso de afilado" (estado_id = 2) o "Lista para retiro" (estado_id = 3)
      if (sierra.estado_id !== 2 && sierra.estado_id !== 3) {
        toast({
          title: 'Error',
          description: `La sierra debe estar en estado "En proceso de afilado" o "Lista para retiro". Estado actual: ${sierra.estado_sierra?.nombre}`,
          variant: 'destructive',
        });
        return;
      }

      // Buscar afilados pendientes para esta sierra
      const afilados = await getAfiladosBySierra(sierra.id);

      if (!afilados || afilados.length === 0) {
        toast({
          title: 'Error',
          description: 'No se encontraron afilados pendientes para esta sierra',
          variant: 'destructive',
        });
        return;
      }

      // Filtrar solo los afilados que no tienen fecha_salida
      const pendingAfilados = afilados.filter(afilado => !afilado.fecha_salida);

      if (pendingAfilados.length === 0) {
        toast({
          title: 'Error',
          description: 'No hay afilados pendientes de salida para esta sierra',
          variant: 'destructive',
        });
        return;
      }

      // Imprimir los datos para depuración
      console.log('Sierra encontrada:', sierra);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Registro de Salida Masiva</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <span className="ml-2">Procesando código...</span>
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
                            <td className="py-2" data-component-name="SalidaMasivaForm">
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
                          onClick={handleConfirmSalida}
                          disabled={loading}
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirmar Salida
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 border rounded-md">
                  No hay sierras escaneadas. Escanee al menos una sierra para continuar.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
