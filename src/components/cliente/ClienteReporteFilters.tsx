'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase-client';
import { ClienteReporteFilters as ClienteReporteFiltersType, getEstadosAfilados } from "@/services/clienteReporteService";
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { DatePickerCustom } from '@/components/ui/date-picker-custom';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, Search, X } from 'lucide-react';

// Interfaces para los datos de Supabase
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

// El estado todos siempre estará disponible
const ESTADO_TODOS = { value: 'todos', label: 'Todos los estados' };

// Esquema de validación con Zod
const formSchema = z.object({
  empresa_id: z.number().nullable(),
  sucursal_id: z.number().nullable(),
  fecha_desde: z.date({
    required_error: "La fecha desde es obligatoria",
  }),
  fecha_hasta: z.date({
    required_error: "La fecha hasta es obligatoria",
  }),
  tipo_sierra_id: z.number().nullable(),
  tipo_afilado_id: z.number().nullable(),
  estado_sierra: z.enum(['todos', 'activo', 'inactivo']).default('todos'),
  estado: z.string().nullable().default(null),
}).refine((data) => {
  // Si ambas fechas están presentes, validar que el rango no sea mayor a 31 días
  if (data.fecha_desde && data.fecha_hasta) {
    const diffTime = Math.abs(data.fecha_hasta.getTime() - data.fecha_desde.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 31;
  }
  return true;
}, {
  message: "El rango de fechas no puede ser mayor a 31 días",
  path: ["fecha_hasta"],
});

// Definir el tipo explícitamente para evitar problemas de inferencia
type FormValues = z.infer<typeof formSchema>;

// Importar SubmitHandler de react-hook-form en lugar de definirlo manualmente
import { SubmitHandler } from 'react-hook-form';

interface ClienteReporteFiltersProps {
  onFilter: (filters: ClienteReporteFiltersType) => void;
  loading?: boolean;
  empresaIdFijo?: number | null;
}

export function ClienteReporteFilters({
  onFilter,
  loading = false,
  empresaIdFijo,
}: ClienteReporteFiltersProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tiposSierra, setTiposSierra] = useState<TipoSierra[]>([]);
  const [tiposAfilado, setTiposAfilado] = useState<TipoAfilado[]>([]);
  const [empresas, setEmpresas] = useState<{id: number, razon_social: string}[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingTiposSierra, setLoadingTiposSierra] = useState(false);
  const [loadingTiposAfilado, setLoadingTiposAfilado] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [estadosAfilado, setEstadosAfilado] = useState<{value: string, label: string}[]>([ESTADO_TODOS]);
  const [loadingEstados, setLoadingEstados] = useState(false);

  // Inicializar el formulario con tipo explícito
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // Usar any para evitar problemas de tipo con el resolver
    defaultValues: {
      empresa_id: empresaIdFijo ? Number(empresaIdFijo) : null,
      sucursal_id: null,
      fecha_desde: new Date(), // Fecha actual por defecto
      fecha_hasta: new Date(), // Fecha actual por defecto
      tipo_sierra_id: null,
      tipo_afilado_id: null,
      estado_sierra: 'todos',
      estado: null,
    },
  });

  // Validar el rango de fechas cuando cambian las fechas (feedback inmediato)
  useEffect(() => {
    const fechaDesde = form.watch('fecha_desde');
    const fechaHasta = form.watch('fecha_hasta');
    
    if (fechaDesde && fechaHasta) {
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        // Mostrar mensaje de error en el formulario
        form.setError('fecha_hasta', {
          type: 'manual',
          message: 'El rango de fechas no puede ser mayor a 31 días'
        });
      } else {
        // Limpiar el error si el rango es válido
        form.clearErrors('fecha_hasta');
      }
    }
  }, [form]);

  // Definir fetchSucursales fuera del efecto para que esté disponible en todo el componente
  const fetchSucursales = async (empresaId: number | string) => {
    // Asegurar que empresaId sea un número para la consulta
    const empresaIdNum = typeof empresaId === 'string' ? Number(empresaId) : empresaId;
    setLoadingSucursales(true);
    try {
      const { data, error } = await supabase
        .from('sucursales')
        .select('id, nombre, empresa_id')
        .eq('empresa_id', empresaIdNum)
        .eq('activo', true)
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

  // Cargar sucursales cuando cambia la empresa
  useEffect(() => {
    // Si hay una empresa seleccionada, cargar sus sucursales
    const empresaId = form.watch('empresa_id');
    if (empresaId) {
      fetchSucursales(empresaId);
    }
  }, [form.watch('empresa_id')]);

  // Cargar tipos de sierra
  const fetchTiposSierra = async () => {
    setLoadingTiposSierra(true);
    try {
      const { data, error } = await supabase
        .from('tipos_sierra')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setTiposSierra(data || []);
    } catch (error) {
      console.error('Error al cargar tipos de sierra:', error);
    } finally {
      setLoadingTiposSierra(false);
    }
  };

  // Cargar tipos de afilado
  const fetchTiposAfilado = async () => {
    setLoadingTiposAfilado(true);
    try {
      const { data, error } = await supabase
        .from('tipos_afilado')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setTiposAfilado(data || []);
    } catch (error) {
      console.error('Error al cargar tipos de afilado:', error);
    } finally {
      setLoadingTiposAfilado(false);
    }
  };

  // Cargar estados de afilado desde la tabla afilados
  const fetchEstadosAfilado = async () => {
    setLoadingEstados(true);
    try {
      // Usar la función del servicio para obtener los estados
      const estados = await getEstadosAfilados();
      
      // Transformar a formato para el select
      const estadosFormateados = estados.map(estado => ({
        value: estado,
        label: estado
      }));
      
      // Añadir la opción 'todos' al principio
      setEstadosAfilado([ESTADO_TODOS, ...estadosFormateados]);
    } catch (error) {
      console.error('Error al cargar estados de afilado:', error);
    } finally {
      setLoadingEstados(false);
    }
  };

  // Cargar empresas
  const fetchEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, razon_social')
        .order('razon_social');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchTiposSierra();
    fetchTiposAfilado();
    fetchEstadosAfilado();
    if (!empresaIdFijo) {
      fetchEmpresas();
    }
  }, []);

  // Efecto para establecer la empresa fija si existe
  useEffect(() => {
    if (empresaIdFijo !== null && empresaIdFijo !== undefined) {
      form.setValue('empresa_id', Number(empresaIdFijo));
      // Cargar sucursales de la empresa fija
      fetchSucursales(empresaIdFijo);
    }
  }, [empresaIdFijo]);

  // Manejar el envío del formulario con tipo correcto
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    console.log('Enviando filtros:', values);
    
    // Convertir valores para el servicio
    const filtros: ClienteReporteFiltersType = {
      empresa_id: values.empresa_id,
      sucursal_id: values.sucursal_id,
      fecha_desde: values.fecha_desde,
      fecha_hasta: values.fecha_hasta,
      tipo_sierra_id: values.tipo_sierra_id,
      tipo_afilado_id: values.tipo_afilado_id,
      activo: values.estado_sierra === 'todos' ? true : values.estado_sierra === 'activo',
      estado: values.estado
    };
    
    // Llamar a la función de filtrado del componente padre
    onFilter(filtros);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    form.reset({
      empresa_id: empresaIdFijo ? Number(empresaIdFijo) : null,
      sucursal_id: null,
      fecha_desde: new Date(),
      fecha_hasta: new Date(),
      tipo_sierra_id: null,
      tipo_afilado_id: null,
      estado_sierra: 'todos',
      estado: null,
    });
    
    // Aplicar filtros con valores por defecto
    onSubmit(form.getValues());
  };

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
            {/* Aviso sobre la selección de fechas */}
            <div className="col-span-full bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">Información importante</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Para generar un reporte, debe seleccionar un rango de fechas (desde/hasta). El rango no puede ser superior a 31 días para optimizar el rendimiento y la exportación a Excel.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Empresa */}
              <FormField
                control={form.control as any}
                name="empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      disabled={loading || (empresaIdFijo !== null && empresaIdFijo !== undefined) || loadingEmpresas}
                      onValueChange={(value) => {
                        field.onChange(value ? Number(value) : null);
                        // Resetear sucursal cuando cambia la empresa
                        form.setValue('sucursal_id', null);
                      }}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loadingEmpresas ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </div>
                          ) : (
                            <SelectValue placeholder="Seleccionar empresa" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Opción para todos */}
                        <SelectItem value="">Todas las empresas</SelectItem>
                        {/* Opciones de empresas */}
                        {empresas.map((empresa: {id: number, razon_social: string}) => (
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
              
              {/* Sucursal */}
              <FormField
                control={form.control as any}
                name="sucursal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select
                      disabled={loading || loadingSucursales || !form.watch('empresa_id')}
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loadingSucursales ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </div>
                          ) : (
                            <SelectValue placeholder="Seleccionar sucursal" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Opción para todos */}
                        <SelectItem value="">Todas las sucursales</SelectItem>
                        {/* Opciones de sucursales */}
                        {sucursales.map((sucursal) => (
                          <SelectItem key={sucursal.id} value={String(sucursal.id)}>
                            {sucursal.nombre}
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
                control={form.control as any}
                name="tipo_afilado_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Afilado</FormLabel>
                    <Select
                      disabled={loading || loadingTiposAfilado}
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loadingTiposAfilado ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </div>
                          ) : (
                            <SelectValue placeholder="Seleccionar tipo de afilado" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all_afilados">Todos los afilados</SelectItem>
                        {tiposAfilado.map((tipo) => (
                          <SelectItem key={tipo.id} value={String(tipo.id)}>
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
                control={form.control as any}
                name="fecha_desde"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Desde</FormLabel>
                    <FormControl>
                      <DatePickerCustom
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
                control={form.control as any}
                name="fecha_hasta"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Hasta</FormLabel>
                    <FormControl>
                      <DatePickerCustom
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

              {/* Estado de Sierra */}
              <FormField
                control={form.control as any}
                name="estado_sierra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de Sierra</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="activo">Activas</SelectItem>
                        <SelectItem value="inactivo">Inactivas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Estado de Afilado */}
              <FormField
                control={form.control as any}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de Afilado</FormLabel>
                    <Select
                      disabled={loading || loadingEstados}
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loadingEstados ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Cargando estados...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Seleccione un estado" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {estadosAfilado.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
