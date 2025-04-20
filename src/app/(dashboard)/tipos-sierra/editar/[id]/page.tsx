'use client';

import TipoSierraForm from '@/components/tipos-sierra/TipoSierraForm';

interface EditarTipoSierraPageProps {
  params: {
    id: string;
  };
}

export default function EditarTipoSierraPage({ params }: EditarTipoSierraPageProps) {
  const tipoId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Editar Tipo de Sierra</h1>
      <TipoSierraForm 
        tipoId={tipoId}
        isEditing={true}
      />
    </div>
  );
}
