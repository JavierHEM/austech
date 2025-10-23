// src/components/auth/AuthProviderImproved.tsx
'use client';

import { createContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

// Definir el tipo para el contexto de autenticación
interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // Nuevos campos para diagnóstico
  userData: any | null;
  roleData: any | null;
  error: string | null;
}

// Crear el contexto con valores por defecto
export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
  userData: null,
  roleData: null,
  error: null,
});

// Proveedor de autenticación mejorado
export function AuthProviderImproved({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any | null>(null);
  const [roleData, setRoleData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      // Limpiar estado local primero
      setSession(null);
      setUser(null);
      setRole(null);
      setUserData(null);
      setRoleData(null);
      setError(null);
      
      // Limpiar caché local de Supabase
      try {
        await supabase.auth.getSession(); // Esto puede ayudar a limpiar el caché
      } catch (e) {
        // Ignorar errores de limpieza de caché
      }
      
      // Llamar a Supabase signOut
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError('Error al cerrar sesión');
        // Aún así redirigir
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        return;
      }
      
      // Redirigir usando window.location para forzar una recarga completa
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
    } catch (error) {
      setError('Error al cerrar sesión');
      // Aún así redirigir en caso de error
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  // Función mejorada para obtener el rol del usuario
  const getUserRole = async (userId: string): Promise<{ role: string | null, userData: any, roleData: any, error: string | null }> => {
    try {
      // Método 1: Intentar obtener rol directamente (método actual)
      const { data: directRoleData, error: directRoleError } = await supabase
        .from('usuarios')
        .select('rol_id')
        .eq('id', userId)
        .single();

      if (!directRoleError && directRoleData?.rol_id) {
        // Necesitamos obtener el nombre del rol desde la tabla roles
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('nombre')
          .eq('id', directRoleData.rol_id)
          .single();

        if (!roleError && roleData) {
          return {
            role: roleData.nombre.toLowerCase(),
            userData: directRoleData,
            roleData: roleData,
            error: null
          };
        }
      }

      // Método 2: Obtener rol_id y luego el nombre del rol (método alternativo)
      const { data: userWithRoleId, error: userError } = await supabase
        .from('usuarios')
        .select('rol_id, *')
        .eq('id', userId)
        .single();

      if (userError) {
        return {
          role: null,
          userData: null,
          roleData: null,
          error: `Error al obtener usuario: ${userError.message}`
        };
      }

      if (!userWithRoleId?.rol_id) {
        return {
          role: null,
          userData: userWithRoleId,
          roleData: null,
          error: 'Usuario sin rol asignado'
        };
      }

      // Obtener el nombre del rol
      const { data: roleInfo, error: roleError } = await supabase
        .from('roles')
        .select('nombre, *')
        .eq('id', userWithRoleId.rol_id)
        .single();

      if (roleError) {
        return {
          role: null,
          userData: userWithRoleId,
          roleData: null,
          error: `Error al obtener rol: ${roleError.message}`
        };
      }

      return {
        role: roleInfo?.nombre || null,
        userData: userWithRoleId,
        roleData: roleInfo,
        error: null
      };

    } catch (error) {
      return {
        role: null,
        userData: null,
        roleData: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  useEffect(() => {
    // Función para obtener la sesión actual
    const getSession = async () => {
      try {
        setError(null);
        
        // Obtener la sesión actual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(`Error al obtener sesión: ${error.message}`);
          setLoading(false);
          return;
        }
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Obtener rol del usuario usando el método mejorado
          if (currentSession.user) {
            const { role: userRole, userData: userInfo, roleData: roleInfo, error: roleError } = 
              await getUserRole(currentSession.user.id);
            
            setRole(userRole);
            setUserData(userInfo);
            setRoleData(roleInfo);
            setError(roleError);
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error general al verificar sesión');
      } finally {
        setLoading(false);
      }
    };

    // Ejecutar al montar el componente
    getSession();

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Manejar los diferentes eventos de autenticación
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Obtener rol del usuario
          if (newSession.user) {
            const { role: userRole, userData: userInfo, roleData: roleInfo, error: roleError } = 
              await getUserRole(newSession.user.id);
            
            setRole(userRole);
            setUserData(userInfo);
            setRoleData(roleInfo);
            setError(roleError);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
        setUserData(null);
        setRoleData(null);
        setError(null);
      } else if (event === 'USER_UPDATED') {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    });

    // Limpiar la suscripción al desmontar
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Proporcionar el contexto a los componentes hijos
  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      role, 
      loading, 
      signOut, 
      userData, 
      roleData, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
