import { Metadata } from 'next';
import SalidaMasivaForm from '@/components/salida-masiva/SalidaMasivaForm';

export const metadata: Metadata = {
  title: 'Crear Salida Masiva | Austech',
  description: 'Crear una nueva salida masiva de sierras',
};

export default function CrearSalidaMasivaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Salida Masiva</h1>
        <p className="text-muted-foreground">
          Registre la salida de múltiples sierras de forma masiva
        </p>
      </div>
      
      <SalidaMasivaForm />
    </div>
  );
}
