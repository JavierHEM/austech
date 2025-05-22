// src/lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}


export const supabase = createClient<Database>(
  supabaseUrl as string, 
  supabaseAnonKey as string, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'austech-auth-token',
      flowType: 'implicit',
      // Aumentar el tiempo de vida de la sesión
      storage: {
        getItem: (key) => {
          try {
            if (typeof window !== 'undefined') {
              const item = localStorage.getItem(key);
              return item;
            }
            return null;
          } catch (error) {
            console.error('Error al acceder a localStorage:', error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, value);
            }
          } catch (error) {
            console.error('Error al escribir en localStorage:', error);
          }
        },
        removeItem: (key) => {
          try {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(key);
            }
          } catch (error) {
            console.error('Error al eliminar de localStorage:', error);
          }
        }
      }
    },
    global: {
      headers: {
        'x-client-info': 'austech-sistema'
      }
    }
  }
);

export default supabase;