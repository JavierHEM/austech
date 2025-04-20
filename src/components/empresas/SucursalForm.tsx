'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

// Interfaz para el formulario
interface SucursalFormData {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
}

interface SucursalFormProps {
  empresaId: number;
  sucursalId?: number;
  isEditing?: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function SucursalForm({ 
  empresaId, 
  sucursalId, 
  isEditing = false,
  onCancel,
  onSuccess
}: SucursalFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Usar un enfoque más simple con useForm
  const form = useForm<SucursalFormData>({
    defaultValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      activo: true
    }
  });

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
            form.setValue('nombre', data.nombre);
            form.setValue('direccion', data.direccion);
            form.setValue('telefono', data.telefono);
            form.setValue('email', data.email);
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
  }, [isEditing, sucursalId, empresaId, form, toast, supabase]);

  const onSubmit = async (data: SucursalFormData & { empresa_id?: number }) => {
    setLoading(true);
    
    try {
      if (isEditing && sucursalId) {
        // Actualizar sucursal existente
        const { error } = await supabase
          .from('sucursales')
          .update({
            nombre: data.nombre,
            direccion: data.direccion,
            telefono: data.telefono,
            email: data.email,
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
            empresa_id: empresaId, // Usar empresaId de las props
            nombre: data.nombre,
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
        title: `Sucursal ${isEditing ? 'actualizada' : 'creada'}`,
        description: `La sucursal ha sido ${isEditing ? 'actualizada' : 'creada'} exitosamente.`
      });
      
      // Llamar al callback de éxito
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la sucursal. Intente nuevamente.`,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };
    

// Validar formulario antes de enviar
const validateAndSubmit = () => {
  const nombre = form.getValues('nombre');
  const direccion = form.getValues('direccion');
  const telefono = form.getValues('telefono');
  const email = form.getValues('email');
  
  let isValid = true;
  
  // Validación de nombre
  if (!nombre || nombre.length < 3) {
    form.setError('nombre', { 
      type: 'manual', 
      message: 'El nombre debe tener al menos 3 caracteres' 
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
    // Asegurarse de incluir empresa_id en los datos
    const formData = {
      ...form.getValues(),
      empresa_id: empresaId
    };
    onSubmit(formData);
  }
};

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Sucursal' : 'Crear Nueva Sucursal'}</CardTitle>
      </CardHeader>
      <form onSubmit={(e) => { e.preventDefault(); validateAndSubmit(); }}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="nombre"
                placeholder="Ingrese el nombre de la sucursal"
                className="mt-1"
                {...form.register('nombre')}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="direccion" className="text-sm font-medium">
                Dirección
              </label>
              <Textarea
                id="direccion"
                placeholder="Ingrese la dirección completa"
                className="resize-none mt-1"
                {...form.register('direccion')}
              />
              {form.formState.errors.direccion && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.direccion.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="telefono" className="text-sm font-medium">
                Teléfono
              </label>
              <Input
                id="telefono"
                placeholder="Ej: +56 9 1234 5678"
                className="mt-1"
                {...form.register('telefono')}
              />
              {form.formState.errors.telefono && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.telefono.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.cl"
                className="mt-1"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Estado</label>
                <div className="text-sm text-muted-foreground">
                  {form.watch('activo') ? 'Activo' : 'Inactivo'}
                </div>
              </div>
              <Switch
                checked={form.watch('activo')}
                onCheckedChange={(checked) => form.setValue('activo', checked)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
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
    </Card>
  );
}