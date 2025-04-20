import { Metadata } from 'next';
import BajaMasivaForm from '@/components/baja-masiva/BajaMasivaForm';

export const metadata: Metadata = {
  title: 'Crear Baja Masiva | Austech',
  description: 'Crear una nueva baja masiva de sierras',
};

export default function CrearBajaMasivaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Baja Masiva</h1>
        <p className="text-muted-foreground">
          Registre la baja de múltiples sierras de forma masiva
        </p>
      </div>
      
      <BajaMasivaForm />
    </div>
  );
}
