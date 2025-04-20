'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { signIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Limpiar cualquier timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);
  
  // Efecto para detectar si el contexto de autenticación está cargando por mucho tiempo
  useEffect(() => {
    // Si el contexto de autenticación está cargando por más de 10 segundos, mostrar un error
    if (authLoading) {
      loginTimeoutRef.current = setTimeout(() => {
        console.error('Tiempo de espera agotado para la autenticación');
        setError('El servidor está tardando demasiado en responder. Por favor, recarga la página e intenta nuevamente.');
        // Forzar el estado de carga a false
        setIsLoading(false);
      }, 10000); // 10 segundos de timeout
      
      return () => {
        if (loginTimeoutRef.current) {
          clearTimeout(loginTimeoutRef.current);
        }
      };
    }
  }, [authLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Establecer un timeout para evitar que el login se quede cargando indefinidamente
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
    }
    
    loginTimeoutRef.current = setTimeout(() => {
      console.error("LoginForm: Tiempo de espera agotado");
      setError("El inicio de sesión está tardando demasiado. Por favor, intenta nuevamente más tarde.");
      setIsLoading(false);
    }, 15000); // 15 segundos de timeout
    
    try {
      console.log("LoginForm: Iniciando proceso de login");
      
      // Verificar si hay datos vacíos
      if (!email || !password) {
        throw new Error("Por favor, ingresa tu email y contraseña");
      }
      
      // El AuthContext se encarga de la redirección y verificación de rol
      console.log("LoginForm: Llamando a signIn");
      const { error, data } = await signIn(email, password);
      console.log("LoginForm: Respuesta de signIn recibida", { error: !!error, data: !!data });
      
      // Limpiar el timeout ya que recibimos una respuesta
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
      
      if (error) {
        console.error("LoginForm: Error de autenticación:", error);
        
        // Mensajes de error más amigables
        if (error.message?.includes("Invalid login credentials")) {
          throw new Error("Credenciales inválidas. Por favor verifica tu email y contraseña.");
        } else if (error.message?.includes("Email not confirmed")) {
          throw new Error("Correo electrónico no confirmado. Por favor verifica tu bandeja de entrada.");
        } else if (error.message?.includes("network") || error.message?.includes("connection")) {
          throw new Error("Error de conexión. Verifica tu conexión a internet e intenta nuevamente.");
        } else {
          throw error;
        }
      }

      // Verificar si tenemos datos de usuario
      if (!data?.user || !data?.session) {
        console.error("LoginForm: Datos de usuario incompletos", data);
        throw new Error("No se pudo obtener la información del usuario");
      }

      console.log("LoginForm: Inicio de sesión exitoso", {
        userId: data.user.id,
        email: data.user.email
      });
      
      // No hacemos redirección aquí, el AuthContext se encarga de eso
      // basado en el rol del usuario
      
    } catch (error: any) {
      console.error("LoginForm: Error completo:", error);
      setError(error.message || "Error al iniciar sesión. Por favor intenta nuevamente.");
      // Asegurarse de que isLoading se establezca en false en caso de error
      setIsLoading(false);
      
      // Limpiar el timeout en caso de error
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
    } finally {
      // Este finally puede no ejecutarse si hay una redirección, así que también
      // establecemos isLoading en false en el bloque catch
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/10 p-4 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            {error.includes('tardando demasiado') && (
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Recargar página
              </button>
            )}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}