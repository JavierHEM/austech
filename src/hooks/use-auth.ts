// src/hooks/use-auth.ts
import { useState, useEffect, useCallback } from 'react';
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

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
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

      console.log('ID de rol del usuario:', userData.rol_id, 'Email:', userData.email);
      
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

      // Convertir el nombre del rol a minúsculas para hacer la comparación insensible a mayúsculas
      const roleName = roleData.nombre.toLowerCase();
      console.log('Rol obtenido:', roleName, 'para usuario:', userData.email);

      // Convertir el string a uno de los tipos permitidos en UserRole
      let typedRole: UserRole = null;
      if (roleName === 'gerente' || roleName === 'administrador' || roleName === 'cliente') {
        typedRole = roleName;
      } else if (roleName.toLowerCase() === 'administrador') {
        typedRole = 'administrador';
      } else if (roleName.toLowerCase() === 'gerente') {
        typedRole = 'gerente';
      } else if (roleName.toLowerCase() === 'cliente') {
        typedRole = 'cliente';
      }

      return typedRole;
    } catch (error) {
      console.error('Error al obtener el rol:', error);
      return null;
    }
  };

  // Función para manejar la redirección basada en el rol
  const handleRoleBasedRedirection = useCallback((userRole: UserRole) => {
    if (isRedirecting) return; // Evitar múltiples redirecciones
    
    if (userRole === 'gerente' || userRole === 'administrador') {
      setIsRedirecting(true);
      console.log('Redirigiendo a /dashboard basado en rol:', userRole);
      router.push('/dashboard');
    } else if (userRole === 'cliente') {
      setIsRedirecting(true);
      console.log('Redirigiendo a /cliente basado en rol:', userRole);
      router.push('/cliente');
    }
  }, [router, isRedirecting]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          setLoading(false);
          return;
        }

        setSession(session);

        if (session?.user) {
          const userRole = await getUserRole(session.user.id);
          console.log('Rol obtenido para el usuario:', userRole);
          setRole(userRole);
          
          // No redirigir automáticamente aquí, solo al hacer login explícito
        }
      } catch (error) {
        console.error('Error al inicializar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        const userRole = await getUserRole(session.user.id);
        console.log('Rol actualizado:', userRole);
        setRole(userRole);
        
        // Solo redirigir en eventos específicos (SIGNED_IN)
        if (event === 'SIGNED_IN') {
          handleRoleBasedRedirection(userRole);
        }
      } else {
        setRole(null);
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, handleRoleBasedRedirection]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Intentando login con:', email);
      setIsRedirecting(false); // Resetear estado de redirección
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error de autenticación:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No se pudo iniciar sesión');
      }

      const userRole = await getUserRole(data.user.id);
      setRole(userRole);
      
      // La redirección se maneja en el listener de onAuthStateChange
      
      return data;
    } catch (error: any) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsRedirecting(false);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // La redirección se maneja en el listener de onAuthStateChange
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
    isAuthorized: role === 'gerente' || role === 'administrador' || role === 'cliente'
  };
}