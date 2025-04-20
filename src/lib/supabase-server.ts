'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// URL y clave pública desde las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function createServerSupabaseClient() {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing');
  }

  const cookieStore = cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Configurar cookies con mayor duración y mejor seguridad
          cookieStore.set({ 
            name, 
            value, 
            ...options,
            // Asegurar que las cookies persistan más tiempo (30 días)
            maxAge: options?.maxAge || 30 * 24 * 60 * 60,
            // Cookies disponibles en todo el sitio
            path: options?.path || '/',
          });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}