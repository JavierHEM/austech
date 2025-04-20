'use client';

import TipoAfiladoForm from '@/components/tipos-afilado/TipoAfiladoForm';

interface EditarTipoAfiladoPageProps {
  params: {
    id: string;
  };
}

export default function EditarTipoAfiladoPage({ params }: EditarTipoAfiladoPageProps) {
  const tipoId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Editar Tipo de Afilado</h1>
      <TipoAfiladoForm 
        tipoId={tipoId}
        isEditing={true}
      />
    </div>
  );
}
