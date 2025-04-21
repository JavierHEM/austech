'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { supabase } from '@/lib/supabase-client';

interface TipoSierraFormProps {
  tipoId?: number;
  isEditing?: boolean;
}

// Definir esquema de validación con zod
const formSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es obligatorio' }),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

export default function TipoSierraForm({ tipoId, isEditing = false }: TipoSierraFormProps) {

  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Configurar el formulario con validación usando zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true
    }
  });

  // Cargar datos del tipo de sierra si estamos en modo edición
  useEffect(() => {
    if (isEditing && tipoId) {
      const fetchTipoSierra = async () => {
        try {
          const { data, error } = await supabase
            .from('tipos_sierra')
            .select('*')
            .eq('id', tipoId)
            .single();

          if (error) throw error;

          if (data) {
            // Establecer los valores en el formulario
            form.setValue('nombre', data.nombre || '');
            form.setValue('descripcion', data.descripcion || '');
            form.setValue('activo', data.activo === true);
          }

          setInitialLoading(false);
        } catch (error) {
          console.error('Error al cargar tipo de sierra:', error);
          toast({
            title: 'Error',
            description: 'No se pudo cargar la información del tipo de sierra.',
            variant: 'destructive'
          });
          setInitialLoading(false);
        }
      };

      fetchTipoSierra();
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, tipoId, form, toast, supabase]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    
    try {
      if (isEditing && tipoId) {
        // Actualizar tipo de sierra existente
        const { error } = await supabase
          .from('tipos_sierra')
          .update({
            nombre: data.nombre,
            descripcion: data.descripcion || '',
            activo: data.activo,
            modificado_en: new Date().toISOString()
          })
          .eq('id', tipoId);
        
        if (error) throw error;
        
        toast({
          title: 'Tipo de sierra actualizado',
          description: 'El tipo de sierra ha sido actualizado exitosamente.'
        });
      } else {
        // Crear nuevo tipo de sierra
        const { error } = await supabase
          .from('tipos_sierra')
          .insert({
            nombre: data.nombre,
            descripcion: data.descripcion || '',
            activo: data.activo,
            creado_en: new Date().toISOString(),
            modificado_en: new Date().toISOString()
          });
        
        if (error) throw error;
        
        toast({
          title: 'Tipo de sierra creado',
          description: 'El tipo de sierra ha sido creado exitosamente.'
        });
      }
      
      // Redireccionar a la lista de tipos de sierra
      router.push('/tipos-sierra');
      router.refresh();
    } catch (error: any) {
      console.error('Error al guardar tipo de sierra:', error);
      
      // Mostrar mensaje de error más específico si está disponible
      const errorMessage = error.message || error.details || 'No se pudo guardar el tipo de sierra. Intente nuevamente.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  });

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando información...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar' : 'Crear'} Tipo de Sierra</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del tipo de sierra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ingrese una descripción para este tipo de sierra" 
                      className="resize-none" 
                      {...field}
                      value={field.value || ''}
                    />
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
              onClick={() => router.push('/tipos-sierra')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'} Tipo de Sierra
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
