'use client';

import AfiladoForm from '@/components/afilados/AfiladoForm';

interface EditarAfiladoPageProps {
  params: {
    id: string;
  };
}

export default function EditarAfiladoPage({ params }: EditarAfiladoPageProps) {
  const afiladoId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Editar Afilado</h1>
      <AfiladoForm 
        afiladoId={afiladoId}
        isEditing={true}
      />
    </div>
  );
}
