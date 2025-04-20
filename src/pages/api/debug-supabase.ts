import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Desactivar caché para esta respuesta
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    // Obtener las variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Verificar si las variables de entorno están definidas
    if (!supabaseUrl) {
      return res.status(500).json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL no está definido',
        environmentVariables: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Definido' : 'No definido',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'Definido' : 'No definido'
        }
      });
    }

    if (!supabaseKey) {
      return res.status(500).json({ 
        error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY no está definido',
        environmentVariables: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Definido' : 'No definido',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'Definido' : 'No definido'
        }
      });
    }

    // Intentar crear un cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Intentar hacer una solicitud simple a Supabase
    const start = Date.now();
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);
    const end = Date.now();

    if (error) {
      return res.status(500).json({
        error: 'Error al conectar con Supabase',
        details: error,
        supabaseUrl: supabaseUrl.substring(0, 10) + '...',
        supabaseKeyLength: supabaseKey.length,
        environmentVariables: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Definido' : 'No definido',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'Definido' : 'No definido'
        }
      });
    }

    // Si llegamos aquí, la conexión fue exitosa
    return res.status(200).json({
      success: true,
      message: 'Conexión exitosa con Supabase',
      responseTime: `${end - start}ms`,
      data,
      supabaseUrl: supabaseUrl.substring(0, 10) + '...',
      supabaseKeyLength: supabaseKey.length,
      environmentVariables: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Definido' : 'No definido',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'Definido' : 'No definido'
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Error inesperado',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
