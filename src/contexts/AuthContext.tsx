'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Definir los roles de usuario
export type UserRole = 'gerente' | 'administrador' | 'cliente' | null;

// Crear una instancia del cliente de Supabase
const supabase = createClient();

// Definir la interfaz para el contexto de autenticación
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: UserRole;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null;
    data: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<void>;
}

// Valor predeterminado para el contexto
const defaultContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  userRole: null,
  signIn: async () => ({ error: null, data: { user: null, session: null } }),
  signOut: async () => {}
};

// Crear el contexto
const AuthContext = createContext<AuthContextType>(defaultContext);

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Función para mapear IDs de roles a nombres
const mapRoleIdToName = (roleId: number): UserRole => {
  switch(roleId) {
    case 1: return 'gerente';
    case 2: return 'administrador';
    case 3: return 'cliente';
    default: return null;
  }
};

// Proveedor de autenticación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Función para obtener el rol del usuario
  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      console.log('Consultando rol para el usuario con ID:', userId);
      
      // Obtener el rol de la tabla usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select('rol_id')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error al obtener el rol del usuario:', error);
        return null;
      }

      console.log('Datos de rol obtenidos:', data);
      return mapRoleIdToName(data?.rol_id);
    } catch (error) {
      console.error('Error al consultar el rol:', error);
      return null;
    }
  };

  // Efecto para verificar la sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Obtener el rol del usuario
          const role = await getUserRole(data.session.user.id);
          setUserRole(role);
          console.log('Rol del usuario:', role);
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Configurar el listener para cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Cambio de estado de autenticación:', { event, newSession });
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Obtener el rol del usuario
          const role = await getUserRole(newSession.user.id);
          setUserRole(role);
          
          if (event === 'SIGNED_IN') {
            router.push('/dashboard');
          }
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
          
          if (event === 'SIGNED_OUT') {
            router.push('/login');
          }
        }
      }
    );

    // Verificar la sesión al cargar
    checkSession();

    // Limpiar el listener al desmontar
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Intentando iniciar sesión con email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error de autenticación:', error);
        return { 
          error, 
          data: { 
            user: null, 
            session: null 
          } 
        };
      }

      // Actualizar el estado inmediatamente después del inicio de sesión exitoso
      if (data.session && data.user) {
        console.log('Inicio de sesión exitoso para usuario:', data.user.id);
        setSession(data.session);
        setUser(data.user);
        
        // Obtener el rol del usuario
        const role = await getUserRole(data.user.id);
        setUserRole(role);
        console.log('Rol del usuario obtenido:', role);
        
        // Permitir acceso a usuarios con cualquier rol válido
        if (role) {
          console.log('Redirigiendo al dashboard...');
          router.push('/dashboard');
        } else {
          console.error('Usuario sin rol asignado');
          toast({
            title: 'Acceso denegado',
            description: 'No tienes un rol asignado en el sistema. Contacta al administrador.',
            variant: 'destructive'
          });
          // Cerrar sesión si no tiene rol asignado
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      }

      return { 
        error: null, 
        data: { 
          user: data.user, 
          session: data.session 
        } 
      };
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      return { 
        error: error as AuthError, 
        data: { 
          user: null, 
          session: null 
        } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    router.push('/login');
  };

  // Valor del contexto
  const value = {
    user,
    session,
    isLoading,
    userRole,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
