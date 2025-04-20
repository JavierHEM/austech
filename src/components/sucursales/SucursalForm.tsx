'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Empresa } from '@/types/empresa';
import { SucursalFormValues } from '@/types/sucursal';

interface SucursalFormProps {
  sucursalId?: number;
  isEditing?: boolean;
  empresaId?: number;
}

export default function SucursalForm({ sucursalId, isEditing = false, empresaId }: SucursalFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  // Configurar el formulario
  const form = useForm<SucursalFormValues>({
    defaultValues: {
      empresa_id: empresaId || 0,
      nombre: '',
      direccion: '',
      telefono: '',
      activo: true
    }
  });

  // Cargar empresas para el selector
  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('activo', true)
          .order('razon_social', { ascending: true });

        if (error) throw error;
        
        setEmpresas(data || []);
        setLoadingEmpresas(false);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las empresas.',
          variant: 'destructive'
        });
        setLoadingEmpresas(false);
      }
    };

    fetchEmpresas();
  }, [supabase, toast]);

  // Cargar datos de la sucursal si estamos en modo edición
  useEffect(() => {
    if (isEditing && sucursalId) {
      const fetchSucursal = async () => {
        try {
          const { data, error } = await supabase
            .from('sucursales')
            .select('*')
            .eq('id', sucursalId)
            .single();

          if (error) throw error;

          if (data) {
            // Establecer los valores en el formulario
            // Si se proporcionó un empresaId, usarlo en lugar del valor de la base de datos
            if (!empresaId) {
              form.setValue('empresa_id', data.empresa_id);
            }
            form.setValue('nombre', data.nombre);
            form.setValue('direccion', data.direccion);
            form.setValue('telefono', data.telefono);
            form.setValue('activo', data.activo);
          }

          setInitialLoading(false);
        } catch (error) {
          console.error('Error al cargar sucursal:', error);
          toast({
            title: 'Error',
            description: 'No se pudo cargar la información de la sucursal.',
            variant: 'destructive'
          });
          setInitialLoading(false);
        }
      };

      fetchSucursal();
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, sucursalId, form, toast, supabase, empresaId]);

  const onSubmit = async (data: SucursalFormValues) => {
    // Si se proporcionó un ID de empresa, usarlo en lugar del valor del formulario
    const finalEmpresaId = empresaId || data.empresa_id;
    
    // Validar que se haya seleccionado una empresa
    if (!finalEmpresaId) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar una empresa.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isEditing && sucursalId) {
        // Actualizar sucursal existente
        const { error } = await supabase
          .from('sucursales')
          .update({
            empresa_id: finalEmpresaId,
            nombre: data.nombre,
            direccion: data.direccion,
            telefono: data.telefono,
            activo: data.activo,
            modificado_en: new Date().toISOString()
          })
          .eq('id', sucursalId);

        if (error) throw error;
      } else {
        // Crear nueva sucursal
        const { error } = await supabase
          .from('sucursales')
          .insert({
            empresa_id: finalEmpresaId,
            nombre: data.nombre,
            direccion: data.direccion,
            telefono: data.telefono,
            activo: data.activo,
            creado_en: new Date().toISOString(),
            modificado_en: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: `Sucursal ${isEditing ? 'actualizada' : 'creada'}`,
        description: `La sucursal ha sido ${isEditing ? 'actualizada' : 'creada'} exitosamente.`
      });

      // Redirigir a la lista de sucursales
      router.push('/sucursales');
    } catch (error) {
      console.error('Error al guardar sucursal:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la sucursal.`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar' : 'Crear'} Sucursal</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {!empresaId ? (
              <FormField
                control={form.control}
                name="empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={loadingEmpresas || isEditing}
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      >
                        <option value="">Seleccione una empresa</option>
                        {empresas.map(empresa => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.razon_social}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre de la sucursal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ingrese la dirección completa" 
                      className="resize-none" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: +56 9 1234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Estado</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/sucursales')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'} Sucursal
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
