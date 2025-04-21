'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// Importa useToast desde la ubicación correcta - actualízala según lo que encuentres
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

// Tipo simplificado para el formulario
interface UserFormData {
  nombre: string;
  email: string;
  password: string;
  role_id: string;
  activo: boolean;
}

interface UserFormProps {
  userId?: string;
  isEditing?: boolean;
}

export default function UserForm({ userId, isEditing = false }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Usar un enfoque más simple con useForm
  const form = useForm<UserFormData>({
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      role_id: '',
      activo: true
    }
  });

  // Cargar roles para el select
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('id, nombre')
          .order('nombre');

        if (error) throw error;

        setRoles(data || []);
        setLoadingRoles(false);
      } catch (error) {
        console.error('Error al cargar roles:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los roles.',
          variant: 'destructive',
        });
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [supabase, toast]);

  // Cargar datos del usuario si estamos en modo edición
  useEffect(() => {
    if (isEditing && userId) {
      const fetchUser = async () => {
        try {
          setInitialLoading(true);
          console.log('Cargando usuario con ID:', userId);
          
          console.log('Cargando usuario con ID:', userId);
          
          // Consultar por ID sin convertir (podría ser UUID o número)
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

          if (userError) {
            console.error('Error de Supabase al cargar usuario:', userError);
            throw userError;
          }

          if (!userData) {
            console.error('No se encontró el usuario con ID:', userId);
            throw new Error('Usuario no encontrado');
          }
          
          console.log('Datos del usuario cargados:', userData);
          
          // Establecer los valores en el formulario
          form.setValue('nombre', userData.nombre || '');
          form.setValue('email', userData.email || '');
          form.setValue('password', ''); // No mostramos la contraseña existente
          form.setValue('role_id', (userData.role_id || '').toString());
          form.setValue('activo', userData.activo !== false);
          
          toast({
            title: 'Éxito',
            description: 'Información del usuario cargada correctamente.',
            variant: 'default'
          });
        } catch (error: any) {
          console.error('Error al cargar usuario:', error);
          toast({
            title: 'Error',
            description: `No se pudo cargar la información del usuario: ${error.message || 'Error desconocido'}`,
            variant: 'destructive'
          });
        } finally {
          setInitialLoading(false);
        }
      };

      fetchUser();
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, userId, form, toast, supabase]);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    
    try {
      if (isEditing && userId) {
        // Preparar datos para actualización
        const updateData: any = {
          nombre: data.nombre,
          email: data.email,
          role_id: parseInt(data.role_id),
          activo: data.activo,
          modificado_en: new Date().toISOString()
        };

        // Solo incluir contraseña si se proporciona una nueva
        if (data.password && data.password.trim() !== '') {
          updateData.password = data.password;
        }

        // Actualizar usuario existente
        const { error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', userId);

        if (error) throw error;
      } else {
        // Validar contraseña para nuevos usuarios
        if (!data.password || data.password.trim() === '') {
          toast({
            title: 'Error',
            description: 'La contraseña es requerida para nuevos usuarios.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        // Crear nuevo usuario
        const { error } = await supabase
          .from('usuarios')
          .insert({
            nombre: data.nombre,
            email: data.email,
            password: data.password,
            role_id: parseInt(data.role_id),
            activo: data.activo,
            creado_en: new Date().toISOString(),
            modificado_en: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: `Usuario ${isEditing ? 'actualizado' : 'creado'}`,
        description: `El usuario ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`
      });

      // Redirigir a la lista de usuarios
      router.push('/usuarios');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} el usuario. Intente nuevamente.`,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  if (initialLoading || loadingRoles) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Validar formulario antes de enviar
  const validateAndSubmit = () => {
    const nombre = form.getValues('nombre');
    const email = form.getValues('email');
    const role_id = form.getValues('role_id');
    
    let isValid = true;
    
    if (!nombre || nombre.length < 3) {
      form.setError('nombre', { 
        type: 'manual', 
        message: 'El nombre debe tener al menos 3 caracteres' 
      });
      isValid = false;
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.setError('email', { 
        type: 'manual', 
        message: 'Ingrese un correo electrónico válido' 
      });
      isValid = false;
    }
    
    if (!role_id) {
      form.setError('role_id', { 
        type: 'manual', 
        message: 'Debe seleccionar un rol' 
      });
      isValid = false;
    }
    
    if (!isEditing) {
      const password = form.getValues('password');
      if (!password || password.length < 6) {
        form.setError('password', { 
          type: 'manual', 
          message: 'La contraseña debe tener al menos 6 caracteres' 
        });
        isValid = false;
      }
    }
    
    if (isValid) {
      onSubmit(form.getValues());
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</CardTitle>
      </CardHeader>
      <form onSubmit={(e) => { e.preventDefault(); validateAndSubmit(); }}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ingrese el nombre completo" 
                  {...form.register('nombre')}
                />
              </FormControl>
              {form.formState.errors.nombre && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </FormItem>

            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="correo@ejemplo.cl" 
                  {...form.register('email')}
                />
              </FormControl>
              {form.formState.errors.email && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </FormItem>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormItem>
              <FormLabel>
                {isEditing ? 'Contraseña (Dejar en blanco para mantener la actual)' : 'Contraseña'}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={isEditing ? "••••••••" : "Ingrese la contraseña"} 
                  {...form.register('password')}
                />
              </FormControl>
              {form.formState.errors.password && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </FormItem>

            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select 
                value={form.watch('role_id')} 
                onValueChange={(value) => form.setValue('role_id', value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    {roles.map(rol => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {form.formState.errors.role_id && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.role_id.message}
                </p>
              )}
            </FormItem>
          </div>

          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Estado</FormLabel>
              <div className="text-sm text-muted-foreground">
                {form.watch('activo') ? 'Activo' : 'Inactivo'}
              </div>
            </div>
            <FormControl>
              <Switch
                checked={form.watch('activo')}
                onCheckedChange={(checked) => form.setValue('activo', checked)}
              />
            </FormControl>
          </FormItem>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/usuarios')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Actualizar' : 'Crear'} Usuario
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}