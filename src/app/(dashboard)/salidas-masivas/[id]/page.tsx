import { Metadata } from 'next';
import SalidaMasivaDetail from '@/components/salida-masiva/SalidaMasivaDetail';

export const metadata: Metadata = {
  title: 'Detalles de Salida Masiva | Austech',
  description: 'Ver detalles de una salida masiva de sierras',
};

interface SalidaMasivaPageProps {
  params: {
    id: string;
  };
}

export default function SalidaMasivaPage({ params }: SalidaMasivaPageProps) {
  const id = parseInt(params.id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detalles de Salida Masiva</h1>
        <p className="text-muted-foreground">
          Información detallada de la salida masiva #{id}
        </p>
      </div>
      
      <SalidaMasivaDetail id={id} />
    </div>
  );
}
