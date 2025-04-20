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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Barcode } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Sierra, TipoSierra, EstadoSierra } from '@/types/sierra';
import { getSierraById } from '@/services/sierraService';

interface SierraFormProps {
  sierraId?: number;
  isEditing?: boolean;
  sucursalId?: number;
}

interface SierraFormValues {
  codigo_barras: string;
  sucursal_id: number;
  tipo_sierra_id: number;
  estado_id: number; // Corregido para coincidir con la columna real en la base de datos
  fecha_registro: string;
  activo: boolean;
}

export default function SierraForm({ sierraId, isEditing = false, sucursalId }: SierraFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [tiposSierra, setTiposSierra] = useState<TipoSierra[]>([]);
  const [estadosSierra, setEstadosSierra] = useState<EstadoSierra[]>([]);
  
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [loadingTiposSierra, setLoadingTiposSierra] = useState(true);
  const [loadingEstadosSierra, setLoadingEstadosSierra] = useState(true);

  // Estado para almacenar el ID del estado "Disponible"
  const [estadoDisponibleId, setEstadoDisponibleId] = useState<number | null>(null);

  // Configurar el formulario
  const form = useForm<SierraFormValues>({
    defaultValues: {
      codigo_barras: '',
      sucursal_id: sucursalId || 0,
      tipo_sierra_id: 0,
      estado_id: 0, // Se actualizará cuando se cargue el estado disponible
      fecha_registro: new Date().toISOString().split('T')[0],
      activo: true
    }
  });

  // Cargar sucursales para el selector
  useEffect(() => {
    const fetchSucursales = async () => {
      setLoadingSucursales(true);
      try {
        const { data, error } = await supabase
          .from('sucursales')
          .select('id, nombre, empresa_id, empresas(razon_social)')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        const formattedData = data.map(item => {
          // Aseguramos que empresas sea tratado como un objeto con razon_social
          const empresaInfo = item.empresas as { razon_social?: string } | null;
          
          return {
            id: item.id,
            nombre: item.nombre,
            empresa_nombre: empresaInfo?.razon_social || 'Sin empresa'
          };
        });
        
        setSucursales(formattedData || []);
        setLoadingSucursales(false);
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las sucursales.',
          variant: 'destructive'
        });
        setLoadingSucursales(false);
      }
    };

    fetchSucursales();
  }, [supabase, toast]);

  // Cargar tipos de sierra para el selector
  useEffect(() => {
    const fetchTiposSierra = async () => {
      setLoadingTiposSierra(true);
      try {
        const { data, error } = await supabase
          .from('tipos_sierra')
          .select('*')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        setTiposSierra(data || []);
        setLoadingTiposSierra(false);
      } catch (error) {
        console.error('Error al cargar tipos de sierra:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los tipos de sierra.',
          variant: 'destructive'
        });
        setLoadingTiposSierra(false);
      }
    };

    fetchTiposSierra();
  }, [supabase, toast]);

  // Cargar estados de sierra para el selector
  useEffect(() => {
    const fetchEstadosSierra = async () => {
      setLoadingEstadosSierra(true);
      try {
        // Verificar primero si la tabla existe
        const { data, error } = await supabase
          .from('estados_sierra')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        setEstadosSierra(data || []);
        
        // Buscar el estado "Disponible" y establecerlo como predeterminado
        const estadoDisponible = data?.find(estado => 
          estado.nombre.toLowerCase() === 'disponible'
        );
        
        if (estadoDisponible) {
          setEstadoDisponibleId(estadoDisponible.id);
          
          // Solo establecer el valor predeterminado si no estamos en modo edición
          if (!isEditing) {
            form.setValue('estado_id', estadoDisponible.id);
          }
        }
        
        setLoadingEstadosSierra(false);
      } catch (error) {
        console.error('Error al cargar estados de sierra:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los estados de sierra.',
          variant: 'destructive'
        });
        setLoadingEstadosSierra(false);
      }
    };

    fetchEstadosSierra();
  }, [supabase, toast, form, isEditing]);

  // Cargar datos de la sierra si estamos en modo edición
  useEffect(() => {
    if (isEditing && sierraId) {
      const fetchSierra = async () => {
        try {
          // Usar el servicio getSierraById en lugar de consultar directamente a Supabase
          const sierra = await getSierraById(sierraId);

          if (sierra) {
            // Establecer los valores en el formulario
            // Si se proporcionó un sucursalId, usarlo en lugar del valor de la base de datos
            if (!sucursalId) {
              form.setValue('sucursal_id', sierra.sucursal_id);
            }
            form.setValue('codigo_barras', sierra.codigo_barras);
            form.setValue('tipo_sierra_id', sierra.tipo_sierra_id);
            // Establecer el valor del estado
            form.setValue('estado_id', sierra.estado_id);
            form.setValue('fecha_registro', new Date(sierra.fecha_registro).toISOString().split('T')[0]);
            form.setValue('activo', sierra.activo);

            // Registrar los datos cargados para depuración
            console.log('Sierra cargada:', sierra);
          }

          setInitialLoading(false);
        } catch (error) {
          console.error('Error al cargar sierra:', error);
          toast({
            title: 'Error',
            description: 'No se pudo cargar la información de la sierra.',
            variant: 'destructive'
          });
          setInitialLoading(false);
        }
      };

      fetchSierra();
    } else {
      setInitialLoading(false);
    }
  }, [isEditing, sierraId, form, toast, supabase, sucursalId]);

  const onSubmit = async (data: SierraFormValues) => {
    // Si se proporcionó un ID de sucursal, usarlo en lugar del valor del formulario
    const finalSucursalId = sucursalId || data.sucursal_id;
    
    // Validar que se haya seleccionado una sucursal
    if (!finalSucursalId) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar una sucursal.',
        variant: 'destructive'
      });
      return;
    }
    
    // Validar que se haya seleccionado un tipo de sierra
    if (!data.tipo_sierra_id) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar un tipo de sierra.',
        variant: 'destructive'
      });
      return;
    }
    
    // Validar que se haya seleccionado un estado de sierra
    if (!data.estado_id) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar un estado de sierra.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Registrar los datos que se enviarán para depuración
      console.log('Datos a enviar:', {
        codigo_barras: data.codigo_barras,
        sucursal_id: finalSucursalId,
        tipo_sierra_id: data.tipo_sierra_id,
        estado_id: data.estado_id
      });
      
      // Preparar los datos para enviar - usando el nombre correcto de la columna
      const sierraData = {
        codigo_barras: data.codigo_barras,
        sucursal_id: finalSucursalId,
        tipo_sierra_id: data.tipo_sierra_id,
        estado_id: data.estado_id,
        fecha_registro: new Date(data.fecha_registro).toISOString(),
        activo: data.activo
      };
      
      if (isEditing && sierraId) {
        // Actualizar sierra existente
        const { error } = await supabase
          .from('sierras')
          .update({
            ...sierraData,
            modificado_en: new Date().toISOString()
          })
          .eq('id', sierraId);
        
        if (error) throw error;
        
        toast({
          title: 'Sierra actualizada',
          description: 'La sierra ha sido actualizada exitosamente.'
        });
      } else {
        // Verificar si ya existe una sierra con el mismo código de barras
        const { data: existingSierra, error: checkError } = await supabase
          .from('sierras')
          .select('id')
          .eq('codigo_barras', data.codigo_barras)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existingSierra) {
          toast({
            title: 'Error',
            description: 'Ya existe una sierra con este código de barras.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
        
        // Crear nueva sierra
        const { error } = await supabase
          .from('sierras')
          .insert({
            ...sierraData,
            creado_en: new Date().toISOString(),
            modificado_en: new Date().toISOString()
          });
        
        if (error) throw error;
        
        toast({
          title: 'Sierra creada',
          description: 'La sierra ha sido creada exitosamente.'
        });
      }
      
      // Redireccionar a la lista de sierras
      router.push('/sierras');
      router.refresh();
    } catch (error) {
      console.error('Error al guardar sierra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la sierra. Intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando información...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar' : 'Registrar'} Sierra</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="codigo_barras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Barcode className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Escanee o ingrese el código de barras" 
                        className="pl-8"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!sucursalId && (
              <FormField
                control={form.control}
                name="sucursal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={loadingSucursales || (isEditing && !!sucursalId)}
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      >
                        <option value="">Seleccione una sucursal</option>
                        {sucursales.map(sucursal => (
                          <option key={sucursal.id} value={sucursal.id}>
                            {sucursal.nombre} - {sucursal.empresa_nombre}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="tipo_sierra_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sierra</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={loadingTiposSierra}
                      {...field}
                      value={field.value || ""}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                    >
                      <option value="">Seleccione un tipo de sierra</option>
                      {tiposSierra.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="estado_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={loadingEstadosSierra || (!isEditing && estadoDisponibleId !== null)}
                      {...field}
                      value={field.value || ""}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                    >
                      <option value="">Seleccione un estado</option>
                      {estadosSierra.map(estado => (
                        <option key={estado.id} value={estado.id}>
                          {estado.nombre}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  {!isEditing && estadoDisponibleId !== null && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Al crear una nueva sierra, el estado se establece automáticamente como "Disponible".
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fecha_registro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Registro</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Estado Activo</FormLabel>
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
              onClick={() => router.push('/sierras')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Registrar'} Sierra
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
