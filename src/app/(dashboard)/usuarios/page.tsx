'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserFilters from '@/components/usuarios/UserFilters';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { supabase } from '@/lib/supabase-client';

// Definir interfaces para los tipos de datos
interface Role {
  id: number;
  nombre: string;
}

interface Empresa {
  id: number;
  razon_social: string;
}

interface Usuario {
  id: string;
  email: string;
  nombre_completo: string | null;
  rol_id: number | null;
  empresa_id: number | null;
  activo: boolean;
  roles?: Role | null;
  empresas?: Empresa | null;
}

// Adaptar la interfaz para coincidir con UserFilters
interface UserFiltersType {
  search: string;
  role: string | null;
  activo: boolean | null;
}

export default function UsuariosPage() {
  // Usar solo los valores disponibles en el contexto
  const { session, role } = useAuth();
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Estado para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<Usuario | null>(null);

  // Función para cargar usuarios con filtros adaptada a los filtros del componente UserFilters
  const fetchUsuarios = async (filters: UserFiltersType) => {
    try {
      setIsLoading(true);
      setError(null);
      // Iniciar la consulta base
      let query = supabase
        .from('usuarios')
        .select(`
          id,
          email,
          nombre_completo,
          rol_id,
          empresa_id,
          activo,
          roles (
            id, 
            nombre
          ),
          empresas (
            id,
            razon_social
          )
        `);
      
      // Aplicar filtros adaptados a la estructura del componente UserFilters
      if (filters.search) {
        query = query.or(`nombre_completo.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters.role) {
        query = query.eq('rol_id', filters.role);
      }
      
      if (filters.activo !== null) {
        query = query.eq('activo', filters.activo);
      }
      
      // Ordenar por nombre
      query = query.order('nombre_completo', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convertir explícitamente los datos al tipo Usuario[]
      const usuariosData: Usuario[] = data ? data.map((item: any) => ({
        id: item.id,
        email: item.email,
        nombre_completo: item.nombre_completo,
        rol_id: item.rol_id,
        empresa_id: item.empresa_id,
        activo: item.activo,
        roles: item.roles || null,
        empresas: item.empresas || null
      })) : [];
      
      setUsuarios(usuariosData);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar con filtros vacíos
  useEffect(() => {
    fetchUsuarios({
      search: '',
      role: null,
      activo: null
    });
  }, []);

  // Manejar cambios en los filtros
  const handleFilterChange = (filters: UserFiltersType) => {
    fetchUsuarios(filters);
  };

  // Función que muestra el modal de confirmación
  const handleToggleActivationClick = (usuario: Usuario) => {
    setUserToToggle(usuario);
    setShowConfirmModal(true);
  };

  // Función que realiza la activación/desactivación
  const handleToggleActivation = async () => {
    if (!userToToggle) return;
    
    try {
      console.log("Cambiando estado del usuario:", userToToggle.id);
      console.log("Estado actual:", userToToggle.activo);
      console.log("Nuevo estado:", !userToToggle.activo);
      
      // Obtener cliente de Supabase
      
      const { error, status } = await supabase
        .from('usuarios')
        .update({ 
          activo: !userToToggle.activo,
          modificado_en: new Date()
        })
        .eq('id', userToToggle.id);
      
      console.log("Respuesta:", { error, status });
      
      if (error) {
        console.error("Error al actualizar estado:", error);
        throw error;
      }
      
      console.log("Estado actualizado correctamente");
      
      // Actualizar la lista sin recargar la página
      setUsuarios(prevUsuarios => 
        prevUsuarios.map(u => 
          u.id === userToToggle.id ? { ...u, activo: !u.activo } : u
        )
      );
    } catch (error: any) {
      console.error('Error al cambiar estado del usuario:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setShowConfirmModal(false);
      setUserToToggle(null);
    }
  };

  return (
    <ProtectedRoute roles={['gerente']}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Gestión de Usuarios
            </h1>
            <Link
              href="/usuarios/crear"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Crear Usuario
            </Link>
          </div>
          
          {/* Componente de filtros */}
          <div className="mt-6">
            <UserFilters onFilterChange={handleFilterChange} />
          </div>
          
          <div className="mt-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md mt-4">
                <p className="text-red-700 dark:text-red-400">Error: {error}</p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col">
                <div className="-my-2 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Rol
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Empresa
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Estado
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Acciones</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                          {usuarios.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No hay usuarios para mostrar
                              </td>
                            </tr>
                          ) : (
                            usuarios.map((usuario) => (
                              <tr key={usuario.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {usuario.nombre_completo || 'Sin nombre'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {usuario.email}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {usuario.roles?.nombre || 'No asignado'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {usuario.empresas?.razon_social || 'No asignada'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    usuario.activo 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {usuario.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link
                                    href={`/usuarios/editar/${usuario.id}`}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                  >
                                    Editar
                                  </Link>
                                  <button
                                    onClick={() => handleToggleActivationClick(usuario)}
                                    className={`${
                                      usuario.activo 
                                        ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300' 
                                        : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                                    }`}
                                  >
                                    {usuario.activo ? 'Desactivar' : 'Activar'}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de confirmación */}
      {showConfirmModal && userToToggle && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={userToToggle.activo ? "Desactivar Usuario" : "Activar Usuario"}
          message={`¿Estás seguro de que deseas ${userToToggle.activo ? 'desactivar' : 'activar'} a ${userToToggle.nombre_completo || userToToggle.email}?`}
          confirmText={userToToggle.activo ? "Desactivar" : "Activar"}
          cancelText="Cancelar"
          onConfirm={handleToggleActivation}
          onCancel={() => {
            setShowConfirmModal(false);
            setUserToToggle(null);
          }}
          confirmButtonClass={userToToggle.activo 
            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
            : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
          }
        />
      )}
    </ProtectedRoute>
  );
}