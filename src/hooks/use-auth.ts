// src/hooks/use-auth.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export type UserRole = 'gerente' | 'supervisor' | 'cliente' | null;

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
      
      
      // Primero intentamos obtener el usuario con su rol_id
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol_id, email, activo')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ Error al obtener datos del usuario:', userError);
        
        // Si el error es que no se encontró el usuario, intentamos crearlo
        if (userError.code === 'PGRST116') { // Código para 'no se encontró ningún registro'
          console.warn('⚠️ Usuario no encontrado en tabla usuarios, código:', userError.code);
          
          // Obtener información del usuario desde auth
          const { data: authUser } = await supabase.auth.getUser(userId);
          
          if (authUser?.user) {
            // Aquí podrías implementar lógica para crear automáticamente el usuario
            // con un rol predeterminado si lo deseas
          }
        }
        
        return null;
      }
      
      if (!userData) {
        console.warn('⚠️ No se encontraron datos del usuario');
        return null;
      }
      
      if (userData.rol_id === null) {
        console.warn('⚠️ Usuario sin rol_id asignado');
        return null;
      }

      
      // Ahora obtenemos el nombre del rol desde la tabla roles
      
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('nombre, id')
        .eq('id', userData.rol_id)
        .single();
      
      // No imprimir respuestas completas para reducir ruido en la consola

      if (roleError) {
        // Error al obtener el rol
        return null;
      }
      
      if (!roleData || !roleData.nombre) {
        // No se encontró el nombre del rol
        return null;
      }

      // Convertir el nombre del rol a minúsculas para hacer la comparación insensible a mayúsculas
      const roleName = roleData.nombre.toLowerCase();
      // console.log('Rol obtenido:', roleName, 'para usuario:', userData.email);

      // Convertir el string a uno de los tipos permitidos en UserRole
      let typedRole: UserRole = null;
      
      // Normalizar el nombre del rol a minúsculas para comparación consistente
      const normalizedRoleName = roleName.toLowerCase().trim();

      
      // Verificar el rol usando el nombre normalizado
      if (normalizedRoleName === 'gerente') {
        typedRole = 'gerente';
      } else if (normalizedRoleName === 'supervisor') {
        typedRole = 'supervisor';
      } else if (normalizedRoleName === 'cliente') {
        typedRole = 'cliente';
      } else {
        // Si no coincide exactamente, intentar hacer una coincidencia parcial
        if (normalizedRoleName.includes('supervisor')) {
          typedRole = 'supervisor';
        } else if (normalizedRoleName.includes('gerent')) {
          typedRole = 'gerente';
        } else if (normalizedRoleName.includes('client')) {
          typedRole = 'cliente';
        }
      }
      

      
      // Guardar el rol en caché para futuras consultas
      if (typedRole) {
        userRoleCache.set(userId, typedRole);
      }
      
      return typedRole;
    } catch (error) {
      console.error('❌ Error en getUserRole:', error);
      return null;
    }
  };

  // Función de redirección inteligente: solo redirige clientes
  const handleRoleBasedRedirection = useCallback((userRole: UserRole) => {
    // Solo redirigir clientes automáticamente, otros roles permanecen donde están
    if (userRole === 'cliente') {
      router.push('/cliente');
    } else {
    }
  }, [router]);

  useEffect(() => {
    // Marcar el componente como montado
    isMounted.current = true;
    
    // Función para inicializar la sesión (se ejecuta solo una vez)
    const initSession = async () => {
      try {

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Error al obtener la sesión
          if (isMounted.current) setLoading(false);
          return;
        }

        if (session) {

          if (isMounted.current) setSession(session);
          
          // Obtener el rol del usuario

          const userRole = await getUserRole(session.user.id);

          if (isMounted.current) setRole(userRole);
        } else {

        }
        
        if (isMounted.current) setLoading(false);
      } catch (error) {
        // Error en initSession
        if (isMounted.current) setLoading(false);
      }
    };

    initSession();
    
    // EVENTOS DE FOCUS Y VISIBILITY ELIMINADOS
    // Estos eventos causaban redirecciones molestas cuando el usuario cambiaba de pestaña
    // La sesión se mantiene activa sin necesidad de verificar constantemente

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
        } else {
          userRole = await getUserRole(session.user.id);
        }
        
        if (isMounted.current) setRole(userRole);
        
        // Redirección inteligente: solo redirige clientes
        if (event === 'SIGNED_IN') {
          if (userRole === 'cliente') {
            router.push('/cliente');
          } else {
          }
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
      
      // Los event listeners de focus y visibility ya no existen
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
        console.error('❌ use-auth.ts - Error en signInWithPassword:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('❌ use-auth.ts - No se pudo iniciar sesión - sin usuario');
        throw new Error('No se pudo iniciar sesión');
      }

      const userRole = await getUserRole(data.user.id);
      setRole(userRole);
      
      // La redirección se maneja en el listener de onAuthStateChange
      
      return data;
    } catch (error: any) {
      console.error('❌ use-auth.ts - Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsRedirecting(false);
      
      // Limpiar la caché de roles antes de cerrar sesión
      userRoleCache.clear();
      
      // Limpiar estado local primero
      setSession(null);
      setRole(null);
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ use-auth.ts - Error al cerrar sesión en Supabase:', error);
        throw error;
      }
      
      // Forzar la redirección en lugar de esperar al listener
      router.push('/login');
    } catch (error) {
      console.error('❌ use-auth.ts - Error al cerrar sesión:', error);
      // Intentar redireccionar de todos modos
      router.push('/login');
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
    isAuthorized: role === 'gerente' || role === 'supervisor' || role === 'cliente'
  };
}
