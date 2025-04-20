'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function NewProtectedRoute({ children }: ProtectedRouteProps) {
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

        console.log(`NewProtectedRoute: Usuario autenticado con rol ${userRole}, permitiendo acceso`);
        setIsChecking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, user, session, userRole, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || isChecking) {
    return <Loading fullScreen />;
  }

  // Si llegamos aquí, el usuario está autenticado y tiene un rol válido
  return <>{children}</>;
}
