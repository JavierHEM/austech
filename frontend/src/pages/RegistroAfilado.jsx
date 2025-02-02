// src/pages/RegistroAfilado.jsx
import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import SierraForm from '../components/sierras/SierraForm';
import ListaUltimosAfilados from '../components/historial/ListaUltimosAfilados';

const TIPOS_AFILADO = [
  { value: 'LOMO', label: 'Lomo' },
  { value: 'PECHO', label: 'Pecho' },
  { value: 'COMPLETO', label: 'Completo' }
];

const RegistroAfilado = () => {
  const { user } = useAuth();
  const inputRef = useRef(null);
  
  const [codigo, setCodigo] = useState('');
  const [sierraEncontrada, setSierraEncontrada] = useState(null);
  const [tipoAfilado, setTipoAfilado] = useState('LOMO');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');
  const [showNuevaSierra, setShowNuevaSierra] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    cargarHistorial();
    const interval = setInterval(cargarHistorial, 3000);
    return () => clearInterval(interval);
  }, []);

  const cargarHistorial = async () => {
    try {
      if (!user?.sucursalId && user?.rol !== 'GERENTE') {
        console.error('No hay sucursal seleccionada');
        return;
      }
  
      // Siempre usamos la ruta de sucursal, pero para GERENTE traemos de todas las sucursales
      const endpoint = `/historial/sucursal/${user?.rol === 'GERENTE' ? 'all' : user.sucursalId}`;
      
      console.log('Cargando historial desde:', endpoint);
      
      const response = await axios.get(endpoint);
      setHistorial(response.data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const buscarSierra = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;

    setLoading(true);
    setError('');
    setSierraEncontrada(null);

    try {
      const response = await axios.get(`/sierras/codigo/${codigo}`);
      setSierraEncontrada(response.data);
      setShowNuevaSierra(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Sierra no encontrada. ¿Desea registrarla?');
        setShowNuevaSierra(true);
      } else {
        setError('Error al buscar la sierra');
      }
    } finally {
      setLoading(false);
    }
  };

  const registrarAfilado = async () => {
    if (!sierraEncontrada) return;

    setLoading(true);
    try {
      await axios.post('/historial', {
        sierraId: sierraEncontrada.id,
        tipoAfilado,
        observaciones: 'Último afilado',
        esUltimoAfilado: true,
        sucursalId: user?.rol === 'GERENTE' ? sierraEncontrada.sucursalId : user.sucursalId
      });

      limpiarFormulario();
      cargarHistorial();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al registrar el afilado');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setCodigo('');
    setTipoAfilado('LOMO');
    setSierraEncontrada(null);
    setError('');
    setShowNuevaSierra(false);
    inputRef.current?.focus();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Registro de Afilado
        </h2>

        <form onSubmit={buscarSierra} className="mb-6">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 pl-10 rounded-lg bg-white dark:bg-dark-accent border-gray-300 dark:border-dark-border text-gray-900 dark:text-white"
              placeholder="Escanee o ingrese el código de la sierra..."
              disabled={loading}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </form>

        {error && (
          <div className="mt-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
            {showNuevaSierra && (
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={limpiarFormulario}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-accent"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowNuevaSierra(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Registrar Nueva Sierra
                </button>
              </div>
            )}
          </div>
        )}

        {sierraEncontrada && (
          <div className="mt-4 p-4 border dark:border-dark-border rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-lg mb-1 text-gray-900 dark:text-white">
                  {sierraEncontrada.codigo}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tipo: {sierraEncontrada.tipoSierra.nombre}
                </p>
                {user?.rol === 'GERENTE' && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Sucursal: {sierraEncontrada.sucursal.nombre}
                  </p>
                )}
                {sierraEncontrada.fechaUltimoAfilado && (
                  <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    Último afilado: {new Date(sierraEncontrada.fechaUltimoAfilado).toLocaleDateString()}
                  </p>
                )}
              </div>
              <CheckCircle className="text-green-500 w-6 h-6" />
            </div>

            {sierraEncontrada.fechaUltimoAfilado ? (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg">
                Esta sierra ya tiene registrado su último afilado y no puede ser afilada nuevamente
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Tipo de Afilado
                  </label>
                  <select
                    value={tipoAfilado}
                    onChange={(e) => setTipoAfilado(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-dark-accent border-gray-300 dark:border-dark-border text-gray-900 dark:text-white"
                  >
                    {TIPOS_AFILADO.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={registrarAfilado}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Registrando...' : 'Registrar Último Afilado'}
                  </button>
                  <button
                    onClick={limpiarFormulario}
                    disabled={loading}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-accent text-gray-700 dark:text-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <ListaUltimosAfilados registros={historial} />
      </div>

      {showNuevaSierra && (
        <SierraForm
          codigo={codigo}
          onSuccess={(sierra) => {
            setSierraEncontrada(sierra);
            setShowNuevaSierra(false);
            setError('');
          }}
          onClose={limpiarFormulario}
        />
      )}
    </div>
  );
};

export default RegistroAfilado;