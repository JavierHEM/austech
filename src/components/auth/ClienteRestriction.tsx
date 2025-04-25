'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ClienteRestrictionProps {
  children: ReactNode;
  empresaId?: number;
}

export default function ClienteRestriction({ 
  children, 
  empresaId 
}: ClienteRestrictionProps) {
  const router = useRouter();
  const { session, role } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [empresasPermitidas, setEmpresasPermitidas] = useState<number[]>([]);
  const [nombresEmpresas, setNombresEmpresas] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no es un usuario cliente, permitir acceso sin verificación
    if (!session?.user || role !== 'cliente') {
      setIsChecking(false);
      setHasAccess(true);
      return;
    }

    const checkAccess = async () => {
      try {
        console.log('Verificando acceso para usuario:', session.user.id, 'con rol:', role);
        
        // Obtener la empresa asignada al usuario desde la tabla usuarios
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('Error al obtener empresa del usuario:', userError);
          setError('Error al verificar acceso');
          setIsChecking(false);
          return;
        }
        
        // Si el usuario no tiene empresa asignada
        if (!userData || userData.empresa_id === null) {
          console.log('Usuario sin empresa asignada');
          setEmpresasPermitidas([]);
          setIsChecking(false);
          setHasAccess(false);
          setError('No tienes una empresa asignada');
          return;
        }

        // Usar solo la empresa asignada al usuario
        const empresasIds = userData.empresa_id ? [userData.empresa_id] : [];
        
        // Nota: La funcionalidad de empresas relacionadas se implementará en el futuro
        // cuando se cree la tabla correspondiente en la base de datos

        console.log('Empresas permitidas:', empresasIds);
        setEmpresasPermitidas(empresasIds);

        // Obtener nombres de empresas para mostrar en la UI
        if (empresasIds.length > 0) {
          const { data: empresasData, error: empresasError } = await supabase
            .from('empresas')
            .select('id, razon_social')
            .in('id', empresasIds);

          if (!empresasError && empresasData) {
            const nombresMap: Record<number, string> = {};
            empresasData.forEach((empresa: any) => {
              nombresMap[empresa.id] = empresa.razon_social;
            });
            setNombresEmpresas(nombresMap);
          }
        }

        // Verificar si tiene acceso a la empresa específica
        if (empresaId && !empresasIds.includes(empresaId)) {
          console.log('No tiene acceso a la empresa:', empresaId);
          setError(`No tienes acceso a esta empresa (ID: ${empresaId})`);
          setHasAccess(false);
        } else {
          console.log('Tiene acceso a la empresa:', empresaId || 'No se especificó empresa');
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error al verificar acceso:', error);
        setError('Error al verificar acceso');
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [session, role, empresaId, router]);

  if (isChecking) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-32 w-full max-w-2xl mb-4" />
        <Skeleton className="h-24 w-full max-w-2xl" />
      </div>
    );
  }

  // Si no es un usuario cliente, mostrar el contenido normalmente
  if (!session?.user || role !== 'cliente') {
    return <>{children}</>;
  }

  // Si no tiene acceso, mostrar mensaje de error
  if (!hasAccess) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            {error || 'No tienes acceso a esta empresa.'}
          </AlertDescription>
        </Alert>
        
        {empresasPermitidas.length > 0 ? (
          <div className="mt-6 bg-white p-4 rounded-md shadow">
            <h3 className="text-lg font-semibold mb-4">Empresas a las que tienes acceso:</h3>
            <div className="space-y-2">
              {empresasPermitidas.map(empresaId => (
                <div key={empresaId} className="p-2 border rounded-md flex justify-between items-center">
                  <span className="font-medium">
                    {nombresEmpresas[empresaId] || `Empresa ID: ${empresaId}`}
                  </span>
                  <Link href={`/afilados?empresa_id=${empresaId}`}>
                    <Button size="sm">
                      Ver afilados
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert className="mt-4">
            <AlertDescription>
              No tienes empresas asignadas. Contacta al administrador para solicitar acceso.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => router.push(role === 'cliente' ? '/cliente' : '/dashboard')}
            variant="outline"
            className="mr-2"
          >
            Volver al Dashboard
          </Button>
          
          <Button
            onClick={() => router.refresh()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Si tiene acceso, renderizar los children
  return <>{children}</>;
}