// src/pages/Sierras.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SierraForm from '../components/sierras/SierraForm';
import { getSierras, deleteSierra, getSierrasBySucursal } from '../services/sierra.service';

const Sierras = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: sierras = [], isLoading } = useQuery({
    queryKey: ['sierras', user?.sucursalId],
    queryFn: () => user?.rol === 'GERENTE' ? getSierras() : getSierrasBySucursal(user?.sucursalId)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSierra,
    onSuccess: () => {
      queryClient.invalidateQueries(['sierras']);
    }
  });

  const sierrasFiltradas = sierras.filter(sierra => 
    sierra.codigo.toLowerCase().includes(search.toLowerCase()) ||
    sierra.tipoSierra.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro que desea eliminar esta sierra?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        alert(error.response?.data?.message || 'Error al eliminar la sierra');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Sierras</h1>
        {user?.rol === 'GERENTE' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Sierra
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o tipo..."
            className="w-full px-4 py-2 pl-10 rounded-lg"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Cargando sierras...</div>
      ) : (
        <div className="bg-white dark:bg-dark-secondary rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gray-50 dark:bg-dark-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase">
                  Tipo
                </th>
                {user?.rol === 'GERENTE' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase">
                    Sucursal
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase">
                  Último Afilado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {sierrasFiltradas.map((sierra) => (
                <tr key={sierra.id} className="hover:bg-gray-50 dark:hover:bg-dark-accent">
                  <td className="px-6 py-4 whitespace-nowrap">{sierra.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sierra.tipoSierra.nombre}</td>
                  {user?.rol === 'GERENTE' && (
                    <td className="px-6 py-4 whitespace-nowrap">{sierra.sucursal.nombre}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sierra.fechaUltimoAfilado ? 
                      new Date(sierra.fechaUltimoAfilado).toLocaleDateString() : 
                      'Sin afilados'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${sierra.estado 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {sierra.estado ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(sierra.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <SierraForm
          onSuccess={() => {
            queryClient.invalidateQueries(['sierras']);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Sierras;