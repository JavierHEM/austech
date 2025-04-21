'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface UserFiltersType {
  search: string;
  role: string | null;
  activo: boolean | null;
}

interface UserFiltersProps {
  onFilterChange: (filters: UserFiltersType) => void;
}

export default function UserFilters({ onFilterChange }: UserFiltersProps) {


  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('all');
  const [activo, setActivo] = useState<string>('all');
  const [roles, setRoles] = useState<{id: number, nombre: string}[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Cargar roles para el filtro
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('id, nombre')
          .order('nombre');
        
        if (error) throw error;
        
        setRoles(data || []);
        setLoadingRoles(false);
      } catch (error) {
        console.error('Error al cargar roles:', error);
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const roleValue = role === 'all' 
      ? null 
      : role;
    
    const activoValue = activo === 'all' 
      ? null 
      : activo === 'true' 
        ? true 
        : false;
    
    onFilterChange({
      search,
      role: roleValue,
      activo: activoValue
    });
  };

  const handleReset = () => {
    setSearch('');
    setRole('all');
    setActivo('all');
    
    onFilterChange({
      search: '',
      role: null,
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
            <Input
              id="search"
              placeholder="Nombre, email..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium">
            Rol
          </label>
          <Select
            value={role}
            onValueChange={setRole}
            disabled={loadingRoles}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder={loadingRoles ? "Cargando roles..." : "Seleccione un rol"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Roles</SelectLabel>
                <SelectItem value="all">Todos los roles</SelectItem>
                {roles.map(rol => (
                  <SelectItem key={rol.id} value={rol.id.toString()}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="activo" className="text-sm font-medium">
            Estado
          </label>
          <Select
            value={activo}
            onValueChange={setActivo}
          >
            <SelectTrigger id="activo">
              <SelectValue placeholder="Seleccione un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Estado</SelectLabel>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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