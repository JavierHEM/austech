'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';

/**
 * Componente que mantiene la sesión activa mediante peticiones periódicas
 * para evitar que la sesión expire por inactividad.
 * 
 * Esta versión utiliza fetch silencioso para renovar tokens sin causar recargas de página.
 */
export function SessionKeepAlive({ interval = 30 }: { interval?: number }) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    // Función para renovar la sesión silenciosamente sin causar recargas
    const refreshSession = async () => {
      try {
        // Verificar si realmente necesitamos refrescar (evitar múltiples refrescos innecesarios)
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;
        
        // Si ha pasado menos de la mitad del intervalo, no refrescar
        // Esto evita refrescos duplicados que pueden ocurrir por cambios de rutas
        if (timeSinceLastRefresh < (interval * 60 * 1000) / 2) {
          // Reducimos los logs para evitar ruido en la consola
          // console.log('Sesión refrescada recientemente, saltando renovación');
          return;
        }
        
        // Obtener la sesión actual sin forzar recargas
        const { data } = await supabase.auth.getSession();
        
        // Solo intentar refrescar si hay una sesión activa
        if (data?.session) {
          // Usar una solicitud silenciosa para renovar el token sin afectar la UI
          const { error } = await supabase.auth.refreshSession({
            refresh_token: data.session.refresh_token,
          });
          
          if (error && process.env.NODE_ENV === 'development') {
            console.error('Error al refrescar la sesión:', error.message);
          }
        }
      } catch (err: any) {
        // Solo registrar errores en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.error('Error inesperado al refrescar la sesión:', err.message);
        }
      }
    };

    // Configurar el intervalo para renovar la sesión (en minutos)
    const intervalMilliseconds = interval * 60 * 1000;
    
    // Ejecutar una vez al inicio para verificar la sesión actual
    refreshSession();
    
    // Iniciar el intervalo con un intervalo más largo para reducir la carga
    intervalRef.current = setInterval(refreshSession, intervalMilliseconds);
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval]);

  // Este componente no renderiza nada visible
  return null;
}
