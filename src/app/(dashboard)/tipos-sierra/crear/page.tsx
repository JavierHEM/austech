'use client';

import TipoSierraForm from '@/components/tipos-sierra/TipoSierraForm';

export default function CrearTipoSierraPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Tipo de Sierra</h1>
      <TipoSierraForm />
    </div>
  );
}
