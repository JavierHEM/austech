'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';

/**
 * Componente que mantiene la sesión activa mediante peticiones periódicas
 * para evitar que la sesión expire por inactividad.
 */
export function SessionKeepAlive({ interval = 5 }: { interval?: number }) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Función para renovar la sesión
    const refreshSession = async () => {
      try {
        // Obtener la sesión actual
        const { data } = await supabase.auth.getSession();
        
        // Solo intentar refrescar si hay una sesión activa
        if (data?.session) {
          // Refrescar la sesión activamente
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('Error al refrescar la sesión:', error);
          }
        }
      } catch (err) {
        console.error('Error al verificar la sesión:', err);
      }
    };

    // Configurar el intervalo para renovar la sesión (en minutos)
    const intervalMinutes = interval * 60 * 1000;
    
    // Iniciar el intervalo
    intervalRef.current = setInterval(refreshSession, intervalMinutes);
    
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
