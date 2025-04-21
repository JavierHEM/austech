import { supabase } from '@/lib/supabase-client';
import { Usuario, UsuarioFormValues, UsuarioFilterOptions } from '@/types/usuario';

// Interfaz para la respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Obtiene una lista paginada de usuarios con filtros opcionales
 */
export const getUsuarios = async (
  page: number = 1,
  pageSize: number = 10,
  filters: Partial<UsuarioFilterOptions> = { search: '', rolId: '', empresaId: '', status: '' }
): Promise<PaginatedResponse<Usuario>> => {
  try {
    // Iniciar la consulta
    let query = supabase
      .from('usuarios')
      .select('*, roles(*), empresas(*)', { count: 'exact' });
    
    // Aplicar filtros si existen
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,nombre_completo.ilike.%${filters.search}%`);
    }
    
    if (filters.rolId && filters.rolId !== 'todos') {
      query = query.eq('rol_id', parseInt(filters.rolId));
    }
    
    if (filters.empresaId && filters.empresaId !== 'todos') {
      query = query.eq('empresa_id', parseInt(filters.empresaId));
    }
    
    if (filters.status && filters.status !== 'todos') {
      const isActivo = filters.status === 'activo';
      query = query.eq('activo', isActivo);
    }
    
    // Calcular el rango para la paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Ejecutar la consulta con paginación
    const { data, error, count } = await query
      .range(from, to)
      .order('email', { ascending: true });
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error(error.message);
    }
    
    // Calcular el total de páginas
    const totalPages = count ? Math.ceil(count / pageSize) : 0;
    
    return {
      data: data as Usuario[],
      count: count || 0,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    throw error;
  }
};

/**
 * Obtiene un usuario por su ID
 */
export const getUsuarioById = async (id: string): Promise<Usuario | null> => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles(*), empresas(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw new Error(error.message);
    }
    
    return data as Usuario;
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    throw error;
  }
};

/**
 * Crea un nuevo usuario
 * Nota: Este método solo crea el registro en la tabla 'usuarios'.
 * Para crear la autenticación debe usarse la API de Auth de Supabase.
 */
export const createUsuario = async (usuario: UsuarioFormValues & { id?: string }): Promise<Usuario> => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        id: usuario.id || '', // El ID debería venir de Auth
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol_id: usuario.rol_id,
        empresa_id: usuario.empresa_id,
        activo: usuario.activo,
        creado_en: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear usuario:', error);
      throw new Error(error.message);
    }
    
    return data as Usuario;
  } catch (error) {
    console.error('Error en createUsuario:', error);
    throw error;
  }
};

/**
 * Actualiza un usuario existente
 */
export const updateUsuario = async (id: string, usuario: Partial<UsuarioFormValues>): Promise<Usuario> => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        ...usuario,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar usuario:', error);
      throw new Error(error.message);
    }
    
    return data as Usuario;
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    throw error;
  }
};

/**
 * Elimina un usuario (desactivando)
 */
export const deleteUsuario = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({
        activo: false,
        modificado_en: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar usuario:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    throw error;
  }
};

/**
 * Obtiene todos los roles disponibles
 */
export const getRoles = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('nombre');
    
    if (error) {
      console.error('Error al obtener roles:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getRoles:', error);
    throw error;
  }
};

/**
 * Registra un nuevo usuario con la API de Auth de Supabase
 * y crea el registro en la tabla 'usuarios'
 */
export const registerUser = async (userData: UsuarioFormValues & { password: string }): Promise<Usuario> => {
  try {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Error al registrar usuario en Auth:', authError);
      throw new Error(authError.message);
    }
    
    // 2. Crear registro en la tabla usuarios
    const userId = authData.user.id;
    const { data: userData2, error: dbError } = await supabase
      .from('usuarios')
      .insert([{
        id: userId,
        email: userData.email,
        nombre_completo: userData.nombre_completo,
        rol_id: userData.rol_id,
        empresa_id: userData.empresa_id,
        activo: userData.activo,
        creado_en: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (dbError) {
      console.error('Error al crear usuario en DB:', dbError);
      throw new Error(dbError.message);
    }
    
    return userData2 as Usuario;
  } catch (error) {
    console.error('Error en registerUser:', error);
    throw error;
  }
};

export type { Usuario, UsuarioFormValues, UsuarioFilterOptions };