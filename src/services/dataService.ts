/**
 * Servicios para acceder a datos de Supabase
 * Con soporte para modo de desarrollo sin conexión a Supabase
 */
import { createClient } from '@/lib/supabase';
import { 
  shouldUseMockData, 
  mockSupabaseResponse, 
  mockEmpresas, 
  mockSucursales, 
  mockSierras,
  mockTiposSierra,
  mockTiposAfilado,
  mockAfilados,
  mockSalidasMasivas,
  mockBajasMasivas,
  mockUsuarios
} from '@/lib/mock-data';

const supabase = createClient();

// Servicios para Empresas
export const getEmpresas = async () => {
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockEmpresas);
  }
  
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
  if (shouldUseMockData()) {
    const empresa = mockEmpresas.find(e => e.id === id);
    return mockSupabaseResponse(empresa);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockSucursales);
  }
  
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
  if (shouldUseMockData()) {
    const sucursal = mockSucursales.find(s => s.id === id);
    return mockSupabaseResponse(sucursal);
  }
  
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
  if (shouldUseMockData()) {
    const sucursales = mockSucursales.filter(s => s.empresa_id === empresaId);
    return mockSupabaseResponse(sucursales);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockSierras);
  }
  
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
  if (shouldUseMockData()) {
    const sierra = mockSierras.find(s => s.id === id);
    return mockSupabaseResponse(sierra);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockTiposSierra);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockTiposAfilado);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockAfilados);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockSalidasMasivas);
  }
  
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
  if (shouldUseMockData()) {
    const salida = mockSalidasMasivas.find(s => s.id === id);
    return mockSupabaseResponse(salida);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockBajasMasivas);
  }
  
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
  if (shouldUseMockData()) {
    const baja = mockBajasMasivas.find(b => b.id === id);
    return mockSupabaseResponse(baja);
  }
  
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
  if (shouldUseMockData()) {
    return mockSupabaseResponse(mockUsuarios);
  }
  
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
  if (shouldUseMockData()) {
    const usuario = mockUsuarios.find(u => u.id === id);
    return mockSupabaseResponse(usuario);
  }
  
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
