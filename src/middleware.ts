import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas a las que solo pueden acceder administradores y gerentes
const restrictedPaths = [
  '/afilados',
  '/sierras',
  '/empresas',
  '/sucursales',
  '/usuarios',
  '/salidas-masivas',
  '/bajas-masivas'
];

// Rutas públicas que no requieren autenticación
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/api'
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Permitir rutas públicas sin restricciones
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }
  
  // Para todas las demás rutas, simplemente continuar
  // La autenticación y el control de acceso se manejarán en los componentes del lado del cliente
  return NextResponse.next();
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
