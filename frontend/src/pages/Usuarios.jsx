// frontend/src/pages/Usuarios.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UsuarioForm from '../components/usuarios/UsuarioForm';
import { getUsuarios, deleteUsuario } from '../services/usuario.service';

const ROL_LABELS = {
  GERENTE: 'Gerente',
  JEFE_SUCURSAL: 'Jefe de Sucursal',
  OPERADOR: 'Operador'
};

const Usuarios = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const queryClient = useQueryClient();

  // Obtener usuarios
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios
  });

  // Eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
    }
  });

  const handleEdit = (usuario) => {
    setSelectedUsuario(usuario);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const canManageUsers = user?.rol === 'GERENTE' || user?.rol === 'JEFE_SUCURSAL';

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Usuarios
        </h1>
        
        {canManageUsers && (
          <button
            onClick={() => {
              setSelectedUsuario(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text">
          Cargando usuarios...
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-secondary rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-accent">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Sucursal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Estado
                  </th>
                  {canManageUsers && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-dark-accent">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                      {usuario.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                      {ROL_LABELS[usuario.rol]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                      {usuario.sucursal?.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usuario.estado ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Check className="w-4 h-4 mr-1" />
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <X className="w-4 h-4 mr-1" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    {canManageUsers && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200"
                          title="Editar usuario"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                          title="Desactivar usuario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <UsuarioForm
          usuario={selectedUsuario}
          onClose={() => {
            setShowForm(false);
            setSelectedUsuario(null);
          }}
        />
      )}
    </div>
  );
};

export default Usuarios;