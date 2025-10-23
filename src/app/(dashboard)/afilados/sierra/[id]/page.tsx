'use client';

import AfiladoForm from '@/components/afilados/AfiladoForm';

interface AfiladoSierraPageProps {
  params: {
    id: string;
  };
}

// Forzar que esta página sea dinámica
export const dynamic = 'force-dynamic';

export default function AfiladoSierraPage({ params }: AfiladoSierraPageProps) {
  const sierraId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Registrar Afilado para Sierra</h1>
      <AfiladoForm sierraId={sierraId} />
    </div>
  );
}
