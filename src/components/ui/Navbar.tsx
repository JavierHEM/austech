'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, session, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();

  // Obtener el rol del usuario desde la sesión
  const userRole = session?.user?.user_metadata?.role || '';
  
  // Determinar los roles del usuario
  const isGerente = userRole === 'gerente';
  const isAdministrador = userRole === 'administrador';
  const isCliente = userRole === 'cliente';

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente.',
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar sesión. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Obtener las iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    
    const email = user.email;
    const name = user.user_metadata?.name || email;
    
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                AusTech
              </Link>
            </div>
            
            {/* Links de navegación - Versión desktop */}
            <div className="hidden md:ml-6 md:flex md:space-x-4 md:items-center">
              <NavLink href="/dashboard" current={pathname ? pathname === '/dashboard' : false}>
                Dashboard
              </NavLink>
              
              {(isAdministrador || isGerente) && (
                <>
                  <NavLink href="/empresas" current={pathname ? pathname.startsWith('/empresas') : false}>
                    Empresas
                  </NavLink>
                  <NavLink href="/sucursales" current={pathname ? pathname.startsWith('/sucursales') : false}>
                    Sucursales
                  </NavLink>
                  <NavLink href="/sierras" current={pathname ? pathname.startsWith('/sierras') : false}>
                    Sierras
                  </NavLink>
                </>
              )}
              
              <NavLink href="/afilados" current={pathname ? pathname.startsWith('/afilados') : false}>
                Afilados
              </NavLink>
              
              {(isAdministrador || isGerente) && (
                <>
                  <NavLink href="/salidas-masivas" current={pathname ? pathname.startsWith('/salidas-masivas') : false}>
                    Salidas Masivas
                  </NavLink>
                  <NavLink href="/bajas-masivas" current={pathname ? pathname.startsWith('/bajas-masivas') : false}>
                    Bajas Masivas
                  </NavLink>
                </>
              )}
              
              {isAdministrador && (
                <NavLink href="/usuarios" current={pathname ? pathname.startsWith('/usuarios') : false}>
                  Usuarios
                </NavLink>
              )}
            </div>
          </div>
          
          {/* Menú usuario y botón móvil */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center">
              <UserMenu 
                userInitials={getUserInitials()}
                email={user?.email || ''} 
                onSignOut={handleSignOut}
              />
            </div>
            
            {/* Botón móvil */}
            <div className="flex md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              >
                <span className="sr-only">Abrir menú principal</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink href="/dashboard" current={pathname === '/dashboard'}>
              Dashboard
            </MobileNavLink>
            
            {(isAdministrador || isGerente) && (
              <>
                <MobileNavLink href="/empresas" current={pathname.startsWith('/empresas')}>
                  Empresas
                </MobileNavLink>
                <MobileNavLink href="/sucursales" current={pathname.startsWith('/sucursales')}>
                  Sucursales
                </MobileNavLink>
                <MobileNavLink href="/sierras" current={pathname.startsWith('/sierras')}>
                  Sierras
                </MobileNavLink>
              </>
            )}
            
            <MobileNavLink href="/afilados" current={pathname.startsWith('/afilados')}>
              Afilados
            </MobileNavLink>
            
            {(isAdministrador || isGerente) && (
              <>
                <MobileNavLink href="/salidas-masivas" current={pathname.startsWith('/salidas-masivas')}>
                  Salidas Masivas
                </MobileNavLink>
                <MobileNavLink href="/bajas-masivas" current={pathname.startsWith('/bajas-masivas')}>
                  Bajas Masivas
                </MobileNavLink>
              </>
            )}
            
            {isAdministrador && (
              <MobileNavLink href="/usuarios" current={pathname.startsWith('/usuarios')}>
                Usuarios
              </MobileNavLink>
            )}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <Avatar>
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium">{user?.email}</div>
                <div className="text-sm font-medium text-gray-500">
                  {userRole}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={handleSignOut}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// Componente para enlaces de navegación en desktop
function NavLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        current
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {children}
    </Link>
  );
}

// Componente para enlaces de navegación en móvil
function MobileNavLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        current
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {children}
    </Link>
  );
}

// Componente para el menú de usuario
function UserMenu({ 
  userInitials, 
  email, 
  onSignOut 
}: { 
  userInitials: string; 
  email: string; 
  onSignOut: () => void 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <Avatar>
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1 bg-background rounded-md shadow-xs">
            <div className="block px-4 py-2 text-sm text-foreground border-b">
              {email}
            </div>
            <Link 
              href="/perfil" 
              className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </div>
            </Link>
            <Link 
              href="/configuracion" 
              className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </div>
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}