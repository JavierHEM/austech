'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAfiladosBySierra } from '@/services/afiladoService';
import type { AfiladoConRelaciones } from '@/types/afilado';
import { Badge } from '@/components/ui/badge';

interface SierraAfiladosHistoryProps {
  sierraId: number;
}

export default function SierraAfiladosHistory({ sierraId }: SierraAfiladosHistoryProps) {
  const [afilados, setAfilados] = useState<AfiladoConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAfilados = async () => {
      try {
        setLoading(true);
        const data = await getAfiladosBySierra(sierraId);
        setAfilados(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar historial de afilados:', err);
        setError('No se pudo cargar el historial de afilados');
      } finally {
        setLoading(false);
      }
    };

    loadAfilados();
  }, [sierraId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Afilados</CardTitle>
        <CardDescription>Registro de afilados realizados a esta sierra</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        ) : afilados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay registros de afilados para esta sierra.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {afilados.map((afilado) => (
              <div
                key={afilado.id}
                className="flex flex-col space-y-2 p-4 border rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{afilado.tipo_afilado.nombre}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(afilado.fecha_afilado), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                  <Badge variant={afilado.urgente ? 'destructive' : 'secondary'}>
                    {afilado.urgente ? 'Urgente' : 'Normal'}
                  </Badge>
                </div>
                {afilado.observaciones && (
                  <p className="text-sm mt-2">{afilado.observaciones}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant="outline"
          disabled={loading || afilados.length === 0}
          asChild
        >
          <Link href={`/sierras/${sierraId}/historial`}>
            <History className="mr-2 h-4 w-4" />
            Ver historial completo
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
