// frontend/src/pages/Sucursales.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SucursalForm from '../components/sucursales/SucursalForm';
import { getSucursales, deleteSucursal } from '../services/sucursal.service';

const Sucursales = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const queryClient = useQueryClient();

  // Obtener sucursales
  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['sucursales'],
    queryFn: getSucursales
  });

  // Eliminar sucursal
  const deleteMutation = useMutation({
    mutationFn: deleteSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries(['sucursales']);
    }
  });

  const handleEdit = (sucursal) => {
    setSelectedSucursal(sucursal);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Header con botón de nueva sucursal */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sucursales</h1>
        
        {user?.rol === 'GERENTE' && (
          <button
            onClick={() => {
              setSelectedSucursal(null); // Asegura que no hay sucursal seleccionada
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 
                     flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nueva Sucursal
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-4 text-gray-600 dark:text-dark-text">
          Cargando sucursales...
        </div>
      ) : (
        /* Tabla de sucursales */
        <div className="bg-white dark:bg-dark-secondary rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gray-50 dark:bg-dark-accent">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                  Dirección
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                  Teléfono
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                  Estado
                </th>
                {user?.rol === 'GERENTE' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-border">
              {sucursales.map((sucursal) => (
                <tr key={sucursal.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-dark-text">
                    {sucursal.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-dark-text">
                    {sucursal.direccion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-dark-text">
                    {sucursal.telefono}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sucursal.estado ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Check className="w-4 h-4 mr-1" />
                        Activa
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <X className="w-4 h-4 mr-1" />
                        Inactiva
                      </span>
                    )}
                  </td>
                  {user?.rol === 'GERENTE' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(sucursal)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sucursal.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <SucursalForm
          sucursal={selectedSucursal}
          onClose={() => {
            setShowForm(false);
            setSelectedSucursal(null);
          }}
        />
      )}
    </div>
  );
};

export default Sucursales;