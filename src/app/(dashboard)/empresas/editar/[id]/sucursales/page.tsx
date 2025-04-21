'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Building } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SucursalesTable from '@/components/empresas/SucursalesTable';
import SucursalForm from '@/components/empresas/SucursalForm';
import {supabase } from '@/lib/supabase-client';

// Definir una interfaz para la empresa (ya que no se exporta de types/empresa)
interface Empresa {
  id: number;
  razon_social: string;
  rut: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  creado_en: string;
  modificado_en: string;
}

interface SucursalesPageProps {
  params: {
    id: string;
  };
}

export default function SucursalesPage({ params }: SucursalesPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const empresaId = parseInt(params.id);
  
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listado');
  const [currentSucursalId, setCurrentSucursalId] = useState<number | undefined>(undefined);

  const fetchEmpresa = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();
      
      if (error) throw error;
      
      setEmpresa(data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar la empresa:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la empresa.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresa();
  }, [empresaId]);

  const handleNewSucursal = () => {
    setCurrentSucursalId(undefined);
    setActiveTab('formulario');
  };

  const handleEditSucursal = (sucursalId: number) => {
    setCurrentSucursalId(sucursalId);
    setActiveTab('formulario');
  };

  const handleCancelForm = () => {
    setActiveTab('listado');
    setCurrentSucursalId(undefined);
  };

  const handleFormSuccess = () => {
    setActiveTab('listado');
    setCurrentSucursalId(undefined);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-[50vh]">
          Cargando información...
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-[50vh]">
          Empresa no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="mr-2"
        >
          <Link href="/empresas">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver a Empresas
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center">
          <Building className="h-6 w-6 mr-2" />
          Sucursales: {empresa.razon_social}
        </h1>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">RUT</p>
              <p>{empresa.rut}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Teléfono</p>
              <p>{empresa.telefono}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p>{empresa.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="listado">Listado de Sucursales</TabsTrigger>
          <TabsTrigger value="formulario">
            {currentSucursalId ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="listado">
          <SucursalesTable 
            empresaId={empresaId} 
            onNew={handleNewSucursal}
            onEdit={handleEditSucursal}
          />
        </TabsContent>
        
        <TabsContent value="formulario">
          <SucursalForm 
            empresaId={empresaId}
            sucursalId={currentSucursalId}
            isEditing={!!currentSucursalId}
            onCancel={handleCancelForm}
            onSuccess={handleFormSuccess}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}