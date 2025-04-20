'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        setLoading(true);
        setError(null);

        // Verificar las variables de entorno
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          setError('Variables de entorno de Supabase no definidas');
          setSupabaseInfo({
            supabaseUrl: supabaseUrl ? 'Definido' : 'No definido',
            supabaseKey: supabaseKey ? 'Definido' : 'No definido',
          });
          return;
        }

        // Intentar crear un cliente de Supabase y hacer una solicitud
        const supabase = createClient();
        const start = Date.now();
        const { data, error } = await supabase.from('usuarios').select('count').limit(1);
        const end = Date.now();

        if (error) {
          setError(`Error al conectar con Supabase: ${error.message}`);
          setSupabaseInfo({
            supabaseUrl: supabaseUrl.substring(0, 10) + '...',
            supabaseKeyLength: supabaseKey.length,
            error
          });
        } else {
          setSupabaseInfo({
            success: true,
            responseTime: `${end - start}ms`,
            data,
            supabaseUrl: supabaseUrl.substring(0, 10) + '...',
            supabaseKeyLength: supabaseKey.length,
          });
        }
      } catch (err: any) {
        setError(`Error inesperado: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    checkSupabaseConnection();
  }, []);

  const checkApiEndpoint = async () => {
    try {
      setApiLoading(true);
      const response = await fetch('/api/debug-supabase');
      const data = await response.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: `Error al llamar al API: ${err.message}` });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Diagnóstico de Supabase</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Conexión desde el cliente</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Verificando conexión...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md mb-4">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              {supabaseInfo && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    NEXT_PUBLIC_SUPABASE_URL: {supabaseInfo.supabaseUrl}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseInfo.supabaseKeyLength ? `${supabaseInfo.supabaseKeyLength} caracteres` : 'No definido'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-md mb-4">
              <p className="text-green-700 dark:text-green-400">Conexión exitosa con Supabase</p>
              {supabaseInfo && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tiempo de respuesta: {supabaseInfo.responseTime}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    NEXT_PUBLIC_SUPABASE_URL: {supabaseInfo.supabaseUrl}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseInfo.supabaseKeyLength ? `${supabaseInfo.supabaseKeyLength} caracteres` : 'No definido'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Conexión desde el servidor</h2>
          
          <button
            onClick={checkApiEndpoint}
            disabled={apiLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 mb-4"
          >
            {apiLoading ? 'Verificando...' : 'Verificar conexión desde el servidor'}
          </button>
          
          {apiLoading ? (
            <div className="flex items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Verificando...</span>
            </div>
          ) : apiResponse ? (
            <div className={`p-4 rounded-md ${apiResponse.success ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
              <pre className="text-sm overflow-auto p-2 bg-gray-100 dark:bg-gray-700 rounded">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Solución de problemas</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">1. Verificar variables de entorno en Vercel</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Asegúrate de que las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén correctamente configuradas en tu proyecto de Vercel.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">2. Verificar configuración de CORS en Supabase</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Verifica que tu proyecto de Supabase tenga configurado el dominio de tu aplicación en Vercel en la configuración de CORS.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">3. Reiniciar el despliegue en Vercel</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                A veces, reiniciar el despliegue en Vercel puede resolver problemas de conexión.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">4. Verificar el estado de Supabase</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Verifica si hay algún problema con el servicio de Supabase en su página de estado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
