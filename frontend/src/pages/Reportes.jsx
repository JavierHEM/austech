// src/pages/Reportes.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  Scissors, 
  Calendar,
  FileBarChart,
  Download,
  PieChart,
  BarChart3
} from 'lucide-react';
import axios from '../utils/axios';
import AfiladosPorSucursal from '../components/reportes/AfiladosPorSucursal';
import AfiladosPorSierra from '../components/reportes/AfiladosPorSierra';
import AfiladosPorFecha from '../components/reportes/AfiladosPorFecha';
import EstadisticasGenerales from '../components/reportes/EstadisticasGenerales';

const REPORTES = [
  {
    id: 'afilados-sucursal',
    title: 'Afilados por Sucursal',
    description: 'Visualiza la cantidad de afilados realizados en cada sucursal',
    icon: Building2,
    component: AfiladosPorSucursal
  },
  {
    id: 'afilados-sierra',
    title: 'Afilados por Sierra',
    description: 'Detalle de afilados realizados a cada sierra',
    icon: Scissors,
    component: AfiladosPorSierra
  },
  {
    id: 'afilados-fecha',
    title: 'Afilados por Fecha',
    description: 'Análisis de afilados por rango de fechas',
    icon: Calendar,
    component: AfiladosPorFecha
  },
  {
    id: 'estadisticas',
    title: 'Estadísticas Generales',
    description: 'Resumen general y tendencias',
    icon: BarChart3,
    component: EstadisticasGenerales
  }
];

const Reportes = () => {
  const [reporteActivo, setReporteActivo] = useState(REPORTES[0].id);

  const ReporteComponent = REPORTES.find(r => r.id === reporteActivo)?.component;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Reportes y Estadísticas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {REPORTES.map(reporte => (
          <button
            key={reporte.id}
            onClick={() => setReporteActivo(reporte.id)}
            className={`
              p-4 rounded-lg border transition-colors
              ${reporteActivo === reporte.id
                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/50 dark:border-indigo-700'
                : 'bg-white border-gray-200 dark:bg-dark-secondary dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-accent'
              }
            `}
          >
            <reporte.icon className={`
              w-8 h-8 mb-2
              ${reporteActivo === reporte.id
                ? 'text-indigo-500 dark:text-indigo-400'
                : 'text-gray-400 dark:text-gray-500'
              }
            `} />
            <h3 className="font-medium text-gray-900 dark:text-white">
              {reporte.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {reporte.description}
            </p>
          </button>
        ))}
      </div>

      {ReporteComponent && <ReporteComponent />}
    </div>
  );
};

export default Reportes;