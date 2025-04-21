'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CalendarIcon, 
  Scissors, 
  Barcode, 
  Search,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { 
  createAfilado, 
  updateAfilado, 
  getAfiladoById, 
  completarAfilado 
} from '@/services/afiladoService';
import { getTiposAfilado } from '@/services/tipoAfiladoService';
import { getSierraById, getSierras } from '@/services/sierraService';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AfiladoFormProps {
  afiladoId?: number;
  sierraId?: number;
  isEditing?: boolean;
  isCompletando?: boolean;
}

// Definir esquema de validación con zod
const formSchema = z.object({
  sierra_id: z.string().min(1, { message: 'Debe seleccionar una sierra' }),
  tipo_afilado_id: z.string().min(1, { message: 'Debe seleccionar un tipo de afilado' }),
  fecha_afilado: z.date({
    required_error: 'Debe seleccionar una fecha de afilado',
  }),
  fecha_salida: z.date().optional().nullable(),
  observaciones: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

export default function AfiladoForm({ 
  afiladoId, 
  sierraId, 
  isEditing = false,
  isCompletando = false
}: AfiladoFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing || isCompletando || !!sierraId);
  const [tiposAfilado, setTiposAfilado] = useState<any[]>([]);
  const [sierras, setSierras] = useState<any[]>([]);
  const [selectedSierra, setSelectedSierra] = useState<any>(null);
  const [searchSierra, setSearchSierra] = useState('');
  const [showSierraDialog, setShowSierraDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Configurar el formulario con validación usando zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sierra_id: sierraId?.toString() || '',
      tipo_afilado_id: '',
      fecha_afilado: new Date(),
      fecha_salida: null,
      observaciones: ''
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Iniciando carga de datos iniciales...');
        
        // Cargar tipos de afilado
        try {
          console.log('Cargando tipos de afilado...');
          const tiposData = await getTiposAfilado();
          console.log('Tipos de afilado cargados:', tiposData);
          setTiposAfilado(tiposData || []);
        } catch (tiposError) {
          console.error('Error al cargar tipos de afilado:', tiposError);
        }
        
        // Si estamos editando o completando un afilado existente
        if (isEditing || isCompletando) {
          console.log('Modo edición/completado, afiladoId:', afiladoId);
          if (afiladoId) {
            try {
              const afilado = await getAfiladoById(afiladoId);
              console.log('Afilado cargado:', afilado);
              
              if (afilado) {
                // Establecer valores en el formulario
                form.setValue('sierra_id', afilado.sierra_id.toString());
                form.setValue('tipo_afilado_id', afilado.tipo_afilado_id.toString());
                form.setValue('fecha_afilado', new Date(afilado.fecha_afilado));
                
                if (afilado.fecha_salida) {
                  form.setValue('fecha_salida', new Date(afilado.fecha_salida));
                }
                
                form.setValue('observaciones', afilado.observaciones || '');
                
                // Cargar detalles de la sierra
                if (afilado.sierra) {
                  console.log('Sierra desde afilado:', afilado.sierra);
                  setSelectedSierra(afilado.sierra);
                } else if (afilado.sierra_id) {
                  console.log('Cargando sierra por ID:', afilado.sierra_id);
                  try {
                    const sierra = await getSierraById(afilado.sierra_id);
                    console.log('Sierra cargada por ID:', sierra);
                    setSelectedSierra(sierra);
                  } catch (sierraError) {
                    console.error('Error al cargar sierra por ID:', sierraError);
                  }
                }
              }
            } catch (afiladoError) {
              console.error('Error al cargar afilado por ID:', afiladoError);
            }
          }
        } 
        // Si estamos creando un afilado para una sierra específica
        else if (sierraId) {
          console.log('Creando afilado para sierra específica, ID:', sierraId);
          try {
            const sierra = await getSierraById(sierraId);
            console.log('Sierra cargada:', sierra);
            setSelectedSierra(sierra);
          } catch (sierraError) {
            console.error('Error al cargar sierra por ID:', sierraError);
          }
        }
        // Para creación normal, no necesitamos cargar lista de sierras ya que solo usaremos búsqueda
        else {
          console.log('Modo creación normal, solo se usará búsqueda de sierra');
        }
        
        console.log('Carga de datos iniciales completada');
      } catch (error) {
        console.error('Error general al cargar datos iniciales:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos necesarios.',
          variant: 'destructive'
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [afiladoId, sierraId, isEditing, isCompletando, form, toast]);

  // Buscar sierra por código de barras
  const handleSearchSierra = async () => {
    if (!searchSierra.trim()) return;
    
    setSearchLoading(true);
    try {
      console.log('Buscando sierra con valor:', searchSierra);
      const { data, error } = await supabase
        .from('sierras')
        .select('*, sucursales(*), tipos_sierra(*), estados_sierra(*)')
        .or(`codigo_barras.ilike.%${searchSierra}%,id.eq.${isNaN(parseInt(searchSierra)) ? 0 : parseInt(searchSierra)}`)
        .order('id', { ascending: false });
      
      if (error) {
        console.error('Error en la consulta a Supabase:', error);
        throw error;
      }
      
      console.log('Resultados de búsqueda:', data);
      
      // Filtrar solo sierras disponibles (estado_id = 1)
      const sierrasDisponibles = data ? data.filter((sierra: any) => sierra.estado_id === 1) : [];
      console.log('Sierras disponibles filtradas:', sierrasDisponibles);
      setSearchResults(sierrasDisponibles);
    } catch (error) {
      console.error('Error al buscar sierra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo realizar la búsqueda.',
        variant: 'destructive'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Seleccionar sierra desde los resultados de búsqueda
  const handleSelectSierra = (sierra: any) => {
    console.log('Sierra seleccionada:', sierra);
    setSelectedSierra(sierra);
    form.setValue('sierra_id', sierra.id.toString());
    setShowSierraDialog(false);
  };

  // Manejar envío del formulario
  const onSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    
    try {
      console.log('Datos del formulario:', data);
      
      // Obtener el ID del usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error al obtener usuario:', userError);
        throw new Error('No se pudo obtener la información del usuario.');
      }
      
      const userId = userData.user?.id || '';
      console.log('ID de usuario:', userId);
      
      const afiladoData = {
        sierra_id: parseInt(data.sierra_id),
        tipo_afilado_id: parseInt(data.tipo_afilado_id),
        fecha_afilado: format(data.fecha_afilado, 'yyyy-MM-dd'),
        fecha_salida: data.fecha_salida ? format(data.fecha_salida, 'yyyy-MM-dd') : null,
        observaciones: data.observaciones || '',
        usuario_id: userId
      };
      
      console.log('Datos de afilado a guardar:', afiladoData);
      
      if (isCompletando && afiladoId) {
        console.log('Completando afilado existente, ID:', afiladoId);
        // Completar un afilado existente
        await completarAfilado(
          afiladoId, 
          format(data.fecha_salida || new Date(), 'yyyy-MM-dd'),
          data.observaciones || ''
        );
        
        toast({
          title: 'Afilado completado',
          description: 'El afilado ha sido completado exitosamente.'
        });
      } else if (isEditing && afiladoId) {
        console.log('Actualizando afilado existente, ID:', afiladoId);
        // Actualizar un afilado existente
        await updateAfilado(afiladoId, afiladoData);
        
        toast({
          title: 'Afilado actualizado',
          description: 'El afilado ha sido actualizado exitosamente.'
        });
      } else {
        console.log('Creando nuevo afilado');
        // Crear un nuevo afilado
        const resultado = await createAfilado(afiladoData);
        console.log('Resultado de creación:', resultado);
        
        toast({
          title: 'Afilado registrado',
          description: 'El afilado ha sido registrado exitosamente.'
        });
      }
      
      // Redireccionar a la lista de afilados
      console.log('Redireccionando a la lista de afilados');
      router.push('/afilados');
      router.refresh();
    } catch (error: any) {
      console.error('Error al guardar afilado:', error);
      
      // Mostrar mensaje de error más específico si está disponible
      const errorMessage = error.message || 'No se pudo guardar el afilado. Intente nuevamente.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  });

  // Manejar completado rápido de afilado
  const handleCompletarRapido = async () => {
    if (!afiladoId) return;
    
    setLoading(true);
    try {
      await completarAfilado(
        afiladoId,
        format(new Date(), 'yyyy-MM-dd'),
        form.getValues('observaciones') || ''
      );
      
      toast({
        title: 'Afilado completado',
        description: 'El afilado ha sido completado exitosamente.'
      });
      
      router.push('/afilados');
      router.refresh();
    } catch (error: any) {
      console.error('Error al completar afilado:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar el afilado.',
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isCompletando ? 'Completar Afilado' : isEditing ? 'Editar Afilado' : 'Registrar Nuevo Afilado'}
        </CardTitle>
        <CardDescription>
          {isCompletando 
            ? 'Complete la información del afilado y registre la fecha de salida' 
            : isEditing 
              ? 'Modifique la información del afilado' 
              : 'Registre un nuevo afilado para una sierra'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            {/* Selección de Sierra */}
            <FormField
              control={form.control}
              name="sierra_id"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">Sierra</FormLabel>
                  
                  {selectedSierra ? (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Scissors className="h-5 w-5 mr-2 text-primary" />
                          <span className="font-semibold text-lg">Sierra #{selectedSierra.id}</span>
                        </div>
                        {!isEditing && !isCompletando && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedSierra(null);
                              form.setValue('sierra_id', '');
                            }}
                          >
                            Cambiar
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Código de Barras</p>
                          <p className="text-lg font-semibold flex items-center">
                            <Barcode className="h-4 w-4 mr-1 text-muted-foreground" />
                            {selectedSierra.codigo_barras}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Sucursal</p>
                          <p className="text-lg font-semibold">
                            {selectedSierra.sucursales?.nombre || 'Sin sucursal'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                          <p className="text-lg font-semibold">
                            {selectedSierra.tipos_sierra?.nombre || 'Sin tipo'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Estado</p>
                          <Badge variant={selectedSierra.estado_id === 1 ? 'success' : 'secondary'}>
                            {selectedSierra.estados_sierra?.nombre || 'Sin estado'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full h-20 text-lg"
                        onClick={() => setShowSierraDialog(true)}
                      >
                        <Search className="mr-2 h-6 w-6" />
                        Buscar Sierra por Código o ID
                      </Button>
                    </div>
                  )}
                  <FormMessage className="text-base" />
                </FormItem>
              )}
            />

            {/* Tipo de Afilado */}
            <FormField
              control={form.control}
              name="tipo_afilado_id"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">Tipo de Afilado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isCompletando}
                  >
                    <FormControl>
                      <SelectTrigger className="h-14 text-base">
                        <SelectValue placeholder="Seleccione un tipo de afilado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposAfilado.map((tipo) => (
                        <SelectItem 
                          key={tipo.id} 
                          value={tipo.id.toString()}
                          className="py-3"
                        >
                          <div className="flex items-center">
                            <Scissors className="h-4 w-4 mr-2 text-primary rotate-45" />
                            <span>{tipo.nombre}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-base" />
                </FormItem>
              )}
            />

            {/* Fecha de Afilado */}
            <FormField
              control={form.control}
              name="fecha_afilado"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">Fecha de Afilado</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-14 text-base justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isCompletando}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-base" />
                </FormItem>
              )}
            />

            {/* Fecha de Salida (solo para completar afilado) */}
            {isCompletando && (
              <FormField
                control={form.control}
                name="fecha_salida"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-lg">Fecha de Salida</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-14 text-base justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          defaultMonth={new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-base" />
                  </FormItem>
                )}
              />
            )}

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-lg">Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ingrese observaciones sobre el afilado"
                      className="h-24 text-base resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-base" />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto text-base"
              onClick={() => router.push('/afilados')}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Volver
            </Button>
            
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              {isCompletando && (
                <Button 
                  type="button" 
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-base"
                  onClick={handleCompletarRapido}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  )}
                  Completar con Fecha Actual
                </Button>
              )}
              
              <Button 
                type="submit" 
                size="lg"
                className="w-full sm:flex-1 text-base"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isCompletando 
                  ? 'Completar Afilado' 
                  : isEditing 
                    ? 'Actualizar Afilado' 
                    : 'Registrar Afilado'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>

      {/* Diálogo de búsqueda de sierra */}
      <Dialog open={showSierraDialog} onOpenChange={setShowSierraDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar Sierra</DialogTitle>
            <DialogDescription>
              Busque por código de barras o ID de sierra
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Input
                value={searchSierra}
                onChange={(e) => setSearchSierra(e.target.value)}
                placeholder="Código de barras o ID"
                className="h-12 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSierra();
                  }
                }}
              />
            </div>
            <Button 
              type="button" 
              size="lg" 
              onClick={handleSearchSierra}
              disabled={searchLoading}
            >
              {searchLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <div className="max-h-72 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchSierra.trim() 
                  ? 'No se encontraron sierras disponibles con ese criterio' 
                  : 'Ingrese un código de barras o ID para buscar'}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((sierra) => (
                  <div 
                    key={sierra.id}
                    className="border rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSelectSierra(sierra)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Scissors className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-semibold">Sierra #{sierra.id}</span>
                      </div>
                      <Badge variant={sierra.estado_id === 1 ? 'success' : 'secondary'}>
                        {sierra.estados_sierra?.nombre || 'Sin estado'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Código de Barras</p>
                        <p className="font-medium">{sierra.codigo_barras}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sucursal</p>
                        <p className="font-medium">{sierra.sucursales?.nombre || 'Sin sucursal'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSierraDialog(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
