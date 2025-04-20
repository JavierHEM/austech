'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SierraForm from '@/components/sierras/SierraForm';
import { useSearchParams } from 'next/navigation';

export default function CrearSierraPage() {
  const searchParams = useSearchParams();
  const sucursalId = searchParams ? searchParams.get('sucursal_id') : null;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Registrar Nueva Sierra</h1>
      <SierraForm 
        sucursalId={sucursalId ? parseInt(sucursalId) : undefined}
      />
    </div>
  );
}
