// frontend/src/components/tipos-sierra/TipoSierraForm.jsx
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { createTipoSierra, updateTipoSierra } from '../../services/tipoSierra.service';

const TipoSierraForm = ({ tipoSierra = null, onClose }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      codigo: tipoSierra?.codigo || '',
      nombre: tipoSierra?.nombre || '',
      descripcion: tipoSierra?.descripcion || '',
      estado: tipoSierra?.estado ?? true
    }
  });

  const mutation = useMutation({
    mutationFn: tipoSierra ? updateTipoSierra : createTipoSierra,
    onSuccess: () => {
      queryClient.invalidateQueries(['tipos-sierra']);
      onClose();
    }
  });

  const onSubmit = async (data) => {
    try {
      if (tipoSierra) {
        await mutation.mutateAsync({ id: tipoSierra.id, ...data });
      } else {
        await mutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error al guardar tipo de sierra:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-secondary rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tipoSierra ? 'Editar' : 'Nuevo'} Tipo de Sierra
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Código
            </label>
            <input
              type="text"
              {...register('codigo', { 
                required: 'El código es requerido',
                pattern: {
                  value: /^[A-Z0-9-]+$/,
                  message: 'Solo mayúsculas, números y guiones'
                }
              })}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-border 
                       bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
              placeholder="Ej: ST-001"
            />
            {errors.codigo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.codigo.message}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Nombre
            </label>
            <input
              type="text"
              {...register('nombre', { 
                required: 'El nombre es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' }
              })}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-border 
                       bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.nombre.message}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Descripción
            </label>
            <textarea
              {...register('descripcion')}
              rows="3"
              className="w-full rounded-lg border border-gray-300 dark:border-dark-border 
                       bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
            />
          </div>

          {/* Estado */}
          {tipoSierra && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('estado')}
                  className="rounded border-gray-300 dark:border-dark-border text-indigo-600 
                           focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-dark-text">
                  Tipo de sierra activo
                </span>
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

export default TipoSierraForm;