import { Metadata } from 'next';
import BajaMasivaList from '@/components/baja-masiva/BajaMasivaList';

export const metadata: Metadata = {
  title: 'Bajas Masivas | Austech',
  description: 'Gestión de bajas masivas de sierras',
};

export default function BajasMasivasPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bajas Masivas</h1>
        <p className="text-muted-foreground">
          Gestione las bajas masivas de sierras
        </p>
      </div>
      
      <BajaMasivaList />
    </div>
  );
}
