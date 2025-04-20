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
        console.log('Verificando sesión...');
        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          throw error;
        }

        console.log('Datos de sesión obtenidos:', data);
        
        if (data.session) {
          console.log('Sesión encontrada, actualizando estado');
          setSession(data.session);
          setUser(data.session.user);
          
          // Obtener el rol del usuario
          const role = await getUserRole(data.session.user.id);
          setUserRole(role);
          console.log('Rol del usuario:', role);
          
          // Programar renovación de token antes de que expire
          const expiresAt = data.session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt * 1000 - Date.now();
            const refreshTime = Math.max(expiresIn - 60000, 0); // Renovar 1 minuto antes de que expire
            console.log(`Programando renovación de token en ${refreshTime / 1000} segundos`);
            
            // Renovar token antes de que expire
            if (refreshTime > 0 && refreshTime < 3600000) { // Solo si expira en menos de 1 hora
              setTimeout(async () => {
                console.log('Renovando token de sesión...');
                const { error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) {
                  console.error('Error al renovar sesión:', refreshError);
                } else {
                  console.log('Token de sesión renovado exitosamente');
                }
              }, refreshTime);
            }
          }
        } else {
          console.log('No hay sesión activa');
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error);
        // Asegurarse de que los errores no bloqueen la aplicación
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        // Siempre establecer isLoading en false para evitar que se quede cargando indefinidamente
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
      
      // Validar entrada
      if (!email || !password) {
        console.error('Email o contraseña vacíos');
        return { 
          error: new Error('Email y contraseña son requeridos') as AuthError, 
          data: { user: null, session: null } 
        };
      }
      
      // Intentar inicio de sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error de autenticación:', error);
        setIsLoading(false); // Asegurarse de desactivar el estado de carga
        return { 
          error, 
          data: { user: null, session: null } 
        };
      }

      // Verificar que tenemos datos válidos
      if (!data || !data.session || !data.user) {
        console.error('Respuesta de autenticación inválida:', data);
        setIsLoading(false);
        return { 
          error: new Error('Respuesta de autenticación inválida') as AuthError, 
          data: { user: null, session: null } 
        };
      }

      // Actualizar el estado inmediatamente después del inicio de sesión exitoso
      console.log('Inicio de sesión exitoso para usuario:', data.user.id);
      setSession(data.session);
      setUser(data.user);
      
      try {
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
      } catch (roleError) {
        console.error('Error al obtener rol del usuario:', roleError);
        toast({
          title: 'Error al verificar permisos',
          description: 'Hubo un problema al verificar tu rol en el sistema. Intenta nuevamente.',
          variant: 'destructive'
        });
        // No cerramos sesión aquí para permitir reintentar
      }

      return { 
        error: null, 
        data: { 
          user: data.user, 
          session: data.session 
        } 
      };
    } catch (error) {
      console.error('Error inesperado en inicio de sesión:', error);
      toast({
        title: 'Error de conexión',
        description: 'Hubo un problema al conectar con el servidor. Verifica tu conexión e intenta nuevamente.',
        variant: 'destructive'
      });
      return { 
        error: error as AuthError, 
        data: { user: null, session: null } 
      };
    } finally {
      setIsLoading(false); // Siempre desactivar el estado de carga
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
