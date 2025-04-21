// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Función para crear un cliente de Supabase para uso en rutas API
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  // En el servidor, podemos usar el Service Role Key para acciones administrativas
  if (supabaseServiceRoleKey) {
    return createClient<Database>(supabaseUrl as string, supabaseServiceRoleKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  // Si no tenemos Service Role Key, usamos el Anon Key
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  
  return createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}