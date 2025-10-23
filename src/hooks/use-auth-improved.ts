// src/hooks/use-auth-improved.ts
import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/components/auth/AuthProviderImproved';
import { supabase } from '@/lib/supabase-client';

export type UserRole = 'gerente' | 'administrador' | 'cliente' | null;

export function useAuthImproved() {
  const context = useContext(AuthContext);
  const router = useRouter();
  
  if (!context) {
    throw new Error('useAuthImproved debe ser usado dentro de AuthProviderImproved');
  }

  const { session, user, role, loading, signOut, userData, roleData, error } = context;

  // Funciones de conveniencia para verificar roles
  const isAdministrador = role === 'administrador';
  const isGerente = role === 'gerente';
  const isCliente = role === 'cliente';
  const isAuthorized = role === 'gerente' || role === 'administrador' || role === 'cliente';

  // Función para obtener información de diagnóstico
  const getDiagnosticInfo = () => ({
    hasSession: !!session,
    userId: user?.id || null,
    userEmail: user?.email || null,
    role,
    userData,
    roleData,
    error,
    loading
  });

  // Función de login que usa Supabase directamente
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ useAuthImproved - Error en signInWithPassword:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('❌ useAuthImproved - No se pudo iniciar sesión - sin usuario');
        throw new Error('No se pudo iniciar sesión');
      }

      // Redirigir según el rol después del login exitoso
      setTimeout(() => {
        if (data.user) {
          // Obtener el rol del usuario para redirigir correctamente
          supabase
            .from('usuarios')
            .select('rol_id')
            .eq('id', data.user.id)
            .single()
            .then(({ data: userData, error: userError }) => {
              if (!userError && userData?.rol_id) {
                supabase
                  .from('roles')
                  .select('nombre')
                  .eq('id', userData.rol_id)
                  .single()
                  .then(({ data: roleData, error: roleError }) => {
                    if (!roleError && roleData?.nombre) {
                      const userRole = roleData.nombre.toLowerCase();
                      
                      if (userRole === 'cliente') {
                        router.push('/cliente');
                      } else if (userRole === 'gerente' || userRole === 'supervisor') {
                        router.push('/dashboard');
                      } else {
                        router.push('/dashboard');
                      }
                    } else {
                      router.push('/dashboard');
                    }
                  });
              } else {
                router.push('/dashboard');
              }
            });
        } else {
          router.push('/dashboard');
        }
      }, 100); // Pequeño delay para asegurar que el estado se actualice
      
      return data;
    } catch (error: any) {
      console.error('❌ useAuthImproved - Error en login:', error);
      throw error;
    }
  };

  return {
    session,
    user,
    role,
    loading,
    login,
    logout: signOut, // Mapear signOut a logout para compatibilidad
    signOut,
    userData,
    roleData,
    error,
    // Funciones de conveniencia
    isAdministrador,
    isGerente,
    isCliente,
    isAuthorized,
    isAuthenticated: !!session?.user,
    // Función de diagnóstico
    getDiagnosticInfo
  };
}
