// src/app/login/page.tsx
'use client';

import React from 'react';
import LoginForm from '@/components/auth/LoginForm'; // Vamos a crear este componente

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/logo-austech.png" 
            alt="Austech Logo" 
            className="w-120 h-40 object-contain"
          />
        </div>
        <h2 className="mt-0 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Gestión de Afilado de Sierras
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Ingrese sus credenciales para acceder al sistema
        </p>
      </div>

      <LoginForm />
    </div>
  );
}