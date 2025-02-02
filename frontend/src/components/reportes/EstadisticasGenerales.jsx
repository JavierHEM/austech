// src/components/reportes/EstadisticasGenerales.jsx
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { 
  Wrench, 
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';
import axios from '../../utils/axios';

const EstadisticasGenerales = () => {
  // Configuraciones para el gráfico
  const COLORS = ['#6366F1', '#10B981', '#F59E0B'];

  // Consulta de datos
  const { data: stats, isLoading } = useQuery({
    queryKey: ['estadisticas-generales'],
    queryFn: async () => {
      const response = await axios.get('/reportes/estadisticas');
      return response.data;
    }
  });

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Afilados */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Afilados
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {stats?.totalAfilados?.toLocaleString() || 0}
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
                {stats?.sierrasActivas || 0}
              </h3>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pendientes
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {stats?.afiladosPendientes || 0}
              </h3>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Usuarios Activos */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Usuarios Activos
              </p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {stats?.usuariosActivos || 0}
              </h3>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y Listados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribución */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Distribución por Tipo
          </h3>
          {stats?.afiladosPorTipo?.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.afiladosPorTipo}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {stats.afiladosPorTipo.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Últimos Registros */}
        <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Últimos Registros
          </h3>
          <div className="space-y-4">
            {stats?.ultimosAfilados?.map((afilado) => (
              <div 
                key={afilado.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-accent rounded-lg"
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
                    <p className="text-sm text-gray-500">
                      {afilado.usuario.nombre}
                    </p>
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
            {(!stats?.ultimosAfilados || stats.ultimosAfilados.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No hay registros recientes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasGenerales;