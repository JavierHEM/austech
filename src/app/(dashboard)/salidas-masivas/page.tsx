import { Metadata } from 'next';
import SalidaMasivaList from '@/components/salida-masiva/SalidaMasivaList';

export const metadata: Metadata = {
  title: 'Salidas Masivas | Austech',
  description: 'Gestión de salidas masivas de sierras',
};

export default function SalidasMasivasPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salidas Masivas</h1>
        <p className="text-muted-foreground">
          Gestione las salidas masivas de sierras
        </p>
      </div>
      
      <SalidaMasivaList />
    </div>
  );
}
