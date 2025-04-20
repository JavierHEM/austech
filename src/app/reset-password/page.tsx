'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface PasswordResetProps {
  userEmail: string;
  onClose: () => void;
}

export default function PasswordReset({ userEmail, onClose }: PasswordResetProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!userEmail) {
      setError('No se proporcionó un email válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Crear instancia de supabase
      const supabase = createClient();
      
      // Enviar email de restablecimiento de contraseña
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
    } catch (error: any) {
      console.error('Error al enviar correo de restablecimiento:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Restablecer Contraseña
      </h2>
      
      {success ? (
        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-md">
          <p className="text-green-700 dark:text-green-400">
            Se ha enviado un correo electrónico a <strong>{userEmail}</strong> con instrucciones para restablecer la contraseña.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md mb-4">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Se enviará un correo electrónico a <strong>{userEmail}</strong> con un enlace para restablecer la contraseña.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 sm:text-sm"
            >
              {loading ? 'Enviando...' : 'Enviar correo'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}