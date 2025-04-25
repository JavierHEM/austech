'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AllowedRoles = 'gerente' | 'administrador' | 'cliente' | 'all';

interface RoleBasedAccessProps {
  children: ReactNode;
  allowedRoles: AllowedRoles[];
  redirectPath?: string;
}

export default function RoleBasedAccess({ 
  children, 
  allowedRoles,
  redirectPath
}: RoleBasedAccessProps) {
  const router = useRouter();
  const { session, role, loading } = useAuth();

  useEffect(() => {
    // Solo realizar redirecciones cuando la carga haya terminado
    if (loading) return;

    // Si no hay sesión, redirigir al login
    if (!session) {
      console.log('No hay sesión activa, redirigiendo a login');
      router.push('/login');
      return;
    }

    // Si el usuario está autenticado pero no tiene un rol permitido
    if (role && !allowedRoles.includes(role) && !allowedRoles.includes('all')) {
      console.log(`Usuario con rol ${role} no tiene acceso a esta sección. Roles permitidos:`, allowedRoles);
      
      // Redirigir según el rol
      if (role === 'cliente') {
        router.push(redirectPath || '/dashboardcliente');
      } else if (role === 'administrador' || role === 'gerente') {
        router.push(redirectPath || '/dashboard');
      }
    } else if (role) {
      console.log(`Acceso permitido para usuario con rol ${role}`);
    }
  }, [session, role, loading, allowedRoles, router, redirectPath]);

  // Mientras se carga, mostrar un skeleton
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-32 w-full max-w-2xl mb-4" />
        <Skeleton className="h-24 w-full max-w-2xl" />
      </div>
    );
  }

  // Si no hay sesión, mostrar un mensaje de carga mientras se redirige
  if (!session) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Sesión no detectada</AlertTitle>
          <AlertDescription>
            Redirigiendo a la página de inicio de sesión...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Si el usuario tiene un rol permitido, mostrar el contenido
  if (role && (allowedRoles.includes(role) || allowedRoles.includes('all'))) {
    return <>{children}</>;
  }

  // Si el usuario no tiene un rol permitido, mostrar mensaje de acceso denegado
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos para acceder a esta sección del sistema.
        </AlertDescription>
      </Alert>
      
      <div className="mt-6 flex justify-center">
        <Button
          onClick={() => {
            if (role === 'cliente') {
              router.push('/dashboardcliente');
            } else if (role === 'administrador' || role === 'gerente') {
              router.push('/dashboard');
            } else {
              router.push('/login');
            }
          }}
          variant="outline"
          className="mr-2"
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
