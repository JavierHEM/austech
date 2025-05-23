'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase-client';
import type { ClienteReporteFilters as ClienteReporteFiltersType } from '@/services/clienteReporteService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerAlt } from '@/components/ui/date-picker-alt';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Loader2, Search, X } from 'lucide-react';

// Esquema de validación para los filtros
const formSchema = z.object({
  empresa_id: z.number().nullable(),
  sucursal_id: z.number().nullable(),
  fecha_desde: z.date().nullable(),
  fecha_hasta: z.date().nullable(),
  tipo_sierra_id: z.number().nullable(),
  tipo_afilado_id: z.number().nullable(),
  activo: z.boolean().default(true),
});

// Tipo inferido del esquema para usar con el formulario
type FormValues = z.infer<typeof formSchema>;

interface ClienteReporteFiltersProps {
  onFilter: (filters: ClienteReporteFiltersType) => void;
  loading?: boolean;
  empresaIdFijo?: number | null;
}

interface Sucursal {
  id: number;
  nombre: string;
  empresa_id: number;
}

interface TipoSierra {
  id: number;
  nombre: string;
}

interface TipoAfilado {
  id: number;
  nombre: string;
}

export function ClienteReporteFilters({
  onFilter,
  loading = false,
  empresaIdFijo,
}: ClienteReporteFiltersProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tiposSierra, setTiposSierra] = useState<TipoSierra[]>([]);
  const [tiposAfilado, setTiposAfilado] = useState<TipoAfilado[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingTiposSierra, setLoadingTiposSierra] = useState(false);
  const [loadingTiposAfilado, setLoadingTiposAfilado] = useState(false);

  // Inicializar el formulario
  const form = useForm({  // Sin tipo genérico explícito
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: empresaIdFijo || null,
      sucursal_id: null,
      fecha_desde: null,
      fecha_hasta: null,
      tipo_sierra_id: null,
      tipo_afilado_id: null,
      activo: true,
    },
  });

  // Cargar sucursales cuando cambia la empresa
  useEffect(() => {
    const fetchSucursales = async () => {
      if (!empresaIdFijo) return;
      
      setLoadingSucursales(true);
      try {
        const { data, error } = await supabase
          .from('sucursales')
          .select('id, nombre, empresa_id')
          .eq('empresa_id', String(empresaIdFijo))
          .order('nombre');
        
        if (error) {
          console.error('Error al cargar sucursales:', error);
          return;
        }
        
        setSucursales(data || []);
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
      } finally {
        setLoadingSucursales(false);
      }
    };
    
    fetchSucursales();
  }, [empresaIdFijo]);

  // Cargar tipos de sierra
  useEffect(() => {
    const fetchTiposSierra = async () => {
      setLoadingTiposSierra(true);
      try {
        const { data, error } = await supabase
          .from('tipos_sierra')
          .select('id, nombre')
          .order('nombre');
        
        if (error) {
          console.error('Error al cargar tipos de sierra:', error);
          return;
        }
        
        setTiposSierra(data || []);
      } catch (error) {
        console.error('Error al cargar tipos de sierra:', error);
      } finally {
        setLoadingTiposSierra(false);
      }
    };
    
    fetchTiposSierra();
  }, []);

  // Cargar tipos de afilado
  useEffect(() => {
    const fetchTiposAfilado = async () => {
      setLoadingTiposAfilado(true);
      try {
        const { data, error } = await supabase
          .from('tipos_afilado')
          .select('id, nombre')
          .order('nombre');
        
        if (error) {
          console.error('Error al cargar tipos de afilado:', error);
          return;
        }
        
        setTiposAfilado(data || []);
      } catch (error) {
        console.error('Error al cargar tipos de afilado:', error);
      } finally {
        setLoadingTiposAfilado(false);
      }
    };
    
    fetchTiposAfilado();
  }, []);

  // Manejar el envío del formulario
  const onSubmit = (values: any) => {
    // Convertir los valores a ClienteReporteFiltersType
    onFilter(values as ClienteReporteFiltersType);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    form.reset({
      empresa_id: empresaIdFijo || null,
      sucursal_id: null,
      fecha_desde: null,
      fecha_hasta: null,
      tipo_sierra_id: null,
      tipo_afilado_id: null,
      activo: true,
    });
  };

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sucursal */}
              <FormField
                control={form.control}
                name="sucursal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select
                      disabled={loadingSucursales || loading}
                      onValueChange={(value) => field.onChange(value === "all_sucursales" ? null : parseInt(value))}
                      value={field.value?.toString() || "all_sucursales"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las sucursales" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all_sucursales">Todas las sucursales</SelectItem>
                        {sucursales.map((sucursal) => (
                          <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                            {sucursal.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Sierra */}
              <FormField
                control={form.control}
                name="tipo_sierra_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Sierra</FormLabel>
                    <Select
                      disabled={loadingTiposSierra || loading}
                      onValueChange={(value) => field.onChange(value === "all_tipos" ? null : parseInt(value))}
                      value={field.value?.toString() || "all_tipos"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los tipos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all_tipos">Todos los tipos</SelectItem>
                        {tiposSierra.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Afilado */}
              <FormField
                control={form.control}
                name="tipo_afilado_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Afilado</FormLabel>
                    <Select
                      disabled={loadingTiposAfilado || loading}
                      onValueChange={(value) => field.onChange(value === "all_afilados" ? null : parseInt(value))}
                      value={field.value?.toString() || "all_afilados"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los afilados" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all_afilados">Todos los afilados</SelectItem>
                        {tiposAfilado.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Desde */}
              <FormField
                control={form.control}
                name="fecha_desde"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Desde</FormLabel>
                    <FormControl>
                      <DatePickerAlt
                        date={field.value || null}
                        onDateChange={field.onChange}
                        placeholder="Seleccionar fecha inicial"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Hasta */}
              <FormField
                control={form.control}
                name="fecha_hasta"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Hasta</FormLabel>
                    <FormControl>
                      <DatePickerAlt
                        date={field.value || null}
                        onDateChange={field.onChange}
                        placeholder="Seleccionar fecha final"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado Activo */}
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Sierras Activas</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
