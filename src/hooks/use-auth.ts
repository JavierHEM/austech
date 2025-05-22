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
      
      // Normalizar el nombre del rol a minúsculas para comparación consistente
      const normalizedRoleName = roleName.toLowerCase().trim();
      console.log('Nombre de rol normalizado:', normalizedRoleName);
      
      // Verificar el rol usando el nombre normalizado
      if (normalizedRoleName === 'gerente') {
        typedRole = 'gerente';
      } else if (normalizedRoleName === 'administrador') {
        typedRole = 'administrador';
      } else if (normalizedRoleName === 'cliente') {
        typedRole = 'cliente';
      } else {
        // Si no coincide exactamente, intentar hacer una coincidencia parcial
        if (normalizedRoleName.includes('admin')) {
          typedRole = 'administrador';
        } else if (normalizedRoleName.includes('gerent')) {
          typedRole = 'gerente';
        } else if (normalizedRoleName.includes('client')) {
          typedRole = 'cliente';
        }
      }
      
      console.log('Rol detectado para', userData.email, ':', typedRole);
      
      // Guardar el rol en caché para futuras consultas
      if (typedRole) {
        userRoleCache.set(userId, typedRole);
      }
      
      return typedRole;
    } catch (error) {
      console.error('Error al obtener el rol del usuario:', error);
      return null;
    }
  };

  // Manejar redirecciones basadas en rol (solo cuando se solicita explícitamente)
  const handleRoleBasedRedirection = useCallback((userRole: UserRole) => {
    if (isRedirecting) return; // Evitar redirecciones múltiples
    
    console.log('Redirigiendo basado en rol:', userRole);
    
    if (userRole === 'gerente' || userRole === 'administrador') {
      setIsRedirecting(true);
      console.log('Redirigiendo a /dashboard');
      router.push('/dashboard');
    } else if (userRole === 'cliente') {
      setIsRedirecting(true);
      console.log('Redirigiendo a /cliente');
      router.push('/cliente');
    } else {
      // Si no hay un rol válido o es null, redirigir al login
      console.log('Rol no válido, redirigiendo a /login');
      router.push('/login');
    }
  }, [router, isRedirecting]);

  useEffect(() => {
    // Marcar el componente como montado
    isMounted.current = true;
    
    // Función para inicializar la sesión (se ejecuta solo una vez)
    const initSession = async () => {
      try {
        console.log('Inicializando sesión...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          if (isMounted.current) setLoading(false);
          return;
        }

        if (session) {
          console.log('Sesión encontrada para usuario:', session.user.email);
          if (isMounted.current) setSession(session);
          
          // Obtener el rol del usuario
          console.log('Obteniendo rol para usuario ID:', session.user.id);
          const userRole = await getUserRole(session.user.id);
          console.log('Rol obtenido:', userRole);
          if (isMounted.current) setRole(userRole);
        } else {
          console.log('No se encontró sesión activa');
        }
        
        if (isMounted.current) setLoading(false);
      } catch (error) {
        console.error('Error en initSession:', error);
        if (isMounted.current) setLoading(false);
      }
    };

    initSession();
    
    // Agregar un manejador de eventos para el enfoque de la ventana
    const handleFocus = async () => {
      // Cuando la ventana recupera el foco, verificar la sesión actual
      try {
        console.log('Verificando sesión al recuperar foco...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error al verificar la sesión en focus:', error);
          return;
        }
        
        // Si hay una sesión activa, actualizar el estado
        if (session && isMounted.current) {
          console.log('Sesión recuperada en focus para usuario:', session.user.email);
          setSession(session);
          
          // Siempre actualizar el rol para asegurar que esté disponible
          if (session.user) {
            console.log('Actualizando rol en focus para usuario ID:', session.user.id);
            const userRole = await getUserRole(session.user.id);
            console.log('Rol actualizado en focus:', userRole);
            if (isMounted.current) setRole(userRole);
          }
        } else {
          console.log('No se encontró sesión activa al recuperar foco');
        }
      } catch (error) {
        console.error('Error al verificar sesión en focus:', error);
      }
    };
    
    // Agregar event listeners para detectar cuando la ventana recupera el foco
    window.addEventListener('focus', handleFocus);
    
    // Crear una referencia a la función de manejo de visibilidad para poder eliminarla después
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

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
      
      // Eliminar los event listeners
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      console.log('Iniciando proceso de cierre de sesión...');
      setIsRedirecting(false);
      
      // Limpiar la caché de roles antes de cerrar sesión
      userRoleCache.clear();
      
      // Limpiar estado local primero
      setSession(null);
      setRole(null);
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión en Supabase:', error);
        throw error;
      }
      
      console.log('Sesión cerrada correctamente');
      
      // Forzar la redirección en lugar de esperar al listener
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
    isAuthorized: role === 'gerente' || role === 'administrador' || role === 'cliente'
  };
}
