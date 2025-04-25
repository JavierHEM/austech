'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ArrowLeft,
  Calendar,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAfiladosBySierra } from '@/services/afiladoService';
import { getSierraById } from '@/services/sierraService';
import type { AfiladoConRelaciones } from '@/types/afilado';
import type { SierraConRelaciones } from '@/types/sierra';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface HistorialPageProps {
  params: {
    id: string;
  };
}

export default function HistorialPage({ params }: HistorialPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [afilados, setAfilados] = useState<AfiladoConRelaciones[]>([]);
  const [sierra, setSierra] = useState<SierraConRelaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const sierraId = params.id ? parseInt(params.id) : 0;

  useEffect(() => {
    const loadData = async () => {
      if (!sierraId) {
        setLoading(false);
        return;
      }

      try {
        const [sierraData, afiladosData] = await Promise.all([
          getSierraById(sierraId),
          getAfiladosBySierra(sierraId)
        ]);

        setSierra(sierraData);
        setAfilados(afiladosData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el historial de afilados.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sierraId, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando historial...</span>
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
          <CardContent>
            <Button onClick={() => router.push('/sierras')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Historial de Afilados</h1>
          <p className="text-muted-foreground">
            Sierra: {sierra.codigo_barras} - {sierra.tipo_sierra?.nombre}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/sierras/${sierraId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a detalles
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro Completo de Afilados</CardTitle>
          <CardDescription>
            Historial completo de todos los afilados realizados a esta sierra
          </CardDescription>
        </CardHeader>
        <CardContent>
          {afilados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay registros de afilados para esta sierra.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {afilados.map((afilado) => (
                    <TableRow key={afilado.id}>
                      <TableCell>
                        {format(new Date(afilado.fecha_afilado), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>{afilado.tipo_afilado.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={afilado.urgente ? 'destructive' : 'secondary'}>
                          {afilado.urgente ? 'Urgente' : 'Normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>{afilado.observaciones || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
