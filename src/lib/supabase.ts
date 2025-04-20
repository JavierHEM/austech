import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Variable para almacenar la instancia única del cliente
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export const createClient = () => {
  if (supabaseClient) return supabaseClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing');
  }
  
  if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing');
  }
  
  // Configurar el cliente con persistencia de sesión mejorada
  supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      // Persistir la sesión en localStorage para mantenerla entre recargas
      persistSession: true,
      // Aumentar el tiempo de vida de la sesión (4 horas por defecto)
      autoRefreshToken: true,
      // Intentar recuperar la sesión al iniciar
      storageKey: 'austech-auth-token',
    },
  });
  
  return supabaseClient;
};