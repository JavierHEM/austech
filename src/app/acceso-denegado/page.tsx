'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import SVGWrapper from '@/components/SVGWrapper';

export default function AccesoDenegadoPage() {
  const router = useRouter();
  const { session } = useAuth();
  
  // Determinar a dónde redirigir según el rol
  const handleRedirect = () => {
    // Redirigir al dashboard correspondiente
    router.push('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <SVGWrapper className="w-8 h-8 text-red-600" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </SVGWrapper>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
        
        <p className="text-gray-600 mb-6">
          No tienes los permisos necesarios para acceder a esta sección del sistema.
        </p>
        
        <button 
          onClick={handleRedirect}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}