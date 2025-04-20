'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserForm from '@/components/usuarios/UserForm';
import PasswordReset from '@/components/usuarios/PasswordReset';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Definimos la interfaz para los parámetros de la página
interface PageParams {
  params: {
    id: string;
  };
}

export default function EditarUsuarioPage({ params }: PageParams) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;
  const [userEmail, setUserEmail] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  
  // Verificar que el usuario existe al cargar la página
  useEffect(() => {
    const checkUserExists = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        console.log('Verificando usuario con ID:', id);
        
        // Intentar consultar por ID sin convertir (podría ser UUID o número)
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, email')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error de Supabase al verificar usuario:', error);
          throw error;
        }
        
        if (data) {
          console.log('Usuario encontrado:', data);
          setUserExists(true);
          setUserEmail(data.email || '');
        } else {
          console.error('Usuario no encontrado con ID:', id);
          toast({
            title: 'Error',
            description: 'Usuario no encontrado',
            variant: 'destructive'
          });
          router.push('/usuarios');
        }
      } catch (error: any) {
        console.error('Error al verificar usuario:', error);
        toast({
          title: 'Error',
          description: `No se pudo verificar el usuario: ${error.message || 'Error desconocido'}`,
          variant: 'destructive'
        });
        router.push('/usuarios');
      } finally {
        setLoading(false);
      }
    };
    
    checkUserExists();
  }, [id, router, toast]);
  
  // Función para mostrar el modal de restablecimiento de contraseña
  const handleShowPasswordReset = () => {
    setShowPasswordReset(true);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Editar Usuario
            </h1>
            <button
              type="button"
              onClick={handleShowPasswordReset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Restablecer Contraseña
            </button>
          </div>
          
          {userExists && (
            <div className="mt-6">
              <UserForm
                userId={id}
                isEditing={true}
              />
            </div>
          )}
          
          {showPasswordReset && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
                <PasswordReset 
                  userEmail={userEmail} 
                  onClose={() => setShowPasswordReset(false)} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}