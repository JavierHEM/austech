'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// UI Components
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase-client';

interface Role {
  id: number;
  nombre: string;
}

interface Empresa {
  id: number;
  razon_social: string;
}

export default function NewUserForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rolId, setRolId] = useState<string>('');
  const [empresaId, setEmpresaId] = useState<string>('');
  const [activo, setActivo] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [showEmpresaField, setShowEmpresaField] = useState(false);
  
  // Form validation
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    nombre: '',
    rolId: '',
    empresaId: ''
  });

  // Load roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('id, nombre')
          .order('nombre');

        if (error) throw error;
        setRoles(data || []);
      } catch (error: any) {
        console.error('Error al cargar roles:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los roles.',
          variant: 'destructive',
        });
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [toast]);

  // Load empresas when needed
  useEffect(() => {
    if (!showEmpresaField) return;
    
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
      } catch (error: any) {
        console.error('Error al cargar empresas:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las empresas.',
          variant: 'destructive',
        });
      } finally {
        setLoadingEmpresas(false);
      }
    };

    fetchEmpresas();
  }, [showEmpresaField, toast]);

  // Show/hide empresa field based on selected role
  useEffect(() => {
    if (rolId) {
      // Assuming role ID 3 is 'Cliente'
      const isClientRole = parseInt(rolId) === 3;
      setShowEmpresaField(isClientRole);
      
      // Clear empresa selection if not a client role
      if (!isClientRole) {
        setEmpresaId('');
      }
    }
  }, [rolId]);

  // Validate form
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
      nombre: '',
      rolId: '',
      empresaId: ''
    };

    // Email validation
    if (!email) {
      newErrors.email = 'El email es requerido';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
      valid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      valid = false;
    }

    // Name validation
    if (!nombre) {
      newErrors.nombre = 'El nombre es requerido';
      valid = false;
    } else if (nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
      valid = false;
    }

    // Role validation
    if (!rolId) {
      newErrors.rolId = 'El rol es requerido';
      valid = false;
    }

    // Empresa validation (only if client role)
    if (showEmpresaField && !empresaId) {
      newErrors.empresaId = 'La empresa es requerida para usuarios con rol Cliente';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for API
      const userData = {
        email,
        password,
        nombre_completo: nombre,
        rol_id: parseInt(rolId),
        empresa_id: showEmpresaField && empresaId ? parseInt(empresaId) : null,
        activo
      };
      

      
      // Send request to API
      const response = await fetch('/api/usuarios/crear-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      // Parse response
      const data = await response.json();
      
      // Handle error
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el usuario');
      }
      
      // Success
      toast({
        title: 'Usuario creado',
        description: 'El usuario ha sido creado exitosamente.',
      });
      
      // Redirect to users list
      router.push('/usuarios');
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el usuario. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Crear Nuevo Usuario</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre completo */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                placeholder="Ingrese el nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading}
              />
              {errors.nombre && (
                <p className="text-sm font-medium text-destructive">{errors.nombre}</p>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm font-medium text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm font-medium text-destructive">{errors.password}</p>
              )}
            </div>
            
            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={rolId}
                onValueChange={setRolId}
                disabled={loading || loadingRoles}
              >
                <SelectTrigger id="rol">
                  <SelectValue placeholder={loadingRoles ? "Cargando roles..." : "Seleccione un rol"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rolId && (
                <p className="text-sm font-medium text-destructive">{errors.rolId}</p>
              )}
            </div>
          </div>

          {/* Empresa (solo para clientes) */}
          {showEmpresaField && (
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Select
                value={empresaId}
                onValueChange={setEmpresaId}
                disabled={loading || loadingEmpresas}
              >
                <SelectTrigger id="empresa">
                  <SelectValue placeholder={loadingEmpresas ? "Cargando empresas..." : "Seleccione una empresa"} />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.empresaId && (
                <p className="text-sm font-medium text-destructive">{errors.empresaId}</p>
              )}
            </div>
          )}

          {/* Estado (activo/inactivo) */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="activo">Estado</Label>
              <p className="text-sm text-muted-foreground">
                {activo ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <Switch
              id="activo"
              checked={activo}
              onCheckedChange={setActivo}
              disabled={loading}
            />
          </div>
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
            Crear Usuario
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
