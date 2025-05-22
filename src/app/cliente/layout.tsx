'use client';

import { useAuth } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { ModeToggle } from '@/components/mode-toggle';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, session, role } = useAuth();
  const router = useRouter();

  // Verificar que el usuario sea cliente
  useEffect(() => {
    console.log('Verificando acceso a dashboard de cliente. Sesión:', !!session, 'Rol:', role);
    
    // Si no hay sesión, esperar un momento antes de redirigir
    // Esto da tiempo a que la sesión se cargue completamente
    if (!session) {
      const timer = setTimeout(() => {
        // Solo redirigir si todavía no hay sesión después del tiempo de espera
        if (!session) {
          console.log('No hay sesión activa después de esperar, redirigiendo a login');
          router.replace('/login');
        }
      }, 2000); // Esperar 2 segundos
      
      return () => clearTimeout(timer);
    }
    
    // Si hay sesión pero no hay rol, intentar obtenerlo directamente
    if (session && !role && session.user) {
      console.log('Hay sesión pero no rol, intentando obtener rol para:', session.user.email);
      // No bloquear el acceso, permitir que el hook use-auth maneje esto
      return;
    }
    
    // Solo redirigir si hay un rol definido y no es cliente
    if (role && role !== 'cliente') {
      console.log('Redirigiendo a dashboard porque el rol es:', role);
      router.replace('/dashboard');
    } else if (role === 'cliente') {
      console.log('Usuario con rol cliente verificado correctamente');
    }
  }, [session, role, router]);

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior fija */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/cliente" className="flex items-center">
              <img 
                src="/logo-austech.png" 
                alt="Austech Logo" 
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Usuario: {session?.user?.email} | Rol: {role}
            </div>
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
