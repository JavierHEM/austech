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

// Interfaz para el formulario
interface EmpresaFormData {
  razon_social: string;
  rut: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
}

interface EmpresaFormProps {
  empresaId?: number;
  isEditing?: boolean;
}

export default function EmpresaForm({ empresaId, isEditing = false }: EmpresaFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Configurar el formulario
  const form = useForm<EmpresaFormData>({
    defaultValues: {
      razon_social: '',
      rut: '',
      direccion: '',
      telefono: '',
      email: '',
      activo: true
    }
  });

  // Cargar datos de la empresa si estamos en modo edición
  useEffect(() => {
    if (isEditing && empresaId) {
      const fetchEmpresa = async () => {
        try {
          const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single();

          if (error) throw error;

          if (data) {
            // Establecer los valores en el formulario
            form.setValue('razon_social', data.razon_social);
            form.setValue('rut', data.rut);
            form.setValue('direccion', data.direccion);
            form.setValue('telefono', data.telefono);
            form.setValue('email', data.email);
            form.setValue('activo', data.activo);
          }

          setInitialLoading(false);
        } catch (error) {
          console.error('Error al cargar empresa:', error);
          toast({
            title: 'Error',
            description: 'No se pudo cargar la información de la empresa.',
            variant: 'destructive'
          });
          setInitialLoading(false);
        }
      };

      fetchEmpresa();
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, empresaId, form, toast, supabase]);

  const onSubmit = async (data: EmpresaFormData) => {
    setLoading(true);
    
    try {
      if (isEditing && empresaId) {
        // Actualizar empresa existente
        const { error } = await supabase
          .from('empresas')
          .update({
            razon_social: data.razon_social,
            rut: data.rut,
            direccion: data.direccion,
            telefono: data.telefono,
            email: data.email,
            activo: data.activo,
            modificado_en: new Date().toISOString()
          })
          .eq('id', empresaId);

        if (error) throw error;
      } else {
        // Crear nueva empresa
        const { error } = await supabase
          .from('empresas')
          .insert({
            razon_social: data.razon_social,
            rut: data.rut,
            direccion: data.direccion,
            telefono: data.telefono,
            email: data.email,
            activo: data.activo,
            creado_en: new Date().toISOString(),
            modificado_en: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: `Empresa ${isEditing ? 'actualizada' : 'creada'}`,
        description: `La empresa ha sido ${isEditing ? 'actualizada' : 'creada'} exitosamente.`
      });

      // Redirigir a la lista de empresas
      router.push('/empresas');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la empresa. Intente nuevamente.`,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // Validar formulario antes de enviar
  const validateAndSubmit = () => {
    const razon_social = form.getValues('razon_social');
    const rut = form.getValues('rut');
    const direccion = form.getValues('direccion');
    const telefono = form.getValues('telefono');
    const email = form.getValues('email');
    
    let isValid = true;
    
    // Validación de razón social
    if (!razon_social || razon_social.length < 3) {
      form.setError('razon_social', { 
        type: 'manual', 
        message: 'La razón social debe tener al menos 3 caracteres' 
      });
      isValid = false;
    }
    
    // Validación de RUT
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
    if (!rut || !rutRegex.test(rut)) {
      form.setError('rut', { 
        type: 'manual', 
        message: 'El RUT debe tener un formato válido (ej: 12.345.678-9)' 
      });
      isValid = false;
    }
    
    // Validación de dirección
    if (!direccion || direccion.length < 5) {
      form.setError('direccion', { 
        type: 'manual', 
        message: 'La dirección debe tener al menos 5 caracteres' 
      });
      isValid = false;
    }
    
    // Validación de teléfono
    const telefonoRegex = /^\+?[0-9\s]+$/;
    if (!telefono || !telefonoRegex.test(telefono) || telefono.length < 8) {
      form.setError('telefono', { 
        type: 'manual', 
        message: 'Ingrese un número de teléfono válido' 
      });
      isValid = false;
    }
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      form.setError('email', { 
        type: 'manual', 
        message: 'Ingrese una dirección de correo electrónico válida' 
      });
      isValid = false;
    }
    
    if (isValid) {
      onSubmit(form.getValues());
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar' : 'Crear'} Empresa</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(validateAndSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="razon_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la razón social" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 12.345.678-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="correo@ejemplo.cl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
              onClick={() => router.push('/empresas')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'} Empresa
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}