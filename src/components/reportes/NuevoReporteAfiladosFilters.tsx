import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase-client';
import { ReporteAfiladosFiltros } from '@/services/nuevoReporteAfiladosService';
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
import { Loader2, Search, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Interfaces para los datos
interface Empresa {
  id: number;
  razon_social: string;
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

// Esquema de validación
const formSchema = z.object({
  empresa_id: z.number().nullable(),
  sucursal_id: z.number().nullable(),
  fecha_desde: z.date(),
  fecha_hasta: z.date(),
  tipo_sierra_id: z.number().nullable(),
  tipo_afilado_id: z.number().nullable(),
  estado_afilado: z.enum(['pendiente', 'completado', 'todos']).default('todos'),
  estado: z.string().nullable().default(null),
});

// Tipo para los valores del formulario
type FormValues = z.infer<typeof formSchema>;

// Tipo para los estados disponibles en la tabla afilados
type EstadoAfilado = 'En proceso' | 'Completado' | 'Cancelado' | 'Pendiente' | 'todos';

// Lista de estados disponibles para el selector
const estadosAfilado: { label: string; value: string }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'En proceso', value: 'En proceso' },
  { label: 'Completado', value: 'Completado' },
  { label: 'Cancelado', value: 'Cancelado' },
  { label: 'Pendiente', value: 'Pendiente' },
];

interface NuevoReporteAfiladosFiltersProps {
  onFilter: (filters: ReporteAfiladosFiltros) => void;
  loading?: boolean;
  empresaIdFijo?: number | null;
}

export function NuevoReporteAfiladosFilters({
  onFilter,
  loading = false,
  empresaIdFijo,
}: NuevoReporteAfiladosFiltersProps) {
  // Estados para los datos
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tiposSierra, setTiposSierra] = useState<TipoSierra[]>([]);
  const [tiposAfilado, setTiposAfilado] = useState<TipoAfilado[]>([]);
  
  // Estados para carga
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingTiposSierra, setLoadingTiposSierra] = useState(false);
  const [loadingTiposAfilado, setLoadingTiposAfilado] = useState(false);
  
  // Estado para errores de validación
  const [validationError, setValidationError] = useState<string | null>(null);

  // Inicializar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      empresa_id: empresaIdFijo || null,
      sucursal_id: null,
      fecha_desde: startOfMonth(new Date()),
      fecha_hasta: endOfMonth(new Date()),
      tipo_sierra_id: null,
      tipo_afilado_id: null,
      estado_afilado: 'todos',
      estado: null,
    },
  });

  // Validar el rango de fechas cuando cambian
  useEffect(() => {
    const fechaDesde = form.watch('fecha_desde');
    const fechaHasta = form.watch('fecha_hasta');
    
    if (fechaDesde && fechaHasta) {
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        form.setError('fecha_hasta', {
          type: 'manual',
          message: 'El rango de fechas no puede ser mayor a 31 días'
        });
        setValidationError('El rango de fechas no puede ser mayor a 31 días');
      } else {
        form.clearErrors('fecha_hasta');
        setValidationError(null);
      }
    }
  }, [form.watch('fecha_desde'), form.watch('fecha_hasta')]);

  // Función para cargar sucursales según la empresa seleccionada
  const fetchSucursales = async (empresaId: number) => {
    setLoadingSucursales(true);
    try {
      const { data, error } = await supabase
        .from('sucursales')
        .select('id, nombre, empresa_id')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw error;
      setSucursales(data || []);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      setSucursales([]);
    } finally {
      setLoadingSucursales(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
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
    fetchTiposSierra();
    fetchTiposAfilado();

    // Cargar empresas si no hay una empresa fija
    if (!empresaIdFijo) {
      fetchEmpresas();
    }
    
    // Si hay una empresa fija, cargar sus sucursales
    if (empresaIdFijo) {
      fetchSucursales(empresaIdFijo);
    }
  }, [empresaIdFijo]);

  // Cuando cambia la empresa, cargar sus sucursales
  useEffect(() => {
    const empresaId = form.watch('empresa_id');
    
    if (empresaId) {
      fetchSucursales(empresaId);
      // Resetear sucursal seleccionada
      form.setValue('sucursal_id', null);
    } else {
      setSucursales([]);
    }
  }, [form.watch('empresa_id')]);

  // Función para aplicar los filtros
  const onSubmit = (values: FormValues) => {
    // Validar el rango de fechas
    const fechaDesde = values.fecha_desde;
    const fechaHasta = values.fecha_hasta;
    
    if (fechaDesde && fechaHasta) {
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        setValidationError('El rango de fechas no puede ser mayor a 31 días');
        return;
      }
    }
    
    // Enviar los filtros al componente padre
    onFilter(values);
  };

  // Función para limpiar los filtros
  const handleReset = () => {
    form.reset({
      empresa_id: empresaIdFijo || null,
      sucursal_id: null,
      fecha_desde: startOfMonth(new Date()),
      fecha_hasta: endOfMonth(new Date()),
      tipo_sierra_id: null,
      tipo_afilado_id: null,
      estado_afilado: 'todos',
      estado: null,
    });
    setValidationError(null);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
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
                control={form.control}
                name="empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      disabled={loading || (empresaIdFijo !== null && empresaIdFijo !== undefined) || loadingEmpresas}
                      onValueChange={(value) => {
                        field.onChange(value ? Number(value) : null);
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

              {/* Sucursal */}
              <FormField
                control={form.control}
                name="sucursal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select
                      disabled={loading || !form.watch('empresa_id') || loadingSucursales}
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
                      disabled={loading || loadingTiposSierra}
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loadingTiposSierra ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </div>
                          ) : (
                            <SelectValue placeholder="Seleccionar tipo de sierra" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Opción para todos */}
                        <SelectItem value="">Todos los tipos</SelectItem>
                        {/* Opciones de tipos de sierra */}
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
                        {/* Opción para todos */}
                        <SelectItem value="">Todos los tipos</SelectItem>
                        {/* Opciones de tipos de afilado */}
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

              {/* Fecha desde */}
              <FormField
                control={form.control}
                name="fecha_desde"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha desde</FormLabel>
                    <DatePickerCustom
                      date={field.value}
                      onDateChange={field.onChange}
                      disabled={loading}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha hasta */}
              <FormField
                control={form.control}
                name="fecha_hasta"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha hasta</FormLabel>
                    <DatePickerCustom
                      date={field.value}
                      onDateChange={field.onChange}
                      disabled={loading}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="estado_afilado"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Estado de afilado</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Estado en tabla afilados</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        defaultValue={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estado" />
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
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={loading}
          type="button"
        >
          <X className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
        
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
