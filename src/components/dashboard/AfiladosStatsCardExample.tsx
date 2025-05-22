'use client';

import { useState, useEffect } from 'react';
import { AfiladosStatsCard } from './AfiladosStatsCard';

// Ejemplo de datos para mostrar en el componente
const datosEjemplo = [
  { mes: '2024-11', cantidad: 120 },
  { mes: '2024-12', cantidad: 180 },
  { mes: '2025-01', cantidad: 150 },
  { mes: '2025-02', cantidad: 220 },
  { mes: '2025-03', cantidad: 280 },
  { mes: '2025-04', cantidad: 350 },
];

export function AfiladosStatsCardExample() {
  const [totalAfilados, setTotalAfilados] = useState(2744);
  const [afiladosPorMes, setAfiladosPorMes] = useState(datosEjemplo);
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Ejemplo de Tarjeta de Estadísticas de Afilados</h2>
      <div className="max-w-md">
        <AfiladosStatsCard 
          totalAfilados={totalAfilados} 
          afiladosPorMes={afiladosPorMes} 
        />
      </div>
    </div>
  );
}
