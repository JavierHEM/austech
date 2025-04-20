'use client';

import TipoAfiladoForm from '@/components/tipos-afilado/TipoAfiladoForm';

export default function CrearTipoAfiladoPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Crear Tipo de Afilado</h1>
      <TipoAfiladoForm />
    </div>
  );
}
