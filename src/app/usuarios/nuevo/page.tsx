'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import NewUserForm from '@/components/usuarios/NewUserForm';

export default function NuevoUsuarioPage() {
  const { role, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Verificar autenticación y permisos
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Solo administradores y gerentes pueden crear usuarios
    if (!loading && isAuthenticated && role !== 'supervisor' && role !== 'gerente') {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, role, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Crear Nuevo Usuario</h1>
        <button
          onClick={() => router.push('/usuarios')}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Volver a la lista
        </button>
      </div>
      
      <NewUserForm />
    </div>
  );
}
