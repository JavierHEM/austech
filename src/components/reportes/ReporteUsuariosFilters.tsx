// src/components/reportes/ReporteUsuariosFilters.tsx
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

export default function ReporteUsuariosFilters({ onFilter, isLoading, empresaIdFijo }: ReporteUsuariosFiltersProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Inicializar el formulario con valores por defecto
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: '',
      rol_id: null,
      empresa_id: empresaIdFijo ? Number(empresaIdFijo) : null,
      activo: true,
      fecha_desde: null,
      fecha_hasta: null,
    },
  });

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

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Búsqueda por nombre o email */}
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buscar por nombre o email</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre o email..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector de rol */}
              <FormField
                control={form.control}
                name="rol_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Rol</FormLabel>
                    <Select
                      disabled={loadingOptions}
                      onValueChange={(value) => field.onChange(value === "todos" ? null : parseInt(value))}
                      value={field.value?.toString() || "todos"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos los roles</SelectItem>
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

              {/* Selector de empresa (solo visible si no hay empresa fija) */}
              {!empresaIdFijo && (
                <FormField
                  control={form.control}
                  name="empresa_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Empresa</FormLabel>
                      <Select
                        disabled={loadingOptions}
                        onValueChange={(value) => field.onChange(value === "todas" ? null : parseInt(value))}
                        value={field.value?.toString() || "todas"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todas">Todas las empresas</SelectItem>
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
              )}

              {/* Selector de fecha desde */}
              <FormField
                control={form.control}
                name="fecha_desde"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha desde</FormLabel>
                    <FormControl>
                      <DatePickerAlt
                        date={field.value || null}
                        onDateChange={field.onChange}
                        placeholder="Seleccionar fecha inicial"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector de fecha hasta */}
              <FormField
                control={form.control}
                name="fecha_hasta"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha hasta</FormLabel>
                    <FormControl>
                      <DatePickerAlt
                        date={field.value || null}
                        onDateChange={field.onChange}
                        placeholder="Seleccionar fecha final"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Switch para filtrar por activo/inactivo */}
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Estado</FormLabel>
                    </div>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="activo-switch" className={!field.value ? "text-primary" : "text-muted-foreground"}>
                          Inactivos
                        </Label>
                        <Switch
                          id="activo-switch"
                          checked={field.value === true}
                          onCheckedChange={(checked) => {
                            form.setValue("activo", checked ? true : false);
                          }}
                        />
                        <Label htmlFor="activo-switch" className={field.value ? "text-primary" : "text-muted-foreground"}>
                          Activos
                        </Label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Cargando...' : 'Aplicar filtros'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
