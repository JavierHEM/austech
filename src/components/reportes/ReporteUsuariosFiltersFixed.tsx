'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerAlt } from '@/components/ui/date-picker-alt';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { getRolesActivos, getEmpresasActivas } from '@/services/usuarioService';
import type { ReporteUsuariosFilters } from '@/services/usuarioService';
import { Role, Empresa } from '@/services/usuarioService';
import { useReportFormPersistence } from '@/hooks/use-form-persistence';

// Esquema de validación para los filtros
const formSchema = z.object({
  search: z.string().optional(),
  rol_id: z.number().nullable(),
  empresa_id: z.number().nullable(),
  activo: z.boolean().nullable(),
  fecha_desde: z.date().nullable(),
  fecha_hasta: z.date().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReporteUsuariosFiltersProps {
  onFilter: (filters: ReporteUsuariosFilters) => void;
  isLoading: boolean;
  empresaIdFijo?: string | null;
}

export default function ReporteUsuariosFiltersFixed({ 
  onFilter, 
  isLoading, 
  empresaIdFijo 
}: ReporteUsuariosFiltersProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Valores iniciales del formulario
  const initialValues: FormValues = {
    search: '',
    rol_id: null,
    empresa_id: empresaIdFijo ? Number(empresaIdFijo) : null,
    activo: true,
    fecha_desde: null,
    fecha_hasta: null,
  };

  // Usar persistencia de formulario
  const {
    formData: persistentData,
    handleFieldChange,
    handleMultipleChanges,
    resetToInitial,
    clearPersistentData,
    isLoaded: isPersistentDataLoaded,
  } = useReportFormPersistence('reporte-usuarios-filters', initialValues);

  // Inicializar el formulario con datos persistentes
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: persistentData,
  });

  // Actualizar el formulario cuando se cargan los datos persistentes
  useEffect(() => {
    if (isPersistentDataLoaded && persistentData) {
      form.reset(persistentData);
    }
  }, [isPersistentDataLoaded, persistentData, form]);

  // Cargar opciones de roles y empresas al montar el componente
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [rolesData, empresasData] = await Promise.all([
          getRolesActivos(),
          getEmpresasActivas(),
        ]);
        
        setRoles(rolesData);
        setEmpresas(empresasData);
      } catch (error) {
        console.error('Error al cargar opciones:', error);
      } finally {
        setLoadingOptions(false);
      }
    };
    
    loadOptions();
  }, []);

  // Manejar el envío del formulario
  const onSubmit = (values: FormValues) => {
    // Convertir fechas a formato ISO string para la API
    const filters: ReporteUsuariosFilters = {
      search: values.search,
      rol_id: values.rol_id,
      empresa_id: empresaIdFijo ? Number(empresaIdFijo) : values.empresa_id,
      activo: values.activo,
      fecha_desde: values.fecha_desde ? format(values.fecha_desde, 'yyyy-MM-dd') : null,
      fecha_hasta: values.fecha_hasta ? format(values.fecha_hasta, 'yyyy-MM-dd') : null,
    };
    
    onFilter(filters);
  };

  // Manejar cambios en los campos del formulario
  const handleFormChange = (field: keyof FormValues, value: any) => {
    handleFieldChange(field, value);
    form.setValue(field, value);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    resetToInitial();
    form.reset(initialValues);
    onSubmit(initialValues);
  };

  // Limpiar datos persistentes
  const handleClearPersistentData = () => {
    clearPersistentData();
    form.reset(initialValues);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información sobre persistencia */}
            <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800">Estado del formulario guardado</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Los datos del formulario se guardan automáticamente. Puedes cambiar de pestaña sin perder tu progreso.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Búsqueda</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Buscar por nombre o email..."
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFormChange('search', e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rol */}
              <FormField
                control={form.control}
                name="rol_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => {
                        const rolId = value ? Number(value) : null;
                        field.onChange(rolId);
                        handleFormChange('rol_id', rolId);
                      }}
                      disabled={loadingOptions}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todos los roles</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Empresa */}
              <FormField
                control={form.control}
                name="empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => {
                        const empresaId = value ? Number(value) : null;
                        field.onChange(empresaId);
                        handleFormChange('empresa_id', empresaId);
                      }}
                      disabled={loadingOptions || !!empresaIdFijo}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todas las empresas</SelectItem>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id.toString()}>
                            {empresa.razon_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado activo */}
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Solo usuarios activos</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleFormChange('activo', checked);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Fecha desde */}
              <FormField
                control={form.control}
                name="fecha_desde"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha desde</FormLabel>
                    <FormControl>
                      <DatePickerAlt
                        date={field.value}
                        onDateChange={(date) => {
                          field.onChange(date);
                          handleFormChange('fecha_desde', date);
                        }}
                        placeholder="Seleccionar fecha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha hasta */}
              <FormField
                control={form.control}
                name="fecha_hasta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha hasta</FormLabel>
                    <FormControl>
                      <DatePickerAlt
                        date={field.value}
                        onDateChange={(date) => {
                          field.onChange(date);
                          handleFormChange('fecha_hasta', date);
                        }}
                        placeholder="Seleccionar fecha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar Reporte'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                Limpiar Filtros
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearPersistentData}
                disabled={isLoading}
                className="text-orange-600 hover:text-orange-700"
              >
                Limpiar Datos Guardados
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
