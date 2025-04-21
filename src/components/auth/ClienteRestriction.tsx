'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import Loading from '@/components/ui/Loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user || role !== 'cliente') {
      setIsChecking(false);
      return;
    }

    const checkAccess = async () => {
      try {
        // Obtener las empresas a las que tiene acceso el usuario
        const { data: userEmpresas, error: userEmpresasError } = await supabase
          .from('usuarios_empresas')
          .select('empresa_id')
          .eq('usuario_id', session.user.id);

        if (userEmpresasError) {
          console.error('Error al obtener empresas del usuario:', userEmpresasError);
          setError('Error al verificar acceso');
          setIsChecking(false);
          return;
        }

        // Obtener las empresas relacionadas con el usuario actual
        const { data: relacionadas, error: relacionadasError } = await supabase
          .from('empresas_relacionadas')
          .select('empresa_relacionada_id')
          .eq('usuario_id', session.user.id);

        if (relacionadasError) {
          console.error('Error al obtener empresas relacionadas:', relacionadasError);
          setError('Error al verificar acceso');
          setIsChecking(false);
          return;
        }

        // Combinar las empresas permitidas
        const empresasIds = [
          ...new Set([
            ...(userEmpresas?.map((item: { empresa_id: number }) => item.empresa_id) || []),
            ...(relacionadas?.map((item: { empresa_relacionada_id: number }) => item.empresa_relacionada_id) || [])
          ])
        ];

        setEmpresasPermitidas(empresasIds);

        // Verificar si tiene acceso a la empresa específica
        if (empresaId && !empresasIds.includes(empresaId)) {
          setError('No tienes acceso a esta empresa');
          setHasAccess(false);
        } else {
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
  }, [session, role, empresaId]);

  if (isChecking) {
    return <Loading />;
  }

  if (!session?.user || role !== 'cliente') {
    return <>{children}</>;
  }

  // Si no tiene acceso, mostrar mensaje de error
  if (!hasAccess) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            {error || 'No tienes acceso a esta empresa.'}
            {empresasPermitidas.length > 0 && (
              <>
                <br />
                Empresas permitidas: {empresasPermitidas.join(', ')}
              </>
            )}
          </AlertDescription>
        </Alert>
        {empresasPermitidas.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Empresas a las que tienes acceso:</h3>
            <ul className="list-disc pl-5">
              {empresasPermitidas.map(empresaId => (
                <li key={empresaId}>
                  <button 
                    className="text-blue-600 hover:underline"
                    onClick={() => router.push(`/reportes/afilados-por-cliente?empresa_id=${empresaId}`)}
                  >
                    Ver reportes de esta empresa (ID: {empresaId})
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4">No tienes empresas asignadas. Contacta al administrador para solicitar acceso.</p>
        )}
        <div className="mt-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Si tiene acceso, renderizar los children
  return <>{children}</>;
}