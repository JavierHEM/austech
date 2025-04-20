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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FilterX } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AfiladoFilters } from '@/types/afilado';
import { getSierras } from '@/services/sierraService';
import { getTiposAfilado } from '@/services/tipoAfiladoService';

interface AfiladoFiltersProps {
  onFilterChange: (filters: AfiladoFilters) => void;
}

export default function AfiladoFiltersComponent({ onFilterChange }: AfiladoFiltersProps) {
  const [sierras, setSierras] = useState<any[]>([]);
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
        const [sierrasData, tiposData] = await Promise.all([
          getSierras(),
          getTiposAfilado()
        ]);
        
        setSierras(sierrasData.data || []);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Sierra */}
          <div className="space-y-2">
            <Label htmlFor="sierra-filter">Sierra</Label>
            <Select
              value={filters.sierra_id?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('sierra_id', value !== 'all' ? parseInt(value) : null)}
            >
              <SelectTrigger id="sierra-filter" className="w-full">
                <SelectValue placeholder="Todas las sierras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sierras</SelectItem>
                {sierras.map((sierra) => (
                  <SelectItem key={sierra.id} value={sierra.id.toString()}>
                    {sierra.codigo_barra} - {sierra.sucursal?.nombre || 'Sin sucursal'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Tipo de Afilado */}
          <div className="space-y-2">
            <Label htmlFor="tipo-filter">Tipo de Afilado</Label>
            <Select
              value={filters.tipo_afilado_id?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('tipo_afilado_id', value !== 'all' ? parseInt(value) : null)}
            >
              <SelectTrigger id="tipo-filter" className="w-full">
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
          <div className="space-y-2">
            <Label htmlFor="fecha-desde-filter">Fecha Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="fecha-desde-filter"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fechaDesde && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaDesde ? format(fechaDesde, 'PPP', { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fechaDesde}
                  onSelect={handleFechaDesdeChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por Fecha Hasta */}
          <div className="space-y-2">
            <Label htmlFor="fecha-hasta-filter">Fecha Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="fecha-hasta-filter"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fechaHasta && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaHasta ? format(fechaHasta, 'PPP', { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fechaHasta}
                  onSelect={handleFechaHastaChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
