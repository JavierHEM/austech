'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartColumn } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AfiladosPorMes {
  mes: string; // Formato YYYY-MM
  cantidad: number;
}

interface AfiladosStatsCardProps {
  totalAfilados: number;
  afiladosPorMes: AfiladosPorMes[];
  className?: string;
}

export function AfiladosStatsCard({ 
  totalAfilados, 
  afiladosPorMes = [], 
  className = '' 
}: AfiladosStatsCardProps) {
  // Asegurarse de que tenemos datos para mostrar
  const datosValidos = Array.isArray(afiladosPorMes) && afiladosPorMes.length > 0;
  
  // Calcular el valor máximo para el eje Y
  const maxValue = datosValidos 
    ? Math.max(...afiladosPorMes.map(i => i.cantidad || 0)) 
    : 1000; // Valor predeterminado si no hay datos
  
  return (
    <Card className={`overflow-hidden ${className}`} data-component-name="_c">
      <CardHeader className="pb-2" data-component-name="_c2">
        <div className="flex justify-between items-center" data-component-name="ClientePage">
          <CardTitle className="text-lg">Afilados</CardTitle>
          <ChartColumn className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm text-muted-foreground" data-component-name="_c6">
          Historial de afilados realizados
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-3xl font-bold mb-2" data-component-name="ClientePage">
          {totalAfilados.toLocaleString()}
        </div>
        
        <div className="text-sm text-muted-foreground mb-4" data-component-name="ClientePage">
          Total de afilados registrados
        </div>
        
        {/* Gráfico de líneas mejorado con datos de afilados */}
        <div className="h-48 relative mt-4">
          {datosValidos ? (
            <>
              {/* Eje Y (izquierda) */}
              <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between">
                <div className="text-xs text-muted-foreground">
                  {maxValue}
                </div>
                <div className="text-xs text-muted-foreground">0</div>
              </div>
              
              {/* Contenedor principal del gráfico con líneas de cuadrícula */}
              <div className="absolute left-10 right-0 top-0 bottom-8 border-l border-b border-border">
                {/* Líneas de cuadrícula horizontales */}
                <div className="w-full h-1/4 border-t border-border/30" data-component-name="ClientePage"></div>
                <div className="w-full h-2/4 border-t border-border/30" data-component-name="ClientePage"></div>
                <div className="w-full h-3/4 border-t border-border/30" data-component-name="ClientePage"></div>
                
                {/* Línea del gráfico */}
                <svg 
                  className="w-full h-full" 
                  viewBox={`0 0 ${Math.max(afiladosPorMes.length - 1, 1)} 100`} 
                  preserveAspectRatio="none"
                  data-component-name="ClientePage"
                >
                  {afiladosPorMes.length > 1 && (() => {
                    // Calcular el valor máximo una sola vez para evitar cálculos repetidos
                    const maxValue = Math.max(...afiladosPorMes.map(i => i.cantidad || 0)) || 1;
                    
                    return (
                      <>
                        {/* Área bajo la línea */}
                        <path
                          d={`
                            M 0 ${100 - ((afiladosPorMes[0].cantidad / maxValue) * 100)}
                            ${afiladosPorMes.map((item, index) => {
                              const yValue = 100 - (((item.cantidad || 0) / maxValue) * 100);
                              return `L ${index} ${yValue}`;
                            }).join(' ')}
                            L ${afiladosPorMes.length - 1} 100
                            L 0 100
                            Z
                          `}
                          fill="hsl(var(--primary) / 0.1)"
                        />
                        
                        {/* Línea de tendencia */}
                        <polyline
                          points={afiladosPorMes.map((item, index) => {
                            const yValue = 100 - (((item.cantidad || 0) / maxValue) * 100);
                            return `${index} ${yValue}`;
                          }).join(' ')}
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Puntos en cada mes con etiquetas de valor */}
                        {afiladosPorMes.map((item, index) => {
                          const yValue = 100 - (((item.cantidad || 0) / maxValue) * 100);
                          const isCurrentMonth = new Date().getMonth() === new Date(item.mes).getMonth();
                          
                          return (
                            <g key={item.mes}>
                              <circle
                                cx={index}
                                cy={yValue}
                                r="4"
                                fill={isCurrentMonth ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.8)"}
                                stroke="hsl(var(--background))"
                                strokeWidth="1.5"
                              />
                              <text
                                x={index}
                                y={yValue - 8}
                                textAnchor="middle"
                                fill="hsl(var(--primary))"
                                fontSize="8"
                                fontWeight="bold"
                              >
                                {item.cantidad}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
              
              {/* Eje X (abajo) - Meses */}
              <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-between">
                {afiladosPorMes.map((item) => (
                  <div key={item.mes} className="text-xs font-medium text-muted-foreground">
                    {format(new Date(item.mes), 'MMM', { locale: es }).toLowerCase()}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Fallback si no hay datos
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
