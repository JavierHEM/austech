'use client';

import AfiladoForm from '@/components/afilados/AfiladoForm';

interface CompletarAfiladoPageProps {
  params: {
    id: string;
  };
}

// Forzar que esta página sea dinámica
export const dynamic = 'force-dynamic';

export default function CompletarAfiladoPage({ params }: CompletarAfiladoPageProps) {
  const afiladoId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Completar Afilado</h1>
      <AfiladoForm 
        afiladoId={afiladoId}
        isCompletando={true}
      />
    </div>
  );
}
