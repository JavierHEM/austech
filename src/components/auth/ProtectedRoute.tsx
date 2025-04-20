'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  rolesPermitidos?: string[];
}

export default function NewProtectedRoute({ children, rolesPermitidos = [] }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, session, isLoading, userRole } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Solo verificar cuando isLoading sea false
    if (!isLoading) {
      console.log('NewProtectedRoute: Verificando acceso', {
        user,
        session,
        userRole
      });

      // Dar un pequeño tiempo para asegurar que los datos estén disponibles
      const timer = setTimeout(() => {
        // Verificar si el usuario está autenticado
        if (!session || !user) {
          console.log('NewProtectedRoute: Usuario no autenticado, redirigiendo a login');
          router.replace('/login');
          return;
        }

        // Verificar si el usuario tiene un rol válido
        if (!userRole) {
          console.log('NewProtectedRoute: Usuario sin rol válido, redirigiendo a login');
          router.replace('/login');
          return;
        }

        // Verificar si el rol del usuario está en la lista de roles permitidos
        if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(userRole)) {
          console.log(`NewProtectedRoute: Usuario con rol ${userRole} no tiene permiso para acceder a esta página`);
          router.replace('/dashboard');
          return;
        }

        console.log(`NewProtectedRoute: Usuario autenticado con rol ${userRole}, permitiendo acceso`);
        setIsChecking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, user, session, userRole, router, rolesPermitidos]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || isChecking) {
    return <Loading fullScreen />;
  }

  // Si llegamos aquí, el usuario está autenticado y tiene un rol válido
  return <>{children}</>;
}
