// src/components/reportes/AfiladosPorSierra.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import axios from '../../utils/axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AfiladosPorSierra = () => {
  const [periodo, setPeriodo] = useState('mes');
  const [busqueda, setBusqueda] = useState('');

  const { data: reporteData, isLoading } = useQuery({
    queryKey: ['reporte-sierras', periodo],
    queryFn: async () => {
      const response = await axios.get(`/reportes/afilados-sierra?periodo=${periodo}`);
      return response.data;
    }
  });

  const handleExportar = async () => {
    try {
      const response = await axios.get(
        `/reportes/afilados-sierra/exportar?periodo=${periodo}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `afilados-por-sierra-${periodo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  const datosFiltrados = reporteData?.filter(item => 
    item.sierra.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.tipo.toLowerCase().includes(busqueda.toLowerCase())
  ) || [];

  return (
    <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Afilados por Sierra
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Historial de afilados por cada sierra
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar sierra..."
              className="pl-9 pr-4 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
            />
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
          >
            <option value="mes">Último mes</option>
            <option value="trimestre">Último trimestre</option>
            <option value="año">Último año</option>
          </select>
          
          <button
            onClick={handleExportar}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : datosFiltrados.length > 0 ? (
        <>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosFiltrados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sierra" 
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis 
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #ccc'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  name="Cantidad de Afilados"
                  stroke="#6366F1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366F1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sierra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Afilados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Último Afilado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {datosFiltrados.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.sierra}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.tipo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.ultimoAfilado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>No se encontraron resultados</p>
        </div>
      )}
    </div>
  );
};

export default AfiladosPorSierra;