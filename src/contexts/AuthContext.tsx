'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  authError: Error | null;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null;
    data: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<void>;
  resetAuthState: () => void;
}

// Valor predeterminado para el contexto
const defaultContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  userRole: null,
  authError: null,
  signIn: async () => ({ error: null, data: { user: null, session: null } }),
  signOut: async () => {},
  resetAuthState: () => {}
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
  const [authError, setAuthError] = useState<Error | null>(null);
  const [sessionCheckAttempts, setSessionCheckAttempts] = useState(0);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  // Función para reiniciar el estado de autenticación
  const resetAuthState = () => {
    setUser(null);
    setSession(null);
    setUserRole(null);
    setAuthError(null);
    setIsLoading(false);
    setSessionCheckAttempts(0);
    console.log('Estado de autenticación reiniciado');
  };

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
    // Limpiar cualquier timeout previo
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Establecer un timeout para la verificación de sesión
    sessionTimeoutRef.current = setTimeout(() => {
      if (isLoading && sessionCheckAttempts > 0) {
        console.error('Tiempo de espera agotado al verificar la sesión');
        setAuthError(new Error('Tiempo de espera agotado al verificar la sesión'));
        setIsLoading(false);
      }
    }, 8000); // 8 segundos de timeout
    
    const checkSession = async () => {
      try {
        // Incrementar el contador de intentos
        setSessionCheckAttempts(prev => prev + 1);
        console.log(`Verificando sesión... (intento ${sessionCheckAttempts + 1})`);
        
        // Limpiar errores anteriores
        setAuthError(null);
        
        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          setAuthError(error);
          throw error;
        }

        console.log('Datos de sesión obtenidos:', data);
        
        if (data.session) {
          console.log('Sesión encontrada, actualizando estado');
          setSession(data.session);
          setUser(data.session.user);
          
          try {
            // Obtener el rol del usuario
            const role = await getUserRole(data.session.user.id);
            setUserRole(role);
            console.log('Rol del usuario:', role);
          } catch (roleError) {
            console.error('Error al obtener rol del usuario:', roleError);
            // No bloqueamos la autenticación por un error en la obtención del rol
          }
          
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
          // Asegurarse de que el estado esté limpio
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (error: any) {
        console.error('Error al verificar la sesión:', error);
        // Guardar el error para mostrarlo en la UI
        setAuthError(error);
        // Asegurarse de que los errores no bloqueen la aplicación
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        // Siempre establecer isLoading en false para evitar que se quede cargando indefinidamente
        setIsLoading(false);
        // Limpiar el timeout
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
          sessionTimeoutRef.current = null;
        }
      }
    };
    
    // Solo verificar la sesión si estamos cargando
    if (isLoading) {
      checkSession();
    }
    
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [isLoading, sessionCheckAttempts]);

  // Configurar el listener para cambios de autenticación
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Cambio de estado de autenticación:', { event, newSession });
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Obtener el rol del usuario
          try {
            const role = await getUserRole(newSession.user.id);
            setUserRole(role);
            
            if (event === 'SIGNED_IN') {
              router.push('/dashboard');
            }
          } catch (error) {
            console.error('Error al obtener rol después de cambio de autenticación:', error);
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

    // Limpiar el listener al desmontar
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('Intentando iniciar sesión con email:', email);
      
      // Validar entrada
      if (!email || !password) {
        console.error('Email o contraseña vacíos');
        setIsLoading(false);
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
    } catch (error: any) {
      console.error('Error inesperado en inicio de sesión:', error);
      setAuthError(error);
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
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: 'Error al cerrar sesión',
        description: 'Hubo un problema al cerrar tu sesión. Intenta nuevamente.',
        variant: 'destructive'
      });
    }
  };

  // Valor del contexto
  const value = {
    user,
    session,
    isLoading,
    userRole,
    authError,
    signIn,
    signOut,
    resetAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
