import { supabase } from '@/lib/supabase-client';

/**
 * Obtiene el ID de la empresa asignada a un usuario
 * @param userId ID del usuario
 * @returns ID de la empresa o null si no tiene empresa asignada
 */
export const getUserEmpresaId = async (userId: string): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener empresa del usuario:', error);
      throw error;
    }

    return data?.empresa_id || null;
  } catch (error) {
    console.error('Error al obtener empresa del usuario:', error);
    throw error;
  }
};
