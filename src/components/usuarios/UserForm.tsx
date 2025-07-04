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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

// Tipo simplificado para el formulario
interface UserFormData {
  nombre: string;
  email: string;
  password: string;
  role_id: string;
  empresa_id: string;
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
  const [empresas, setEmpresas] = useState<{ id: number; razon_social: string }[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [showEmpresaField, setShowEmpresaField] = useState(false);

  // Usar un enfoque más simple con useForm
  const form = useForm<UserFormData>({
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      role_id: '',
      empresa_id: '',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);
  
  // Cargar empresas cuando sea necesario
  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('id, razon_social')
          .eq('activo', true)
          .order('razon_social');

        if (error) throw error;

        setEmpresas(data || []);
        setLoadingEmpresas(false);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las empresas.',
          variant: 'destructive',
        });
        setLoadingEmpresas(false);
      }
    };

    // Solo cargar empresas si se muestra el campo
    if (showEmpresaField) {
      fetchEmpresas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmpresaField, toast]);
  
  // Mostrar/ocultar campo de empresa según el rol seleccionado
  useEffect(() => {
    const selectedRoleId = form.watch('role_id');

    
    if (selectedRoleId) {
      const roleId = parseInt(selectedRoleId);

      
      // Asumiendo que el rol con ID 3 es 'Cliente' según tu trigger
      const isClientRole = roleId === 3;

      
      setShowEmpresaField(isClientRole);
      
      // Si no es cliente, limpiar el campo empresa_id
      if (!isClientRole) {
        form.setValue('empresa_id', '');
      } else {
        // Si es cliente, cargar las empresas si aún no se han cargado
        if (empresas.length === 0 && !loadingEmpresas) {
          const fetchEmpresas = async () => {
            setLoadingEmpresas(true);
            try {
              const { data, error } = await supabase
                .from('empresas')
                .select('id, razon_social')
                .eq('activo', true)
                .order('razon_social');
      
              if (error) throw error;


              setEmpresas(data || []);
              setLoadingEmpresas(false);
            } catch (error) {
              console.error('Error al cargar empresas:', error);
              toast({
                title: 'Error',
                description: 'No se pudieron cargar las empresas.',
                variant: 'destructive',
              });
              setLoadingEmpresas(false);
            }
          };
          
          fetchEmpresas();
        }
      }
    }
  // Extraemos la dependencia compleja a una variable para evitar el warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('role_id'), empresas.length, loadingEmpresas, toast]);

  // Cargar datos del usuario si estamos en modo edición
  useEffect(() => {
    if (isEditing && userId) {
      const fetchUser = async () => {
        try {
          setInitialLoading(true);

          
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
          

          
          // Establecer los valores en el formulario
          form.setValue('nombre', userData.nombre_completo || '');
          form.setValue('email', userData.email || '');
          form.setValue('password', ''); // No mostramos la contraseña existente
          form.setValue('role_id', (userData.rol_id || '').toString());
          form.setValue('empresa_id', (userData.empresa_id || '').toString());
          form.setValue('activo', userData.activo !== false);
          
          // Verificar si es rol cliente para mostrar campo de empresa
          const roleId = userData.rol_id;
          const isClientRole = roleId === 3;
          setShowEmpresaField(isClientRole);
          
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
  }, [isEditing, userId, form, toast]); // supabase es una constante externa, no es necesario incluirla como dependencia

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    
    try {
      if (isEditing && userId) {
        // Preparar datos para actualización
        const updateData: any = {
          nombre_completo: data.nombre,
          email: data.email,
          rol_id: parseInt(data.role_id),
          activo: data.activo,
          modificado_en: new Date().toISOString()
        };
        
        // Agregar empresa_id solo si es rol cliente y se seleccionó una empresa
        if (parseInt(data.role_id) === 3 && data.empresa_id) {
          updateData.empresa_id = parseInt(data.empresa_id);
        } else {
          updateData.empresa_id = null;
        }

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

        // Preparar los datos para enviar a la API
        const clientData: any = {
          email: data.email,
          password: data.password,
          nombre_completo: data.nombre,
          rol_id: parseInt(data.role_id),
          activo: data.activo
        };
        
        // Asignar empresa_id para usuarios de tipo cliente (rol_id = 3)
        if (parseInt(data.role_id) === 3) {
          if (data.empresa_id) {
            clientData.empresa_id = parseInt(data.empresa_id);

          } else {
            console.error('Error: Se requiere empresa_id para usuarios cliente');
            toast({
              title: 'Error',
              description: 'Debe seleccionar una empresa para usuarios con rol Cliente',
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
        } else {
          clientData.empresa_id = null;
        }
        
        // Crear nuevo usuario a través de nuestra API para evitar cerrar la sesión actual
        const response = await fetch('/api/usuarios/crear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Error al crear el usuario');
        }
        
        const authData = responseData.data;
        
        // El usuario ha sido creado exitosamente en el servidor
        // No necesitamos verificar la tabla usuarios porque el endpoint ya lo hizo por nosotros

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

  // Validar formulario antes de enviar
  const validateAndSubmit = () => {
    // Validar campos obligatorios
    let hasErrors = false;
    
    if (!form.watch('nombre')) {
      form.setError('nombre', {
        type: 'required',
        message: 'El nombre es requerido'
      });
      hasErrors = true;
    }
    
    if (!form.watch('email')) {
      form.setError('email', {
        type: 'required',
        message: 'El email es requerido'
      });
      hasErrors = true;
    } else if (!/^\S+@\S+\.\S+$/.test(form.watch('email'))) {
      form.setError('email', {
        type: 'pattern',
        message: 'Ingrese un email válido'
      });
      hasErrors = true;
    }
    
    if (!isEditing && !form.watch('password')) {
      form.setError('password', {
        type: 'required',
        message: 'La contraseña es requerida'
      });
      hasErrors = true;
    }
    
    if (!form.watch('role_id')) {
      form.setError('role_id', {
        type: 'required',
        message: 'El rol es requerido'
      });
      hasErrors = true;
    }
    
    // Validar que se seleccione una empresa cuando el rol es cliente (rol_id = 3)
    if (parseInt(form.watch('role_id')) === 3 && !form.watch('empresa_id')) {
      form.setError('empresa_id', {
        type: 'required',
        message: 'La empresa es requerida para usuarios de tipo cliente'
      });
      hasErrors = true;
    }
    
    if (!hasErrors) {
      onSubmit(form.getValues() as UserFormData);
    }
  };

  if (initialLoading || loadingRoles) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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
                  placeholder="Nombre completo" 
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
                  placeholder="correo@ejemplo.com" 
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

        {showEmpresaField && (
          <FormItem>
            <FormLabel>
              Empresa <span className="text-destructive">*</span>
            </FormLabel>
            <Select 
              value={form.watch('empresa_id')} 
              onValueChange={(value) => form.setValue('empresa_id', value)}
              disabled={loadingEmpresas}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={loadingEmpresas ? "Cargando empresas..." : "Seleccione una empresa"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Empresas</SelectLabel>
                  {empresas.map(empresa => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.razon_social}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {form.formState.errors.empresa_id && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.empresa_id.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Requerido para usuarios de tipo cliente
            </p>
          </FormItem>
        )}

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
