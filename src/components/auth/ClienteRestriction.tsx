'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import Loading from '@/components/ui/Loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ClienteRestrictionProps {
  children: ReactNode;
  empresaId?: string | null;
}

export default function ClienteRestriction({ 
  children, 
  empresaId 
}: ClienteRestrictionProps) {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [empresasPermitidas, setEmpresasPermitidas] = useState<number[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const checkClienteAccess = async () => {
      // Si no es cliente, tiene acceso completo
      if (userRole !== 'cliente') {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // Si es cliente pero no hay empresaId, verificar si tiene empresas asignadas
      if (!empresaId) {
        // Obtener las empresas vinculadas al usuario
        await fetchEmpresasPermitidas();
        setIsChecking(false);
        return;
      }

      // Si es cliente y hay empresaId, verificar si tiene acceso a esa empresa
      try {
        const { data, error } = await supabase
          .from('usuarios_empresas')
          .select('empresa_id')
          .eq('usuario_id', user?.id)
          .eq('empresa_id', empresaId);

        if (error) {
          console.error('Error al verificar acceso a empresa:', error);
          setHasAccess(false);
        } else {
          // Tiene acceso si hay al menos un registro que vincula al usuario con la empresa
          setHasAccess(data && data.length > 0);
        }

        // Obtener todas las empresas permitidas para mostrarlas en caso de acceso denegado
        await fetchEmpresasPermitidas();
      } catch (error) {
        console.error('Error en verificación de acceso:', error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    const fetchEmpresasPermitidas = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios_empresas')
          .select('empresa_id')
          .eq('usuario_id', user?.id);

        if (error) {
          console.error('Error al obtener empresas permitidas:', error);
          return;
        }

        // Extraer los IDs de las empresas permitidas
        const empresasIds = data?.map(item => item.empresa_id) || [];
        setEmpresasPermitidas(empresasIds);
      } catch (error) {
        console.error('Error al obtener empresas permitidas:', error);
      }
    };

    if (user) {
      checkClienteAccess();
    }
  }, [user, userRole, empresaId, supabase]);

  if (isChecking) {
    return <Loading />;
  }

  // Si no es cliente o tiene acceso a la empresa, mostrar el contenido
  if (hasAccess || userRole !== 'cliente') {
    return <>{children}</>;
  }

  // Si es cliente pero no tiene acceso a la empresa solicitada
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes acceso a esta empresa. Solo puedes ver información de las empresas vinculadas a tu cuenta.
        </AlertDescription>
      </Alert>
      
      {empresasPermitidas.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Empresas a las que tienes acceso:</h3>
          <ul className="list-disc pl-5">
            {empresasPermitidas.map(id => (
              <li key={id}>
                <button 
                  className="text-blue-600 hover:underline"
                  onClick={() => router.push(`/reportes/afilados-por-cliente?empresa_id=${id}`)}
                >
                  Ver reportes de esta empresa (ID: {id})
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
