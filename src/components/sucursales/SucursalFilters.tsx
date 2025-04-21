'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { SucursalFilters as SucursalFiltersType } from '@/types/sucursal';
import { Empresa } from '@/types/empresa';
import { supabase } from '@/lib/supabase-client';

interface SucursalFiltersProps {
  onFilterChange: (filters: SucursalFiltersType) => void;
}

export default function SucursalFilters({ onFilterChange }: SucursalFiltersProps) {
  const [search, setSearch] = useState('');
  const [empresaId, setEmpresaId] = useState<string>('all');
  const [activo, setActivo] = useState<string>('all');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  // Cargar empresas para el filtro
  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('activo', true)
          .order('razon_social', { ascending: true });

        if (error) throw error;
        
        setEmpresas(data || []);
        setLoadingEmpresas(false);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        setLoadingEmpresas(false);
      }
    };

    fetchEmpresas();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const empresaIdValue = empresaId === 'all' 
      ? null 
      : parseInt(empresaId);
    
    const activoValue = activo === 'all' 
      ? null 
      : activo === 'true' 
        ? true 
        : false;
    
    onFilterChange({
      search,
      empresa_id: empresaIdValue,
      activo: activoValue
    });
  };

  const handleReset = () => {
    setSearch('');
    setEmpresaId('all');
    setActivo('all');
    
    onFilterChange({
      search: '',
      empresa_id: null,
      activo: null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="search"
              placeholder="Nombre, dirección, teléfono..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="empresa" className="text-sm font-medium">
            Empresa
          </label>
          <select
            id="empresa"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            disabled={loadingEmpresas}
          >
            <option value="all">Todas las empresas</option>
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.id.toString()}>
                {empresa.razon_social}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="activo" className="text-sm font-medium">
            Estado
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