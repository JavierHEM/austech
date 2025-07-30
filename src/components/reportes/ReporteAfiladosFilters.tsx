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
// Importamos los componentes de formulario simplificados que no dependen de useFormContext
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

// Esquema de validación para los filtros
const formSchema = z.object({
  empresa_id: z.string().min(1, { message: 'Seleccione una empresa' }),
  sucursal_id: z.string().optional(),
  tipo_sierra_id: z.string().optional(),
  tipo_afilado_id: z.string().optional(),
  fecha_desde: z.date({ required_error: 'La fecha inicial es obligatoria' }).nullable(),
  fecha_hasta: z.date({ required_error: 'La fecha final es obligatoria' }).nullable(),
  estado: z.boolean().optional(), // Estado del afilado (true = Activo, false = Inactivo)
}).refine((data) => {
  // Validar que ambas fechas estén presentes
  if (!data.fecha_desde || !data.fecha_hasta) {
    return false;
  }
  return true;
}, {
  message: 'Debe seleccionar ambas fechas para generar el informe',
  path: ['fecha_hasta']
}).refine((data) => {
  // Validar que el rango no supere los 31 días
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

export default function ReporteAfiladosFilters({ 
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

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: '',
      sucursal_id: '',
      tipo_sierra_id: '',
      tipo_afilado_id: '',
      fecha_desde: null,
      fecha_hasta: null,
      estado: undefined // undefined significa que no se aplica filtro para el estado del afilado
    },
    shouldUnregister: false,
  });

  // Cargar empresas al montar el componente
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        setIsLoading(true);
        const data = await getEmpresasActivas();
        setEmpresas(data);
        
        // Si hay una empresa fija (para usuarios con rol cliente), establecerla como valor por defecto
        if (empresaIdFijo) {
          // Estableciendo empresa fija en filtros
          form.setValue('empresa_id', empresaIdFijo);
          // Cargar sucursales para esta empresa
          loadSucursales(empresaIdFijo);
          
          // Buscar el nombre de la empresa para mostrarlo en la UI
          // Asegurarse de que la comparación sea robusta convirtiendo ambos valores a string y normalizándolos
          console.log('Empresas disponibles:', data.map(e => ({ id: e.id, razon_social: e.razon_social })));
          console.log('Buscando empresa con ID:', empresaIdFijo, 'tipo:', typeof empresaIdFijo);
          
          // Comparación más robusta
          const empresaSeleccionada = data.find(e => 
            String(e.id).trim() === String(empresaIdFijo).trim() || 
            Number(e.id) === Number(empresaIdFijo)
          );
          
          if (empresaSeleccionada) {
            // Empresa seleccionada encontrada
          } else {
            console.warn('No se encontró la empresa con ID:', empresaIdFijo, 'entre las empresas disponibles');
          }
        }
      } catch (error) {
        console.error('Error al cargar empresas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmpresas();
  }, [empresaIdFijo, form]);
  
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
  
  // Validar el rango de fechas cuando cambian las fechas (feedback inmediato)
  useEffect(() => {
    const fechaDesde = form.watch('fecha_desde');
    const fechaHasta = form.watch('fecha_hasta');
    
    if (fechaDesde && fechaHasta) {
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        // Mostrar alerta
        alert('El rango de fechas no puede ser mayor a 31 días. Por favor, seleccione un rango menor.');
        // Resetear la fecha hasta para que el usuario seleccione un rango válido
        form.setValue('fecha_hasta', null);
      }
    }
  }, [form.watch('fecha_desde'), form.watch('fecha_hasta'), form]);
  
  // Cargar tipos de sierra y tipos de afilado
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        setIsLoading(true);
        
        // Cargar tipos de sierra
        const { data: dataTiposSierra, error: errorTiposSierra } = await supabase
          .from('tipos_sierra')
          .select('*')
          .eq('activo', true)
          .order('nombre');
          
        if (errorTiposSierra) throw errorTiposSierra;
        setTiposSierra(dataTiposSierra || []);
        
        // Cargar tipos de afilado
        const { data: dataTiposAfilado, error: errorTiposAfilado } = await supabase
          .from('tipos_afilado')
          .select('*')
          .order('nombre');
          
        if (errorTiposAfilado) throw errorTiposAfilado;
        setTiposAfilado(dataTiposAfilado || []);
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
      empresa_id: values.empresa_id ? parseInt(values.empresa_id) : 0, // Valor por defecto para evitar error de tipo
      sucursal_id: values.sucursal_id && values.sucursal_id !== 'all_sucursales' ? parseInt(values.sucursal_id) : null,
      tipo_sierra_id: values.tipo_sierra_id && values.tipo_sierra_id !== 'all_tipos' ? parseInt(values.tipo_sierra_id) : null,
      tipo_afilado_id: values.tipo_afilado_id && values.tipo_afilado_id !== 'all_tipos' ? parseInt(values.tipo_afilado_id) : null,
      fecha_desde: values.fecha_desde ? format(values.fecha_desde, 'yyyy-MM-dd') : null,
      fecha_hasta: values.fecha_hasta ? format(values.fecha_hasta, 'yyyy-MM-dd') : null,
      activo: true, // Por defecto, siempre queremos sierras activas
      estado: values.estado, // Usar el campo estado (booleano) para filtrar por el estado del afilado
    };
    
    onFilter(filters);
  };

  return (
    <div className="space-y-4 bg-card p-4 rounded-md shadow">
      <div className="text-lg font-semibold mb-4">Filtros del Reporte</div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de empresa */}
          <FormItem>
            <FormLabel htmlFor="empresa_id">Empresa</FormLabel>
            <Select 
              disabled={loading || !!empresaIdFijo} 
              onValueChange={(value) => {
                // Empresa seleccionada manualmente
                form.setValue('empresa_id', value);
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
              disabled={isLoading || !form.watch('empresa_id')} 
              onValueChange={(value) => form.setValue('sucursal_id', value)} 
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
              disabled={isLoading} 
              onValueChange={(value) => form.setValue('tipo_sierra_id', value)} 
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
              disabled={isLoading} 
              onValueChange={(value) => form.setValue('tipo_afilado_id', value)} 
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
              onDateChange={(date) => form.setValue('fecha_desde', date)}
              placeholder="Seleccione fecha inicial"
            />
          </FormItem>

          {/* Fecha hasta */}
          <FormItem>
            <FormLabel htmlFor="fecha_hasta">Fecha hasta</FormLabel>
            <DatePickerAlt
              date={form.watch('fecha_hasta') as Date | null}
              onDateChange={(date) => form.setValue('fecha_hasta', date)}
              placeholder="Seleccione fecha final"
            />
          </FormItem>
          
          {/* El filtro de Sierra Activa se eliminó por ser redundante */}
          
          {/* Estado del afilado */}
          <FormItem>
            <FormLabel htmlFor="estado">Estado</FormLabel>
            <Select 
              disabled={isLoading} 
              onValueChange={(value) => {
                if (value === "todos") {
                  form.setValue('estado', undefined);
                } else {
                  form.setValue('estado', value === "true");
                }
              }} 
              value={
                form.watch('estado') === undefined
                  ? "todos"
                  : form.watch('estado') === true
                  ? "true"
                  : "false"
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            Generar Reporte
          </Button>
        </div>
      </form>
    </div>
  );
}