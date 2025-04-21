'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Credenciales hardcodeadas para evitar problemas con variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are not set in environment variables.');
}

// Función para crear un cliente de Supabase para uso en rutas API
export function createClient() {
  console.log('Creando cliente de Supabase para servidor con URL:', supabaseUrl);
  return createSupabaseClient(supabaseUrl, supabaseKey);
}