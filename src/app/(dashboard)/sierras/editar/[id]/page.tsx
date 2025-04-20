'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SierraForm from '@/components/sierras/SierraForm';

interface EditarSierraPageProps {
  params: {
    id: string;
  };
}

export default function EditarSierraPage({ params }: EditarSierraPageProps) {
  const sierraId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Editar Sierra</h1>
      <SierraForm 
        sierraId={sierraId}
        isEditing={true}
      />
    </div>
  );
}
