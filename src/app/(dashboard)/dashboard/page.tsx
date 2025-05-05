'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Map, FileText, ArrowUpRight, Scissors, Package, PackageX } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import SalidasBajasMasivasResumen from '@/components/dashboard/SalidasBajasMasivasResumen';
import { useRouter } from 'next/navigation';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  link: string;
  loading: boolean;
}

function StatCard({ title, value, description, icon, link, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-7 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
      <CardFooter>
        <Link href={link} className="w-full">
          <Button variant="outline" className="w-full flex items-center justify-between">
            Ver detalles
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function DashboardPage() {
  const { session, role } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    empresas: 0,
    sucursales: 0,
    sierras: 0,
    afilados: 0
  });

  // Redirigir a los usuarios con rol 'cliente' a su dashboard específico
  useEffect(() => {
    // Solo redirigir si hay una sesión y el rol es cliente
    if (session && role === 'cliente') {
      console.log('Redirigiendo a panel de cliente porque el rol es:', role);
      router.replace('/cliente');
      return;
    }
  }, [session, role, router]);

  // Determinar los roles del usuario
  const isGerente = role === 'gerente';
  const isAdministrador = role === 'administrador';
  const isCliente = role === 'cliente';


  // Función para cargar estadísticas
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Consultas a Supabase para obtener estadísticas
      const [
        empresasResult,
        sucursalesResult,
        sierrasResult,
        afiladosResult
      ] = await Promise.all([
        // Contar empresas activas
        supabase
          .from('empresas')
          .select('id', { count: 'exact', head: true })
          .eq('activo', true),
        
        // Contar sucursales activas
        supabase
          .from('sucursales')
          .select('id', { count: 'exact', head: true })
          .eq('activo', true),
        
        // Contar sierras activas
        supabase
          .from('sierras')
          .select('id', { count: 'exact', head: true })
          .eq('activo', true),
        
        // Contar afilados
        supabase
          .from('afilados')
          .select('id', { count: 'exact', head: true })
      ]);

      // Obtener los conteos de cada consulta
      setStats({
        empresas: empresasResult.count || 0,
        sucursales: sucursalesResult.count || 0,
        sierras: sierrasResult.count || 0,
        afilados: afiladosResult.count || 0
      });
      
      setLoading(false);
    } catch (error) {
      // console.error('Error al cargar estadísticas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas del dashboard.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión. Aquí puede ver un resumen general de la información.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {(isAdministrador || isGerente) && (
          <>
            <StatCard
              title="Empresas"
              value={stats.empresas}
              description="Total de empresas registradas"
              icon={<Building className="h-4 w-4" />}
              link="/empresas"
              loading={loading}
            />
            <StatCard
              title="Sucursales"
              value={stats.sucursales}
              description="Total de sucursales activas"
              icon={<Map className="h-4 w-4" />}
              link="/sucursales"
              loading={loading}
            />
          </>
        )}
        
        <StatCard
          title="Sierras"
          value={stats.sierras}
          description="Total de sierras registradas"
          icon={<Scissors className="h-4 w-4" />}
          link="/sierras"
          loading={loading}
        />
        <StatCard
          title="Afilados"
          value={stats.afilados}
          description="Total de afilados realizados"
          icon={<FileText className="h-4 w-4" />}
          link="/afilados"
          loading={loading}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Rápido</CardTitle>
            <CardDescription>
              Acceda rápidamente a las funciones más utilizadas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {isGerente && (
                <>
                  <Link href="/empresas/crear">
                    <Button variant="outline" className="w-full justify-start">
                      <Building className="mr-2 h-4 w-4" />
                      Nueva Empresa
                    </Button>
                  </Link>
                  <Link href="/sucursales/crear">
                    <Button variant="outline" className="w-full justify-start">
                      <Map className="mr-2 h-4 w-4" />
                      Nueva Sucursal
                    </Button>
                  </Link>
                </>
              )}
              <Link href="/sierras/crear">
                <Button variant="outline" className="w-full justify-start">
                <Scissors className="mr-2 h-4 w-4" />
                  Nueva Sierra
                </Button>
              </Link>
              <Link href="/afilados/crear">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Registrar Afilado
                </Button>
              </Link>
              
              {(isAdministrador || isGerente) && (
                <>
                  <Link href="/salidas-masivas/crear">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="mr-2 h-4 w-4" />
                      Nueva Salida Masiva
                    </Button>
                  </Link>
                  <Link href="/bajas-masivas/crear">
                    <Button variant="outline" className="w-full justify-start">
                      <PackageX className="mr-2 h-4 w-4" />
                      Nueva Baja Masiva
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Información sobre el estado actual del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-medium">Base de datos</div>
              <div className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Conectada
              </div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-medium">Último respaldo</div>
              <div className="text-sm">{new Date().toLocaleDateString()}, 06:00 AM</div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-medium">Versión del sistema</div>
              <div className="text-sm">2.0</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="font-medium">Usuario actual</div>
                <div className="text-sm">{session?.user?.email || 'No identificado'}</div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="font-medium">Rol</div>
                <div className="text-sm capitalize">{role || 'Sin rol asignado'}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="font-medium">Estado</div>
                <div className={`text-sm px-2 py-1 rounded-full ${session?.user ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'}`}>
                  {session?.user ? 'Activo' : 'No autenticado'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Agregar el componente de resumen de salidas y bajas masivas */}
      {(isAdministrador || isGerente) && (
        <div className="mt-8">
          <SalidasBajasMasivasResumen />
        </div>
      )}
    </div>
  );
}
