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
  const router = useRouter();
  const { toast } = useToast();
  
  // Estado para la sesión y el usuario
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [sessionCheckAttempts, setSessionCheckAttempts] = useState(0);
  
  // Referencia para el timeout de verificación de sesión
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar si estamos en modo desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Modo de desarrollo local sin Supabase
  const devModeEnabled = isDevelopment && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Datos simulados para desarrollo local
  const mockUser = {
    id: 'dev-user-id',
    email: 'dev@example.com',
    user_metadata: {
      name: 'Usuario Desarrollo',
      role: 'administrador'
    }
  };
  
  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600
  };

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
    // Si estamos en modo desarrollo sin Supabase, usar datos simulados
    if (devModeEnabled) {
      console.log('Modo desarrollo sin Supabase: usando datos simulados');
      return 'administrador';
    }
    
    try {
      console.log('Consultando rol para el usuario con ID:', userId);
      console.log('Verificando cliente de Supabase:', supabase ? 'Cliente inicializado' : 'Cliente no inicializado');
      
      // Verificar si tenemos las variables de entorno necesarias
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log('NEXT_PUBLIC_SUPABASE_URL disponible:', !!supabaseUrl);
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY disponible:', !!supabaseKey);
      
      // Obtener el rol de la tabla usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select('rol_id')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error al obtener el rol del usuario:', JSON.stringify(error));
        // Si no hay datos, asignar un rol por defecto para desarrollo local
        if (isDevelopment) {
          console.log('Modo desarrollo: asignando rol de administrador por defecto');
          return 'administrador';
        }
        return null;
      }

      console.log('Datos de rol obtenidos:', data);
      return mapRoleIdToName(data?.rol_id);
    } catch (error) {
      console.error('Error al consultar el rol:', error);
      // Si estamos en desarrollo, asignar un rol por defecto
      if (isDevelopment) {
        console.log('Modo desarrollo: asignando rol de administrador por defecto');
        return 'administrador';
      }
      return null;
    }
  };

  // Efecto para verificar la sesión al cargar
  useEffect(() => {
    // Si estamos en modo desarrollo sin Supabase, usar datos simulados
    if (devModeEnabled) {
      console.log('Modo desarrollo sin Supabase: usando datos simulados');
      setUser(mockUser as any);
      setSession(mockSession as any);
      setUserRole('administrador');
      setIsLoading(false);
      return;
    }
    
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
        
        // En desarrollo, usar datos simulados si hay timeout
        if (isDevelopment) {
          console.log('Modo desarrollo: usando datos simulados debido a timeout');
          setUser(mockUser as any);
          setSession(mockSession as any);
          setUserRole('administrador');
        }
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
          
          // En desarrollo, usar datos simulados si hay error
          if (isDevelopment) {
            console.log('Modo desarrollo: usando datos simulados debido a error');
            setUser(mockUser as any);
            setSession(mockSession as any);
            setUserRole('administrador');
            setIsLoading(false);
            return;
          }
          
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
            console.error('Error al obtener el rol del usuario:', roleError);
            
            // En desarrollo, asignar rol por defecto si hay error
            if (isDevelopment) {
              console.log('Modo desarrollo: asignando rol de administrador por defecto');
              setUserRole('administrador');
            } else {
              setUserRole(null);
            }
          }
        } else {
          console.log('No hay sesión activa');
          
          // En desarrollo, usar datos simulados si no hay sesión
          if (isDevelopment) {
            console.log('Modo desarrollo: usando datos simulados para sesión no encontrada');
            setUser(mockUser as any);
            setSession(mockSession as any);
            setUserRole('administrador');
          } else {
            setSession(null);
            setUser(null);
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error);
      } finally {
        // Limpiar el timeout ya que hemos completado la verificación
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
          sessionTimeoutRef.current = null;
        }
        
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Limpiar el timeout al desmontar
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

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
    // Si estamos en modo desarrollo sin Supabase, simular cierre de sesión
    if (devModeEnabled) {
      console.log('Modo desarrollo sin Supabase: simulando cierre de sesión');
      setIsLoading(true);
      
      // Simular un retraso para que parezca real
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Limpiar el estado
      setSession(null);
      setUser(null);
      setUserRole(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
        
        // En desarrollo, forzar cierre de sesión incluso con error
        if (isDevelopment) {
          console.log('Modo desarrollo: forzando cierre de sesión a pesar del error');
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }
        
        throw error;
      }
      
      // Limpiar el estado
      setSession(null);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error en signOut:', error);
      
      // En desarrollo, forzar cierre de sesión incluso con error
      if (isDevelopment) {
        console.log('Modo desarrollo: forzando cierre de sesión a pesar del error');
        setSession(null);
        setUser(null);
        setUserRole(null);
      } else {
        throw error;
      }
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
