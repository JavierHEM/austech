import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Variable para almacenar la instancia única del cliente
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export const createClient = () => {
  if (supabaseClient) return supabaseClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing');
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing');
  }
  
  if (!supabaseKey) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing');
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing');
  }
  
  console.log('Inicializando cliente de Supabase con URL:', supabaseUrl.substring(0, 20) + '...');
  
  try {
    // Configurar el cliente con persistencia de sesión mejorada y tiempos de espera reducidos
    supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        // Persistir la sesión en localStorage para mantenerla entre recargas
        persistSession: true,
        // Aumentar el tiempo de vida de la sesión (4 horas por defecto)
        autoRefreshToken: true,
        // Intentar recuperar la sesión al iniciar
        storageKey: 'austech-auth-token',
        // Reducir el tiempo de espera para las operaciones de autenticación
        flowType: 'implicit',
      },
      global: {
        // Reducir los tiempos de espera para las solicitudes
        fetch: (url, options) => {
          const timeout = 10000; // 10 segundos de timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
        },
      },
      realtime: {
        // Configuración para mejorar la estabilidad de las conexiones en tiempo real
        timeout: 10000, // 10 segundos
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    
    console.log('Cliente de Supabase inicializado correctamente');
    return supabaseClient;
  } catch (error) {
    console.error('Error al inicializar el cliente de Supabase:', error);
    throw error;
  }
};