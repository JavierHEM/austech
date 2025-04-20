'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import SucursalForm from '@/components/sucursales/SucursalForm';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase';

interface EditarSucursalPageProps {
  params: {
    id: string;
  };
}

export default function EditarSucursalPage({ params }: EditarSucursalPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const sucursalId = parseInt(params.id);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar información de la sucursal para obtener el ID de la empresa
  useEffect(() => {
    const fetchSucursal = async () => {
      try {
        const { data, error } = await supabase
          .from('sucursales')
          .select('empresa_id')
          .eq('id', sucursalId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setEmpresaId(data.empresa_id);
        } else {
          toast({
            title: 'Error',
            description: 'No se encontró la sucursal.',
            variant: 'destructive'
          });
          router.push('/sucursales');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar la sucursal:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información de la sucursal.',
          variant: 'destructive'
        });
        setLoading(false);
        router.push('/sucursales');
      }
    };

    fetchSucursal();
  }, [sucursalId, router, toast, supabase]);

  const handleCancel = () => {
    router.push('/sucursales');
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
        <h1 className="text-3xl font-bold">Editar Sucursal</h1>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : empresaId ? (
          <SucursalForm 
            sucursalId={sucursalId}
            isEditing={true}
            empresaId={empresaId}
          />
        ) : (
          <div className="text-center py-10">No se encontró información de la sucursal.</div>
        )}
      </div>
    </div>
  );
}