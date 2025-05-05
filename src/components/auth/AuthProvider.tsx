// src/components/auth/AuthProvider.tsx
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
}

// Crear el contexto con valores por defecto
export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

// Proveedor de autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    // Función para obtener la sesión actual
    const getSession = async () => {
      try {
        console.log('Verificando sesión de usuario...');
        
        // Obtener la sesión actual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener sesión:', error.message);
          setLoading(false);
          return;
        }
        
        if (currentSession) {
          console.log('Sesión encontrada, actualizando estado...');
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Obtener rol del usuario desde la base de datos
          if (currentSession.user) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('rol')
                .eq('id', currentSession.user.id)
                .single();
                
              if (userError) {
                console.error('Error al obtener rol del usuario:', userError.message);
              } else if (userData) {
                console.log('Rol del usuario:', userData.rol);
                setRole(userData.rol);
              }
            } catch (roleError) {
              console.error('Error al consultar rol:', roleError);
            }
          }
        } else {
          console.log('No hay sesión activa');
        }
      } catch (error) {
        console.error('Error general al verificar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    // Ejecutar al montar el componente
    getSession();

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Evento de autenticación:', event);
      
      // Manejar los diferentes eventos de autenticación
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession) {
          console.log('Usuario autenticado o token renovado');
          setSession(newSession);
          setUser(newSession.user);
          
          // Obtener rol del usuario
          if (newSession.user) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('rol')
                .eq('id', newSession.user.id)
                .single();
                
              if (userError) {
                console.error('Error al obtener rol del usuario:', userError.message);
              } else if (userData) {
                console.log('Rol del usuario actualizado:', userData.rol);
                setRole(userData.rol);
              }
            } catch (roleError) {
              console.error('Error al consultar rol:', roleError);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Usuario cerró sesión');
        setSession(null);
        setUser(null);
        setRole(null);
      } else if (event === 'USER_UPDATED') {
        console.log('Información de usuario actualizada');
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
    <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
