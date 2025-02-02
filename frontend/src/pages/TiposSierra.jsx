// frontend/src/pages/TiposSierra.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TipoSierraForm from '../components/tipos-sierra/TipoSierraForm';
import { getTiposSierra, deleteTipoSierra } from '../services/tipoSierra.service';

const TiposSierra = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedTipoSierra, setSelectedTipoSierra] = useState(null);
  const queryClient = useQueryClient();

  // Obtener tipos de sierra
  const { data: tiposSierra = [], isLoading } = useQuery({
    queryKey: ['tipos-sierra'],
    queryFn: getTiposSierra
  });

  // Eliminar tipo de sierra
  const deleteMutation = useMutation({
    mutationFn: deleteTipoSierra,
    onSuccess: () => {
      queryClient.invalidateQueries(['tipos-sierra']);
    }
  });

  const handleEdit = (tipoSierra) => {
    setSelectedTipoSierra(tipoSierra);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este tipo de sierra?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert('Error al eliminar el tipo de sierra');
        }
      }
    }
  };

  const canManage = user?.rol === 'GERENTE';

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Tipos de Sierra
        </h1>
        
        {canManage && (
          <button
            onClick={() => {
              setSelectedTipoSierra(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 
                     flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nuevo Tipo
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-gray-600 dark:text-dark-text">
          Cargando tipos de sierra...
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-secondary rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-accent">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Estado
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {tiposSierra.map((tipo) => (
                  <tr key={tipo.id} className="hover:bg-gray-50 dark:hover:bg-dark-accent">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text">
                      {tipo.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                      {tipo.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                      {tipo.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tipo.estado ? (
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
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(tipo)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200"
                          title="Editar tipo de sierra"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tipo.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                          title="Eliminar tipo de sierra"
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
        <TipoSierraForm
          tipoSierra={selectedTipoSierra}
          onClose={() => {
            setShowForm(false);
            setSelectedTipoSierra(null);
          }}
        />
      )}
    </div>
  );
};

export default TiposSierra;