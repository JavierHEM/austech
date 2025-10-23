'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AfiladosPorMesData {
  name: string;
  cantidad: number;
  mes?: string;
  año?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface AfiladosTendenciaChartProps {
  data: AfiladosPorMesData[];
  promedio: number;
}

export function AfiladosTendenciaChart({ data, promedio }: AfiladosTendenciaChartProps) {
  // Verificar que hay datos
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Tendencia de Afilados por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
            No hay datos disponibles para mostrar la tendencia
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para el gráfico
  const chartData = data.map(item => ({
    mes: item.name,
    afilados: item.cantidad,
    promedio: promedio,
    trend: item.trend
  }));

  // Calcular tendencia general
  const tendenciaGeneral = data.length >= 2 
    ? (data[data.length - 1].cantidad > data[data.length - 2].cantidad ? 'up' : 
       data[data.length - 1].cantidad < data[data.length - 2].cantidad ? 'down' : 'stable')
    : 'stable';

  const getTendenciaIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTendenciaColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981'; // green-500
      case 'down': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Afilados: <span className="font-bold">{data.afilados.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Promedio: <span className="font-bold">{data.promedio.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {getTendenciaIcon(data.trend)}
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Tendencia: <span className="font-bold capitalize">{data.trend}</span>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">Tendencia de Afilados por Mes</span>
          <div className="flex items-center gap-2">
            {getTendenciaIcon(tendenciaGeneral)}
            <span className="text-sm text-muted-foreground">
              Promedio: {promedio.toLocaleString()}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="mes" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Línea principal de afilados */}
              <Line
                type="monotone"
                dataKey="afilados"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Afilados"
                animationDuration={0}
              />
              
              {/* Línea de promedio */}
              <Line
                type="monotone"
                dataKey="promedio"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Promedio"
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estadísticas adicionales */}
        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {Math.max(...data.map(d => d.cantidad)).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Máximo</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-600">
                {Math.min(...data.map(d => d.cantidad)).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Mínimo</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  const max = Math.max(...data.map(d => d.cantidad));
                  const min = Math.min(...data.map(d => d.cantidad));
                  return min > 0 ? ((max - min) / min * 100).toFixed(1) : '0';
                })()}%
              </div>
              <div className="text-xs text-muted-foreground">Variación</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
