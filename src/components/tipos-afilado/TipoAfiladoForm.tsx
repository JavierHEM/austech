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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { getTipoAfiladoById, createTipoAfilado, updateTipoAfilado } from '@/services/tipoAfiladoService';

interface TipoAfiladoFormProps {
  tipoId?: number;
  isEditing?: boolean;
}

// Definir esquema de validación con zod
const formSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es obligatorio' }),
  descripcion: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

export default function TipoAfiladoForm({ tipoId, isEditing = false }: TipoAfiladoFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Configurar el formulario con validación usando zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      descripcion: ''
    }
  });

  // Cargar datos del tipo de afilado si estamos en modo edición
  useEffect(() => {
    if (isEditing && tipoId) {
      const fetchTipoAfilado = async () => {
        try {
          // Usar el servicio para obtener el tipo de afilado
          const tipoAfilado = await getTipoAfiladoById(tipoId);

          if (tipoAfilado) {
            // Establecer los valores en el formulario
            form.setValue('nombre', tipoAfilado.nombre || '');
            form.setValue('descripcion', tipoAfilado.descripcion || '');

            // Registrar los datos cargados para depuración
            console.log('Tipo de afilado cargado:', tipoAfilado);
          }

          setInitialLoading(false);
        } catch (error) {
          console.error('Error al cargar tipo de afilado:', error);
          toast({
            title: 'Error',
            description: 'No se pudo cargar la información del tipo de afilado.',
            variant: 'destructive'
          });
          setInitialLoading(false);
        }
      };

      fetchTipoAfilado();
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, tipoId, form, toast]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    
    try {
      // Registrar los datos que se enviarán para depuración
      console.log('Datos a enviar:', {
        nombre: data.nombre,
        descripcion: data.descripcion || ''
      });
      
      if (isEditing && tipoId) {
        // Actualizar tipo de afilado existente
        await updateTipoAfilado(tipoId, {
          nombre: data.nombre,
          descripcion: data.descripcion || ''
        });
        
        toast({
          title: 'Tipo de afilado actualizado',
          description: 'El tipo de afilado ha sido actualizado exitosamente.'
        });
      } else {
        // Crear nuevo tipo de afilado
        await createTipoAfilado({
          nombre: data.nombre,
          descripcion: data.descripcion || ''
        });
        
        toast({
          title: 'Tipo de afilado creado',
          description: 'El tipo de afilado ha sido creado exitosamente.'
        });
      }
      
      // Redireccionar a la lista de tipos de afilado
      router.push('/tipos-afilado');
      router.refresh();
    } catch (error: any) {
      console.error('Error al guardar tipo de afilado:', error);
      
      // Mostrar mensaje de error más específico si está disponible
      const errorMessage = error.message || error.details || 'No se pudo guardar el tipo de afilado. Intente nuevamente.';
      
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
        <CardTitle>{isEditing ? 'Editar' : 'Crear'} Tipo de Afilado</CardTitle>
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
                    <Input placeholder="Ingrese el nombre del tipo de afilado" {...field} />
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
                      placeholder="Ingrese una descripción para este tipo de afilado" 
                      className="resize-none" 
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/tipos-afilado')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'} Tipo de Afilado
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
