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
      // Solo redirigir si no hay sesión
      if (!session) {
        router.push(redirectTo);
        return;
      }

      // Restricción especial para usuarios con rol 'cliente'
      if (role === 'cliente') {
        // Si el cliente intenta acceder al dashboard principal, redirigirlo a su dashboard específico
        if (pathname === '/dashboard') {
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
          router.push('/cliente');
          return;
        }
      }

      // Restricción especial para usuarios con rol 'supervisor'
      if (role === 'supervisor') {
        // Lista de rutas restringidas para supervisores (solo gestión de usuarios)
        const rutasRestringidasParaSupervisores = [
          '/usuarios'
        ];
        
        // Verificar si la ruta actual está restringida para supervisores
        const esRutaRestringida = rutasRestringidasParaSupervisores.some(ruta => 
          pathname === ruta || pathname.startsWith(`${ruta}/`)
        );
        
        if (esRutaRestringida) {
          router.push('/acceso-denegado');
          return;
        }
      }

      if (roles.length > 0 && role) {
        // Convertir tanto el rol del usuario como los roles permitidos a minúsculas
        // para hacer la comparación insensible a mayúsculas/minúsculas
        const userRoleLower = role.toLowerCase();
        const rolesLower = roles.map(r => r.toLowerCase());
        
        if (!rolesLower.includes(userRoleLower)) {
          router.push('/acceso-denegado');
          return;
        }
      }
    }
  }, [loading, session, role, roles, redirectTo, router]);

  // Si está cargando, mostrar el componente de carga
  if (loading) {
    return <Loading fullScreen={false} />;
  }
  
  // Si no hay sesión, mostrar un mensaje mientras se redirecciona
  if (!session) {
    return <Loading fullScreen={false} />;
  }

  // Renderizar los children solo si hay sesión y el usuario tiene el rol requerido
  return <>{children}</>;
}