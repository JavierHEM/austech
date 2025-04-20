'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserForm from '@/components/usuarios/UserForm';

export default function CrearUsuarioPage() {
  const router = useRouter();
  
  return (
    <ProtectedRoute rolesPermitidos={['gerente']}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Crear Nuevo Usuario
          </h1>
          
          <div className="mt-6">
            <UserForm />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}