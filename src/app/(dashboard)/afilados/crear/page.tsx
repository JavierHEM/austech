'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AfiladoForm from '@/components/afilados/AfiladoForm';
import SierraBusqueda from '@/components/afilados/SierraBusqueda';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSierraById } from '@/services/sierraService';
import { useToast } from '@/hooks/use-toast';

enum CrearAfiladoStep {
  BUSCAR_SIERRA,
  REGISTRAR_AFILADO
}

export default function CrearAfiladoPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<CrearAfiladoStep>(CrearAfiladoStep.BUSCAR_SIERRA);
  const [selectedSierra, setSelectedSierra] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Verificar si hay un ID de sierra en la URL
  useEffect(() => {
    if (!searchParams) return;
    
    const sierraId = searchParams.get('sierra_id');
    if (sierraId) {
      setLoading(true);
      getSierraById(parseInt(sierraId))
        .then(sierra => {
          if (sierra) {
            setSelectedSierra(sierra);
            setCurrentStep(CrearAfiladoStep.REGISTRAR_AFILADO);
          } else {
            toast({
              title: 'Error',
              description: 'No se encontró la sierra especificada',
              variant: 'destructive'
            });
          }
        })
        .catch(error => {
          console.error('Error al cargar la sierra:', error);
          toast({
            title: 'Error',
            description: 'Ocurrió un error al cargar la sierra',
            variant: 'destructive'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams, toast]);

  const handleSierraSelected = (sierra: any) => {
    setSelectedSierra(sierra);
    setCurrentStep(CrearAfiladoStep.REGISTRAR_AFILADO);
  };

  const handleRegistrarNueva = () => {
    // Redirigir a la página de registro de nueva sierra
    window.location.href = '/sierras/crear';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información de la sierra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {currentStep === CrearAfiladoStep.BUSCAR_SIERRA
            ? 'Buscar Sierra para Afilado'
            : 'Registrar Nuevo Afilado'}
        </h1>
        
        {currentStep === CrearAfiladoStep.REGISTRAR_AFILADO && (
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(CrearAfiladoStep.BUSCAR_SIERRA)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la búsqueda
          </Button>
        )}

        {currentStep === CrearAfiladoStep.BUSCAR_SIERRA && (
          <Link href="/afilados">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </Link>
        )}
      </div>

      {currentStep === CrearAfiladoStep.BUSCAR_SIERRA ? (
        <SierraBusqueda 
          onSierraSelected={handleSierraSelected} 
          onRegistrarNueva={handleRegistrarNueva}
        />
      ) : (
        <AfiladoForm sierraId={selectedSierra?.id} />
      )}
    </div>
  );
}
