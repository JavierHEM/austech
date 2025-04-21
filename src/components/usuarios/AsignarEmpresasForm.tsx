'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Empresa {
  id: string;
  nombre: string;
}

interface UsuarioEmpresa {
  id: string;
  usuario_id: string;
  empresa_id: string;
}

interface AsignarEmpresasFormProps {
  usuarioId: string;
  usuarioEmail: string;
}

export default function AsignarEmpresasForm({ usuarioId, usuarioEmail }: AsignarEmpresasFormProps) {
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresasAsignadas, setEmpresasAsignadas] = useState<string[]>([]);
  const [relaciones, setRelaciones] = useState<UsuarioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Obtener todas las empresas
        const supabase = createClient();
        const { data: empresasData, error: empresasError } = await supabase
          .from('empresas')
          .select('id, nombre')
          .order('nombre');

        if (empresasError) {
          throw empresasError;
        }

        // Obtener las relaciones usuario-empresa para este usuario
        const { data: relacionesData, error: relacionesError } = await supabase
          .from('usuarios_empresas')
          .select('id, usuario_id, empresa_id')
          .eq('usuario_id', usuarioId);

        if (relacionesError) {
          throw relacionesError;
        }

        setEmpresas(empresasData || []);
        setRelaciones(relacionesData || []);
        setEmpresasAsignadas(relacionesData?.map(r => r.empresa_id) || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos. Intenta nuevamente.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [usuarioId, toast]);

  const handleToggleEmpresa = (empresaId: string) => {
    setEmpresasAsignadas(prev => {
      if (prev.includes(empresaId)) {
        return prev.filter(id => id !== empresaId);
      } else {
        return [...prev, empresaId];
      }
    });
  };

  const handleGuardar = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      // Empresas a eliminar (estaban asignadas pero ya no están en la selección)
      const empresasAEliminar = relaciones.filter(
        r => !empresasAsignadas.includes(r.empresa_id)
      );
      
      // Empresas a agregar (están en la selección pero no estaban asignadas)
      const empresasAAgregar = empresasAsignadas.filter(
        empresaId => !relaciones.some(r => r.empresa_id === empresaId)
      );
      
      // Eliminar relaciones
      for (const relacion of empresasAEliminar) {
        const { error } = await supabase
          .from('usuarios_empresas')
          .delete()
          .eq('id', relacion.id);
          
        if (error) {
          throw error;
        }
      }
      
      // Agregar nuevas relaciones
      if (empresasAAgregar.length > 0) {
        const nuevasRelaciones = empresasAAgregar.map(empresaId => ({
          usuario_id: usuarioId,
          empresa_id: empresaId
        }));
        
        const { error } = await supabase
          .from('usuarios_empresas')
          .insert(nuevasRelaciones);
          
        if (error) {
          throw error;
        }
      }
      
      // Actualizar la lista de relaciones
      const { data: nuevasRelaciones, error: relacionesError } = await supabase
        .from('usuarios_empresas')
        .select('id, usuario_id, empresa_id')
        .eq('usuario_id', usuarioId);
        
      if (relacionesError) {
        throw relacionesError;
      }
      
      setRelaciones(nuevasRelaciones || []);
      
      toast({
        title: 'Cambios guardados',
        description: 'Las empresas asignadas se han actualizado correctamente.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios. Intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignar Empresas</CardTitle>
        <CardDescription>
          Selecciona las empresas a las que el usuario {usuarioEmail} tendrá acceso
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-96 overflow-y-auto p-2">
              {empresas.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay empresas disponibles</p>
              ) : (
                empresas.map(empresa => (
                  <div key={empresa.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`empresa-${empresa.id}`}
                      checked={empresasAsignadas.includes(empresa.id)}
                      onCheckedChange={() => handleToggleEmpresa(empresa.id)}
                    />
                    <Label 
                      htmlFor={`empresa-${empresa.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {empresa.nombre}
                    </Label>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleGuardar} 
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
