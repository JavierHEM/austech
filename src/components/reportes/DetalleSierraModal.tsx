import { useState, useEffect } from 'react';
import { obtenerDetalleSierra } from '@/services/nuevoReporteAfiladosService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface DetalleSierraModalProps {
  sierraId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DetalleSierra {
  id: number;
  codigo_barras: string;
  observaciones: string | null;
  activo: boolean;
  tipos_sierra: {
    id: number;
    nombre: string;
  };
  sucursales: {
    id: number;
    nombre: string;
    empresas: {
      id: number;
      razon_social: string;
    };
  };
  estados_sierra: {
    id: number;
    nombre: string;
  };
}

export function DetalleSierraModal({ sierraId, isOpen, onClose }: DetalleSierraModalProps) {
  const [detalle, setDetalle] = useState<DetalleSierra | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sierraId) {
      cargarDetalleSierra(sierraId);
    } else {
      // Limpiar datos cuando se cierra el modal
      setDetalle(null);
      setError(null);
    }
  }, [isOpen, sierraId]);

  const cargarDetalleSierra = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await obtenerDetalleSierra(id);
      
      // Transformar los datos al formato esperado
      if (data) {
        const detalleFormateado: DetalleSierra = {
          id: data.id,
          codigo_barras: data.codigo_barras,
          observaciones: data.observaciones,
          activo: data.activo,
          tipos_sierra: data.tipos_sierra?.[0] || { id: 0, nombre: 'N/A' },
          sucursales: {
            id: data.sucursales?.[0]?.id || 0,
            nombre: data.sucursales?.[0]?.nombre || 'N/A',
            empresas: {
              id: data.sucursales?.[0]?.empresas?.[0]?.id || 0,
              razon_social: data.sucursales?.[0]?.empresas?.[0]?.razon_social || 'N/A'
            }
          },
          estados_sierra: data.estados_sierra?.[0] || { id: 0, nombre: 'N/A' }
        };
        
        setDetalle(detalleFormateado);
      }
    } catch (err) {
      console.error('Error al cargar detalle de sierra:', err);
      setError('No se pudo cargar la información de la sierra. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle de Sierra</DialogTitle>
          <DialogDescription>
            Información detallada de la sierra seleccionada
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            {error}
          </div>
        ) : detalle ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Código:</span>
                  <span>{detalle.codigo_barras}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tipo:</span>
                  <span>{detalle.tipos_sierra?.nombre || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Estado:</span>
                  <Badge variant={detalle.activo ? "success" : "destructive"}>
                    {detalle.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Estado Sierra:</span>
                  <span>{detalle.estados_sierra?.nombre || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Empresa:</span>
                  <span>{detalle.sucursales?.empresas?.razon_social || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sucursal:</span>
                  <span>{detalle.sucursales?.nombre || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
            
            {detalle.observaciones && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {detalle.observaciones}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            No hay información disponible
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
