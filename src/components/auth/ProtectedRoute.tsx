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
  // Obtener la ruta actual del navegador
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const { session, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Agregar logs para depuración
      console.log('ProtectedRoute - Current role:', role);
      console.log('ProtectedRoute - Allowed roles:', roles);
      console.log('ProtectedRoute - Current pathname:', pathname);
      
      if (!session) {
        console.log('ProtectedRoute - No session, redirecting to', redirectTo);
        router.push(redirectTo);
        return;
      }

      // Restricción especial para usuarios con rol 'cliente'
      if (role === 'cliente') {
        // Si el cliente intenta acceder al dashboard principal, redirigirlo a su dashboard específico
        if (pathname === '/dashboard') {
          console.log('ProtectedRoute - Cliente trying to access main dashboard, redirecting to /cliente');
          router.push('/cliente');
          return;
        }
        
        // Lista de rutas restringidas para clientes
        const rutasRestringidasParaClientes = [
          '/empresas',
          '/usuarios',
          '/tipos-sierra',
          '/tipos-afilado',
          '/bajas-masivas',
          '/salidas-masivas'
        ];
        
        // Verificar si la ruta actual está restringida para clientes
        const esRutaRestringida = rutasRestringidasParaClientes.some(ruta => 
          pathname === ruta || pathname.startsWith(`${ruta}/`)
        );
        
        if (esRutaRestringida) {
          console.log('ProtectedRoute - Cliente trying to access restricted route, redirecting to /cliente');
          router.push('/cliente');
          return;
        }
      }

      if (roles.length > 0 && role) {
        // Convertir tanto el rol del usuario como los roles permitidos a minúsculas
        // para hacer la comparación insensible a mayúsculas/minúsculas
        const userRoleLower = role.toLowerCase();
        const rolesLower = roles.map(r => r.toLowerCase());
        
        console.log('ProtectedRoute - Comparing lowercase:', userRoleLower, 'against', rolesLower);
        
        if (!rolesLower.includes(userRoleLower)) {
          console.log('ProtectedRoute - Role not allowed, redirecting to acceso-denegado');
          router.push('/acceso-denegado');
          return;
        }
      }
    }
  }, [loading, session, role, roles, redirectTo, router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Renderizar los children solo si hay sesión y el usuario tiene el rol requerido (o no hay rol requerido)
  return <>{children}</>;
}