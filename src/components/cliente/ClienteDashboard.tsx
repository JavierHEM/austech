'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ClienteStats, datosEjemplo, fetchClienteStats, getEmpresaIdFromUser, checkSupabaseConnection } from '@/services/clienteService';
import { EstadisticasCard } from './EstadisticasCard';
import { UltimosAfilados } from './UltimosAfilados';
import { ProximosAfilados } from './ProximosAfilados';
import { EstadisticasGraficos } from './EstadisticasGraficos';
import { ClienteReporte } from './ClienteReporte';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart3, Scissors, Activity, Clock, FileText } from 'lucide-react';

export function ClienteDashboard() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClienteStats>(datosEjemplo);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  useEffect(() => {
    setStats(datosEjemplo);

    const forceRenderTimeout = setTimeout(() => {
      if (loading) {
        console.log('Forzando renderizado después de tiempo de espera');
        setLoading(false);
      }
    }, 10000);

    const cargarDatosReales = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!session?.user?.id) {
          console.log('No hay sesión activa, usando datos de ejemplo');
          setLoading(false);
          return;
        }

        // Verificar la conexión con Supabase antes de continuar
        const conexionOk = await checkSupabaseConnection();
        if (!conexionOk) {
          console.log('No hay conexión con Supabase, usando datos de ejemplo');
          toast({
            title: 'Sin conexión a la base de datos',
            description: 'Mostrando datos de ejemplo',
            variant: 'default',
          });
          setLoading(false);
          return;
        }

        const idEmpresa = await getEmpresaIdFromUser(session.user.id);

        if (!idEmpresa) {
          console.log('No se pudo obtener el ID de empresa, usando datos de ejemplo');
          setLoading(false);
          return;
        }

        setEmpresaId(idEmpresa);
        
        try {
          const datosReales = await fetchClienteStats(idEmpresa);

          if (datosReales) {
            setStats(datosReales);
          } else {
            console.log('No se obtuvieron datos reales, manteniendo datos de ejemplo');
          }
        } catch (statsError) {
          console.log('Error al obtener estadísticas, usando datos de ejemplo', statsError);
          // No establecer error para el usuario, simplemente usar datos de ejemplo
        }
      } catch (error) {
        console.error('Error al cargar datos reales:', error);
        // No mostrar error al usuario, simplemente usar datos de ejemplo
      } finally {
        setLoading(false);
      }
    };

    cargarDatosReales();

    return () => clearTimeout(forceRenderTimeout);
  }, [session]);

  const handleReload = async () => {
    setLoading(true);
    try {
      if (empresaId) {
        const datosReales = await fetchClienteStats(empresaId);
        setStats(datosReales);
        toast({
          title: 'Datos actualizados',
          description: 'Se han actualizado los datos del dashboard',
        });
      }
    } catch (error) {
      console.error('Error al recargar datos:', error);
      toast({
        title: 'Error al actualizar',
        description: 'No se pudieron actualizar los datos. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Panel de Cliente</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reportes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {error ? (
            <div className="rounded-lg bg-destructive/15 p-4 text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-2" onClick={handleReload}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <EstadisticasCard
                  title="Total Sierras"
                  value={stats.totalSierras}
                  loading={loading}
                  icon={<Scissors className="h-5 w-5 text-primary" />}
                />
                <EstadisticasCard
                  title="Sierras Activas"
                  value={stats.sierrasActivas}
                  loading={loading}
                  icon={<Activity className="h-5 w-5 text-green-500" />}
                />
                <EstadisticasCard
                  title="Afilados Pendientes"
                  value={stats.afiladosPendientes}
                  loading={loading}
                  icon={<Clock className="h-5 w-5 text-amber-500" />}
                />
                <EstadisticasCard
                  title="Afilados Completados"
                  value={stats.totalAfilados}
                  loading={loading}
                  icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UltimosAfilados items={stats.ultimosAfilados} loading={loading} />
                <ProximosAfilados items={stats.proximosAfilados} loading={loading} />
              </div>

              <EstadisticasGraficos 
                afiladosPorMes={stats.afiladosPorMes} 
                sucursalesStats={stats.sucursalesStats} 
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <ClienteReporte />
        </TabsContent>
      </Tabs>
    </div>
  );
}
