// src/components/reportes/AfiladosPorSucursal.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import axios from '../../utils/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AfiladosPorSucursal = () => {
  const [periodo, setPeriodo] = useState('mes');

  const { data: reporteData, isLoading } = useQuery({
    queryKey: ['reporte-sucursales', periodo],
    queryFn: async () => {
      const response = await axios.get(`/reportes/afilados-sucursal?periodo=${periodo}`);
      return response.data;
    }
  });

  const handleExportar = async () => {
    try {
      const response = await axios.get(
        `/reportes/afilados-sucursal/exportar?periodo=${periodo}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `afilados-por-sucursal-${periodo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Afilados por Sucursal
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cantidad de afilados realizados en cada sucursal
          </p>
        </div>
        
        <div className="flex gap-4">
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
      ) : reporteData && reporteData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reporteData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="sucursal" 
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
              <Bar 
                dataKey="cantidad" 
                name="Cantidad de Afilados"
                fill="#6366F1"
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>No hay datos disponibles para el período seleccionado</p>
        </div>
      )}

      {reporteData && reporteData.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-2">Resumen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-dark-accent rounded-lg">
              <p className="text-sm text-gray-500">Total Afilados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {reporteData.reduce((sum, item) => sum + item.cantidad, 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-dark-accent rounded-lg">
              <p className="text-sm text-gray-500">Sucursal más activa</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {reporteData.reduce((max, item) => 
                  item.cantidad > max.cantidad ? item : max
                ).sucursal}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfiladosPorSucursal;