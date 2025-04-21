'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Definir los roles de usuario
export type UserRole = 'gerente' | 'administrador' | 'cliente' | null;

// Definir la interfaz para el contexto de autenticación
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: UserRole;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
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
  signOut: async () => {},
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
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  // Estado para la sesión y el usuario
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Función para obtener el rol del usuario
  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      console.log('Consultando rol para el usuario con ID:', userId);
      
      // Consultar el rol del usuario directamente de la tabla roles usando el auth.users
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol_id')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error al obtener el rol del usuario:', userError);
        return null;
      }
      
      if (!userData) {
        console.warn(`No se encontró información de rol para el usuario ${userId}`);
        return null;
      }
      
      // Mapear el ID del rol al nombre del rol
      const roleName = mapRoleIdToName(userData.rol_id);
      console.log(`Rol obtenido para el usuario ${userId}: ${roleName}`);
      
      return roleName;
    } catch (error) {
      console.error('Error en getUserRole:', error);
      return null;
    }
  };

  // Verificar la sesión al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        
        // Obtener la sesión actual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          return;
        }
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Obtener el rol del usuario
          const role = await getUserRole(currentSession.user.id);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, newSession: Session | null) => {
      console.log('Evento de autenticación:', event);
      
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
        
        // Obtener el rol del usuario
        const role = await getUserRole(newSession.user.id);
        setUserRole(role);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserRole(null);
        router.push('/login');
      }
    });
    
    // Limpiar la suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Iniciar sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Error al iniciar sesión:', error);
        toast({
          title: 'Error de inicio de sesión',
          description: error.message,
          variant: 'destructive',
        });
        
        return { 
          error, 
          data: { user: null, session: null } 
        };
      }
      
      console.log('Inicio de sesión exitoso para usuario:', data.user.id);
      setSession(data.session);
      setUser(data.user);
      
      try {
        // Obtener el rol del usuario
        const role = await getUserRole(data.user.id);
        setUserRole(role);
        
        if (role) {
          console.log(`Usuario con rol '${role}' autenticado correctamente`);
          router.push('/dashboard');
        } else {
          console.error('Usuario sin rol asignado');
          toast({
            title: 'Acceso denegado',
            description: 'No tienes un rol asignado en el sistema. Contacta al administrador.',
            variant: 'destructive',
          });
          
          // Cerrar sesión si no tiene rol asignado
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (roleError) {
        console.error('Error al obtener rol del usuario:', roleError);
        toast({
          title: 'Error al verificar permisos',
          description: 'Hubo un problema al verificar tu rol en el sistema. Intenta nuevamente.',
          variant: 'destructive',
        });
      }

      return { 
        error: null, 
        data: { 
          user: data.user, 
          session: data.session 
        } 
      };
    } catch (error: any) {
      console.error('Error inesperado en inicio de sesión:', error);
      toast({
        title: 'Error de conexión',
        description: 'Hubo un problema al conectar con el servidor. Verifica tu conexión e intenta nuevamente.',
        variant: 'destructive',
      });
      
      return { 
        error, 
        data: { user: null, session: null } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
        throw error;
      }
      
      // Limpiar el estado
      setSession(null);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
