// src/components/sierras/SierraForm.jsx
import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';

const SierraForm = ({ codigo = '', onSuccess, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tiposSierra, setTiposSierra] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [tiposResponse, sucursalesResponse] = await Promise.all([
        axios.get('/tipos-sierra'),
        user?.rol === 'GERENTE' ? axios.get('/sucursales') : null
      ]);

      setTiposSierra(tiposResponse.data);
      if (sucursalesResponse) {
        setSucursales(sucursalesResponse.data);
      }
    } catch (error) {
      setError('Error al cargar datos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const sierraData = {
      codigo: codigo || formData.get('codigo'),
      tipoSierraId: Number(formData.get('tipoSierraId')),
      sucursalId: user?.rol === 'GERENTE' 
        ? Number(formData.get('sucursalId'))
        : user.sucursalId
    };

    try {
      const response = await axios.post('/sierras', sierraData);
      onSuccess?.(response.data);
      onClose?.();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear la sierra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-secondary rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {codigo ? 'Nueva Sierra' : 'Registrar Sierra'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Código */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código
            </label>
            {codigo ? (
              <input
                type="text"
                value={codigo}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-accent border-gray-300 dark:border-dark-border text-gray-900 dark:text-white"
              />
            ) : (
              <input
                type="text"
                name="codigo"
                required
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-accent border-gray-300 dark:border-dark-border text-gray-900 dark:text-white"
                placeholder="Ingrese el código"
              />
            )}
          </div>

          {/* Tipo de Sierra */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Sierra
            </label>
            <select
              name="tipoSierraId"
              required
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-accent border-gray-300 dark:border-dark-border text-gray-900 dark:text-white"
            >
              <option value="">Seleccione un tipo</option>
              {tiposSierra.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sucursal (solo para GERENTE) */}
          {user?.rol === 'GERENTE' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sucursal
              </label>
              <select
                name="sucursalId"
                required
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-dark-accent border-gray-300 dark:border-dark-border text-gray-900 dark:text-white"
              >
                <option value="">Seleccione una sucursal</option>
                {sucursales.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-accent"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Verificar si el código existe
    const verificacion = await axios.get(`/sierras/verificar-codigo/${codigo}`);
    if (verificacion.data.disponible === false) {
      setError('El código ya está registrado');
      setLoading(false);
      return;
    }

    // Si el código está disponible, continuar con el registro
    const formData = new FormData(e.target);
    const data = {
      codigo,
      tipoSierraId: Number(formData.get('tipoSierraId')),
      sucursalId: user?.rol === 'GERENTE' 
        ? Number(formData.get('sucursalId'))
        : user.sucursalId
    };

    const response = await axios.post('/sierras', data);
    onSuccess?.(response.data);
    onClose?.();
  } catch (error) {
    setError(error.response?.data?.message || 'Error al crear la sierra');
  } finally {
    setLoading(false);
  }
};

export default SierraForm;