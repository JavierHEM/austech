'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import SucursalForm from '@/components/sucursales/SucursalForm';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase';

// Interfaz para la empresa
interface Empresa {
  id: number;
  razon_social: string;
}

export default function CrearSucursalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Selección de empresa, 2: Formulario de sucursal

  // Cargar empresas disponibles
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('id, razon_social')
          .eq('activo', true)
          .order('razon_social');
        
        if (error) throw error;
        
        setEmpresas(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las empresas.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, [supabase, toast]);

  const handleSelectEmpresa = (empresaId: number) => {
    setSelectedEmpresa(empresaId);
    setStep(2);
  };

  const handleCancelForm = () => {
    if (step === 2) {
      setStep(1);
      setSelectedEmpresa(null);
    } else {
      router.push('/sucursales');
    }
  };

  const handleSuccess = () => {
    router.push('/sucursales');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="mr-2"
        >
          <Link href="/sucursales">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Crear Nueva Sucursal</h1>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Cargando empresas...</div>
              ) : empresas.length === 0 ? (
                <div className="text-center py-4">
                  <p>No hay empresas disponibles.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => router.push('/empresas/crear')}
                  >
                    Crear Empresa
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {empresas.map((empresa) => (
                    <Button
                      key={empresa.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start text-left"
                      onClick={() => handleSelectEmpresa(empresa.id)}
                    >
                      <span className="font-bold">{empresa.razon_social}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          selectedEmpresa && (
            <SucursalForm 
              sucursalId={undefined}
              isEditing={false}
              empresaId={selectedEmpresa}
            />
          )
        )}
      </div>
    </div>
  );
}