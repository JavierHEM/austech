'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Loading from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  roles = [],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { session, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push(redirectTo);
        return;
      }

      if (roles.length > 0 && role && !roles.includes(role)) {
        router.push('/acceso-denegado');
        return;
      }
    }
  }, [loading, session, role, roles, redirectTo, router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Renderizar los children solo si hay sesión y el usuario tiene el rol requerido (o no hay rol requerido)
  return <>{children}</>;
}
