// src/components/reportes/AfiladosPorFecha.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import axios from '../../utils/axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AfiladosPorFecha = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [agrupacion, setAgrupacion] = useState('dia'); // dia, semana, mes

  const { data: reporteData, isLoading } = useQuery({
    queryKey: ['reporte-fechas', fechaInicio, fechaFin, agrupacion],
    queryFn: async () => {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        agrupacion
      });
      const response = await axios.get(`/reportes/afilados-fecha?${params}`);
      return response.data;
    },
    enabled: Boolean(fechaInicio && fechaFin)
  });

  const handleExportar = async () => {
    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        agrupacion
      });
      const response = await axios.get(
        `/reportes/afilados-fecha/exportar?${params}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `afilados-por-fecha.xlsx`);
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
            Afilados por Fecha
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Distribución de afilados a lo largo del tiempo
          </p>
        </div>
        
        <div className="flex gap-4">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
          />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
          />
          <select
            value={agrupacion}
            onChange={(e) => setAgrupacion(e.target.value)}
            className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
          >
            <option value="dia">Por día</option>
            <option value="semana">Por semana</option>
            <option value="mes">Por mes</option>
          </select>
          <button
            onClick={handleExportar}
            disabled={!fechaInicio || !fechaFin}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {!fechaInicio || !fechaFin ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>Selecciona un rango de fechas para ver el reporte</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : reporteData && reporteData.length > 0 ? (
        <>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reporteData}>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #ccc'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cantidad"
                  name="Cantidad de Afilados"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de Afilados
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {reporteData.reduce((sum, item) => sum + item.cantidad, 0)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Promedio Diario
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(reporteData.reduce((sum, item) => sum + item.cantidad, 0) / reporteData.length)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Día más Activo
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {reporteData.reduce((max, item) => 
                  item.cantidad > max.cantidad ? item : max
                ).fecha}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>No hay datos disponibles para el rango seleccionado</p>
        </div>
      )}
    </div>
  );
};

export default AfiladosPorFecha;