'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import EmpresaForm from '@/components/empresas/EmpresaForm';

interface EditarEmpresaPageProps {
  params: {
    id: string;
  };
}

// Forzar que esta página sea dinámica
export const dynamic = 'force-dynamic';

export default function EditarEmpresaPage({ params }: EditarEmpresaPageProps) {
  const empresaId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="mr-2"
        >
          <Link href="/empresas">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Empresa</h1>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <EmpresaForm empresaId={empresaId} isEditing={true} />
      </div>
    </div>
  );
}