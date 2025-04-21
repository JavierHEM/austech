// src/hooks/use-auth.ts
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export type UserRole = 'gerente' | 'administrador' | 'cliente' | null;

type RoleData = {
  id: number;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
  modificado_en: string | null;
};

type UserWithRole = {
  roles: RoleData;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      console.log('Obteniendo rol para el usuario ID:', userId);
      
      // Verificar si el usuario existe en la tabla usuarios
      console.log('Consultando tabla usuarios con ID:', userId);
      
      // Primero intentamos obtener el usuario con su rol_id
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol_id, email, activo')
        .eq('id', userId)
        .single();
      
      // Imprimir la respuesta completa para depuración
      console.log('Respuesta de consulta a usuarios:', { userData, userError });

      if (userError) {
        console.error('Error al obtener el usuario:', userError);
        
        // Si el error es que no se encontró el usuario, intentamos crearlo
        if (userError.code === 'PGRST116') { // Código para 'no se encontró ningún registro'
          console.log('Usuario no encontrado en la tabla usuarios. Se debe crear un registro.');
          
          // Obtener información del usuario desde auth
          const { data: authUser } = await supabase.auth.getUser(userId);
          
          if (authUser?.user) {
            console.log('Información del usuario desde auth:', authUser.user);
            // Aquí podrías implementar lógica para crear automáticamente el usuario
            // con un rol predeterminado si lo deseas
          }
        }
        
        return null;
      }
      
      if (!userData) {
        console.error('No se encontraron datos del usuario:', userId);
        return null;
      }
      
      if (userData.rol_id === null) {
        console.error('Usuario sin rol_id asignado:', userId, 'Email:', userData.email);
        return null;
      }

      console.log('ID de rol del usuario:', userData.rol_id, 'Email:', userData.email); // Log para depuración
      
      // Ahora obtenemos el nombre del rol desde la tabla roles
      console.log('Consultando tabla roles con ID:', userData.rol_id);
      
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('nombre, id')
        .eq('id', userData.rol_id)
        .single();
      
      // Imprimir la respuesta completa para depuración
      console.log('Respuesta de consulta a roles:', { roleData, roleError });

      if (roleError) {
        console.error('Error al obtener el rol:', roleError);
        return null;
      }
      
      if (!roleData || !roleData.nombre) {
        console.error('No se encontró el nombre del rol para rol_id:', userData.rol_id);
        return null;
      }

      const roleName = roleData.nombre.toLowerCase();
      console.log('Rol obtenido:', roleName, 'para usuario:', userData.email);

      return roleName as UserRole;
    } catch (error) {
      console.error('Error al obtener el rol:', error);
      return null;
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          return;
        }

        setSession(session);

        if (session?.user) {
          const userRole = await getUserRole(session.user.id);
          setRole(userRole);
          if (userRole === 'gerente' || userRole === 'administrador') {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error al inicializar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session);
      setSession(session);
      
      if (session?.user) {
        const userRole = await getUserRole(session.user.id);
        setRole(userRole);
        if (userRole === 'gerente' || userRole === 'administrador') {
          router.push('/dashboard');
        }
      } else {
        setRole(null);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Intentando login con:', { email, password: '********' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error de autenticación detallado:', error);
        
        // Verificar si es un error de red o de Supabase
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Error de conexión. Verifica tu conexión a internet.');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
        } else {
          throw error;
        }
      }
      
      if (!data.user) {
        throw new Error('No se pudo iniciar sesión');
      }

      const userRole = await getUserRole(data.user.id);
      if (userRole !== 'gerente' && userRole !== 'administrador') {
        await supabase.auth.signOut();
        throw new Error('No tienes acceso al sistema');
      }

      return data;
    } catch (error: any) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  return {
    session,
    role,
    loading,
    login,
    logout,
    isAuthenticated: !!session?.user,
    isAuthorized: role === 'gerente' || role === 'administrador'
  };
}