// Este archivo debería eliminarse o refactorizarse para utilizar
// los clientes ya definidos en supabase.ts y supabase-server.ts

// Importar los clientes existentes en su lugar
import { createClient } from './supabase';

// Exportar un objeto que proporcione acceso controlado a los clientes
export const db = {
  client: createClient()
};

// Deprecation notice
console.warn('El archivo db.ts está obsoleto. Por favor utiliza directamente createClient de supabase.ts o createServerSupabaseClient de supabase-server.ts');