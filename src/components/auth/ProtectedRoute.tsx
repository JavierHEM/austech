'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { user, session, isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si no está cargando para evitar redirecciones prematuras
    if (!isLoading) {
      // Si no hay sesión, redirigir al login
      if (!session) {
        console.log('No hay sesión, redirigiendo a /login');
        router.push('/login');
        return;
      }
      
      // Si hay roles requeridos y el usuario no tiene el rol adecuado
      if (requiredRoles.length > 0 && (!userRole || !requiredRoles.includes(userRole))) {
        console.log(`Usuario sin rol requerido (${userRole}), redirigiendo a /dashboard`);
        router.push('/dashboard');
        return;
      }
    }
  }, [isLoading, session, userRole, router, requiredRoles]);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return <Loading />;
  }

  // Renderizar los children solo si hay sesión y el usuario tiene el rol requerido (o no hay rol requerido)
  return <>{children}</>;
}
