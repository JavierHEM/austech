'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building, 
  Menu, 
  X, 
  Home, 
  LogOut, 
  Map,
  Settings,
  Users,
  UserCheck,
  Scissors,
  Barcode,
  ArrowDownToLine,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
// El ThemeProvider ahora está en el archivo providers.tsx
import { ModeToggle } from '@/components/mode-toggle';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive: (pathname: string | null) => boolean;
  requiredRoles?: string[]; // Roles que pueden ver este elemento de navegación
}

// Definición de categorías para el menú
interface NavCategory {
  name: string;
  items: NavItem[];
}

// Elementos de navegación organizados por categorías con control de acceso por rol
const navCategories: NavCategory[] = [
  {
    name: '',
    items: [
      {
        label: 'Inicio',
        href: '/dashboard',
        icon: <Home className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname === '/dashboard' : false,
        requiredRoles: ['gerente', 'administrador', 'cliente'] // Todos los roles pueden ver el inicio
      },
      {
        label: 'Empresas',
        href: '/empresas',
        icon: <Building className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/empresas') : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver empresas
      },
      {
        label: 'Sucursales',
        href: '/sucursales',
        icon: <Map className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/sucursales') : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver sucursales
      },
      {
        label: 'Sierras',
        href: '/sierras',
        icon: <Scissors className="h-5 w-5" />,
        isActive: (pathname) => pathname ? (pathname.startsWith('/sierras') && pathname !== '/sierras/buscar' && !pathname.startsWith('/tipos-sierra')) : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver sierras
      },
      {
        label: 'Buscar Sierra',
        href: '/sierras/buscar',
        icon: <Barcode className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname === '/sierras/buscar' : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden buscar sierras
      },
      {
        label: 'Afilados',
        href: '/afilados',
        icon: <Scissors className="h-5 w-5 rotate-180" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/afilados') : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver afilados
      }
    ]
  },
  {
    name: 'Operaciones Masivas',
    items: [
      {
        label: 'Salidas Masivas',
        href: '/salidas-masivas',
        icon: <ArrowDownToLine className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/salidas-masivas') : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver salidas masivas
      },
      {
        label: 'Bajas Masivas',
        href: '/bajas-masivas',
        icon: <XCircle className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/bajas-masivas') : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver bajas masivas
      }
    ]
  },
  {
    name: 'Reportes',
    items: [
      {
        label: 'Afilados por Cliente',
        href: '/reportes/afilados-por-cliente',
        icon: <FileSpreadsheet className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/reportes/afilados-por-cliente') : false,
        requiredRoles: ['gerente', 'administrador', 'cliente'] // Todos los roles pueden ver reportes
      }
    ]
  },
  {
    name: 'Catálogos',
    items: [
      {
        label: 'Tipos de Sierra',
        href: '/tipos-sierra',
        icon: <Scissors className="h-5 w-5 rotate-45" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/tipos-sierra') : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver tipos de sierra
      },
      {
        label: 'Tipos de Afilado',
        href: '/tipos-afilado',
        icon: <Scissors className="h-5 w-5 rotate-90" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/tipos-afilado') : false,
        requiredRoles: ['gerente', 'administrador'] // Solo gerentes y administradores pueden ver tipos de afilado
      }
    ]
  },
  {
    name: 'Configuración',
    items: [
      {
        label: 'Usuarios',
        href: '/usuarios',
        icon: <Users className="h-5 w-5" />,
        isActive: (pathname) => pathname ? pathname.startsWith('/usuarios') : false,
        requiredRoles: ['gerente'] // Solo gerentes pueden ver usuarios
      }
    ]
  }
];

// Lista plana de todos los elementos de navegación para uso en componentes que no muestran categorías
const navItems: NavItem[] = navCategories.flatMap(category => category.items);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { logout, session, role, loading } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Filtrar los elementos de navegación según el rol del usuario
  const filteredNavCategories = useMemo(() => {
    if (!role) return [];
    
    return navCategories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        // Mostrar el elemento si no tiene requiredRoles o si el rol del usuario está en requiredRoles
        !item.requiredRoles || item.requiredRoles.includes(role)
      )
    })).filter(category => category.items.length > 0); // Eliminar categorías vacías
  }, [role]);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si el usuario no tiene un rol válido y no está cargando, mostrar un mensaje de error
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">No tienes un rol asignado. Por favor contacta al administrador.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex min-h-screen flex-col">
        {/* Barra superior */}
        <header className="bg-background border-b sticky top-0 z-30">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="ml-2 md:ml-0 text-xl font-bold">Sistema de Gestión</div>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <ModeToggle />
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Contenedor principal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Barra lateral - Versión escritorio */}
          <aside className="w-0 md:w-auto bg-background border-r hidden md:flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Reducir espaciado en la navegación */}
            <nav className="py-0.5 px-1">
              <div className="space-y-1">
                {filteredNavCategories.map((category, index) => (
                  <div key={index} className="space-y-1">
                    {category.name && (
                      <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3">
                        {category.name}
                      </h3>
                    )}
                    {category.items.length > 0 && (
                      <ul className="space-y-0.5">
                        {category.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                                pathname && item.isActive(pathname) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                              )}
                            >
                              {item.icon}
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          </aside>
          
          {/* Barra lateral - Versión móvil */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div 
                className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                onClick={toggleSidebar}
              />
              <div className="fixed inset-y-0 left-0 z-40 w-64 bg-background">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="text-xl font-bold">Sistema de Gestión</div>
                  <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="py-1 px-2">
                  <div className="space-y-2">
                    {filteredNavCategories.map((category, index) => (
                      <div key={index} className="space-y-1">
                        {category.name && (
                          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3">
                            {category.name}
                          </h3>
                        )}
                        {category.items.length > 0 && (
                          <ul className="space-y-0.5">
                            {category.items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={toggleSidebar}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-all hover:bg-accent",
                                    pathname && item.isActive(pathname) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                                  )}
                                >
                                  {item.icon}
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </nav>
              </div>
            </div>
          )}
          
          {/* Contenido principal */}
          <main className="flex-1 md:ml-0 p-0 overflow-y-auto">
            {children}
          </main>
        </div>
        </div>
        <Toaster />
      </div>
    </ProtectedRoute>
  );
}