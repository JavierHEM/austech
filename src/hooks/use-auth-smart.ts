'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { useRedirectControl } from '@/components/auth/RedirectControl';

// Tipos para los roles de usuario
export type UserRole = 'gerente' | 'administrador' | 'cliente' | null;

// Cache para roles de usuario (evita consultas repetidas)
const userRoleCache = new Map<string, UserRole>();

export function useAuthSmart() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const isMounted = useRef(true);
  
  // Usar el control de redirección siempre (debe estar disponible)
  const redirectControl = useRedirectControl();
  const { shouldPreventRedirect, currentPath } = redirectControl;

  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      // Verificar primero si el rol ya está en caché
      if (userRoleCache.has(userId)) {
        return userRoleCache.get(userId) || null;
      }

      // Obtener el rol del usuario desde la base de datos
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('rol_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener rol del usuario:', error);
        return null;
      }

      if (!userData?.rol_id) {
        return null;
      }

      // Obtener el nombre del rol desde la tabla roles
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('nombre')
        .eq('id', userData.rol_id)
        .single();

      if (roleError) {
        console.error('Error al obtener nombre del rol:', roleError);
        return null;
      }

      // Convertir el nombre del rol a nuestro tipo
      let typedRole: UserRole = null;
      if (roleData?.nombre) {
        const roleName = roleData.nombre.toLowerCase();
        if (roleName === 'gerente') {
          typedRole = 'gerente';
        } else if (roleName === 'administrador') {
          typedRole = 'administrador';
        } else if (roleName === 'cliente') {
          typedRole = 'cliente';
        }
      }
      
      // Guardar el rol en caché para futuras consultas
      if (typedRole) {
        userRoleCache.set(userId, typedRole);
      }
      
      return typedRole;
    } catch (error) {
      console.error('Error al obtener rol del usuario:', error);
      return null;
    }
  };

  // Manejar redirecciones basadas en rol (con control inteligente)
  const handleRoleBasedRedirection = useCallback((userRole: UserRole, forceRedirect = false) => {
    if (isRedirecting) return; // Evitar redirecciones múltiples
    
    // Verificar si se debe prevenir la redirección
    if (!forceRedirect && shouldPreventRedirect(currentPath)) {
      console.log('Redirección prevenida para ruta protegida:', currentPath);
      return;
    }
    
    if (userRole === 'gerente' || userRole === 'administrador') {
      setIsRedirecting(true);
      router.push('/dashboard');
    } else if (userRole === 'cliente') {
      setIsRedirecting(true);
      router.push('/cliente');
    } else {
      // Si no hay un rol válido o es null, redirigir al login
      router.push('/login');
    }
  }, [router, isRedirecting, shouldPreventRedirect, currentPath]);

  useEffect(() => {
    // Marcar el componente como montado
    isMounted.current = true;

    // Función para obtener la sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (isMounted.current) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          
          if (initialSession?.user) {
            const userRole = await getUserRole(initialSession.user.id);
            if (isMounted.current) {
              setRole(userRole);
            }
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al obtener sesión inicial:', error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    // Función para manejar el focus (SOLO para renovar tokens, NO para redirecciones)
    const handleFocus = async () => {
      try {
        // Solo renovar el token si es necesario, sin causar redirecciones
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession && isMounted.current) {
          // Verificar si el token está próximo a expirar (últimos 5 minutos)
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = currentSession.expires_at || 0;
          const timeUntilExpiry = expiresAt - now;
          
          // Solo refrescar si el token expira en menos de 5 minutos
          if (timeUntilExpiry < 300) {
            await supabase.auth.refreshSession({
              refresh_token: currentSession.refresh_token,
            });
          }
        }
      } catch (error) {
        // Solo registrar errores en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.error('Error al refrescar sesión en focus:', error);
        }
      }
    };

    // Ejecutar la función inicial
    getInitialSession();

    // Suscribirse a cambios de autenticación (una sola vez)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
            console.log('🔄 Redirigiendo cliente a su dashboard específico');
            router.push('/cliente');
          } else {
            console.log('🔒 Evento SIGNED_IN detectado, pero redirección automática deshabilitada para rol:', userRole);
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
    };
  }, [router, handleRoleBasedRedirection]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar el caché de roles
      userRoleCache.clear();
      
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para forzar redirección (útil para botones de navegación)
  const forceRedirect = useCallback(() => {
    if (role) {
      handleRoleBasedRedirection(role, true);
    }
  }, [role, handleRoleBasedRedirection]);

  return {
    session,
    user,
    role,
    loading,
    login,
    signOut,
    isRedirecting,
    forceRedirect,
  };
}
