'use client';

import * as React from "react";
const { useState, useEffect } = React;
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/simple-form';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePickerAlt } from '@/components/ui/date-picker-alt';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { getEmpresasActivas } from '@/services/reporteService';
import { Empresa } from '@/types/empresa';
import { ReporteAfiladosPorClienteFilters } from '@/services/reporteService';
import { Sucursal } from '@/types/sucursal';
import { TipoSierra } from '@/types/sierra';
import { TipoAfilado } from '@/types/afilado';
import { useReportFormPersistence } from '@/hooks/use-form-persistence';

// Esquema de validación para los filtros
const formSchema = z.object({
  empresa_id: z.string().min(1, { message: 'Seleccione una empresa' }),
  sucursal_id: z.string().optional(),
  tipo_sierra_id: z.string().optional(),
  tipo_afilado_id: z.string().optional(),
  fecha_desde: z.date({ required_error: 'La fecha inicial es obligatoria' }).nullable(),
  fecha_hasta: z.date({ required_error: 'La fecha final es obligatoria' }).nullable(),
  estado: z.boolean().optional(),
}).refine((data) => {
  if (!data.fecha_desde || !data.fecha_hasta) {
    return false;
  }
  return true;
}, {
  message: 'Debe seleccionar ambas fechas para generar el informe',
  path: ['fecha_hasta']
}).refine((data) => {
  if (data.fecha_desde && data.fecha_hasta) {
    const diffTime = Math.abs(data.fecha_hasta.getTime() - data.fecha_desde.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 31;
  }
  return true;
}, {
  message: 'El rango de fechas no puede superar los 31 días',
  path: ['fecha_hasta']
});

type FormValues = z.infer<typeof formSchema>;

interface ReporteAfiladosFiltersProps {
  onFilter: (filters: ReporteAfiladosPorClienteFilters) => void;
  isLoading?: boolean;
  empresaIdFijo?: string | null;
}

export default function ReporteAfiladosFiltersFixed({ 
  onFilter, 
  isLoading: externalLoading = false,
  empresaIdFijo = null 
}: ReporteAfiladosFiltersProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tiposSierra, setTiposSierra] = useState<TipoSierra[]>([]);
  const [tiposAfilado, setTiposAfilado] = useState<TipoAfilado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Combinar el estado de carga interno con el externo
  const loading = isLoading || externalLoading;

  // Valores iniciales del formulario
  const initialValues: FormValues = {
    empresa_id: empresaIdFijo || '',
    sucursal_id: '',
    tipo_sierra_id: '',
    tipo_afilado_id: '',
    fecha_desde: null,
    fecha_hasta: null,
    estado: undefined
  };

  // Usar persistencia de formulario
  const {
    formData: persistentData,
    handleFieldChange,
    handleMultipleChanges,
    resetToInitial,
    clearPersistentData,
    isLoaded: isPersistentDataLoaded,
  } = useReportFormPersistence('reporte-afilados-filters', initialValues);

  // Configurar el formulario con datos persistentes
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: persistentData,
    shouldUnregister: false,
  });

  // Actualizar el formulario cuando se cargan los datos persistentes
  useEffect(() => {
    if (isPersistentDataLoaded && persistentData) {
      form.reset(persistentData);
    }
  }, [isPersistentDataLoaded, persistentData, form]);

  // Cargar empresas al montar el componente
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        setIsLoading(true);
        const data = await getEmpresasActivas();
        setEmpresas(data);
        
        // Si hay una empresa fija, establecerla como valor por defecto
        if (empresaIdFijo) {
          form.setValue('empresa_id', empresaIdFijo);
          handleFieldChange('empresa_id', empresaIdFijo);
          loadSucursales(empresaIdFijo);
        }
      } catch (error) {
        console.error('Error al cargar empresas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmpresas();
  }, [empresaIdFijo, form, handleFieldChange]);
  
  // Función para cargar sucursales
  const loadSucursales = async (empresaId: string) => {
    if (!empresaId) {
      setSucursales([]);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .eq('empresa_id', parseInt(empresaId))
        .eq('activo', true)
        .order('nombre');
        
      if (error) throw error;
      
      setSucursales(data || []);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar sucursales cuando se selecciona una empresa
  useEffect(() => {
    const empresaId = form.watch('empresa_id');
    if (empresaId) {
      loadSucursales(empresaId);
    }
  }, [form.watch('empresa_id')]);

  // Cargar tipos de sierra y afilado
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        setIsLoading(true);
        
        const [tiposSierraData, tiposAfiladoData] = await Promise.all([
          supabase.from('tipos_sierra').select('*').eq('activo', true).order('nombre'),
          supabase.from('tipos_afilado').select('*').order('nombre') // Sin filtro activo porque no existe
        ]);
        
        if (tiposSierraData.error) throw tiposSierraData.error;
        if (tiposAfiladoData.error) throw tiposAfiladoData.error;
        
        setTiposSierra(tiposSierraData.data || []);
        setTiposAfilado(tiposAfiladoData.data || []);
      } catch (error) {
        console.error('Error al cargar catálogos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCatalogos();
  }, []);

  // Manejar envío del formulario
  const onSubmit = (values: FormValues) => {
    // Validar que ambas fechas estén presentes
    if (!values.fecha_desde || !values.fecha_hasta) {
      alert('Debe seleccionar ambas fechas para generar el informe');
      return;
    }
    
    // Validar que el rango no supere los 31 días
    if (values.fecha_desde && values.fecha_hasta) {
      const diffTime = Math.abs(values.fecha_hasta.getTime() - values.fecha_desde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        alert('El rango de fechas no puede superar los 31 días');
        return;
      }
    }
    
    // Convertir los valores del formulario al formato esperado por el servicio
    const filters: ReporteAfiladosPorClienteFilters = {
      empresa_id: values.empresa_id ? parseInt(values.empresa_id) : 0,
      sucursal_id: values.sucursal_id && values.sucursal_id !== 'all_sucursales' ? parseInt(values.sucursal_id) : null,
      tipo_sierra_id: values.tipo_sierra_id && values.tipo_sierra_id !== 'all_tipos' ? parseInt(values.tipo_sierra_id) : null,
      tipo_afilado_id: values.tipo_afilado_id && values.tipo_afilado_id !== 'all_tipos' ? parseInt(values.tipo_afilado_id) : null,
      fecha_desde: values.fecha_desde ? format(values.fecha_desde, 'yyyy-MM-dd') : null,
      fecha_hasta: values.fecha_hasta ? format(values.fecha_hasta, 'yyyy-MM-dd') : null,
      activo: true,
      estado: values.estado,
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
    <div className="space-y-4 bg-card p-4 rounded-md shadow">
      <div className="text-lg font-semibold mb-4">Filtros del Reporte</div>
      
      {/* Información sobre persistencia */}
      <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2 flex-1">
            <h3 className="text-sm font-medium text-green-800">Estado del formulario guardado</h3>
            <div className="mt-1 text-xs text-green-700">
              <p>Los datos del formulario se guardan automáticamente. Puedes cambiar de pestaña sin perder tu progreso.</p>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de empresa */}
          <FormItem>
            <FormLabel htmlFor="empresa_id">Empresa</FormLabel>
            <Select 
              disabled={loading} 
              onValueChange={(value) => {
                handleFormChange('empresa_id', value);
                if (value) loadSucursales(value);
              }}
              value={form.watch('empresa_id') ? String(form.watch('empresa_id')) : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.empresa_id && (
              <FormMessage>{form.formState.errors.empresa_id.message}</FormMessage>
            )}
            {empresaIdFijo && (
              <FormDescription>
                Solo puedes ver información de esta empresa.
              </FormDescription>
            )}
          </FormItem>
          
          {/* Selector de sucursal */}
          <FormItem>
            <FormLabel htmlFor="sucursal_id">Sucursal</FormLabel>
            <Select 
              disabled={loading || !form.watch('empresa_id')} 
              onValueChange={(value) => handleFormChange('sucursal_id', value)} 
              value={form.watch('sucursal_id')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_sucursales">Todas las sucursales</SelectItem>
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                    {sucursal.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          
          {/* Selector de tipo de sierra */}
          <FormItem>
            <FormLabel htmlFor="tipo_sierra_id">Tipo de Sierra</FormLabel>
            <Select 
              disabled={loading} 
              onValueChange={(value) => handleFormChange('tipo_sierra_id', value)} 
              value={form.watch('tipo_sierra_id')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_tipos">Todos los tipos</SelectItem>
                {tiposSierra.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          {/* Selector de tipo de afilado */}
          <FormItem>
            <FormLabel htmlFor="tipo_afilado_id">Tipo de Afilado</FormLabel>
            <Select 
              disabled={loading} 
              onValueChange={(value) => handleFormChange('tipo_afilado_id', value)} 
              value={form.watch('tipo_afilado_id')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_tipos">Todos los tipos</SelectItem>
                {tiposAfilado.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          {/* Fecha desde */}
          <FormItem>
            <FormLabel htmlFor="fecha_desde">Fecha desde</FormLabel>
            <DatePickerAlt
              date={form.watch('fecha_desde') as Date | null}
              onDateChange={(date) => handleFormChange('fecha_desde', date)}
              placeholder="Seleccione fecha inicial"
            />
          </FormItem>

          {/* Fecha hasta */}
          <FormItem>
            <FormLabel htmlFor="fecha_hasta">Fecha hasta</FormLabel>
            <DatePickerAlt
              date={form.watch('fecha_hasta') as Date | null}
              onDateChange={(date) => handleFormChange('fecha_hasta', date)}
              placeholder="Seleccione fecha final"
            />
          </FormItem>
          
          {/* Estado del afilado */}
          <FormItem>
            <FormLabel htmlFor="estado">Estado</FormLabel>
            <RadioGroup 
              value={form.watch('estado') === undefined ? 'all' : form.watch('estado') ? 'active' : 'inactive'}
              onValueChange={(value) => {
                const estadoValue = value === 'all' ? undefined : value === 'active';
                handleFormChange('estado', estadoValue);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="estado-all" />
                <label htmlFor="estado-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Todos los estados
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="estado-active" />
                <label htmlFor="estado-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Solo activos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="estado-inactive" />
                <label htmlFor="estado-inactive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Solo inactivos
                </label>
              </div>
            </RadioGroup>
          </FormItem>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClearFilters}
            disabled={loading}
          >
            Limpiar Filtros
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClearPersistentData}
            disabled={loading}
            className="text-orange-600 hover:text-orange-700"
          >
            Limpiar Datos Guardados
          </Button>
        </div>
      </form>
    </div>
  );
}
