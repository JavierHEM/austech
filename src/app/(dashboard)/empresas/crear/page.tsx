'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import EmpresaForm from '@/components/empresas/EmpresaForm';

export default function CrearEmpresaPage() {
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
        <h1 className="text-3xl font-bold">Crear Nueva Empresa</h1>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <EmpresaForm />
      </div>
    </div>
  );
}