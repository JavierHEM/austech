'use client';

import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FilterX } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AfiladoFilters } from '@/types/afilado';
import { getTiposAfilado } from '@/services/tipoAfiladoService';

interface AfiladoFiltersProps {
  onFilterChange: (filters: AfiladoFilters) => void;
}

export default function AfiladoFiltersComponent({ onFilterChange }: AfiladoFiltersProps) {
  const [tiposAfilado, setTiposAfilado] = useState<any[]>([]);
  const [filters, setFilters] = useState<AfiladoFilters>({
    sierra_id: null,
    tipo_afilado_id: null,
    fecha_desde: null,
    fecha_hasta: null
  });
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined);
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined);

  // Cargar datos para los filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const tiposData = await getTiposAfilado();
        setTiposAfilado(tiposData);
      } catch (error) {
        console.error('Error al cargar datos para filtros:', error);
      }
    };
    
    loadFilterData();
  }, []);

  // Actualizar filtros cuando cambian los valores
  const handleFilterChange = (key: keyof AfiladoFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Manejar cambio de fecha desde
  const handleFechaDesdeChange = (date: Date | undefined) => {
    setFechaDesde(date);
    handleFilterChange('fecha_desde', date ? format(date, 'yyyy-MM-dd') : null);
  };

  // Manejar cambio de fecha hasta
  const handleFechaHastaChange = (date: Date | undefined) => {
    setFechaHasta(date);
    handleFilterChange('fecha_hasta', date ? format(date, 'yyyy-MM-dd') : null);
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      sierra_id: null,
      tipo_afilado_id: null,
      fecha_desde: null,
      fecha_hasta: null
    });
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    onFilterChange({
      sierra_id: null,
      tipo_afilado_id: null,
      fecha_desde: null,
      fecha_hasta: null
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Tipo de Afilado */}
          <div className="flex flex-col">
            <Label htmlFor="tipo-filter" className="mb-2">Tipo de Afilado</Label>
            <Select
              value={filters.tipo_afilado_id?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('tipo_afilado_id', value !== 'all' ? parseInt(value) : null)}
            >
              <SelectTrigger id="tipo-filter" className="h-10">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposAfilado.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Fecha Desde */}
          <div className="flex flex-col">
            <Label htmlFor="fecha-desde-filter" className="mb-2">Fecha Desde</Label>
            <CustomDatePicker
              date={fechaDesde}
              onDateChange={handleFechaDesdeChange}
              placeholder="Seleccionar fecha desde"
              className="h-10"
            />
          </div>

          {/* Filtro por Fecha Hasta */}
          <div className="flex flex-col">
            <Label htmlFor="fecha-hasta-filter" className="mb-2">Fecha Hasta</Label>
            <CustomDatePicker
              date={fechaHasta}
              onDateChange={handleFechaHastaChange}
              placeholder="Seleccionar fecha hasta"
              className="h-10"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleClearFilters}
          className="flex items-center"
        >
          <FilterX className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      </CardFooter>
    </Card>
  );
}
