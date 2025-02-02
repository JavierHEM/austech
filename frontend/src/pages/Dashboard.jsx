// src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  Wrench,
  Users,
  Building2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get(`/dashboard${user?.rol === 'GERENTE' ? '' : `/sucursal/${user?.sucursalId}`}`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {user?.rol === 'GERENTE' && 'Panel de control general del sistema'}
          {user?.rol === 'JEFE_SUCURSAL' && `Panel de control de sucursal ${user?.sucursal?.nombre}`}
          {user?.rol === 'OPERADOR' && 'Panel de registro de afilados'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Afilados */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Afilados del Mes
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {dashboardData?.afiladosMes?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
              <Wrench className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Sierras Activas */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sierras Activas
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {dashboardData?.sierrasActivas || 0}
              </h3>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Últimos Afilados */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Últimos Afilados
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {dashboardData?.ultimosAfilados?.length || 0}
              </h3>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Alertas
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {dashboardData?.alertas || 0}
              </h3>
            </div>
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Afilados */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Tendencia de Afilados
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData?.tendenciaAfilados || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha"
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Afilados por Tipo */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Afilados por Tipo
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.afiladosPorTipo || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="tipo"
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Actividad Reciente
        </h3>
        <div className="space-y-4">
          {dashboardData?.ultimosAfilados?.map((afilado) => (
            <div 
              key={afilado.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-accent rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {afilado.sierra.codigo}
                </p>
                <div className="flex gap-2 mt-1">
                  <p className="text-sm text-gray-500">
                    {new Date(afilado.fecha).toLocaleDateString()}
                  </p>
                  <span className="text-sm text-gray-500">•</span>
                  <p className="text-sm text-gray-500">{afilado.usuario.nombre}</p>
                </div>
              </div>
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${afilado.tipoAfilado === 'LOMO' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : afilado.tipoAfilado === 'PECHO'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }
              `}>
                {afilado.tipoAfilado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;