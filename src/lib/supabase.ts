import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Credenciales hardcodeadas para evitar problemas con variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are not set in environment variables.');
}

// Variable para almacenar la instancia única del cliente
let supabaseClient: any = null;

export const createClient = () => {
  if (supabaseClient) return supabaseClient;
  
  try {
    console.log('Inicializando cliente de Supabase con URL:', supabaseUrl);
    
    // Crear un cliente simple sin opciones complejas
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey);
    
    console.log('Cliente de Supabase inicializado correctamente');
    return supabaseClient;
  } catch (error) {
    console.error('Error al inicializar el cliente de Supabase:', error);
    throw error;
  }
};