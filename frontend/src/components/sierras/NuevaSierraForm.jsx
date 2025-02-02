// src/components/sierras/NuevaSierraForm.jsx
import { useState } from 'react';
import { XCircle } from 'lucide-react';
import axios from '../../utils/axios';

const NuevaSierraForm = ({ codigo, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipoSierras, setTipoSierras] = useState([]);
  
  useState(() => {
    const cargarTiposSierra = async () => {
      try {
        const response = await axios.get('/tipos-sierra');
        setTipoSierras(response.data);
      } catch (error) {
        setError('Error al cargar tipos de sierra');
      }
    };
    cargarTiposSierra();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const data = {
      codigo,
      tipoSierraId: Number(formData.get('tipoSierraId')),
      sucursalId: 1 // Por ahora hardcodeado
    };

    try {
      const response = await axios.post('/sierras', data);
      onSuccess(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear sierra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-secondary rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">Nueva Sierra</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Código
            </label>
            <input
              type="text"
              value={codigo}
              disabled
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-accent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Tipo de Sierra
            </label>
            <select
              name="tipoSierraId"
              required
              className="w-full rounded-lg"
            >
              <option value="">Seleccione un tipo</option>
              {tipoSierras.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaSierraForm;