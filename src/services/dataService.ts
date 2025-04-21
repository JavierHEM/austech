/**
 * Servicios para acceder a datos de Supabase
 */
import { supabase } from '@/lib/supabase-client';

// Servicios para Empresas
export const getEmpresas = async () => {
  try {
    return await supabase
      .from('empresas')
      .select('*')
      .order('nombre');
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    return { data: null, error };
  }
};

export const getEmpresaById = async (id: number) => {
  try {
    return await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error(`Error al obtener empresa con ID ${id}:`, error);
    return { data: null, error };
  }
};

// Servicios para Sucursales
export const getSucursales = async () => {
  try {
    return await supabase
      .from('sucursales')
      .select('*, empresas(nombre)')
      .order('nombre');
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    return { data: null, error };
  }
};

export const getSucursalById = async (id: number) => {
  try {
    return await supabase
      .from('sucursales')
      .select('*, empresas(nombre)')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error(`Error al obtener sucursal con ID ${id}:`, error);
    return { data: null, error };
  }
};

export const getSucursalesByEmpresa = async (empresaId: number) => {
  try {
    return await supabase
      .from('sucursales')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre');
  } catch (error) {
    console.error(`Error al obtener sucursales de la empresa ${empresaId}:`, error);
    return { data: null, error };
  }
};

// Servicios para Sierras
export const getSierras = async () => {
  try {
    return await supabase
      .from('sierras')
      .select('*, tipos_sierra(nombre), sucursales(nombre, empresas(nombre))')
      .order('codigo');
  } catch (error) {
    console.error('Error al obtener sierras:', error);
    return { data: null, error };
  }
};

export const getSierraById = async (id: number) => {
  try {
    return await supabase
      .from('sierras')
      .select('*, tipos_sierra(nombre), sucursales(nombre, empresas(nombre))')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error(`Error al obtener sierra con ID ${id}:`, error);
    return { data: null, error };
  }
};

// Servicios para Tipos de Sierra
export const getTiposSierra = async () => {
  try {
    return await supabase
      .from('tipos_sierra')
      .select('*')
      .order('nombre');
  } catch (error) {
    console.error('Error al obtener tipos de sierra:', error);
    return { data: null, error };
  }
};

// Servicios para Tipos de Afilado
export const getTiposAfilado = async () => {
  try {
    return await supabase
      .from('tipos_afilado')
      .select('*')
      .order('nombre');
  } catch (error) {
    console.error('Error al obtener tipos de afilado:', error);
    return { data: null, error };
  }
};

// Servicios para Afilados
export const getAfilados = async () => {
  try {
    return await supabase
      .from('afilados')
      .select('*, sierras(codigo, sucursales(nombre, empresas(nombre))), tipos_afilado(nombre)')
      .order('fecha', { ascending: false });
  } catch (error) {
    console.error('Error al obtener afilados:', error);
    return { data: null, error };
  }
};

// Servicios para Salidas Masivas
export const getSalidasMasivas = async () => {
  try {
    return await supabase
      .from('salidas_masivas')
      .select('*, sucursales(nombre, empresas(nombre))')
      .order('fecha', { ascending: false });
  } catch (error) {
    console.error('Error al obtener salidas masivas:', error);
    return { data: null, error };
  }
};

export const getSalidaMasivaById = async (id: number) => {
  try {
    return await supabase
      .from('salidas_masivas')
      .select('*, sucursales(nombre, empresas(nombre))')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error(`Error al obtener salida masiva con ID ${id}:`, error);
    return { data: null, error };
  }
};

// Servicios para Bajas Masivas
export const getBajasMasivas = async () => {
  try {
    return await supabase
      .from('bajas_masivas')
      .select('*, sucursales(nombre, empresas(nombre))')
      .order('fecha', { ascending: false });
  } catch (error) {
    console.error('Error al obtener bajas masivas:', error);
    return { data: null, error };
  }
};

export const getBajaMasivaById = async (id: number) => {
  try {
    return await supabase
      .from('bajas_masivas')
      .select('*, sucursales(nombre, empresas(nombre))')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error(`Error al obtener baja masiva con ID ${id}:`, error);
    return { data: null, error };
  }
};

// Servicios para Usuarios
export const getUsuarios = async () => {
  try {
    return await supabase
      .from('usuarios')
      .select('*')
      .order('email');
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { data: null, error };
  }
};

export const getUsuarioById = async (id: string) => {
  try {
    return await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${id}:`, error);
    return { data: null, error };
  }
};