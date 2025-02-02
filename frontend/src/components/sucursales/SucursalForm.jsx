// frontend/src/components/sucursales/SucursalForm.jsx
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { createSucursal, updateSucursal } from '../../services/sucursal.service';

const SucursalForm = ({ sucursal = null, onClose }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      nombre: sucursal?.nombre || '',
      direccion: sucursal?.direccion || '',
      telefono: sucursal?.telefono || '',
      estado: sucursal?.estado ?? true
    }
  });

  const mutation = useMutation({
    mutationFn: sucursal ? 
      (data) => updateSucursal({ id: sucursal.id, ...data }) : 
      createSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries(['sucursales']);
      onClose();
    }
  });

  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      console.error('Error al guardar la sucursal:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-secondary rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {sucursal ? 'Editar' : 'Nueva'} Sucursal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Campo Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Nombre
            </label>
            <input
              type="text"
              {...register('nombre', { 
                required: 'El nombre es requerido',
                minLength: { value: 3, message: 'El nombre debe tener al menos 3 caracteres' }
              })}
              className={`w-full rounded-lg border ${errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} 
                         bg-white dark:bg-dark-accent text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600`}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre.message}</p>
            )}
          </div>

          {/* Campo Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Dirección
            </label>
            <input
              type="text"
              {...register('direccion', { 
                required: 'La dirección es requerida' 
              })}
              className={`w-full rounded-lg border ${errors.direccion ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} 
                         bg-white dark:bg-dark-accent text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600`}
            />
            {errors.direccion && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.direccion.message}</p>
            )}
          </div>

          {/* Campo Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Teléfono
            </label>
            <input
              type="text"
              {...register('telefono', { 
                required: 'El teléfono es requerido',
                pattern: {
                  value: /^[0-9+-]+$/,
                  message: 'Ingrese un número de teléfono válido'
                }
              })}
              className={`w-full rounded-lg border ${errors.telefono ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} 
                         bg-white dark:bg-dark-accent text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600`}
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefono.message}</p>
            )}
          </div>

          {/* Campo Estado */}
          {sucursal && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('estado')}
                  className="rounded border-gray-300 dark:border-dark-border text-indigo-600 
                           focus:ring-indigo-500 dark:focus:ring-indigo-600 h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-dark-text">Sucursal activa</span>
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg 
                       text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
                       dark:ring-offset-dark-primary disabled:opacity-50"
            >
              {mutation.isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SucursalForm;