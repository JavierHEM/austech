'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { SierraFilters as SierraFiltersType } from '@/types/sierra';
import { createClient } from '@/lib/supabase';

interface SierraFiltersProps {
  onFilterChange: (filters: SierraFiltersType) => void;
}

export default function SierraFilters({ onFilterChange }: SierraFiltersProps) {
  const [codigoBarras, setCodigoBarras] = useState('');
  const [sucursalId, setSucursalId] = useState<string>('all');
  const [tipoSierraId, setTipoSierraId] = useState<string>('all');
  const [estadoSierraId, setEstadoSierraId] = useState<string>('all');
  const [activo, setActivo] = useState<string>('all');
  
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [tiposSierra, setTiposSierra] = useState<any[]>([]);
  const [estadosSierra, setEstadosSierra] = useState<any[]>([]);
  
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [loadingTiposSierra, setLoadingTiposSierra] = useState(true);
  const [loadingEstadosSierra, setLoadingEstadosSierra] = useState(true);

  // Cargar sucursales para el filtro
  useEffect(() => {
    const fetchSucursales = async () => {
      setLoadingSucursales(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('sucursales')
          .select('id, nombre, empresa_id, empresas(razon_social)')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        const formattedData = data.map(item => ({
          id: item.id,
          nombre: item.nombre,
          empresa_nombre: item.empresas?.razon_social || 'Sin empresa'
        }));
        
        setSucursales(formattedData || []);
        setLoadingSucursales(false);
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
        setLoadingSucursales(false);
      }
    };

    fetchSucursales();
  }, []);

  // Cargar tipos de sierra para el filtro
  useEffect(() => {
    const fetchTiposSierra = async () => {
      setLoadingTiposSierra(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('tipos_sierra')
          .select('*')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        setTiposSierra(data || []);
        setLoadingTiposSierra(false);
      } catch (error) {
        console.error('Error al cargar tipos de sierra:', error);
        setLoadingTiposSierra(false);
      }
    };

    fetchTiposSierra();
  }, []);

  // Cargar estados de sierra para el filtro
  useEffect(() => {
    const fetchEstadosSierra = async () => {
      setLoadingEstadosSierra(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('estados_sierra')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        setEstadosSierra(data || []);
        setLoadingEstadosSierra(false);
      } catch (error) {
        console.error('Error al cargar estados de sierra:', error);
        setLoadingEstadosSierra(false);
      }
    };

    fetchEstadosSierra();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sucursalIdValue = sucursalId === 'all' 
      ? null 
      : parseInt(sucursalId);
    
    const tipoSierraIdValue = tipoSierraId === 'all' 
      ? null 
      : parseInt(tipoSierraId);
    
    const estadoSierraIdValue = estadoSierraId === 'all' 
      ? null 
      : parseInt(estadoSierraId);
    
    const activoValue = activo === 'all' 
      ? null 
      : activo === 'true' 
        ? true 
        : false;
    
    onFilterChange({
      codigo_barras: codigoBarras || undefined,
      sucursal_id: sucursalIdValue,
      tipo_sierra_id: tipoSierraIdValue,
      estado_sierra_id: estadoSierraIdValue,
      activo: activoValue
    });
  };

  const handleReset = () => {
    setCodigoBarras('');
    setSucursalId('all');
    setTipoSierraId('all');
    setEstadoSierraId('all');
    setActivo('all');
    
    onFilterChange({
      codigo_barras: undefined,
      sucursal_id: null,
      tipo_sierra_id: null,
      estado_sierra_id: null,
      activo: null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label htmlFor="codigo_barras" className="text-sm font-medium">
            Código de Barras
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="codigo_barras"
              placeholder="Buscar por código..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="sucursal" className="text-sm font-medium">
            Sucursal
          </label>
          <select
            id="sucursal"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
            disabled={loadingSucursales}
          >
            <option value="all">Todas las sucursales</option>
            {sucursales.map(sucursal => (
              <option key={sucursal.id} value={sucursal.id.toString()}>
                {sucursal.nombre} - {sucursal.empresa_nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="tipo_sierra" className="text-sm font-medium">
            Tipo de Sierra
          </label>
          <select
            id="tipo_sierra"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={tipoSierraId}
            onChange={(e) => setTipoSierraId(e.target.value)}
            disabled={loadingTiposSierra}
          >
            <option value="all">Todos los tipos</option>
            {tiposSierra.map(tipo => (
              <option key={tipo.id} value={tipo.id.toString()}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="estado_sierra" className="text-sm font-medium">
            Estado
          </label>
          <select
            id="estado_sierra"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={estadoSierraId}
            onChange={(e) => setEstadoSierraId(e.target.value)}
            disabled={loadingEstadosSierra}
          >
            <option value="all">Todos los estados</option>
            {estadosSierra.map(estado => (
              <option key={estado.id} value={estado.id.toString()}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="activo" className="text-sm font-medium">
            Activo
          </label>
          <select
            id="activo"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={activo}
            onChange={(e) => setActivo(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleReset}
        >
          <X className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>
    </form>
  );
}
