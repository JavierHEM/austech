'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { EmpresaFilters as EmpresaFiltersType } from '@/services/empresaService';

interface EmpresaFiltersProps {
  onFilterChange: (filters: EmpresaFiltersType) => void;
}

export default function EmpresaFilters({ onFilterChange }: EmpresaFiltersProps) {
  const [razon_social, setRazonSocial] = useState('');
  const [rut, setRut] = useState('');
  const [activo, setActivo] = useState<string>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const activoValue = activo === 'all' 
      ? undefined 
      : activo === 'true' 
        ? true 
        : false;
    
    onFilterChange({
      razon_social: razon_social || undefined,
      rut: rut || undefined,
      activo: activoValue
    });
  };

  const handleReset = () => {
    setRazonSocial('');
    setRut('');
    setActivo('all');
    
    onFilterChange({
      razon_social: undefined,
      rut: undefined,
      activo: undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="razon_social" className="text-sm font-medium">
            Razón Social
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="razon_social"
              placeholder="Buscar por razón social"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
              value={razon_social}
              onChange={(e) => setRazonSocial(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="rut" className="text-sm font-medium">
            RUT
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="rut"
              placeholder="Buscar por RUT"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
            />
          </div>
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