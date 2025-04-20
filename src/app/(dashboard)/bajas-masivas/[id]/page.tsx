import { Metadata } from 'next';
import BajaMasivaDetail from '@/components/baja-masiva/BajaMasivaDetail';

export const metadata: Metadata = {
  title: 'Detalles de Baja Masiva | Austech',
  description: 'Ver detalles de una baja masiva de sierras',
};

interface BajaMasivaPageProps {
  params: {
    id: string;
  };
}

export default function BajaMasivaPage({ params }: BajaMasivaPageProps) {
  const id = parseInt(params.id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detalles de Baja Masiva</h1>
        <p className="text-muted-foreground">
          Información detallada de la baja masiva #{id}
        </p>
      </div>
      
      <BajaMasivaDetail id={id} />
    </div>
  );
}
