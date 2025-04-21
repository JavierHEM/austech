/**
 * Datos simulados para desarrollo local sin Supabase
 * Este archivo proporciona datos simulados para usar cuando no hay conexión con Supabase
 */

// Verificar si estamos en modo desarrollo
export const isDevelopment = process.env.NODE_ENV === 'development';

// Modo de desarrollo local sin Supabase
export const devModeEnabled = isDevelopment && 
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Datos simulados para usuario y sesión
export const mockUser = {
  id: 'dev-user-id',
  email: 'dev@example.com',
  user_metadata: {
    name: 'Usuario Desarrollo',
    role: 'administrador'
  }
};

export const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600
};

// Datos simulados para entidades del sistema
export const mockEmpresas = [
  { id: 1, nombre: 'Empresa Simulada 1', direccion: 'Dirección 1', telefono: '123456789', email: 'empresa1@example.com' },
  { id: 2, nombre: 'Empresa Simulada 2', direccion: 'Dirección 2', telefono: '987654321', email: 'empresa2@example.com' }
];

export const mockSucursales = [
  { id: 1, nombre: 'Sucursal Simulada 1', direccion: 'Dirección Sucursal 1', empresa_id: 1 },
  { id: 2, nombre: 'Sucursal Simulada 2', direccion: 'Dirección Sucursal 2', empresa_id: 1 },
  { id: 3, nombre: 'Sucursal Simulada 3', direccion: 'Dirección Sucursal 3', empresa_id: 2 }
];

export const mockSierras = [
  { id: 1, codigo: 'S001', tipo_sierra_id: 1, sucursal_id: 1, estado: 'activa' },
  { id: 2, codigo: 'S002', tipo_sierra_id: 2, sucursal_id: 1, estado: 'activa' },
  { id: 3, codigo: 'S003', tipo_sierra_id: 1, sucursal_id: 2, estado: 'inactiva' }
];

export const mockTiposSierra = [
  { id: 1, nombre: 'Tipo Sierra Simulada 1', descripcion: 'Descripción 1' },
  { id: 2, nombre: 'Tipo Sierra Simulada 2', descripcion: 'Descripción 2' }
];

export const mockTiposAfilado = [
  { id: 1, nombre: 'Tipo Afilado Simulado 1', descripcion: 'Descripción 1' },
  { id: 2, nombre: 'Tipo Afilado Simulado 2', descripcion: 'Descripción 2' }
];

export const mockAfilados = [
  { id: 1, sierra_id: 1, tipo_afilado_id: 1, fecha: '2025-04-01', observaciones: 'Observación 1' },
  { id: 2, sierra_id: 2, tipo_afilado_id: 2, fecha: '2025-04-05', observaciones: 'Observación 2' },
  { id: 3, sierra_id: 1, tipo_afilado_id: 1, fecha: '2025-04-10', observaciones: 'Observación 3' }
];

export const mockSalidasMasivas = [
  { id: 1, fecha: '2025-04-01', sucursal_id: 1, cantidad: 5, observaciones: 'Salida masiva 1' },
  { id: 2, fecha: '2025-04-10', sucursal_id: 2, cantidad: 3, observaciones: 'Salida masiva 2' }
];

export const mockBajasMasivas = [
  { id: 1, fecha: '2025-04-05', sucursal_id: 1, cantidad: 2, observaciones: 'Baja masiva 1' },
  { id: 2, fecha: '2025-04-15', sucursal_id: 2, cantidad: 1, observaciones: 'Baja masiva 2' }
];

export const mockUsuarios = [
  { id: 'dev-user-id', email: 'dev@example.com', rol_id: 1, nombre: 'Usuario Desarrollo' },
  { id: 'user-2', email: 'gerente@example.com', rol_id: 2, nombre: 'Usuario Gerente' },
  { id: 'user-3', email: 'cliente@example.com', rol_id: 3, nombre: 'Usuario Cliente' }
];

// Función para simular un retraso en las respuestas
export const simulateDelay = async (minMs = 300, maxMs = 800) => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
};

// Función para simular una respuesta de Supabase
export const mockSupabaseResponse = async (data: any, errorChance = 0) => {
  await simulateDelay();
  
  // Simular un error aleatorio según la probabilidad indicada
  if (Math.random() < errorChance) {
    return {
      data: null,
      error: {
        message: 'Error simulado para desarrollo',
        details: 'Este es un error simulado para probar el manejo de errores'
      }
    };
  }
  
  return {
    data,
    error: null
  };
};

// Función para verificar si debemos usar datos simulados
export const shouldUseMockData = () => {
  // Desactivar el uso forzado de datos simulados
  return false;
};
