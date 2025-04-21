import { supabase } from '@/lib/supabase-client';
import { Sucursal, SucursalConEmpresa, SucursalFilters } from '@/types/sucursal';

// Función para obtener todas las sucursales con filtros
export async function getSucursales(
  page: number = 1,
  pageSize: number = 10,
  filters: SucursalFilters = { search: '', empresa_id: null, activo: null }
): Promise<{ data: SucursalConEmpresa[], count: number }> {
  const startRow = (page - 1) * pageSize;
  const endRow = startRow + pageSize - 1;

  let query = supabase
    .from('sucursales')
    .select('*, empresas(*)', { count: 'exact' });

  // Aplicar filtros si existen
  if (filters.search) {
    query = query.or(`nombre.ilike.%${filters.search}%,direccion.ilike.%${filters.search}%,telefono.ilike.%${filters.search}%`);
  }

  if (filters.empresa_id !== null) {
    query = query.eq('empresa_id', filters.empresa_id);
  }

  if (filters.activo !== null) {
    query = query.eq('activo', filters.activo);
  }

  // Aplicar paginación
  query = query.range(startRow, endRow);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error al obtener sucursales:', error);
    throw error;
  }

  // Transformar los datos para que coincidan con SucursalConEmpresa
  const sucursalesConEmpresa: SucursalConEmpresa[] = data.map(item => {
    const { empresas, ...sucursal } = item;
    return {
      ...sucursal,
      empresa: empresas
    } as SucursalConEmpresa;
  });

  return {
    data: sucursalesConEmpresa,
    count: count || 0
  };
}

// Función para obtener una sucursal por ID
export async function getSucursalById(id: number): Promise<SucursalConEmpresa | null> {
  const { data, error } = await supabase
    .from('sucursales')
    .select('*, empresas(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener sucursal:', error);
    throw error;
  }

  if (!data) return null;

  // Transformar los datos para que coincidan con SucursalConEmpresa
  const { empresas, ...sucursal } = data;
  return {
    ...sucursal,
    empresa: empresas
  } as SucursalConEmpresa;
}

// Función para crear una nueva sucursal
export async function createSucursal(sucursal: Omit<Sucursal, 'id' | 'creado_en' | 'modificado_en'>): Promise<Sucursal> {
  const now = new Date().toISOString();
  const newSucursal = {
    ...sucursal,
    creado_en: now,
    modificado_en: now
  };
  
  const { data, error } = await supabase
    .from('sucursales')
    .insert(newSucursal)
    .select()
    .single();

  if (error) {
    console.error('Error al crear sucursal:', error);
    throw error;
  }

  return data;
}

// Función para actualizar una sucursal existente
export async function updateSucursal(id: number, sucursal: Partial<Omit<Sucursal, 'id' | 'creado_en' | 'modificado_en'>>): Promise<Sucursal> {
  const updateData = {
    ...sucursal,
    modificado_en: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('sucursales')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar sucursal:', error);
    throw error;
  }

  return data;
}

// Función para eliminar una sucursal (desactivar)
export async function deleteSucursal(id: number): Promise<void> {
  const { error } = await supabase
    .from('sucursales')
    .update({ 
      activo: false,
      modificado_en: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar sucursal:', error);
    throw error;
  }
}

// Función para obtener todas las sucursales de una empresa específica
export async function getSucursalesByEmpresa(empresaId: number): Promise<Sucursal[]> {
  const { data, error } = await supabase
    .from('sucursales')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('activo', true);

  if (error) {
    console.error('Error al obtener sucursales por empresa:', error);
    throw error;
  }

  return data || [];
}

// Exportar tipos para usar en componentes
export type { Sucursal, SucursalConEmpresa, SucursalFilters };
