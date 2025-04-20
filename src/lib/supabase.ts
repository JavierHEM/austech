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
  
  supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseKey);
  
  return supabaseClient;
};