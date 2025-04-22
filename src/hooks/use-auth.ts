// src/hooks/use-auth.ts
import { useState, useEffect, useCallback, useRef } from 'react';
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

// Caché para almacenar roles de usuarios y evitar peticiones repetidas
const userRoleCache = new Map<string, UserRole>();

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  
  // Referencia para controlar si el componente está montado
  const isMounted = useRef(true);

  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      // Verificar primero si el rol ya está en caché
      if (userRoleCache.has(userId)) {
        // console.log('Usando rol en caché para usuario ID:', userId);
        return userRoleCache.get(userId) || null;
      }
      
      // console.log('Obteniendo rol para el usuario ID:', userId);
      
      // Primero intentamos obtener el usuario con su rol_id
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol_id, email, activo')
        .eq('id', userId)
        .single();

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

      // console.log('ID de rol del usuario:', userData.rol_id, 'Email:', userData.email);
      
      // Ahora obtenemos el nombre del rol desde la tabla roles
      
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('nombre, id')
        .eq('id', userData.rol_id)
        .single();
      
      // No imprimir respuestas completas para reducir ruido en la consola

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
      // console.log('Rol obtenido:', roleName, 'para usuario:', userData.email);

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

      // Guardar el rol en caché para futuras consultas
      if (typedRole) {
        userRoleCache.set(userId, typedRole);
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
      router.push('/dashboard');
    } else if (userRole === 'cliente') {
      setIsRedirecting(true);
      router.push('/cliente');
    }
  }, [router, isRedirecting]);

  useEffect(() => {
    // Marcar el componente como montado
    isMounted.current = true;
    
    // Función para inicializar la sesión (se ejecuta solo una vez)
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          if (isMounted.current) setLoading(false);
          return;
        }

        if (isMounted.current) setSession(session);

        if (session?.user) {
          const userRole = await getUserRole(session.user.id);
          // console.log('Rol obtenido para el usuario:', userRole);
          if (isMounted.current) setRole(userRole);
          
          // No redirigir automáticamente aquí, solo al hacer login explícito
        }
      } catch (error) {
        console.error('Error al inicializar sesión:', error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    initSession();

    // Suscribirse a cambios de autenticación (una sola vez)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('Auth event:', event, session?.user?.id);
      if (!isMounted.current) return;
      
      setSession(session);
      
      if (session?.user) {
        // Usar el rol en caché si está disponible, o obtenerlo si no
        let userRole: UserRole = null;
        
        if (userRoleCache.has(session.user.id)) {
          userRole = userRoleCache.get(session.user.id) || null;
          // console.log('Usando rol en caché:', userRole);
        } else {
          userRole = await getUserRole(session.user.id);
          // console.log('Rol actualizado:', userRole);
        }
        
        if (isMounted.current) setRole(userRole);
        
        // Solo redirigir en eventos específicos (SIGNED_IN)
        if (event === 'SIGNED_IN') {
          handleRoleBasedRedirection(userRole);
        }
      } else {
        if (isMounted.current) setRole(null);
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    });

    // Limpiar al desmontar
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [router, handleRoleBasedRedirection]);

  const login = async (email: string, password: string) => {
    try {
      setIsRedirecting(false); // Resetear estado de redirección
      
      // Primero intentamos obtener la sesión actual y cerrarla si existe
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session) {
        await supabase.auth.signOut();
      }
      
      // Luego intentamos iniciar sesión con las credenciales proporcionadas
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
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