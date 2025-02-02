// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png'; // Importa tu logo

const Login = () => {
  const navigate = useNavigate();
  const { signin } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      await signin(formData.get('email'), formData.get('password'));
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-primary">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-dark-secondary p-8 rounded-lg shadow">
        <div className="flex flex-col items-center">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-20 w-auto mb-6" // Ajusta el tamaño según necesites
          />
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Sistema de Afilado
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Inicie sesión para continuar
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-dark-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-dark-accent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;