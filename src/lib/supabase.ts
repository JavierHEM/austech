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
    console.log('Inicializando cliente de Supabase para dominio:', typeof window !== 'undefined' ? window.location.origin : 'servidor');
    
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
        // No usar cookies para evitar problemas de CORS
        detectSessionInUrl: true,
      },
      global: {
        // Implementar sistema de reintentos y manejo mejorado de errores para las solicitudes
        fetch: async (url, options) => {
          const MAX_RETRIES = 3;
          const RETRY_DELAY = 1000; // 1 segundo entre reintentos
          const TIMEOUT = 15000; // 15 segundos de timeout (aumentado de 10 a 15)
          
          // Función para esperar un tiempo determinado
          const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          
          // Función para realizar un intento de solicitud con timeout
          const attemptFetch = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
            
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                // No usar 'credentials: include' para evitar problemas de CORS
                // credentials: 'include', // Esto causa problemas de CORS con el comodín '*'
                // Asegurarse de que las solicitudes no se cacheen
                headers: {
                  ...options?.headers,
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'X-Client-Info': 'supabase-js/2.x (Vercel-Production)',
                },
              });
              clearTimeout(timeoutId);
              return response;
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          };
          
          // Intentar la solicitud con reintentos
          let lastError;
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
              if (attempt > 0) {
                console.log(`Reintentando solicitud a ${url} (intento ${attempt + 1}/${MAX_RETRIES})`);
                // Esperar antes de reintentar, con tiempo exponencial
                await wait(RETRY_DELAY * Math.pow(2, attempt - 1));
              }
              
              return await attemptFetch();
            } catch (error: any) {
              console.error(`Error en solicitud a ${url} (intento ${attempt + 1}/${MAX_RETRIES}):`, error);
              lastError = error;
              
              // Si no es un error de timeout o red, no reintentar
              if (!(error instanceof DOMException && error.name === 'AbortError') && 
                  !(error.message && error.message.includes('fetch'))) {
                throw error;
              }
            }
          }
          
          // Si llegamos aquí, todos los intentos fallaron
          console.error(`Todos los intentos de conexión a ${url} fallaron después de ${MAX_RETRIES} intentos`);
          throw new Error(`Failed to fetch after ${MAX_RETRIES} attempts: ${lastError?.message || 'Network error'}`);
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