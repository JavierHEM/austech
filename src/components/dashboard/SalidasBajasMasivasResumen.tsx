import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getSalidasMasivas } from '@/services/salidaMasivaService';
import { getBajasMasivas } from '@/services/bajaMasivaService';
import { SalidaMasivaConRelaciones } from '@/types/salidaMasiva';
import { BajaMasivaConRelaciones } from '@/types/bajaMasiva';

export default function SalidasBajasMasivasResumen() {
  const [salidasMasivas, setSalidasMasivas] = useState<SalidaMasivaConRelaciones[]>([]);
  const [bajasMasivas, setBajasMasivas] = useState<BajaMasivaConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar salidas masivas
        const salidasData = await getSalidasMasivas();
        setSalidasMasivas(salidasData.slice(0, 5)); // Mostrar solo las 5 más recientes
        
        // Cargar bajas masivas
        const bajasData = await getBajasMasivas();
        setBajasMasivas(bajasData.slice(0, 5)); // Mostrar solo las 5 más recientes
      } catch (error) {
        console.error('Error al cargar datos de resumen:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Salidas y Bajas Masivas</CardTitle>
        <CardDescription>
          Resumen de las salidas y bajas masivas más recientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="salidas">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="salidas">Salidas Masivas</TabsTrigger>
            <TabsTrigger value="bajas">Bajas Masivas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="salidas" className="space-y-4 mt-4">
            {loading ? (
              <p className="text-center py-4">Cargando salidas masivas...</p>
            ) : salidasMasivas.length === 0 ? (
              <p className="text-center py-4">No hay salidas masivas registradas</p>
            ) : (
              <div className="space-y-4">
                {salidasMasivas.map((salida) => (
                  <div key={salida.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">
                        Salida #{salida.id} - {salida.sucursal?.nombre || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(salida.fecha_salida), 'PPP', { locale: es })}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/salidas-masivas/${salida.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bajas" className="space-y-4 mt-4">
            {loading ? (
              <p className="text-center py-4">Cargando bajas masivas...</p>
            ) : bajasMasivas.length === 0 ? (
              <p className="text-center py-4">No hay bajas masivas registradas</p>
            ) : (
              <div className="space-y-4">
                {bajasMasivas.map((baja) => (
                  <div key={baja.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">
                        Baja #{baja.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(baja.fecha_baja), 'PPP', { locale: es })}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/bajas-masivas/${baja.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="outline">
          <Link href="/salidas-masivas">
            Ver todas las salidas
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/bajas-masivas">
            Ver todas las bajas
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
