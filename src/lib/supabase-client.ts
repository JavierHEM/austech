// src/lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Inicializando Supabase con URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length);

export const supabase = createClient<Database>(
  supabaseUrl as string, 
  supabaseAnonKey as string, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'austech-auth-token',
      flowType: 'implicit'
    },
    global: {
      headers: {
        'x-client-info': 'austech-sistema'
      }
    }
  }
);

export default supabase;